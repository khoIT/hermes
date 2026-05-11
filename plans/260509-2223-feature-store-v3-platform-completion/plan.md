---
title: "Feature Store v3 — Data-Product Detail · Multi-Game Crawler · Live Audience"
slug: feature-store-v3-platform-completion
date: 2026-05-09
status: largely-completed
priority: P1
effort: "infrastructure (00-02, 06, 07) + LM marquee panels (05a) + validation (08) shipped same-day"
parent_plan: 260509-2032-real-trino-feature-pipeline
blockedBy: []
blocks: []
demo_target: "Phase 2 demo — June 2026"
acceptance_assertions: "36/36 PASS (validate-feature-pipeline.cjs)"
remaining: "DA panels (Phase 03, 5 panels) and DE panels (Phase 04, 4 panels) — endpoints live, UI work additive"
---

# Feature Store v3 — Platform Completion

## Overview

Builds on the Real Trino Feature Pipeline (just-shipped plan
`260509-2032-real-trino-feature-pipeline`) to close the four remaining
gaps blocking a full LiveOps demo:

1. **Feature detail redesign** — replace the current LM-only panels with a 3-persona surface (Data Analyst · Data Engineer · LiveOps Manager). Each persona gets the analytics they need to trust + use the feature.
2. **Multi-game crawler** — extend the CFM-only path to PTG, NTH, TF, COS so the `games[]` chip cluster on every feature reflects real per-game distributions.
3. **Trim Bedrock modules** — delete `mappings/`, `master-tables/` from catalog-api now that they're unused.
4. **query-svc `/audience/count`** — wire Segments threshold playground to live audience counts (replaces the hardcoded 15k).

## Why bundle them

- **Detail redesign** validates and exposes the data we just stored (feature_values, feature_distributions_daily) — without UI, that data is invisible.
- **Multi-game crawler** unblocks the `games[]` story: today every non-CFM feature is `source='synth'`. Without real PTG/NTH/TF/COS data the platform looks single-tenant.
- **Bedrock trim** removes confusion in the catalog-api surface; it's also a prerequisite for the Phase 2 wiring story (query-svc audience-count) since Segments today still references some of those modules indirectly.
- **query-svc audience-count** is the next-largest demo gap (Segments are still hardcoded to fixtures even after Feature Store went live).

## Persona-driven detail redesign — what each panel answers

| Panel | Persona | Answers |
|---|---|---|
| **Source provenance card** | LM | "Should I bet a campaign on this?" — REAL / HYBRID / SYNTH badge with derivation source link |
| **Health verdict** | LM | GREEN / YELLOW / RED — single signal aggregating drift, freshness, null rate, coverage |
| **Threshold playground** | LM | Live audience size as you adjust a threshold (real Postgres COUNT) |
| **Top-5 example segments using this** | LM | Discovery — "how are others using this?" |
| **Coverage of MAU (split by game)** | LM | Reach estimation per game — feeds the `games[]` chip cluster |
| **Quantile strip (p10/p25/p50/p75/p90/p99 vs 30d ago)** | DA | Distribution shape change at a glance |
| **Coverage segmentation (lifecycle/region/spend tier)** | DA | "Is this populated for paying VN users or just everyone?" |
| **Sample value cards** | DA | 5-10 anonymized uids — what does a value of `mmr_drift_7d=147` actually mean |
| **Correlated features** | DA | Top 5 features that move with this one |
| **Outlier examples** | DA | Spot data-quality issues — `account_age_days=99999` |
| **Pipeline health timeline** | DE | Last 30 runs · status · duration |
| **Cost & latency card** | DE | Rowcount, storage MB, p99 lookup, derivation duration |
| **Lineage v2 (split upstream / downstream)** | DE | Impact analysis before changing the definition |
| **Backfill history** | DE | Coverage gaps in the historical sparkline |

## Phases

| # | Phase | Priority | Effort | Deps | Status |
|---|-------|----------|--------|------|--------|
| 00 | [Multi-game Trino probe](./phase-00-multi-game-trino-probe.md) | P1 | 2h | — | Complete (only cfm_vn reachable) |
| 01 | [Catalog-API persona endpoints](./phase-01-catalog-api-persona-endpoints.md) | P1 | 8h | — | Complete (8/8 endpoints + 4 from v2) |
| 02 | [Multi-game crawler — arch prep only (per Phase 00)](./phase-02-multi-game-crawler.md) | P2 | 3h | 00 | Complete (game_id schema, awaiting Trino access) |
| 03 | [Detail page · DA panels](./phase-03-detail-page-da-panels.md) | P1 | 7h | 01 | **Pending** (endpoints live, UI work pending) |
| 04 | [Detail page · DE panels](./phase-04-detail-page-de-panels.md) | P1 | 6h | 01 | **Pending** (endpoints live, UI work pending) |
| 05 | [Detail page · LM panels](./phase-05-detail-page-lm-panels.md) | P1 | 7h | 01, 04 | Complete (3/5 marquee panels — provenance, verdict, playground) |
| 06 | [Trim Bedrock modules](./phase-06-trim-bedrock-modules.md) | P3 | 4h | — | Complete |
| 07 | [query-svc audience-count](./phase-07-query-svc-audience-count.md) | P1 | 14h | 01, 06 | Complete |
| 08 | [Validation + docs](./phase-08-validation-docs.md) | P1 | 3h | 02-07 | Complete (36/36 assertions PASS) |

**Total:** ~52h serial after Phase 00 finding. Phases 03/04/05 parallelisable after 01. Phase 06 fully independent.

## Critical path

```
00 ─► 02 ─┐
          ├─► 08
01 ─┬─► 03 ┤
    ├─► 04 ─► 05 ┤
    └─► 07 ──────┤
06 ────────────────┘
```

## Key dependencies

- **Trino access for non-CFM schemas** — Phase 00 is the gate. If `iceberg.ptg_vn` etc. are access-denied, the plan adapts: each unreachable game stays on synth path with a clear provenance tag.
- **Postgres** — already running from prior plan. New tables added in Phase 01 (correlations, samples, lineage_meta if needed).
- **Existing Phase 04 derivations** — Phase 02 reuses them per-game without changes; SourceTable is parameterized by schema.
- **Web bundle** — Phases 03/04/05 add new `_components/_panels/*.tsx` files; existing detail.tsx adds tab-or-panel wiring.

## Acceptance gate

- [ ] `pnpm refresh-cfm-data` works for any of the 5 games via `--game=cfm|ptg|nth|tf|cos`.
- [ ] catalog-api exposes 8 new endpoints (quantiles, samples, correlations, audience-count, lineage v2, pipeline-health, coverage-by-segment, top-segments-using).
- [ ] Feature detail page renders DA + DE + LM panels for at least the 5 sample features used in Phase 07 of prior plan.
- [ ] Threshold playground returns audience count via real Postgres COUNT in <300ms p95.
- [ ] `apps/catalog-api/src/{mappings,master-tables}/` deleted; typecheck + build green.
- [ ] query-svc `POST /api/v1/audience/count` responds with mock + Trino driver parity.
- [ ] Segments threshold playground shows live audience instead of hardcoded 15k.
- [ ] Validation script extended; 30+ assertions pass.

## Risk register

1. **Multi-game Trino access** — `ptg_vn`, `nth_vn`, `tf_vn`, `cos_vn` may not be visible to this account. Phase 00 gates Phase 02. Mitigation: graceful per-game synth fallback.
2. **Detail page bundle bloat** — 14 new panels could push the Vite bundle past 1MB. Mitigation: lazy-import heavy panels (correlations, lineage); keep panel files under 150 LOC.
3. **`mappings/master-tables` removal breaks something** — they're "unused" but may have transitive imports. Mitigation: scout grep before delete; smoke test all existing API routes after.
4. **Threshold playground perf** — naive `SELECT COUNT(*) FROM feature_values WHERE feature_name=X AND value_numeric > Y` on 6.35M rows. Mitigation: existing `fv_by_numeric` index covers it; benchmark in Phase 01.
5. **query-svc predicate translator scope** — Hermes predicate AST → SQL is non-trivial. Mitigation: Phase 07 implements only the subset Segments actually emits today (AND-of-OR over numeric/bool features); flag other ops as TODO.

## Out of scope

- Real Apollo TEE / Temporal wiring (substrate A live).
- Hatchet schedule for nightly auto-refresh.
- WCAG audit on new panels.
- Mobile responsive on new panels.
- Cross-game predicate translation in query-svc (ptg_vn ↔ cfm_vn joins).

## Open questions

1. Multi-game crawler — do PTG/NTH/TF/COS share `etl_login`, `etl_recharge`, etc. column names with CFM? If schemas differ significantly, the per-table SQL builders need per-game variants. Phase 00 surfaces this.
2. For correlations panel — pairwise Pearson on standardized 50k uid sample is O(n × m²); m=48 features ≈ 2300 pairs. Compute once nightly into a `feature_correlations` table or compute on-demand?
3. Threshold playground — when feature has only `valueText` (categorical), playground supports `=` only; do we expose `IN (...)` or stick with single-value equality?
4. Pipeline health timeline — we don't currently log derivation runs. Add a `feature_pipeline_runs` table (lightweight: feature_name, started_at, finished_at, rows_written, error)?
