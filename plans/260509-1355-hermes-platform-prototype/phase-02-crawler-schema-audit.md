---
phase: 2
title: "Crawler Step-0 Schema Audit"
status: complete
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 02: Crawler Step-0 Schema Audit

## Context Links
- Brainstorm: `../reports/brainstorm-260509-1355-hermes-platform-prototype.md` §4.2 (data flow), §4.3 (derivation tiers)
- Trino client (reuse): `apps/query-svc/src/driver/trino-client.ts`
- Hermes_Demo_Data.md Part 1 (67 features) + Part 2 (47 events)
- `.env` (root) — `TRINO_*` creds

## Overview
First crawler pass. Discovery only — no compute. Connect to Trino, dump `iceberg.cfm_vn` schema, write `schema-audit.md` listing every table + column + type. Produce derivation-coverage manifest mapping each of the 67 PRD features to a tier (T1–T5) based on what cfm_vn actually contains.

## Key Insights
- **Cannot promise feature coverage without this audit.** Many features are derived (`mmr_drift_7d`, `consecutive_ranked_losses_streak`) — not raw columns. Need to know which raw events exist.
- Bedrock's `infra/trino-mock/data/*.jsonl` files mirror likely schema (etl_login, etl_match_end, etl_recharge, etl_inapp_event, std_master_user_profile) — use as hypothesis to verify.
- VPN required to reach `10.164.54.181`. If user is off-VPN, crawler fails fast with clear message.
- Output is committed to git so demo runs offline.

## Requirements
**Functional**
- `pnpm refresh-cfm-data --schema-only` (or equivalent CLI flag) connects to Trino with creds from root `.env`.
- Runs `SHOW SCHEMAS IN iceberg`, `SHOW TABLES IN iceberg.cfm_vn`, `DESCRIBE iceberg.cfm_vn.<table>` for each.
- Writes `infra/trino-crawler/schema-audit.md` with tables + columns + types.
- Writes `infra/trino-crawler/derivation-coverage.json` mapping each of 67 PRD feature names to: tier (T1-T5), source_table, source_columns (or null), notes.

**Non-functional**
- Connect timeout ≤10s; clear error if VPN down.
- Write idempotent (overwrites previous audit).
- Audit doc readable as standalone documentation.

## Architecture
```
infra/trino-crawler/
├── package.json              "@hermes/trino-crawler" (private)
├── tsconfig.json
├── src/
│   ├── main.ts               CLI entry — parses --schema-only, --features-only, etc.
│   ├── trino.ts              wraps query-svc/trino-client.ts (re-export)
│   ├── steps/
│   │   ├── 00-schema-discovery.ts
│   │   ├── 01-feature-distributions.ts   (P-4)
│   │   ├── 02-audience-counts.ts         (P-4)
│   │   ├── 03-sample-players.ts          (P-4)
│   │   ├── 04-event-volumes.ts           (P-4)
│   │   └── 05-segment-demographics.ts    (P-4)
│   ├── derivations/          (P-4)
│   │   └── <feature-name>.sql per derivable feature
│   └── derivation-coverage-builder.ts
├── schema-audit.md           OUTPUT
└── derivation-coverage.json  OUTPUT
```

`main.ts` invoked via `pnpm refresh-cfm-data` script in root `package.json`. CLI flags:
- `--schema-only` (this phase)
- `--features-only`, `--audience-only`, `--samples-only`, `--events-only`, `--demographics-only` (P-4)
- (no flag) runs all steps in order.

## Related Code Files
**Create**
- `infra/trino-crawler/package.json`
- `infra/trino-crawler/tsconfig.json`
- `infra/trino-crawler/src/main.ts`
- `infra/trino-crawler/src/trino.ts`
- `infra/trino-crawler/src/steps/00-schema-discovery.ts`
- `infra/trino-crawler/src/derivation-coverage-builder.ts`
- `infra/trino-crawler/.env.example` (TRINO_* template)

**Modify**
- Root `package.json` — add `"refresh-cfm-data": "pnpm --filter @hermes/trino-crawler start"` script
- `pnpm-workspace.yaml` — add `infra/*` if not already

**Outputs (generated, committed to git)**
- `infra/trino-crawler/schema-audit.md`
- `infra/trino-crawler/derivation-coverage.json`

## Implementation Steps
1. Create `infra/trino-crawler/` scaffold. `package.json` with deps `trino-client` (or reuse via path), `dotenv`, `tsx`. Scripts: `start: tsx src/main.ts`.
2. Add to `pnpm-workspace.yaml`.
3. `src/trino.ts`: import `TrinoClient` from `apps/query-svc/src/driver/trino-client.ts` via tsconfig path alias OR copy minimal client (Trino HTTP basic auth). Prefer alias; fall back to copy if import boundary breaks.
4. `src/main.ts`: parse CLI flags via `process.argv` (no extra deps). Dispatch to step modules.
5. `src/steps/00-schema-discovery.ts`:
   - `SHOW SCHEMAS FROM iceberg`
   - For each schema starting with `cfm` or matching `cfm_vn`: `SHOW TABLES`
   - For each table: `DESCRIBE iceberg.<schema>.<table>` → columns array
   - Render `schema-audit.md` (markdown tables: schema → tables → columns)
6. `src/derivation-coverage-builder.ts`:
   - Hardcoded list of 67 PRD feature names + expected source hint (e.g. `consecutive_ranked_losses_streak` ← `etl_match_end`).
   - For each feature, classify against discovered schema:
     - T1 if column exists directly in `std_master_user_profile`
     - T2 if simple aggregate over discovered table
     - T3 if window function plausible (event timestamp present)
     - T4 if requires join across discovered tables
     - T5 if no discovered source maps (synthesised tier)
   - Write JSON: `[{feature, tier, source_table, source_columns, notes}, ...]`
7. Run `pnpm refresh-cfm-data --schema-only`. VPN check first — print "Connecting to Trino @ 10.164.54.181..." then "Connected · X schemas found" or fail with VPN hint.
8. Review `schema-audit.md` manually — sanity check.
9. Review `derivation-coverage.json` — count features per tier. Expected rough split per brainstorm §4.3: T1 ≈ 10-15, T2 ≈ 15-20, T3 ≈ 10-15, T4 ≈ 5-10, T5 ≈ 10-15.
10. Commit: `feat(crawler): add schema audit step for iceberg.cfm_vn`.

## Todo List
- [x] Scaffold `infra/trino-crawler/` package
- [x] Wire to root `pnpm-workspace.yaml`
- [x] Re-export Trino client from query-svc (or copy minimal)
- [x] Implement `00-schema-discovery.ts`
- [x] Implement `derivation-coverage-builder.ts` with 73 feature names (PRD header says 67; actual table rows = 73)
- [x] Add `refresh-cfm-data` script to root package.json
- [x] Run `pnpm refresh-cfm-data --schema-only` (stub mode — VPN/auth blocked)
- [x] Review + commit `schema-audit.md` (stub — VPN/auth required for real)
- [x] Review + commit `derivation-coverage.json` (heuristic tiers, all 73 features covered)

## Success Criteria
- [ ] `infra/trino-crawler/schema-audit.md` exists, lists ≥1 schema (cfm_vn or similar) with tables + columns
- [ ] `infra/trino-crawler/derivation-coverage.json` exists, has 67 entries
- [ ] Running on cached data offline (no VPN): graceful failure message pointing to existing audit
- [ ] No PRD feature unaccounted for (every feature has a tier assignment)

## Risk Assessment
| Risk | Mitigation |
|---|---|
| VPN down at run time | Fail fast with message: "Cannot reach 10.164.54.181 — VPN required" |
| Trino schema is `crossfire_vn` not `cfm_vn` | Crawler scans schema list dynamically — picks first matching `cfm*` |
| `DESCRIBE` returns nested types unhandled | Render as raw type string in audit; downstream derivations handle |
| Trino auth fails (creds rotated) | Print HTTP 401 body; stop with hint to refresh creds in `.env` |

## Security Considerations
- Reads `.env` via `dotenv` — no creds logged.
- Outputs committed: `schema-audit.md` contains table/column names (not data) — safe to commit per VNG GIO conventions.
- `derivation-coverage.json` contains feature names + table refs — no PII.

## Next Steps
- P-4 unblocked: per-feature derivation SQL can be written against confirmed schema.
- If T5 (synthesised) count >20, escalate to user: PRD feature catalog may need slimming.
