import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import {
  featureAnalytics180d,
  featureDistributionsDaily,
  featurePipelineRuns,
  featureValues,
} from '../db/schema';
import type { Db } from '../db/client';
import { InjectDb } from '../db/client';
import { FeatureCatalogLoader } from './feature-catalog-loader';

type AudienceOp = 'gt' | 'lt' | 'gte' | 'lte' | 'eq';

/**
 * Joins the static feature catalog (76 features × metadata fields)
 * with the live `feature_analytics_180d` Postgres rollup. Returns
 * `HermesFeature[]` matching the zod shape the web bundle imports
 * from @hermes/contracts.
 *
 * Caching: catalog is in-memory after first load (immutable per
 * deploy). Analytics rows are read per-request — small table (76
 * rows) on PK lookup, sub-millisecond on indexed reads.
 */

type CatalogRow = Record<string, unknown> & { name: string };
type AnalyticsRow = typeof featureAnalytics180d.$inferSelect;

const EMPTY_ANALYTICS = {
  usageCount180d: 0,
  driftScore: 0,
  driftEventDates: [] as string[],
  freshnessSlaMet: 1,
  nullRate: 0,
  distinctValuesP50: 0,
  topConsumingCampaigns: [] as unknown[],
  requestRateSparkline: new Array<number>(180).fill(0),
  lastBackfillAt: null as string | null,
  p99LookupLatencyMs: 0,
  coverageOfMau: 0,
  medianLagMinutes: 0,
  lastSlaMissAt: null as string | null,
};

function shapeAnalytics(row: AnalyticsRow | undefined): typeof EMPTY_ANALYTICS & { source?: string } {
  if (!row) return EMPTY_ANALYTICS;
  return {
    usageCount180d:        Number(row.usageCount180d),
    driftScore:            Number(row.driftScore),
    driftEventDates:       (row.driftEventDates as string[]) ?? [],
    freshnessSlaMet:       Number(row.freshnessSlaMet),
    nullRate:              Number(row.nullRate),
    distinctValuesP50:     Number(row.distinctValuesP50),
    topConsumingCampaigns: (row.topConsumingCampaigns as unknown[]) ?? [],
    requestRateSparkline:  (row.requestRateSparkline as number[]) ?? new Array<number>(180).fill(0),
    lastBackfillAt:        row.lastBackfillAt ? row.lastBackfillAt.toISOString() : null,
    p99LookupLatencyMs:    row.p99LookupLatencyMs ? Number(row.p99LookupLatencyMs) : 0,
    coverageOfMau:         row.coverageOfMau ? Number(row.coverageOfMau) : 0,
    medianLagMinutes:      row.medianLagMinutes ? Number(row.medianLagMinutes) : 0,
    lastSlaMissAt:         row.lastSlaMissAt ? row.lastSlaMissAt.toISOString() : null,
    source:                row.source,
  };
}

@Injectable()
export class FeaturesService {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly loader: FeatureCatalogLoader,
  ) {}

  async listAll(): Promise<unknown[]> {
    const catalog = this.loader.read() as CatalogRow[];
    const analytics = await this.db.select().from(featureAnalytics180d);
    const byName = new Map(analytics.map((a) => [a.featureName, a]));
    return catalog.map((c) => ({ ...c, analytics: shapeAnalytics(byName.get(c.name)) }));
  }

  async getOne(name: string): Promise<unknown> {
    const catalog = this.loader.read() as CatalogRow[];
    const c = catalog.find((f) => f.name === name);
    if (!c) throw new NotFoundException(`feature ${name} not found`);
    const analytics = await this.db
      .select()
      .from(featureAnalytics180d)
      .where(eq(featureAnalytics180d.featureName, name))
      .limit(1);
    return { ...c, analytics: shapeAnalytics(analytics[0]) };
  }

  async getDistribution(name: string, days: number) {
    const catalog = this.loader.read() as CatalogRow[];
    if (!catalog.some((f) => f.name === name)) {
      throw new NotFoundException(`feature ${name} not found`);
    }
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    const rows = await this.db
      .select()
      .from(featureDistributionsDaily)
      .where(
        and(
          eq(featureDistributionsDaily.featureName, name),
          gte(featureDistributionsDaily.snapshotDate, cutoffIso),
        ),
      )
      .orderBy(desc(featureDistributionsDaily.snapshotDate));
    return {
      feature: name,
      snapshots: rows.map((r) => ({
        snapshotDate:  r.snapshotDate,
        bucketKind:    r.bucketKind,
        buckets:       r.buckets,
        totalUids:     Number(r.totalUids),
        nullCount:     Number(r.nullCount),
        distinctCount: Number(r.distinctCount),
        isSynthesized: r.isSynthesized,
      })),
    };
  }

  async getUsedBy(name: string): Promise<{ feature: string; segments: { count: number }; campaigns: { count: number } }> {
    const catalog = this.loader.read() as Array<CatalogRow & { usedBySegments?: number; usedByCampaigns?: number }>;
    const c = catalog.find((f) => f.name === name);
    if (!c) throw new NotFoundException(`feature ${name} not found`);
    return {
      feature: name,
      segments:  { count: Number(c.usedBySegments  ?? 0) },
      campaigns: { count: Number(c.usedByCampaigns ?? 0) },
    };
  }

  /**
   * Audience-count for a single-feature threshold. Numeric ops on
   * value_numeric; eq on value_text for categoricals. Backs the LM
   * threshold playground (Phase 05).
   */
  async getAudienceCount(name: string, op: AudienceOp, value: string): Promise<{
    feature: string;
    op: AudienceOp;
    value: string;
    count: number;
    totalUids: number;
    fraction: number;
    durationMs: number;
  }> {
    const catalog = this.loader.read() as CatalogRow[];
    if (!catalog.some((f) => f.name === name)) {
      throw new NotFoundException(`feature ${name} not found`);
    }
    const start = Date.now();

    let numericValue: number | null = null;
    if (op !== 'eq') {
      numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        throw new NotFoundException(`numeric op ${op} requires a numeric value`);
      }
    }

    // total denominator — count of uids with non-null value for this feature
    const [{ total }] = await this.db
      .select({ total: sql<number>`count(*)::bigint` })
      .from(featureValues)
      .where(eq(featureValues.featureName, name));

    let matched: number;
    if (op === 'eq') {
      // categorical or exact numeric eq — match against value_text first, fallback numeric.
      const [{ c }] = await this.db
        .select({ c: sql<number>`count(*)::bigint` })
        .from(featureValues)
        .where(and(
          eq(featureValues.featureName, name),
          sql`(${featureValues.valueText} = ${value} OR ${featureValues.valueNumeric}::text = ${value})`,
        ));
      matched = Number(c);
    } else {
      const cmp =
        op === 'gt' ? sql`${featureValues.valueNumeric} > ${numericValue}` :
        op === 'gte' ? sql`${featureValues.valueNumeric} >= ${numericValue}` :
        op === 'lt' ? sql`${featureValues.valueNumeric} < ${numericValue}` :
                      sql`${featureValues.valueNumeric} <= ${numericValue}`;
      const [{ c }] = await this.db
        .select({ c: sql<number>`count(*)::bigint` })
        .from(featureValues)
        .where(and(eq(featureValues.featureName, name), cmp));
      matched = Number(c);
    }

    const totalNum = Number(total);
    return {
      feature: name,
      op,
      value,
      count: matched,
      totalUids: totalNum,
      fraction: totalNum === 0 ? 0 : matched / totalNum,
      durationMs: Date.now() - start,
    };
  }

  /**
   * Quantile strip — p10/p25/p50/p75/p90/p99 for the feature's numeric
   * values. Single-pass aggregate. Returns empty array for non-numeric
   * features.
   */
  async getQuantiles(name: string): Promise<{ feature: string; quantiles: { p: number; value: number }[] }> {
    const catalog = this.loader.read() as CatalogRow[];
    if (!catalog.some((f) => f.name === name)) {
      throw new NotFoundException(`feature ${name} not found`);
    }
    const PERCENTILES = [0.10, 0.25, 0.50, 0.75, 0.90, 0.99];
    const rows = await this.db.execute(sql`
      SELECT
        percentile_cont(0.10) WITHIN GROUP (ORDER BY value_numeric) AS p10,
        percentile_cont(0.25) WITHIN GROUP (ORDER BY value_numeric) AS p25,
        percentile_cont(0.50) WITHIN GROUP (ORDER BY value_numeric) AS p50,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY value_numeric) AS p75,
        percentile_cont(0.90) WITHIN GROUP (ORDER BY value_numeric) AS p90,
        percentile_cont(0.99) WITHIN GROUP (ORDER BY value_numeric) AS p99
      FROM feature_values
      WHERE feature_name = ${name} AND value_numeric IS NOT NULL
    `);
    const r = (rows as unknown as { rows: Record<string, number | null>[] }).rows[0];
    if (!r || r.p50 === null) {
      return { feature: name, quantiles: [] };
    }
    return {
      feature: name,
      quantiles: PERCENTILES.map((p) => ({
        p,
        value: Number(r[`p${Math.round(p * 100)}`]) ?? 0,
      })),
    };
  }

  /**
   * Sample value cards — N anonymized uids with their value. Phase 01a
   * baseline; Phase 03 will join with player_lifecycle_stage etc. for
   * richer context.
   */
  async getSamples(name: string, limit: number): Promise<{ feature: string; samples: unknown[] }> {
    const catalog = this.loader.read() as CatalogRow[];
    if (!catalog.some((f) => f.name === name)) {
      throw new NotFoundException(`feature ${name} not found`);
    }
    const cap = Math.min(Math.max(limit, 1), 50);
    const rows = await this.db
      .select({
        uid: featureValues.uid,
        valueText: featureValues.valueText,
        valueNumeric: featureValues.valueNumeric,
        gameId: featureValues.gameId,
      })
      .from(featureValues)
      .where(eq(featureValues.featureName, name))
      .limit(cap);
    return {
      feature: name,
      samples: rows.map((r) => ({
        uidAnonymized: r.uid.length > 4 ? `…${r.uid.slice(-4)}` : r.uid,
        value: r.valueText ?? r.valueNumeric,
        gameId: r.gameId,
      })),
    };
  }

  /**
   * DE pipeline-health — last N derivation runs. Falls back to empty
   * list when no runs recorded yet (i.e. before step 08 has tracked them).
   */
  async getPipelineHealth(name: string, days: number): Promise<{
    feature: string;
    runs: unknown[];
    slaBreaches: number;
    p99DurationMs: number | null;
  }> {
    const catalog = this.loader.read() as CatalogRow[];
    if (!catalog.some((f) => f.name === name)) {
      throw new NotFoundException(`feature ${name} not found`);
    }
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    const rows = await this.db
      .select()
      .from(featurePipelineRuns)
      .where(and(
        eq(featurePipelineRuns.featureName, name),
        gte(featurePipelineRuns.startedAt, cutoff),
      ))
      .orderBy(desc(featurePipelineRuns.startedAt))
      .limit(60);

    const successRuns = rows.filter((r) => !r.error);
    const breaches    = rows.length - successRuns.length;
    const durations = successRuns.map((r) => r.durationMs ?? 0).filter((d) => d > 0).sort((a, b) => a - b);
    const p99 = durations.length === 0 ? null : durations[Math.floor(durations.length * 0.99)] ?? durations[durations.length - 1];

    return {
      feature: name,
      runs: rows.map((r) => ({
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString() ?? null,
        rowsWritten: Number(r.rowsWritten),
        durationMs: r.durationMs,
        error: r.error,
        sourceTable: r.sourceTable,
      })),
      slaBreaches: breaches,
      p99DurationMs: p99,
    };
  }

  /**
   * DA outliers — top-K uids whose value is most extreme relative to the
   * feature distribution. Uses zScore against the mean+stddev of
   * value_numeric. Numeric features only.
   */
  async getOutliers(name: string, topK: number): Promise<{ feature: string; outliers: unknown[] }> {
    const catalog = this.loader.read() as CatalogRow[];
    if (!catalog.some((f) => f.name === name)) {
      throw new NotFoundException(`feature ${name} not found`);
    }
    const cap = Math.min(Math.max(topK, 1), 50);
    const result = await this.db.execute(sql`
      WITH stats AS (
        SELECT avg(value_numeric)::double precision AS mean,
               stddev_pop(value_numeric)::double precision AS sd
        FROM feature_values
        WHERE feature_name = ${name} AND value_numeric IS NOT NULL
      )
      SELECT uid,
             value_numeric AS value,
             abs((value_numeric - stats.mean) / NULLIF(stats.sd, 0)) AS z_score
      FROM feature_values, stats
      WHERE feature_name = ${name} AND value_numeric IS NOT NULL
      ORDER BY z_score DESC NULLS LAST
      LIMIT ${cap}
    `);
    const rows = (result as unknown as { rows: { uid: string; value: number; z_score: number | null }[] }).rows;
    return {
      feature: name,
      outliers: rows.map((r) => ({
        uidAnonymized: r.uid.length > 4 ? `…${r.uid.slice(-4)}` : r.uid,
        value: Number(r.value),
        zScore: r.z_score === null ? 0 : Number(r.z_score),
      })),
    };
  }

  /**
   * DA coverage segmentation — joins feature_values × player_lifecycle_stage,
   * × region_code, × spend_tier_lifetime to show how this feature's
   * coverage breaks down across cohorts. Each cohort returns count + pct.
   */
  async getCoverageSegmentation(name: string): Promise<{
    feature: string;
    byLifecycle: Record<string, number>;
    byRegion: Record<string, number>;
    bySpendTier: Record<string, number>;
  }> {
    const catalog = this.loader.read() as CatalogRow[];
    if (!catalog.some((f) => f.name === name)) {
      throw new NotFoundException(`feature ${name} not found`);
    }
    // Three independent group-bys (joined via uid). LEFT JOIN so uids
    // without a cohort tag still count under '__unknown'.
    const buildBreakdown = async (cohortFeature: string): Promise<Record<string, number>> => {
      const result = await this.db.execute(sql`
        SELECT COALESCE(c.value_text, '__unknown') AS bucket,
               COUNT(*)::bigint AS c
        FROM feature_values f
        LEFT JOIN feature_values c
          ON c.uid = f.uid AND c.feature_name = ${cohortFeature}
        WHERE f.feature_name = ${name}
        GROUP BY 1
        ORDER BY 2 DESC
        LIMIT 20
      `);
      const out: Record<string, number> = {};
      for (const r of (result as unknown as { rows: { bucket: string; c: number }[] }).rows) {
        out[r.bucket] = Number(r.c);
      }
      return out;
    };
    const [byLifecycle, byRegion, bySpendTier] = await Promise.all([
      buildBreakdown('player_lifecycle_stage'),
      buildBreakdown('region_code'),
      buildBreakdown('spend_tier_lifetime'),
    ]);
    return { feature: name, byLifecycle, byRegion, bySpendTier };
  }

  /**
   * LM top-5 segments using this feature. Reads the static segments
   * catalog (loaded via loader extension) — joins by feature reference
   * in the segment's predicate AST.
   */
  async getTopSegmentsUsing(name: string): Promise<{
    feature: string;
    segments: { segmentId: string; displayName: string; audienceSize: number; game: string }[];
  }> {
    const catalog = this.loader.read() as CatalogRow[];
    if (!catalog.some((f) => f.name === name)) {
      throw new NotFoundException(`feature ${name} not found`);
    }
    const segments = await this.loadSegmentsCatalog();
    const matching = segments
      .filter((s) => featureReferencedInSpec(s, name))
      .map((s) => ({
        segmentId: s.id,
        displayName: s.displayName ?? s.id,
        audienceSize: Number(s.size ?? 0),
        game: String(s.game ?? 'cfm'),
      }))
      .sort((a, b) => b.audienceSize - a.audienceSize)
      .slice(0, 5);
    return { feature: name, segments: matching };
  }

  /**
   * DA correlations — top-K Pearson on standardized 5k uid sample,
   * computed lazily and cached in-process. First call returns empty
   * + warms the cache; subsequent calls return the precomputed value.
   * Cache key: feature name. TTL: 1h.
   */
  async getCorrelations(name: string, topK: number): Promise<{
    feature: string;
    correlations: { feature: string; pearson: number; sampleSize: number }[];
    cacheStatus: 'warm' | 'cold' | 'computing';
  }> {
    const catalog = this.loader.read() as CatalogRow[];
    if (!catalog.some((f) => f.name === name)) {
      throw new NotFoundException(`feature ${name} not found`);
    }
    const cap = Math.min(Math.max(topK, 1), 20);
    const cached = correlationCache.get(name);
    if (cached && cached.expiresAt > Date.now()) {
      return { feature: name, correlations: cached.results.slice(0, cap), cacheStatus: 'warm' };
    }
    // Schedule an async warm-up; return empty so the request is fast.
    if (!correlationInflight.has(name)) {
      correlationInflight.add(name);
      void this.computeCorrelations(name).finally(() => correlationInflight.delete(name));
      return { feature: name, correlations: [], cacheStatus: 'computing' };
    }
    return { feature: name, correlations: [], cacheStatus: 'cold' };
  }

  private async loadSegmentsCatalog(): Promise<SegmentCatalogRow[]> {
    if (segmentsCatalogCache) return segmentsCatalogCache;
    // Reuse the FeatureCatalogLoader's path-walking trick to find the
    // segments TS file and import it via dynamic require (NestJS uses CJS
    // so this works). YAGNI vs. exporting another _catalog.json — single
    // file, cached after first read.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const candidates: string[] = [];
    let cursor = __dirname;
    for (let i = 0; i < 8; i++) {
      candidates.push(path.resolve(cursor, 'apps/web/src/data/catalog/segments.ts'));
      cursor = path.dirname(cursor);
    }
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        // Read raw text, scrape predicate refs (avoids cross-workspace TS import).
        const text = fs.readFileSync(candidate, 'utf-8');
        segmentsCatalogCache = parseSegmentsCatalog(text);
        return segmentsCatalogCache;
      }
    }
    segmentsCatalogCache = [];
    return segmentsCatalogCache;
  }

  private async computeCorrelations(feature: string): Promise<void> {
    const SAMPLE = 5_000;
    // Pull SAMPLE uids that have a numeric value for `feature`.
    const baseRows = await this.db.execute(sql`
      SELECT uid, value_numeric AS v
      FROM feature_values
      WHERE feature_name = ${feature} AND value_numeric IS NOT NULL
      LIMIT ${SAMPLE}
    `);
    const baseList = (baseRows as unknown as { rows: { uid: string; v: number }[] }).rows;
    if (baseList.length < 50) {
      correlationCache.set(feature, { results: [], expiresAt: Date.now() + 5 * 60_000 });
      return;
    }
    const baseMap = new Map<string, number>(baseList.map((r) => [r.uid, Number(r.v)]));

    // Other numeric features to correlate against.
    const others = await this.db.execute(sql`
      SELECT DISTINCT feature_name
      FROM feature_values
      WHERE value_numeric IS NOT NULL AND feature_name <> ${feature}
    `);
    const otherFeatures = (others as unknown as { rows: { feature_name: string }[] }).rows
      .map((r) => r.feature_name);

    const out: { feature: string; pearson: number; sampleSize: number }[] = [];
    for (const other of otherFeatures) {
      const co = await this.db.execute(sql`
        SELECT uid, value_numeric AS v
        FROM feature_values
        WHERE feature_name = ${other} AND value_numeric IS NOT NULL AND uid IN (
          SELECT uid FROM feature_values
          WHERE feature_name = ${feature} AND value_numeric IS NOT NULL
          LIMIT ${SAMPLE}
        )
      `);
      const coRows = (co as unknown as { rows: { uid: string; v: number }[] }).rows;
      if (coRows.length < 50) continue;
      const xs: number[] = [];
      const ys: number[] = [];
      for (const r of coRows) {
        const bv = baseMap.get(r.uid);
        if (bv === undefined) continue;
        xs.push(bv);
        ys.push(Number(r.v));
      }
      if (xs.length < 50) continue;
      out.push({ feature: other, pearson: pearson(xs, ys), sampleSize: xs.length });
    }
    out.sort((a, b) => Math.abs(b.pearson) - Math.abs(a.pearson));
    correlationCache.set(feature, { results: out, expiresAt: Date.now() + 60 * 60_000 });
  }

  /** Health probe — returns the count loaded from the static catalog. */
  count(): number {
    return this.loader.read().length;
  }
}

// ── In-process caches (correlations + segments) ────────────────────────────
type SegmentCatalogRow = {
  id: string;
  displayName?: string;
  game?: string;
  size?: number;
  predicateText?: string;
};
let segmentsCatalogCache: SegmentCatalogRow[] | null = null;

const correlationCache = new Map<string, { results: { feature: string; pearson: number; sampleSize: number }[]; expiresAt: number }>();
const correlationInflight = new Set<string>();

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
    sxx += xs[i] * xs[i];
    syy += ys[i] * ys[i];
    sxy += xs[i] * ys[i];
  }
  const denom = Math.sqrt(n * sxx - sx * sx) * Math.sqrt(n * syy - sy * sy);
  return denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
}

/**
 * Cheap text scrape over apps/web/src/data/catalog/segments.ts to extract
 * each segment's id, displayName, game, size, and a flattened predicate
 * blob (used for feature-name reference checks). Avoids workspace import.
 */
function parseSegmentsCatalog(text: string): SegmentCatalogRow[] {
  const out: SegmentCatalogRow[] = [];
  // Each segment = `const segXxx: HermesSegment = { id: 'seg-...', displayName: '...', ... };`
  // We do a permissive multi-line regex per object.
  const objRegex = /\{[\s\S]*?id:\s*['"]([^'"]+)['"][\s\S]*?\}/g;
  let m: RegExpExecArray | null;
  while ((m = objRegex.exec(text)) !== null) {
    const block = m[0];
    const id = m[1];
    const displayName = block.match(/displayName:\s*['"]([^'"]+)['"]/)?.[1];
    const game = block.match(/\bgame:\s*['"]([^'"]+)['"]/)?.[1];
    const sizeStr = block.match(/\bsize:\s*(\d+)/)?.[1];
    out.push({
      id,
      displayName,
      game,
      size: sizeStr ? Number(sizeStr) : 0,
      predicateText: block,
    });
  }
  return out;
}

function featureReferencedInSpec(seg: SegmentCatalogRow, featureName: string): boolean {
  if (!seg.predicateText) return false;
  // Look for the feature name as a quoted string anywhere in the segment block.
  return seg.predicateText.includes(`'${featureName}'`) || seg.predicateText.includes(`"${featureName}"`);
}
