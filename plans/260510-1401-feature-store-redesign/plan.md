---
title: "Feature Store redesign — sidebar-merged actions + dense rows"
description: "Kill StatStrip + page-level FilterRail; promote Register CTA, Pinned, You viewed, New this month into the global sidebar Feature Store section; replace rail with horizontal filter bar; redesign rows to single-line dense (~32px) with drift indicator, relative freshness, hover overflow menu."
status: completed
priority: P1
branch: "actioneer"
tags: [frontend, feature-store, redesign]
blockedBy: []
blocks: []
created: "2026-05-10T07:22:20.543Z"
createdBy: "ck:plan"
source: skill
brainstorm_ref: "plans/reports/brainstorm-260510-1401-feature-store-redesign.md"
demo_target: "2026-05-12"
estimate_days: 1.5
---

# Feature Store redesign — sidebar-merged actions + dense rows

## Overview

Frontend-only redesign of the Feature Store library page. Kills the 7-pill `StatStrip` and the 196px page-level `FilterRail`; promotes Register CTA + Pinned + You viewed + New this month into the global sidebar's Feature Store section; replaces filter rail with an inline horizontal dropdown bar; rewrites `FeatureRowCard` to single-line dense (~32px) with drift indicator, relative freshness, hover overflow menu (Pin / View / Used by).

No backend changes. All state client-side (existing `FilterState` + new localStorage `pinned-features-store`). Builds on top of the global sidebar shell established by completed plan `260510-0151-chat-first-sidebar-ia` Phase 1.

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Pin store + sidebar Feature Store section](./phase-01-pin-store-sidebar-feature-store-section.md) | Completed | 0.4d |
| 2 | [Filter bar (horizontal) + dropdown chips](./phase-02-filter-bar-horizontal-dropdown-chips.md) | Completed | 0.4d |
| 3 | [Dense row card + drift + freshness + overflow menu](./phase-03-dense-row-card-drift-freshness-overflow-menu.md) | Completed | 0.5d |
| 4 | [Library page integration + cleanup](./phase-04-library-page-integration-cleanup.md) | Completed | 0.2d |

## Dependencies

None blocking. Prior plan `260510-0151-chat-first-sidebar-ia` is `completed`; this plan extends its global sidebar.

## Acceptance Criteria (from brainstorm §7)

- [ ] Page header ≤ 80px vertical (entry-point chips + filter bar) before toolbar
- [ ] No `<StatStrip />` or `<FilterRail />` rendered anywhere
- [ ] Global sidebar Feature Store section shows: Register CTA + Pinned (when set) + You viewed (when any) + New this month (when any)
- [ ] Hover row → ★ pin button visible; click toggles pin → sidebar updates within one render tick
- [ ] Search input keyboard-focusable from anywhere via `/`
- [ ] Inline filter dropdowns render 6 categories; active filters appear as removable chips below
- [ ] Feature rows ≤ 36px tall; ≥ 18 rows fit on a 1080p viewport without scroll
- [ ] All existing filter/group/sort/navigation behavior unchanged — no functional regressions
- [ ] `pnpm typecheck && pnpm --filter @hermes/web build` clean
- [ ] No layout shift between sidebar collapsed (60px) and expanded (260px) states
