import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, and, gte } from 'drizzle-orm';
import {
  featureAnalytics180d,
  featureDistributionsDaily,
} from '../db/schema';
import type { Db } from '../db/client';
import { InjectDb } from '../db/client';
import { FeatureCatalogLoader } from './feature-catalog-loader';

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

  /** Health probe — returns the count loaded from the static catalog. */
  count(): number {
    return this.loader.read().length;
  }
}
