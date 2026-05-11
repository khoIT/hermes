---
phase: 3
title: "30d Synthesis Backfill"
status: pending
priority: P1
effort: "5h"
dependencies: [2]
---

# Phase 03: 30d Synthesis Backfill

## Overview

Extend the 7d real `raw_event_aggregates` rows backwards by 23 days to produce a 30d trajectory, anchored on the real distribution shape. The synth rows are tagged `is_synthesized=true` so the API can distinguish provenance, and they preserve realistic day-of-week effects + drift events for the analytics panels.

## Requirements

**Functional:**
- New step `07-synthesize-30d-backfill.ts` reads the 7d real rows from Postgres, samples per-uid behavior, projects 23 additional past days.
- Day-of-week scaling: weekend (+10%) vs weekday baseline; one drift event injected at a deterministic seeded date with ~25% mean shift.
- Per-uid shrinkage: existing uids get full 30d; we don't synth phantom uids (no fake `vopenid`s).
- Optional `--include-180d` flag projects an additional 150d behind the 30d to seed the 180d sparkline (lower fidelity — only daily totals, no per-uid).

**Non-functional:**
- Seeded RNG (re-uses `infra/trino-crawler/src/synthesizers/seeded-rng.ts`) — same input ⇒ same output.
- Run time <2 minutes against a fully populated 7d window.
- All synth writes tagged with the same `computed_at` timestamp for traceability.

## Architecture

### Backfill flow

```
For each (source_table, uid) pair in raw_event_aggregates with is_synthesized=false:
  Read the 7 most recent rows (uid's 7d behavior signature).
  Compute per-uid daily mean + variance for each numeric column.
  For day = D-30 .. D-8 (23 days):
    base = mean × dayOfWeekFactor(day) × driftFactor(day)
    jittered = base × (1 + rng.uniform(-0.15, 0.15))
    Insert row with is_synthesized=true.
```

Day-of-week factor (deterministic table):
```
[Mon, Tue, Wed, Thu, Fri, Sat, Sun] = [0.95, 0.97, 1.00, 1.02, 1.05, 1.10, 1.05]
```

Drift event:
```
Picked deterministically from feature name hash. One date in last 60d, ±25% multiplier
on numeric metrics for that date only. Recorded so Phase 04 can promote the date into
feature_analytics_180d.drift_event_dates.
```

### 180d projection (optional)

When `--include-180d` is passed: a second pass writes a coarse daily-aggregate-per-source-table table (no per-uid). Used by Phase 04 to seed the 180-bucket request rate sparkline. Table reuses `feature_distributions_daily` with `bucket_kind='request_rate_daily'` (single integer per row), or a separate `daily_request_totals` table — choose during impl, don't bake in.

### CLI integration

`main.ts`:
- `--synth-backfill-only` runs step 07.
- In `all` mode, step 07 runs after step 06 and before 01-05.

## Related Code Files

**Create:**
- `infra/trino-crawler/src/steps/07-synthesize-30d-backfill.ts` — orchestrator
- `infra/trino-crawler/src/synthesizers/timeline-projector.ts` — pure function `(uidRows7d, daysToProject) → projectedRows`

**Modify:**
- `infra/trino-crawler/src/main.ts` — wire `--synth-backfill-only` and reorder
- `infra/trino-crawler/src/synthesizers/seeded-rng.ts` — extend if missing helpers (uniform, normal)

**Delete:** none

## Implementation Steps

1. Build `timeline-projector.ts` as a pure, unit-testable function.
2. Build `07-synthesize-30d-backfill.ts`: read 7d rows in chunks of 10k uids; project; bulk-insert; tag `is_synthesized=true`.
3. Write a smoke check: after run, query `SELECT COUNT(*) FILTER (WHERE is_synthesized) AS synth, COUNT(*) FILTER (WHERE NOT is_synthesized) AS real FROM raw_event_aggregates;` — synth count should be roughly `real_count × 23/7`.
4. Idempotency: re-running step 07 should `DELETE` prior synth rows for the same uids before re-inserting (don't accumulate). Wrap in transaction.
5. Wire CLI flags + `all`-mode ordering in `main.ts`.
6. `pnpm typecheck` and commit.

## Todo List

- [ ] Author `timeline-projector.ts` (pure function)
- [ ] Author step 07 orchestrator with idempotent delete-then-insert
- [ ] Wire `--synth-backfill-only` CLI flag
- [ ] Smoke check rowcounts
- [ ] (Optional) `--include-180d` daily-totals path
- [ ] `pnpm typecheck` green
- [ ] Commit

## Success Criteria

- [ ] After `pnpm refresh-cfm-data --synth-backfill-only`: `SELECT COUNT(*) FROM raw_event_aggregates WHERE is_synthesized` returns ≥3× the real-row count (23 synth days vs 7 real days).
- [ ] Re-running is idempotent — synth rowcount stable.
- [ ] Sample query: `SELECT event_date, SUM(row_count) FROM raw_event_aggregates GROUP BY 1 ORDER BY 1` shows a continuous 30-day timeseries with realistic weekend/weekday variance.
- [ ] At least one `feature_analytics_180d.drift_event_dates` per feature lands on a date within the synth window (Phase 04 surfaces it).

## Risk Assessment

- **Synth shape too smooth, doesn't feel real:** if the projected timeseries is suspiciously regular, drift markers won't differentiate. **Mitigation:** add Gaussian jitter on top of the day-of-week factor; verify by eyeballing one feature's 30d series in Postgres.
- **Synth rows leak into "real" computations:** Phase 04 must explicitly filter by `is_synthesized=false` for "what was the value last week" panels. **Mitigation:** every Phase 04 query carries `is_synthesized` predicate explicitly; reviewed in Phase 07 acceptance.
- **Drift events misleading:** a UI panel showing "drift on Apr 19" when the data is synthesized could confuse demo viewers. **Mitigation:** Phase 04 writes `feature_analytics_180d.source = 'hybrid'` whenever drift_event_dates fall in the synth window so the UI can render a "synth-period drift" badge if desired (defer the badge to Phase 06).
