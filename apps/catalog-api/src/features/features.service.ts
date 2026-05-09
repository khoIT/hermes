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

  /** Health probe — returns the count loaded from the static catalog. */
  count(): number {
    return this.loader.read().length;
  }
}
