---
phase: 1
title: "Schema & DB Design"
status: pending
priority: P1
effort: "4h"
dependencies: []
---

# Phase 01: Schema & DB Design

## Overview

Design the Postgres schema that receives Trino crawl output, holds 30d synth backfill, and powers the catalog-api `/features` endpoints. Validate Trino reachability against real `iceberg.cfm_vn` tables (not via SHOW SCHEMAS, which the prior audit showed is access-denied for this account).

## Requirements

**Functional:**
- 4 new Postgres tables (drizzle schema additions): `raw_event_aggregates`, `feature_values`, `feature_distributions_daily`, `feature_analytics_180d`.
- One drizzle migration committed and applied via `pnpm migrate`.
- A diagnostic script `infra/trino-crawler/src/diagnose-trino.ts` that runs `SELECT 1`, then `SELECT count(*) FROM iceberg.cfm_vn.etl_login WHERE dteventtime > current_date - INTERVAL '1' DAY`, captures pass/fail/timing per known table, and writes the result to `infra/trino-crawler/trino-diagnostic.md`.

**Non-functional:**
- Schema must support the existing `FeatureAnalytics180d` zod shape (`packages/contracts/src/hermes-feature.ts:100`) without lossy projection.
- Composite primary keys on hot read paths so daily refresh can `UPSERT` cleanly.
- Indexed by `(feature_name, snapshot_date)` for time-series reads.

## Architecture

### Table 1 — `raw_event_aggregates`

Per-day, per-uid rollup for each source table, scoped by event date. One row per `(source_table, uid, event_date)`. Holds the minimum fields needed by feature derivations (count, sum, min/max ts, max value, last value).

```
raw_event_aggregates
  source_table   text       e.g. 'etl_login', 'etl_recharge', 'etl_game_detail'
  uid            text       vopenid
  event_date     date
  row_count      bigint     COUNT(*) for this uid on this date
  numeric_sum    double     e.g. revenue sum on etl_recharge; mmr sum on etl_game_detail
  numeric_max    double
  numeric_min    double
  last_value     text       JSON-encoded last row's relevant fields
  is_synthesized boolean    true for 23d synth backfill rows
  computed_at    timestamptz
  PK             (source_table, uid, event_date)
  IDX            (event_date), (source_table, event_date)
```

### Table 2 — `feature_values`

Latest per-uid value for each batch feature. Replaces per-uid timeseries to bound storage.

```
feature_values
  feature_name   text       'account_age_days'
  uid            text
  value_text     text       canonical string repr (parsed by feature type at query time)
  value_numeric  double     null when feature is enum/bool/string-only
  computed_at    timestamptz
  is_synthesized boolean
  PK             (feature_name, uid)
  IDX            (feature_name, value_numeric)  -- supports histogram queries
```

### Table 3 — `feature_distributions_daily`

Daily histogram per feature for the value-distribution-over-time panel. 30 buckets per snapshot.

```
feature_distributions_daily
  feature_name   text
  snapshot_date  date
  bucket_kind    text       'numeric' | 'categorical'
  buckets        jsonb      [{binStart, binEnd, count}] | [{label, count}]
  total_uids     bigint
  null_count     bigint
  distinct_count bigint
  computed_at    timestamptz
  is_synthesized boolean
  PK             (feature_name, snapshot_date)
```

### Table 4 — `feature_analytics_180d`

Single rollup row per feature in the `FeatureAnalytics180d` zod shape, refreshed at the end of each crawl. UI reads this directly.

```
feature_analytics_180d
  feature_name        text PK
  usage_count_180d    bigint
  drift_score         double
  drift_event_dates   jsonb         string[]
  freshness_sla_met   double
  null_rate           double
  distinct_values_p50 bigint
  top_consuming_campaigns jsonb     {campaignId, game, fires180d}[]
  request_rate_sparkline jsonb      number[180]
  last_backfill_at    timestamptz null
  p99_lookup_latency_ms bigint
  coverage_of_mau     double
  median_lag_minutes  bigint
  last_sla_miss_at    timestamptz null
  source              text          'real' | 'synth' | 'hybrid'
  computed_at         timestamptz
```

### Trino diagnostic flow

`SHOW SCHEMAS FROM iceberg` is access-denied for this user (verified in current `schema-audit.md`). The diagnostic must:
1. Try `SELECT 1` (proves connection).
2. Try `SELECT count(*) FROM iceberg.cfm_vn.<table> WHERE <date_col> >= current_date - INTERVAL '7' DAY` for each of the 7 expected tables (`etl_login`, `etl_logout`, `etl_game_detail`, `etl_recharge`, `etl_moneyflow`, `etl_appsflyer_installs_datalocker`, `std_master_user_profile`).
3. Record per-table latency + row count + error.
4. Emit pass/fail summary; non-zero exit if zero tables reachable.

This replaces the current schema-audit-via-SHOW-SCHEMAS approach which fails before any real data check.

## Related Code Files

**Create:**
- `apps/catalog-api/src/db/schema-features.ts` — drizzle definitions for the 4 tables (kept separate from `schema.ts` so it stays under 200 lines)
- `apps/catalog-api/src/db/migrations/000X_features.sql` — generated by drizzle-kit
- `infra/trino-crawler/src/diagnose-trino.ts` — diagnostic script
- `infra/trino-crawler/trino-diagnostic.md` — diagnostic output (gitignored at write time, committed once green)

**Modify:**
- `apps/catalog-api/src/db/schema.ts` — re-export from `schema-features.ts` so existing imports still work
- `apps/catalog-api/drizzle.config.ts` — pick up the new schema file
- `infra/trino-crawler/package.json` — add `diagnose` script

**Delete:** none

## Implementation Steps

1. **Validate Trino access first.** Write `diagnose-trino.ts`; run with `pnpm --filter @hermes/trino-crawler diagnose`. If VPN is up but auth still fails on every table, escalate to user before proceeding (this is a hard blocker for phases 2-7).
2. Add `schema-features.ts` with the 4 tables. Re-export from `schema.ts`.
3. Run `pnpm --filter @hermes/catalog-api db:generate` (or equivalent drizzle-kit command) to create migration SQL. Inspect it. Run `pnpm migrate`.
4. Update `schema-audit.md` writer in `00-schema-discovery.ts` to use direct table queries when SHOW SCHEMAS is access-denied (preserve the stub-mode fallback).
5. `pnpm typecheck` — must pass.
6. Commit: `feat(catalog-api): add feature-pipeline drizzle schema (raw_event_aggregates, feature_values, feature_distributions_daily, feature_analytics_180d)`.

## Todo List

- [ ] Implement `diagnose-trino.ts` and run it
- [ ] Author `schema-features.ts` with all 4 tables
- [ ] Re-export from `schema.ts`
- [ ] Generate + apply drizzle migration
- [ ] Update `00-schema-discovery.ts` to bypass SHOW SCHEMAS gracefully
- [ ] `pnpm typecheck` green
- [ ] Commit

## Success Criteria

- [ ] `pnpm --filter @hermes/trino-crawler diagnose` produces `trino-diagnostic.md` listing per-table reachability + row counts.
- [ ] `pnpm migrate` applies the new tables to local Postgres without error.
- [ ] `psql -c "\d feature_values"` shows the schema as documented above.
- [ ] `pnpm typecheck` green across the workspace.

## Risk Assessment

- **VPN/auth blocker:** Diagnostic exits non-zero → escalate to user before sinking effort into phases 2-7. **Mitigation:** the diagnostic IS the gate.
- **Drizzle migration ordering:** existing migrations have specific numbering. **Mitigation:** use `pnpm --filter @hermes/catalog-api db:generate` so drizzle-kit picks the next number.
- **Schema drift later:** if Phase 4 finds the schema can't represent some analytic, we revisit — but the design is `FeatureAnalytics180d` shape-isomorphic so this should be rare.
