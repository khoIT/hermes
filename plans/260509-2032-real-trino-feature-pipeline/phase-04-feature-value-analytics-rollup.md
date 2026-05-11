---
phase: 4
title: "Feature Value & Analytics Rollup"
status: pending
priority: P1
effort: "8h"
dependencies: [2, 3]
---

# Phase 04: Feature Value & Analytics Rollup

## Overview

Apply per-feature derivations against the 30d (7d real + 23d synth) `raw_event_aggregates` table to produce: (a) **per-uid `feature_values`** for the 48 batch features with source-table mappings, (b) **daily `feature_distributions_daily`** histograms, and (c) **single-row `feature_analytics_180d`** rollup matching the `FeatureAnalytics180d` zod shape the UI already consumes.

T5 features (25 with `source_table: null`) keep their existing synth path; this phase writes their analytics rows directly from the existing `feature-analytics-180d.json` so the API can serve all 73 features uniformly.

## Requirements

**Functional:**
- `derivations/<feature>.ts` per batch feature — pure functions `(rawAggregates, computedAt) → featureValueRow[]`.
- Step `08-compute-feature-values.ts` orchestrates: for each feature in `derivation-coverage.json` with non-null `source_table`, run derivation, bulk-write `feature_values`.
- Step `09-compute-feature-analytics.ts` reads `feature_values` + `raw_event_aggregates`, computes histograms / drift / freshness / null-rate / top-campaigns, writes `feature_distributions_daily` + `feature_analytics_180d`.
- T5 fallback: `09` reads `apps/web/src/data/catalog/feature-analytics-180d.json` for any feature with no `feature_values` rows and writes that data verbatim into `feature_analytics_180d` with `source='synth'`.

**Non-functional:**
- Each derivation ≤30 lines, named after the feature (`account-age-days.ts`, `ranked-win-rate-30d.ts`, …).
- Idempotent: re-running step 08 truncates+rewrites `feature_values` for that feature only; step 09 truncates+rewrites the analytics row.
- All derivations covered by unit tests with fixture rows (vitest, in `infra/trino-crawler/src/derivations/__tests__/`).

## Architecture

### Derivation registry

```ts
// derivations/index.ts
export const DERIVATIONS: Record<string, Derivation> = {
  account_age_days: { sourceTables: ['etl_login'], fn: deriveAccountAgeDays },
  lifetime_login_count: { sourceTables: ['etl_login'], fn: deriveLifetimeLoginCount },
  // ... 46 more
};

export type Derivation = {
  sourceTables: string[];
  fn: (uidAggregates: RawAggregateRow[], computedAt: Date) => FeatureValueRow[];
};
```

### Per-feature SQL helper

`feature-value-loader.ts` exposes `loadAggregatesForUid(sourceTable, uid)` and `streamAllUids(sourceTable)` (cursor-based; iterates by uid so memory bounded).

### Distribution rollup

For each feature, write 30 rows into `feature_distributions_daily` (one per day):
- Numeric features → 24-bin equal-width histogram (binEnd / binStart / count).
- Bool features → 2 categorical buckets (`true`, `false`).
- Enum features → **full categorical histogram** — one bucket per observed label, no top-N truncation, no `"other"` collapse. Empty labels (zero count) omitted.
- Computed by streaming `feature_values` rows for that feature into a histogram accumulator with the snapshot date stamp.

### 180d analytics rollup

Single row per feature into `feature_analytics_180d` matching `FeatureAnalytics180d` zod shape:
- `usage_count_180d` = sum of daily `feature_values` writes × MAU coverage estimate (or pulled from `event_volumes` table — confirm during impl).
- `drift_score` = max bucket-shift between earliest and latest snapshot (Wasserstein-lite over histograms).
- `drift_event_dates` = days where bucket-shift exceeds threshold (0.15 by default).
- `freshness_sla_met` = fraction of 30d rolled up successfully (1.0 when no failures).
- `null_rate` = `null_count / total_uids` from latest day's `feature_distributions_daily`.
- `distinct_values_p50` = `distinct_count` from latest day.
- `top_consuming_campaigns` = derived from `apps/web/src/data/catalog/campaigns.ts` — count which campaigns reference each feature in their `entrySegmentSpec`. (Static, but emit per-feature so UI shape matches.)
- `request_rate_sparkline[180]` = synth from real 30d daily totals, repeated × 6 with day-of-week jitter.
- `last_backfill_at` = `now()`.
- `coverage_of_mau` = `count(distinct uid in feature_values) / count(distinct uid in std_master_user_profile aggregates)`.
- `median_lag_minutes` = synth (placeholder) — real freshness lag instrumentation is deferred.
- `p99_lookup_latency_ms` = synth — same reasoning.
- `last_sla_miss_at` = null when `freshness_sla_met = 1.0`, else most recent miss.
- `source` = `'real'` if all 30d rows have `is_synthesized=false`, `'hybrid'` if mixed, `'synth'` for T5.

### Orchestration

```
Step 08:
  For each feature with source_table != null:
    Truncate feature_values WHERE feature_name = X.
    Stream raw aggregates for relevant uids.
    Apply derivation fn → feature_value rows.
    Bulk insert.

Step 09:
  For each feature in catalog (all 73):
    If feature has feature_values rows:
       Compute 30 daily histograms → upsert feature_distributions_daily.
       Compute 180d analytics rollup → upsert feature_analytics_180d (source='real' or 'hybrid').
    Else (T5):
       Read static feature-analytics-180d.json[feature_name].
       Upsert feature_analytics_180d (source='synth').
```

## Related Code Files

**Create:**
- `infra/trino-crawler/src/derivations/index.ts` — registry
- `infra/trino-crawler/src/derivations/<feature>.ts` × 48
- `infra/trino-crawler/src/derivations/__tests__/derivations.test.ts` — fixture-driven coverage
- `infra/trino-crawler/src/feature-value-loader.ts` — Postgres uid streamer
- `infra/trino-crawler/src/steps/08-compute-feature-values.ts`
- `infra/trino-crawler/src/steps/09-compute-feature-analytics.ts`
- `infra/trino-crawler/src/analytics/histogram-builder.ts`
- `infra/trino-crawler/src/analytics/drift-detector.ts`
- `infra/trino-crawler/src/analytics/top-consuming-campaigns.ts`

**Modify:**
- `infra/trino-crawler/src/main.ts` — wire `--features-only`, `--analytics-only`; reorder `all` mode

**Delete:** none

## Implementation Steps

1. Build the 4 analytics utilities first (`histogram-builder`, `drift-detector`, `top-consuming-campaigns`, `feature-value-loader`) with vitest coverage.
2. Author derivations in 4 batches by domain (identity-lifecycle, monetization+currency, engagement+gameplay, social+streaks). Each batch lands with its own commit so review is tractable.
3. Build step 08 + step 09 orchestrators.
4. Run `pnpm refresh-cfm-data --features-only --analytics-only` end-to-end. Inspect rowcounts in Postgres.
5. Sanity check: pick `account_age_days`, query `feature_distributions_daily` for the latest snapshot, verify histogram shape matches the synth fixture (long-tailed, peak at 1-2 days). Variance is expected.
6. Sanity check 2: `feature_analytics_180d.source` should be `'real'` for ~46 features, `'synth'` for 25 T5 features, `'hybrid'` for any mixed-source feature.
7. `pnpm typecheck` and commit per batch.

## Todo List

- [ ] Build histogram-builder + drift-detector + top-consuming-campaigns utilities (with tests)
- [ ] Build feature-value-loader (Postgres uid stream)
- [ ] Author 48 derivations (4 batches) with unit tests
- [ ] Build step 08 orchestrator
- [ ] Build step 09 orchestrator (incl. T5 fallback path)
- [ ] Wire CLI flags
- [ ] End-to-end run + sanity-check rowcounts
- [ ] `pnpm typecheck` green
- [ ] Commit per batch

## Success Criteria

- [ ] `feature_values` table has rows for all 48 T1-T4 features. T5 features have zero rows in `feature_values` (expected) but still have a row in `feature_analytics_180d` with `source='synth'`.
- [ ] `feature_distributions_daily` has 30 rows per feature with non-null source.
- [ ] `feature_analytics_180d` has 73 rows total (one per catalog feature).
- [ ] Sample drift score for `account_age_days` is non-zero (timeline projection induces variance).
- [ ] Unit tests pass: `pnpm --filter @hermes/trino-crawler test`.

## Risk Assessment

- **Derivation correctness drift from synth fixtures:** real `account_age_days` may distribute differently from the synth power-law alpha=1.8. **Mitigation:** sanity check + reviewed in Phase 07 demo walkthrough; treat real as authoritative.
- **T4 features (`avg_session_duration_30d`, `social_engagement_score`, `specific_pack_owned`) are heuristic:** their derivations are approximate. **Decision (2026-05-09):** attempt with proxy SQL — `avg_session_duration_30d` ≈ paired login/logout duration via `etl_login` / `etl_logout` join; `social_engagement_score` ≈ weighted blend of `etl_game_detail` social columns; `specific_pack_owned` ≈ ownership inferred from `etl_moneyflow` event signatures. All three tagged `feature_analytics_180d.source = 'hybrid'`. Header comment in each derivation documents the proxy and its known accuracy gap. On query failure, fall back to the static `feature-analytics-180d.json` synth value with `source='synth'` and a logged warning.
- **48 derivations is a lot of code:** review burden, possible bugs. **Mitigation:** strict file size <30 LOC per derivation, identical signature, test fixture per feature.
- **Top-consuming-campaigns is static-only here:** real campaign-fire counts would require Apollo TEE telemetry which we don't have. **Mitigation:** derive from catalog reference counts (number of campaigns whose `entrySegmentSpec` references the feature × scaled fire estimate). Document the proxy in the analytics file's header comment.
