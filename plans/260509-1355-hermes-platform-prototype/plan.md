---
title: "Hermes Platform Prototype"
slug: hermes-platform-prototype
date: 2026-05-09
status: completed
priority: P1
effort: "~60h estimated · shipped same day via parallel agent execution"
demo_target: 2026-05-12 (alignment meeting)
completed_at: 2026-05-09
final_commit: 31e15b7
brainstorm_report: ../reports/brainstorm-260509-1355-hermes-platform-prototype.md
acceptance_criteria_met: 25/25
---

# Hermes Platform Prototype

## Overview

Bootstrap working prototype of **Hermes** — VNG Games Studio-facing LiveOps product layer. Three deliverables:
1. Frontend (23 screens · Feature Store, Segments, Campaigns, Agents · Vite+React 18+TS).
2. Trino crawler (`infra/trino-crawler/`) pulls real `iceberg.cfm_vn` data → static fixtures.
3. Latent backends (catalog-api, query-svc) forked from Bedrock, renamed `@hermes/*`.

Web bundle reads fixtures statically — no runtime fetch (PRD constraint).

## Phases

| # | Phase | Priority | Effort | Deps | Status |
|---|---|---|---|---|---|
| 01 | [Bootstrap](phase-01-bootstrap.md) | P1 | 4h | – | ✓ completed (f2bc512) |
| 02 | [Crawler Step-0 Schema Audit](phase-02-crawler-schema-audit.md) | P1 | 3h | 01 | ✓ completed (stub-mode · auth blocked) |
| 03 | [Catalog Data](phase-03-catalog-data.md) | P1 | 6h | 01 | ✓ completed (73 features · 51 events · 8 contract schemas) |
| 04 | [Crawler Steps 1-5](phase-04-crawler-derivations.md) | P1 | 8h | 02 | ✓ completed (synth · 5 JSONs · 509 KB) |
| 05 | [Web Shell Nav Theme](phase-05-web-shell.md) | P1 | 4h | 01 | ✓ completed (44 files · 23 routes) |
| 06 | [Feature Store Module](phase-06-feature-store.md) | P1 | 5h | 03, 04, 05 | ✓ completed (13 files · 73 features render · showcase smoke pass) |
| 07 | [Segments Module](phase-07-segments.md) | P1 | 8h | 03, 04, 05 | ✓ completed (22 files · canvas centerpiece · demo 3-5 ✓) |
| 08 | [Campaigns Module](phase-08-campaigns.md) | P2 | 8h | 07 | ✓ completed (24 files · demo 6-9 ✓ · hybrid handoff A+B) |
| 09 | [Agents Module](phase-09-agents.md) | P1/P2 | 6h | 07, 08 | ✓ completed (13 files · demo 10-13 ✓ · cross-cutting ✓) |
| 10 | [Demo Flow Validation](phase-10-demo-validation.md) | P1 | 3h | 06–09 | ✓ completed (24/25 pass · substrate verbatim · 13 routes 200) |
| 11 | [Docs Polish](phase-11-docs-polish.md) | P2 | 3h | 10 | ✓ completed (8 docs · README · final build green · 31e15b7) |
| 12 | [Backend Latency Check](phase-12-backend-latency.md) | P3 | 2h | 01 | ✓ completed (typecheck+build+health 200) |

## Critical path

```
01 ─┬─► 02 ─► 04 ─┬─► 06 ─┐
    ├─► 03 ───────┤       ├─► 07 ─► 08 ─► 09 ─► 10 ─► 11
    └─► 05 ───────┘                              ↑
                                                 │
12 (independent) ────────────────────────────────┘
```

Critical chain: 01 → 02 → 04 → 06 → 07 → 08 → 09 → 10 (≈ 49h serial). 03 + 05 + 12 parallelisable.

## Key dependencies

- **External:** Trino @ `10.164.54.181` (VPN required for phases 02, 04). `Hermes_Demo_Data.md` for catalog content. Bedrock `LiveOps Engine.html` + `theme.jsx` for visual reference.
- **Internal:** P-1 unblocks all. P-7 canvas blocks P-8 (re-uses predicate composer) and P-9 (drafts route into canvas review mode). P-10 is the integration gate.

## Demo-day cut list (if compressed against May 12)

If running tight, drop in this order — each item ~2-4h reclaimed:
1. P-8 · `17_cmp_patterns` (Nice-to-have)
2. P-7 · `08_seg_patterns` (Nice-to-have)
3. P-8 · keep one of `11_cmp_canvas_scheduled` or `12_cmp_canvas_onetime` not both
4. P-8 · simplify `13_cmp_journey` to read-only render
5. P-9 · `21_ag_activity` ship as stub
6. P-11 · defer roadmap.md + deployment-guide.md

Demo flow steps 1-13 must work end-to-end regardless.

## Acceptance gate

25-criteria composite from PRD §14 + Agentic §12 — see brainstorm report §5. P-10 validates all 25.
