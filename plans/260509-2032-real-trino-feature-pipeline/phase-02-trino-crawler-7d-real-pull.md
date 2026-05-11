---
phase: 2
title: "Trino Crawler — 7d Real Pull"
status: pending
priority: P1
effort: "8h"
dependencies: [1]
---

# Phase 02: Trino Crawler — 7d Real Pull

## Overview

Extend `infra/trino-crawler/` with a new step that pulls **7 days of aggregated raw event data** from `iceberg.cfm_vn` into the `raw_event_aggregates` Postgres table. Aggregation happens at Trino-side (no `SELECT *`); only per-uid daily rollups cross the wire.

## Requirements

**Functional:**
- New step `06-raw-event-aggregates.ts` that pulls 7d of aggregates from each of the 7 source tables.
- Per-table SQL builder so each table's specific columns + date column are encoded once.
- Postgres bulk insert via `INSERT ... ON CONFLICT DO UPDATE` (idempotent re-runs).
- VPN-down behavior: log clearly, exit 0 (or skip step, continue with synth-only path).
- Configurable date window via `--days=N` flag (default 7).
- Per-uid sample cap (e.g. 500_000 uids per source table) to bound query weight.

**Non-functional:**
- Single Trino connection re-used across all 7 queries.
- Each query runs in `<60s` (cap via `TRINO_QUERY_TIMEOUT_MS` env, currently 30000).
- Postgres inserts batched at 5_000 rows per statement.
- Each step prints rowcount + ms timing.

## Architecture

### Per-table SQL pattern

Each source table gets a builder of shape `(days, capUids) → string` that emits a `GROUP BY uid` aggregation pulling only the columns needed by feature derivations referenced in `derivation-coverage.json`.

Example — `etl_login`:

```sql
SELECT
  vopenid AS uid,
  CAST(dteventtime AS DATE) AS event_date,
  COUNT(*) AS row_count,
  MIN(EXTRACT(epoch FROM dteventtime)) AS numeric_min,  -- earliest login on date
  MAX(EXTRACT(epoch FROM dteventtime)) AS numeric_max,  -- latest login on date
  ARBITRARY(region_code) AS last_region
FROM iceberg.cfm_vn.etl_login
WHERE dteventtime >= current_date - INTERVAL '7' DAY
GROUP BY vopenid, CAST(dteventtime AS DATE)
LIMIT 500000
```

Per-table aggregations:

| Source table | Numeric metric | Last value | Notes |
|--------------|---------------|------------|-------|
| `etl_login` | session count, min/max ts | region_code, vip_status | feeds session_count_*, last_login_days_ago, region_code, vip_status |
| `etl_logout` | session duration sum | — | feeds avg_session_duration_30d |
| `etl_game_detail` | match count, kill sum, mmr max, win/loss flag, ladder score | guild_id, dominant_playstyle | feeds ranked_match_count_*, ranked_win_rate_*, mmr_*, rank_*, streaks |
| `etl_recharge` | revenue sum, purchase count, avg amount | spend_tier, vip_status | feeds lifetime_revenue_local, purchase_count_*, avg_purchase_amount_30d |
| `etl_moneyflow` | gem balance latest, cf_coin balance latest | — | feeds gem_balance_current, cf_coin_balance_current, premium_currency_balance |
| `etl_appsflyer_installs_datalocker` | install_time min | media_source | feeds days_since_install |
| `std_master_user_profile` | first_login min, last_login max, total_rev | — | feeds account_first_login_ts, last_login_days_ago, last_purchase_days_ago, is_paying_user_lifetime |

### Pipeline topology

```
.env credentials → Trino client (existing trino.ts)
   ↓
diagnose-trino (Phase 01 gate) — must pass
   ↓
For each source table:
   builder(days=7) → SQL → runQuery (cap 500k rows)
   ↓
For each row:
   transform → raw_event_aggregates row
   ↓
Bulk INSERT ... ON CONFLICT (source_table, uid, event_date) DO UPDATE
   ↓
Log per-table rowcount + ms
```

### CLI integration

Extend `main.ts`:
- New flag `--raw-events-only` runs only step 06.
- `all` mode runs step 06 BEFORE existing steps 01-05 so synth steps can read real distributions if available.

## Related Code Files

**Create:**
- `infra/trino-crawler/src/steps/06-raw-event-aggregates.ts` — orchestrator
- `infra/trino-crawler/src/queries/etl-login-aggregate.ts` — per-table SQL builder
- `infra/trino-crawler/src/queries/etl-logout-aggregate.ts`
- `infra/trino-crawler/src/queries/etl-game-detail-aggregate.ts`
- `infra/trino-crawler/src/queries/etl-recharge-aggregate.ts`
- `infra/trino-crawler/src/queries/etl-moneyflow-aggregate.ts`
- `infra/trino-crawler/src/queries/etl-appsflyer-installs-aggregate.ts`
- `infra/trino-crawler/src/queries/std-master-user-profile-aggregate.ts`
- `infra/trino-crawler/src/postgres-client.ts` — Postgres insertion wrapper (uses `pg` package; share connection string with catalog-api via env)

**Modify:**
- `infra/trino-crawler/src/main.ts` — wire `--raw-events-only` and reorder `all` mode
- `infra/trino-crawler/package.json` — add `pg` dependency

**Delete:** none

## Implementation Steps

1. Add `pg` dependency to crawler package; build `postgres-client.ts` with `bulkUpsertRawAggregates(rows[])`.
2. Build the 7 per-table SQL builders. Each is a pure function taking `{days, capUids}`.
3. Write `06-raw-event-aggregates.ts` orchestrator: for each table, run builder → runQuery → bulkUpsert. Tag every row `is_synthesized=false`.
4. Wire `--raw-events-only` and `--days=N` flags into `main.ts`.
5. Run `pnpm refresh-cfm-data --raw-events-only --days=1` first (smoke test). Inspect Postgres rowcounts.
6. Then run `--days=7`; verify rowcounts roughly match `(MAU × active_rate × 7)` order of magnitude.
7. `pnpm typecheck` and commit.

## Todo List

- [ ] Add `pg` dep to crawler
- [ ] Build `postgres-client.ts` with bulk-upsert helper
- [ ] Author 7 per-table SQL builders
- [ ] Author `06-raw-event-aggregates.ts` orchestrator
- [ ] Wire CLI flags
- [ ] Smoke test with `--days=1`
- [ ] Full run with `--days=7`, verify rowcounts
- [ ] `pnpm typecheck` green
- [ ] Commit

## Success Criteria

- [ ] `pnpm refresh-cfm-data --raw-events-only --days=7` completes in <10 minutes.
- [ ] `psql -c "SELECT source_table, COUNT(*) FROM raw_event_aggregates GROUP BY 1"` shows non-zero rows per table (or a clear note when VPN is down).
- [ ] Re-running the same command is idempotent (no row count change, only `computed_at` updates).
- [ ] Each table query stays within `TRINO_QUERY_TIMEOUT_MS`; if not, log the timeout and continue with the next table rather than aborting.

## Risk Assessment

- **`etl_game_detail` row count explosion:** even at 500k uids × 7 days × ~10 matches/day = 35M raw rows aggregated to ~3.5M output rows. **Mitigation:** the Trino-side `GROUP BY vopenid, event_date` keeps output ≤ `capUids × days = 3.5M`. If the query times out, halve `capUids` for that table only.
- **Postgres bulk insert slow:** naive single-statement inserts of 3.5M rows is hours. **Mitigation:** batch at 5k rows per `INSERT ... VALUES (...) ON CONFLICT ... DO UPDATE` using `pg-format` or template literals; expect throughput ≥50k rows/sec.
- **VPN drops mid-run:** partial data in Postgres tagged with mismatched `computed_at`. **Mitigation:** start each step with `BEGIN`, end with `COMMIT`; if a query fails, `ROLLBACK` for that table only.
- **Trino account permissions narrower than expected:** some tables visible, others denied. **Mitigation:** Phase 01 diagnostic surfaces this; Phase 02 logs per-table failures clearly so we know which features to keep on the synth path.
