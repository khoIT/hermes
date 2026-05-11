---
title: "Hermes Feature Store v2 — Discovery + Analytics Redesign"
slug: feature-store-v2-discovery-analytics
description: "Redesign Feature Store for state-of-the-art discovery + analytics: relabel substrates, replace owner with games attribution, add propensity-model platform features, dedicated registration page, full Segment wiring."
status: complete
priority: P1
created: 2026-05-09
date: 2026-05-09
parent_plan: 260509-1355-hermes-platform-prototype
prd_addendum: docs/feature-store-v2-prd.md
---

# Hermes Feature Store v2 — Discovery + Analytics Redesign

## Overview

Phase 1 prototype shipped Feature Store as a thin inventory (library + detail with overview/lineage/used-by tabs). This v2 turns it into the discovery + analytics surface for the platform — the screen LiveOps PMs land on first when shopping for a feature, and the screen GDS analysts use to monitor health.

Six concrete shifts vs v1:

1. **Substrate copy:** `<1s · A` / `<1h · B` / `<1d · B` → **Realtime / Batch warm / Batch cold**. Architectural IDs (A/B) retained only on engineer-facing surfaces (handoff modals, lineage detail).
2. **Attribution:** owner avatar → **games-used-by chip cluster**, sourced from `liveops_2026_campaign_requirements.md` mappings (CFM real, PTG/NTH/TF/COS/PT synthesised). Cross-game features tagged as **Platform** propensity models.
3. **Platform features:** rebrand existing `Predictive` domain + author 2-3 flagship propensity features (`pltv_30d_score`, `churn_7d_propensity`, `reactivation_propensity`).
4. **Analytics dashboard:** drift, freshness vs SLA, value-distribution-over-time, null/cardinality rates, top consuming campaigns, online request rate, 180-day usage trend — replaces the static histogram block.
5. **Register new feature:** dedicated route + form (was a no-op CTA per PRD §13), wires submission into local catalog with handoff modal.
6. **Segment wiring:** every Segment surface that shows a feature (picker, swap popover, right rail, predicate row, library group-by) is updated to consume the new attribution + analytics.

## Phases

| Phase | Name | Priority | Effort | Deps | Status |
|-------|------|----------|--------|------|--------|
| 1 | [Schema & Game Attribution](./phase-01-schema-game-attribution.md) | P1 | 6h | — | Complete |
| 2 | [Substrate Relabel + Latency System](./phase-02-substrate-relabel-latency-system.md) | P1 | 3h | 1 | Complete |
| 3 | [Feature Detail Redesign](./phase-03-feature-detail-redesign.md) | P1 | 8h | 1, 2 | Complete |
| 4 | [Register New Feature Page](./phase-04-register-new-feature-page.md) | P2 | 5h | 1, 2 | Complete |
| 5 | [Library Redesign + Filters](./phase-05-library-redesign-filters.md) | P1 | 5h | 1, 2 | Complete |
| 6 | [Segment Wiring (Full Touch-up)](./phase-06-segment-wiring-full-touch-up.md) | P2 | 6h | 1, 2, 3 | Complete |
| 7 | [Docs + Validation](./phase-07-docs-validation.md) | P1 | 3h | 3-6 | Complete |

**Total:** ~36h serial · 1, 2 must complete first; 3-6 parallelisable after 2.

## Critical path

```
01 ─► 02 ─┬─► 03 ─┐
          ├─► 04 ─┼─► 07
          ├─► 05 ─┤
          └─► 06 ─┘
```

## Key dependencies

- **PRDs read:** `design-reference/Hermes/uploads/PRD_Hermes_Design (1).md` (§6 Feature Store, §10 cross-cutting), `liveops_2026_campaign_requirements.md` (game ↔ campaign ↔ feature mapping source of truth), `Hermes_Demo_Data.md` (existing 73-feature catalog content), `PRD_Hermes_Agentic.md` (Agents module touch points).
- **New PRD addendum:** `docs/feature-store-v2-prd.md` written in Phase 7 — captures the schema deltas, design rationale, and acceptance criteria specific to v2.
- **Schema:** `packages/contracts/src/hermes-feature.ts` adds `games[]`, `platform`, `propensityModel`, `analytics` (180d). Migration of 73 existing features handled in Phase 1.
- **Cross-module:** Segment composer (`apps/web/src/modules/segments/_composer/*`) must keep working through the touch-up. No regression on demo flow steps 3-5.

## Acceptance gate

12-criteria composite — see Phase 7 success criteria. Validated via:
- `pnpm typecheck` — 0 errors
- `pnpm build` — green
- 13-step demo flow (FS detail → Segment build → Campaign activate → monitoring) walks end-to-end with the new visuals
- New flow: Library → Register → handoff → see new feature in catalog → use in segment with correct game chips
- Visual parity: PMs see "Realtime / Batch warm / Batch cold" everywhere user-facing; engineers still see A/B in handoff modals + lineage diagrams

## Out of scope

- Live backend wiring (catalog-api, query-svc remain latent — Phase 12 of parent plan)
- Real Trino crawler for non-CFM games (synthesised data per user direction)
- Edit-existing-feature flow (Edit Definition CTA stays no-op; only New flow wired)
- Explore module (deferred per parent PRD §7)
- Mobile responsive (desktop-first, parity with parent prototype)
- WCAG audit (Phase 3 of parent plan)
