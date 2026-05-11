---
phase: 1
title: "Catalog-API persona endpoints"
status: pending
priority: P1
effort: "8h"
dependencies: []
---

# Phase 01: Catalog-API Persona Endpoints

## Overview

Add 8 new endpoints to `apps/catalog-api/src/features/` so the redesigned detail page (Phases 03-05) can render persona-specific panels. Plus a new `feature_pipeline_runs` table for DE pipeline-health.

## Endpoints

| Route | Persona | Returns |
|---|---|---|
| `GET /features/:name/quantiles?days=30` | DA | `{ today: {p10..p99}, comparedTo: {p10..p99}, snapshotDate }` |
| `GET /features/:name/coverage-segmentation` | DA | `{ byLifecycle: {...}, byRegion: {...}, byVip: {...} }` (joins feature_values × std_master_user_profile-derived features) |
| `GET /features/:name/samples?limit=10` | DA | `[{ uid, value, lifecycleStage, lastLoginDaysAgo, region, totalRev }]` |
| `GET /features/:name/correlations?topK=5` | DA | `[{ feature, pearson, sampleSize }]` |
| `GET /features/:name/outliers?topK=5` | DA | `[{ uid, value, zScore }]` |
| `GET /features/:name/pipeline-health?days=30` | DE | `{ runs: [{ startedAt, finishedAt, rowsWritten, error }], slaBreaches7d, p99DerivationMs }` |
| `GET /features/:name/audience-count?op=gt&value=30` | LM | `{ count, totalUids, fraction }` (real Postgres COUNT) |
| `GET /features/:name/top-segments-using` | LM | `[{ segmentId, displayName, audienceSize }]` (joins static segments catalog) |

## Implementation Steps

1. Add Drizzle table `feature_pipeline_runs (feature_name, started_at, finished_at, rows_written, error, source_table)` in `schema-features.ts`. Migration `0009_feature_pipeline_runs.sql`.
2. Patch step 08 to insert one row per derivation start/finish.
3. Patch step 09 same for analytics rollup runs.
4. Add 8 service methods to `FeaturesService` reading from existing tables + the new runs table.
5. Add 8 controller routes.
6. Audience-count perf: rely on existing `fv_by_numeric` index. Benchmark with EXPLAIN ANALYZE on `account_age_days`.
7. Correlations: precompute lazily — first request triggers a background `feature_correlations` materializer (Pearson over sampled 50k uids). Cache 24h. Fallback: empty array on first call.

## Success Criteria

- [ ] All 8 endpoints respond 200 for `account_age_days` (real T2) and 404 for unknown feature.
- [ ] Audience-count for `account_age_days > 30` returns in <300ms p95 (5 trials).
- [ ] Correlations populated for ≥10 features after first warm-up.
- [ ] Validation script extended to 27 assertions.

## Risk

- Coverage-segmentation requires joining feature_values × `player_lifecycle_stage` etc. — both are in feature_values, so trivial. But it's slow (multiple table scans). Cache result for 1h.
- Correlations on sampled 50k × 48 features = 1.2k pairs — under 30s nightly. First request user sees may show empty list briefly.
