/**
 * Hermes Feature Store catalog schema — Hermes-specific extension over the
 * Bedrock Feature type. The existing Feature schema is Bedrock-era generic;
 * this schema captures the Hermes Feature Store semantics per PRD §6.
 *
 * Key additions:
 *   - displayName (serif italic label)
 *   - latencyTier with dual-tier support ('<1s · A' / '<1h · B' / '<1d · B')
 *   - substrate ('A' = Apollo TEE | 'B' = Hatchet/Trino/Iceberg)
 *   - domain (one of the 9 feature domains)
 *   - dualTier flag for features with two materializations
 *   - definition with expr-lang + dbt SQL for the Semantic Management Layer
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
  /** snake_case technical name — verbatim from Hermes_Demo_Data.md */
  name: z.string(),
  /** Serif italic display label for UI */
  displayName: z.string(),
  type: HermesFeatureType,
  /** Primary latency tier */
  latencyTier: HermesLatencyTier,
  /** Primary substrate */
  substrate: HermesSubstrate,
  domain: HermesFeatureDomain,
  owner: z.string(),
  status: HermesFeatureStatus,
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
});
export type HermesFeature = z.infer<typeof HermesFeature>;
