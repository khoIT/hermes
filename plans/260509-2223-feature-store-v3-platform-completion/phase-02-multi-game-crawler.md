---
phase: 2
title: "Multi-game crawler — architectural prep (scaled-down per Phase 00)"
status: pending
priority: P2
effort: "3h"
dependencies: [0]
---

# Phase 02: Multi-Game Crawler — Architectural Prep

## Scope shift (2026-05-09)

Phase 00 found only `cfm_vn` reachable on this Trino account. The full
multi-game pull is blocked on out-of-band schema provisioning by VNG IT.
Phase 02 reduced to **architectural prep only** so the platform is ready
when access lands:

- Add `game_id` column + composite PK to `raw_event_aggregates` and `feature_values`
- Parameterize aggregate-queries by `schema` (already partially in place)
- Default all new rows to `game_id='cfm'` for back-compat
- CLI flag `--game=<game>` accepted but only `cfm` works; others log "schema not provisioned (Phase 00 finding)"

## Overview

Extend steps 06-09 of the crawler to operate per-game over the schemas Phase 00 confirmed reachable. Per-game `raw_event_aggregates` partitioned via a new `game_id` column; Phase 04 derivations stay schema-agnostic (they read by source_table + game_id).

## Schema delta

- `raw_event_aggregates`: add `game_id` column (default `'cfm'`). Update PK to `(source_table, game_id, uid, event_date)`.
- `feature_values`: add `game_id` column. PK `(feature_name, game_id, uid)`.
- `feature_distributions_daily`: keep (per-feature already). Add per-game variant if asked: `feature_distributions_daily_by_game`.
- `feature_analytics_180d`: stay single-row; aggregate across games. Phase 03 LM panel splits by game from `feature_values`.

## Implementation Steps

1. Migration `0010_multi_game.sql` — add `game_id` columns, drop+recreate PKs.
2. CLI: `pnpm refresh-cfm-data --game=cfm|ptg|nth|tf|cos|all`. Default `cfm` for back-compat.
3. Crawler `aggregate-queries.ts` — already parameterized by FQN; extend to take `schema` arg. Add per-game schema map.
4. Step 06: per-game iteration, tag rows with `game_id`.
5. Step 07: synth backfill per-game, idempotent.
6. Step 08: derivations groupby `(uid, game_id)`. emit feature_value rows with `game_id`.
7. Step 09: analytics aggregate across games. New panel data: per-game uid count.
8. Diagnostic: `--all-games` triggers all reachable schemas; per-game failures non-fatal.

## Success Criteria

- [ ] `pnpm refresh-cfm-data --game=ptg` runs end-to-end (or gracefully skips if Phase 00 reported access-denied).
- [ ] `feature_values` has `game_id` populated for every row.
- [ ] `GET /features/:name` shows aggregate analytics; new endpoint `/features/:name/per-game-coverage` returns per-game uid counts.

## Risk

- Schema drift between games — Phase 00 surfaced this. Mitigation: per-game SQL variants where columns differ.
- Cross-game uid collision: `vopenid` unique within game only. Mitigation: `(game_id, uid)` is the natural PK.
- 5x volume on raw_event_aggregates — Postgres bloat. Mitigation: keep `--cap` flag, default 200k uids/game/table.
