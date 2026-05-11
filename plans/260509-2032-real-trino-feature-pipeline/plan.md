---
title: "Real Trino Feature Pipeline · 7d Crawl → 30d Synthesis → Live Backend"
slug: real-trino-feature-pipeline
date: 2026-05-09
status: completed
priority: P1
effort: "shipped same-day across 5 commits"
parent_plan: 260509-1855-feature-store-v2-discovery-analytics
blockedBy: []
blocks: []
demo_target: "Phase 2 wiring kickoff — May 13+"
completed_at: 2026-05-09
final_commits: "54b3d63, 7eb04ba, e61b137, ca84b5d, <phase-06>, <phase-07>"
acceptance_assertions: "19/19 PASS"
---

# Real Trino Feature Pipeline — 7d Crawl → 30d Synthesis → Live Backend

## Overview

Replace the static `feature-analytics-180d.json` + `crawled/distributions.json` synth fixtures driving the Feature Store with a **real pipeline**:

1. **Trino crawler** pulls 7 days of CFM raw event aggregates into local Postgres (one-shot, no streaming).
2. **Synthesizer** backfills 23 additional days anchored on the 7d real distribution to produce a **30d trajectory** (and projects a 180d sparkline by replicating the 30d shape with day-of-week noise + seeded drift events).
3. **Per-feature value computation** runs T2/T3/T4 derivations against the 7d real + 23d synth raw data, writes per-uid feature values to Postgres.
4. **Catalog-API exposes `/features`** returning `HermesFeature[]` with analytics computed live from the DB.
5. **Frontend swaps the static JSON import** for an API fetch (env-gated, with the static JSON kept as the offline fallback).

**Scope: batch features only.** Substrate B / latency `<1h` / `<1d`. Realtime `<1s · A` features stay unchanged (they have no batch materialization). Dual-tier features (`stateful-streaks`) compute their `<1h · B` side only — `<1s · A` side remains UI-only.

**Game scope: CFM only.** Other games (PTG/NTH/TF/COS/PT) keep their `games[]` attribution in the catalog but their analytics block stays synth — they have no Trino-mock fixtures and no live VPN access.

## Why now

Phase 1 prototype shipped May 9 with synth fixtures. Phase 2 (parent roadmap) calls for live backend wiring starting May 13. This plan is the first concrete piece of Phase 2 — it proves the data path Trino → Postgres → API → UI for the Feature Store before the Segments + Campaigns modules follow.

## Feature scope (73 batch features in catalog)

| Tier | Count | Source-table mapping | Action |
|------|-------|---------------------|--------|
| T1 | 2 | Direct column (e.g. `account_first_login_ts`, `region_code`) | Pull live · zero derivation |
| T2 | 24 | Single-table aggregate (counts, means, dates) | Pull live · simple SQL aggregation |
| T3 | 19 | Multi-step or window-derived (lifecycle stage, streaks, MMR drift) | Pull live · CTE / window function |
| T4 | 3 | Heuristic / approximate (avg session, social score, specific pack ownership) | Pull live · approximate query |
| T5 | 25 | No source-table mapping (gear inventory, UGC scores, marketing flags) | **Stay synth** (fallback path) |

T1+T2+T3+T4 = **48 features** computed from real data. T5 (25 features) keeps the existing synth path because they have no upstream Trino source.

## Phases

| # | Phase | Priority | Effort | Deps | Status |
|---|-------|----------|--------|------|--------|
| 01 | [Schema & DB Design](./phase-01-schema-db-design.md) | P1 | 4h | — | Complete |
| 02 | [Trino Crawler — 7d Real Pull](./phase-02-trino-crawler-7d-real-pull.md) | P1 | 8h | 01 | Complete |
| 03 | [30d Synthesis Backfill](./phase-03-30d-synthesis-backfill.md) | P1 | 5h | 02 | Complete |
| 04 | [Feature Value & Analytics Rollup](./phase-04-feature-value-analytics-rollup.md) | P1 | 8h | 02, 03 | Complete |
| 05 | [Catalog-API Feature Endpoints](./phase-05-catalog-api-feature-endpoints.md) | P1 | 5h | 04 | Complete |
| 06 | [Frontend Wiring (Static → API)](./phase-06-frontend-wiring-static-to-api.md) | P1 | 4h | 05 | Complete |
| 07 | [Validation & Docs](./phase-07-validation-and-docs.md) | P1 | 3h | 05, 06 | Complete |

**Total:** ~37h serial. Phases 5 and 6 can run in parallel after 4 (different file ownership).

## Critical path

```
01 ─► 02 ─► 03 ─► 04 ─┬─► 05 ─┐
                     └─► 06 ─┴─► 07
```

## Key dependencies

- **Trino access via VPN** — currently DOWN per `infra/trino-crawler/schema-audit.md` (Access Denied on SHOW SCHEMAS). Phase 2 must validate that direct `SELECT FROM iceberg.cfm_vn.<table>` works even when SHOW SCHEMAS does not, and bail with a clear stub-mode message if not.
- **Postgres 16** via `infra/docker-compose.yml` — `pnpm dev:db` boots it. catalog-api already wired to it.
- **drizzle-kit** for migrations — already in catalog-api stack.
- **Existing crawler skeleton** at `infra/trino-crawler/src/` — Phase 2 extends step-01..05 rather than rewriting.

## Risk register (top 5)

1. **VPN/auth blocker** — if Trino remains unreachable, plan stalls at Phase 2. Mitigation: keep the synth-only path working as a fallback at every layer (crawler, API, frontend) and tag rows with `is_synthesized=true`.
2. **etl_game_detail volume** — per-match rows over 7d for ~2M MAU CFM = potentially billions of rows. Mitigation: aggregate at Trino-side (no `SELECT *`, all queries are `GROUP BY uid` with date filters), and cap each feature query at e.g. 500k uids.
3. **Postgres bloat from per-uid feature values** — 48 features × ~500k uids × 30d snapshots = up to 720M rows naive. Mitigation: store only the **latest snapshot** per (uid, feature) plus a **histogram-per-day** rollup table. No per-uid timeseries.
4. **Schema drift between synth and real** — synth distributions.json keys by feature name, real DB rolls up histograms differently. Mitigation: catalog-api emits the same `FeatureAnalytics180d` shape that the frontend expects today (Zod-validated); internal storage shape is free to differ.
5. **Frontend regression** — current code has many static-JSON consumers. Mitigation: env-gated rollout (`VITE_USE_REAL_FEATURES`); static path stays compiled-in for offline / VPN-down dev.

## Acceptance gate

- [ ] `pnpm refresh-cfm-data` (or `pnpm refresh-features`) crawls 7d real from Trino into Postgres, then synthesizes 23d backfill, with row counts logged and stored in Postgres.
- [ ] `psql ... -c "SELECT COUNT(*) FROM feature_values"` returns ≥10× for a sample feature compared to T5 (synth-only) feature.
- [ ] `curl http://localhost:3001/api/v1/features` returns 73 features with the same `HermesFeature` Zod shape the frontend expects today (no schema breakage).
- [ ] `curl http://localhost:3001/api/v1/features/account_age_days/distribution?days=30` returns a 30-bucket histogram matching the histogram seen on the detail page.
- [ ] `pnpm dev` (with `pnpm --filter @hermes/catalog-api dev` running) renders the Feature Store library and detail page using API data; no static JSON import path remains in the bundle.
- [ ] `pnpm typecheck` and `pnpm build` green.
- [ ] 13-step demo flow still passes end-to-end (no regressions in Segments / Campaigns / Agents that consume features).
- [ ] Docs updated: `docs/system-architecture.md` §9 (Phase 2 wiring path), `docs/deployment-guide.md` (new `pnpm refresh-features` command), `docs/project-roadmap.md` (Phase 2 progress), `infra/trino-crawler/schema-audit.md` overwritten with a real audit.

## Out of scope

- **Live wiring of Segments / Campaigns** — separate plan, follows after this one validates the data path.
- **Non-CFM games' real data** — needs separate Trino schemas (`ptg_vn`, `nth_vn`, …) which are not configured.
- **Realtime `<1s · A` features** — they live in Apollo TEE / Temporal, out of Trino's reach.
- **Streaming / incremental updates** — this is one-shot batch refresh. Cron / Hatchet scheduling is Phase 3.
- **Multi-tenant / production hardening** — connection pooling, retry, circuit-breaking deferred to Phase 3.

## Resolved decisions (2026-05-09)

- **Q1 — script entry point:** Extend `pnpm refresh-cfm-data` (single entry point). No new top-level script.
- **Q2 — enum bucketing:** Full categorical histogram (every label gets its own bucket). No top-N + "other".
- **Q3 — T4 attempt vs. synth:** **Attempt** with proxy SQL. Write real derivations for the 3 T4 features; tag rows `source='hybrid'` so the approximation is visible. Fall back to synth only on query failure.
- **Q4 — frontend rollout:** **Hard cut.** Delete the static JSON import path. API fetch is the only source. `pnpm dev` requires catalog-api running. No env flag, no fallback banner.
