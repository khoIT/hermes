/**
 * Feature-pipeline drizzle schema.
 *
 * Lives separately from `schema.ts` to keep both files under 200 LOC and to
 * isolate the Phase 2 (Real Trino Feature Pipeline) tables from the legacy
 * Bedrock-derived tables.
 *
 * Re-exported from `schema.ts` so existing import sites are unchanged.
 *
 * Provenance: every table carries an `is_synthesized` boolean (or `source`
 * enum-as-text) so consumers can distinguish real-Trino rows from the 23d
 * timeline-projected synth backfill.
 */

import {
  pgTable, text, bigint, doublePrecision, timestamp, date, boolean, jsonb, primaryKey, index,
} from 'drizzle-orm/pg-core';

// ───────────────────────────────────────────────────────────────────
// raw_event_aggregates — per-day, per-uid rollup of each source table.
// Trino-side aggregation writes 7d real rows; synth step projects 23d
// past behavior on top. Indexed for date-range and source-table reads.
// ───────────────────────────────────────────────────────────────────
export const rawEventAggregates = pgTable('raw_event_aggregates', {
  sourceTable:    text('source_table').notNull(),                      // e.g. 'etl_login'
  uid:            text('uid').notNull(),                               // vopenid
  eventDate:      date('event_date').notNull(),
  rowCount:       bigint('row_count', { mode: 'number' }).notNull().default(0),
  numericSum:     doublePrecision('numeric_sum'),
  numericMax:     doublePrecision('numeric_max'),
  numericMin:     doublePrecision('numeric_min'),
  lastValue:      jsonb('last_value'),                                 // arbitrary trailing fields per source table
  isSynthesized:  boolean('is_synthesized').notNull().default(false),
  computedAt:     timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk:           primaryKey({ columns: [t.sourceTable, t.uid, t.eventDate] }),
  byDate:       index('rea_by_date').on(t.eventDate),
  byTableDate:  index('rea_by_table_date').on(t.sourceTable, t.eventDate),
  bySynth:      index('rea_by_synth').on(t.isSynthesized),
}));

// ───────────────────────────────────────────────────────────────────
// feature_values — latest per-uid value for each batch feature. We
// store only the latest snapshot (no per-uid timeseries) to bound
// storage; per-day shape lives in feature_distributions_daily.
// ───────────────────────────────────────────────────────────────────
export const featureValues = pgTable('feature_values', {
  featureName:    text('feature_name').notNull(),
  uid:            text('uid').notNull(),
  valueText:      text('value_text'),                                  // canonical string repr
  valueNumeric:   doublePrecision('value_numeric'),                    // null for enum/bool/string-only
  computedAt:     timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  isSynthesized:  boolean('is_synthesized').notNull().default(false),
}, (t) => ({
  pk:        primaryKey({ columns: [t.featureName, t.uid] }),
  byNumeric: index('fv_by_numeric').on(t.featureName, t.valueNumeric),
}));

// ───────────────────────────────────────────────────────────────────
// feature_distributions_daily — daily histogram per feature.
// Numeric features → 24-bin equal-width buckets.
// Bool features → 2 buckets (true/false).
// Enum features → full categorical buckets (one per observed label,
// no top-N truncation, no "other" collapse). Empty labels omitted.
// ───────────────────────────────────────────────────────────────────
export const featureDistributionsDaily = pgTable('feature_distributions_daily', {
  featureName:    text('feature_name').notNull(),
  snapshotDate:   date('snapshot_date').notNull(),
  bucketKind:     text('bucket_kind').notNull(),                       // 'numeric' | 'categorical'
  buckets:        jsonb('buckets').notNull(),                          // {binStart,binEnd,count}[] | {label,count}[]
  totalUids:      bigint('total_uids', { mode: 'number' }).notNull().default(0),
  nullCount:      bigint('null_count', { mode: 'number' }).notNull().default(0),
  distinctCount:  bigint('distinct_count', { mode: 'number' }).notNull().default(0),
  isSynthesized:  boolean('is_synthesized').notNull().default(false),
  computedAt:     timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk:           primaryKey({ columns: [t.featureName, t.snapshotDate] }),
  byFeature:    index('fdd_by_feature').on(t.featureName),
}));

// ───────────────────────────────────────────────────────────────────
// feature_analytics_180d — single rollup row per feature in the
// FeatureAnalytics180d zod shape (see packages/contracts). The
// catalog-api `/features` endpoint reads this directly.
//
// `source` discriminates provenance:
//   'real'   = all 30d rows are is_synthesized=false (Trino real)
//   'hybrid' = mix of real + synth (e.g. 7d real + 23d backfill, or
//              T4 features computed via proxy SQL)
//   'synth'  = T5 features (no source_table mapping); analytics
//              copied from apps/catalog-api/src/seed/feature-analytics-180d.json
// ───────────────────────────────────────────────────────────────────
export const featureAnalytics180d = pgTable('feature_analytics_180d', {
  featureName:           text('feature_name').primaryKey(),
  usageCount180d:        bigint('usage_count_180d', { mode: 'number' }).notNull().default(0),
  driftScore:            doublePrecision('drift_score').notNull().default(0),
  driftEventDates:       jsonb('drift_event_dates').notNull(),         // string[] (ISO dates)
  freshnessSlaMet:       doublePrecision('freshness_sla_met').notNull().default(1),
  nullRate:              doublePrecision('null_rate').notNull().default(0),
  distinctValuesP50:     bigint('distinct_values_p50', { mode: 'number' }).notNull().default(0),
  topConsumingCampaigns: jsonb('top_consuming_campaigns').notNull(),   // TopConsumingCampaign[]
  requestRateSparkline:  jsonb('request_rate_sparkline').notNull(),    // number[180]
  lastBackfillAt:        timestamp('last_backfill_at', { withTimezone: true }),
  p99LookupLatencyMs:    bigint('p99_lookup_latency_ms', { mode: 'number' }),
  coverageOfMau:         doublePrecision('coverage_of_mau'),
  medianLagMinutes:      bigint('median_lag_minutes', { mode: 'number' }),
  lastSlaMissAt:         timestamp('last_sla_miss_at', { withTimezone: true }),
  source:                text('source').notNull().default('synth'),    // 'real' | 'hybrid' | 'synth'
  computedAt:            timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  bySource: index('fa180_by_source').on(t.source),
}));
