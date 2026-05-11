---
phase: 0
title: "Multi-game Trino probe"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 00: Multi-Game Trino Probe

## Overview

Verify which of the 5 game Trino schemas (`cfm_vn` known-good, plus `ptg_vn`, `nth_vn`, `tf_vn`, `cos_vn`) are reachable + return non-zero last-7d rowcounts. This is the gate for Phase 02. If most schemas are inaccessible, multi-game scope shrinks; if their column shapes differ from `cfm_vn`, per-game SQL variants needed.

## Requirements

- Extend `infra/trino-crawler/src/diagnose-trino.ts` to accept `--all-games` flag.
- Per-game probe: `SELECT count(*) FROM iceberg.<schema>.etl_login WHERE dteventtime > now() - INTERVAL '7' DAY` (and the other 6 expected tables).
- Per-game schema discovery: `DESCRIBE iceberg.<schema>.etl_login` etc. → compare column lists to cfm_vn baseline.
- Output: `infra/trino-crawler/multi-game-diagnostic.md` with per-game per-table reachability + column-drift summary.

## Implementation Steps

1. Extract `KNOWN_TABLES` constant from existing diagnose-trino.ts.
2. Parameterize probe by `(schema, table)` instead of `(table)`.
3. Add `--all-games` flag → iterates `[cfm_vn, ptg_vn, nth_vn, tf_vn, cos_vn]`.
4. Add column-shape diff: for each (game, table), describe + emit columns added/removed vs cfm_vn baseline.
5. Run, write report, exit 0.

## Success Criteria

- [ ] `pnpm --filter @hermes/trino-crawler diagnose --all-games` exits 0
- [ ] `multi-game-diagnostic.md` lists 5 games × 7 tables = 35 probe rows
- [ ] Column-drift summary identifies any games whose tables differ from cfm_vn (decides whether Phase 02 needs per-game SQL variants)

## Risk

- Auth-denied for non-CFM schemas → graceful: report "no access", Phase 02 keeps those games on synth path.
- Same-shape but different `dteventtime` column name → already handled per-table.
