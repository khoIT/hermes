/**
 * Hermes Feature Store catalog schema — Hermes-specific extension over the
 * Bedrock Feature type. The existing Feature schema is Bedrock-era generic;
 * this schema captures the Hermes Feature Store semantics per PRD §6.
 *
 * v1 additions:
 *   - displayName (serif italic label)
 *   - latencyTier with dual-tier support
 *   - substrate ('A' = Apollo TEE | 'B' = Hatchet/Trino/Iceberg)
 *   - domain (one of 11 feature domains)
 *   - dualTier flag for features with two materializations
 *   - definition with expr-lang + dbt SQL for the Semantic Management Layer
 *
 * v2 additions (Feature Store v2 — discovery + analytics redesign):
 *   - games[] (HermesGame multi-select; replaces owner attribution PM-side)
 *   - platform flag + propensityModel meta (cross-game GDS propensity models)
 *   - analytics (180-day usage / drift / freshness / cardinality / consumption)
 */
import { z } from 'zod';

export const HermesLatencyTier = z.enum(['<1s', '<1h', '<1d']);
export type HermesLatencyTier = z.infer<typeof HermesLatencyTier>;

export const HermesSubstrate = z.enum(['A', 'B']);
export type HermesSubstrate = z.infer<typeof HermesSubstrate>;

export const HermesFeatureDomain = z.enum([
  'identity-lifecycle',
  'monetization',
  'currency',
  'engagement',
  'gameplay-cfm',
  'stateful-streaks',
  'inventory',
  'promotion-config',
  'social-playstyle',
  'test-system',
  'campaign-engagement',
  'predictive',
]);
export type HermesFeatureDomain = z.infer<typeof HermesFeatureDomain>;

export const HermesFeatureType = z.enum([
  'int',
  'numeric',
  'bool',
  'enum',
  'string',
  'timestamp',
  'array<string>',
]);
export type HermesFeatureType = z.infer<typeof HermesFeatureType>;

/**
 * Hermes game codes — see liveops_2026_campaign_requirements.md for the
 * canonical list. CFM uses real Trino fixtures; PTG/NTH/TF/COS/PT use
 * deterministically-synthesised analytics anchored to the campaign calendar.
 */
export const HermesGame = z.enum(['cfm', 'ptg', 'nth', 'tf', 'cos', 'pt']);
export type HermesGame = z.infer<typeof HermesGame>;

/** Propensity model families for cross-game platform features. */
export const PropensityModelFamily = z.enum([
  'pltv', // predicted lifetime value
  'churn', // churn risk
  'reactivation', // win-back probability
  'monetization', // first-payment / next-payment propensity
  'engagement', // session-likelihood
]);
export type PropensityModelFamily = z.infer<typeof PropensityModelFamily>;

export const PropensityModelMeta = z.object({
  family: PropensityModelFamily,
  /** e.g. "30d_revenue", "7d_churn" */
  target: z.string(),
  trainingWindowDays: z.number().int().positive(),
  /** e.g. "0.78-0.82" */
  aucBand: z.string(),
  /** e.g. "v3.2" */
  modelVersion: z.string(),
  refreshCadence: z.enum(['daily', 'weekly']),
});
export type PropensityModelMeta = z.infer<typeof PropensityModelMeta>;

/** Top-3 campaign consumers for the Analytics tab "Top consuming campaigns" panel. */
export const TopConsumingCampaign = z.object({
  campaignId: z.string(),
  game: HermesGame,
  fires180d: z.number().int().nonnegative(),
});
export type TopConsumingCampaign = z.infer<typeof TopConsumingCampaign>;

/**
 * 180-day analytics rollup. Drives the detail-page Analytics tab + library
 * row card (sparkline, freshness gauge, drift detected count).
 *
 * Newly-registered features (Phase 4) carry zeroed analytics with
 * `lastBackfillAt: null` to signal the "7-day warm-up" empty state.
 */
export const FeatureAnalytics180d = z.object({
  usageCount180d: z.number().int().nonnegative(),
  /** 0 = stable, 1 = severe drift */
  driftScore: z.number().min(0).max(1),
  /** ISO dates flagged as drift events (overlay markers on distribution chart) */
  driftEventDates: z.array(z.string()),
  /** Fraction of buckets meeting freshness SLA (0..1) */
  freshnessSlaMet: z.number().min(0).max(1),
  nullRate: z.number().min(0).max(1),
  distinctValuesP50: z.number().int().nonnegative(),
  topConsumingCampaigns: z.array(TopConsumingCampaign).max(3),
  /** Daily request count over 180 days — exactly 180 buckets */
  requestRateSparkline: z.array(z.number()).length(180),
  /** ISO timestamp of last successful backfill; null for newly-registered features */
  lastBackfillAt: z.string().nullable(),
  /** Median lookup latency at p99 in ms (online tier) */
  p99LookupLatencyMs: z.number().nonnegative().optional(),
  /** Coverage: fraction of MAU covered (0..1) */
  coverageOfMau: z.number().min(0).max(1).optional(),
  /** Median freshness lag in minutes (for FreshnessVsSlaPanel) */
  medianLagMinutes: z.number().nonnegative().optional(),
  /** Last freshness-SLA miss timestamp (ISO) */
  lastSlaMissAt: z.string().nullable().optional(),
});
export type FeatureAnalytics180d = z.infer<typeof FeatureAnalytics180d>;

export const HermesFeatureDefinition = z.object({
  /** expr-lang expression for Substrate A (Apollo TEE) */
  exprLang: z.string(),
  /** dbt / Trino SQL for Substrate B (Hatchet/Trino/Iceberg) */
  dbtSql: z.string(),
});
export type HermesFeatureDefinition = z.infer<typeof HermesFeatureDefinition>;

export const HermesFeatureStatus = z.enum(['active', 'beta', 'deprecated']);
export type HermesFeatureStatus = z.infer<typeof HermesFeatureStatus>;

export const HermesFeature = z.object({
  /** snake_case technical name */
  name: z.string(),
  /** Serif italic display label for UI */
  displayName: z.string(),
  type: HermesFeatureType,
  /** Primary latency tier */
  latencyTier: HermesLatencyTier,
  /** Primary substrate */
  substrate: HermesSubstrate,
  domain: HermesFeatureDomain,
  /** DEPRECATED PM-side; kept for back-compat + engineer-facing surfaces. v2 uses games[]. */
  owner: z.string(),
  status: HermesFeatureStatus,
  /**
   * v2: games this feature is wired into. Non-empty after migration.
   * Single-game features have one entry; cross-game features have many.
   * Platform-propensity features include all 6.
   */
  games: z.array(HermesGame).min(1),
  /**
   * v2: true when feature is a cross-game GDS-owned propensity model.
   * Renders the deep-red "Platform · Propensity" chip and the model card.
   */
  platform: z.boolean().optional(),
  /** v2: propensity-model metadata; only set when platform = true. */
  propensityModel: PropensityModelMeta.optional(),
  /**
   * True for dual-tier features (<1s·A AND <1h·B) — one feature, two
   * materializations. Only applies to stateful-streaks domain currently.
   */
  dualTier: z.boolean().optional(),
  /**
   * Semantic layer definition — expr-lang + dbt SQL.
   * Present for features with non-trivial derivations; omitted for
   * raw Kafka ingestions where the definition is implicit.
   */
  definition: HermesFeatureDefinition.optional(),
  /** ISO date the feature was added */
  addedAt: z.string().optional(),
  /** Display sparkline key for 7d distribution chart */
  sparklineKey: z.string().optional(),
  /** Back-reference counts — populated by catalog aggregation */
  usedBySegments: z.number().int().nonnegative().optional(),
  usedByCampaigns: z.number().int().nonnegative().optional(),
  /**
   * v2: 180-day analytics block — required, but zeroed for newly-registered features.
   * Loaded via feature-analytics-180d.json + injected at module load.
   */
  analytics: FeatureAnalytics180d,
});
export type HermesFeature = z.infer<typeof HermesFeature>;

/**
 * Source-form feature — what each catalog file exports. Analytics is loaded
 * separately from feature-analytics-180d.json + injected at module load to
 * produce the full HermesFeature surface.
 */
export type HermesFeatureSource = Omit<HermesFeature, 'analytics'>;
