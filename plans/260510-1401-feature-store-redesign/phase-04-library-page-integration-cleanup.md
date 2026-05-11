---
phase: 4
title: "Library page integration + cleanup"
status: completed
priority: P1
effort: "0.2d"
dependencies: [1, 2, 3]
---

# Phase 4: Library page integration + cleanup

## Overview

Final cutover. Modify `library.tsx` to delete `<StatStrip>` render, drop the page-rail flex layout, and mount the new `<FilterBar>` from Phase 2 above the toolbar. Delete `stat-strip.tsx` and `filter-rail.tsx` files. Run full typecheck + build + smoke test against acceptance criteria.

**Must run last** — depends on all three prior phases.

## Requirements

- **Functional:**
  - `/feature-store` renders: entry-point chips → search → filter dropdowns → active-chip row (when present) → toolbar → grouped feature rows
  - No `<StatStrip>` visible at top
  - No 196px left rail; main canvas spans full content width minus sidebar
  - All existing filter / group / sort / search behavior preserved
  - Sidebar Feature Store section (Phase 1) remains synced with route navigation
- **Non-functional:**
  - Build passes: `pnpm --filter @hermes/web build`
  - No dead imports left over
  - No console errors during navigation flows

## Architecture

```
library.tsx BEFORE                          library.tsx AFTER
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│ <StatStrip />                   │         │ <EntryPointChipStrip />         │
│ <EntryPointChipStrip />         │         │ <FilterBar features state ... />│
│ <FilterRail /> | <GroupedRows />│         │ <Toolbar GroupBy + Sort />      │
└─────────────────────────────────┘         │ <GroupedRows />                 │
                                            └─────────────────────────────────┘
```

## Related Code Files

- **Modify:**
  - `apps/web/src/modules/feature-store/library.tsx`
- **Delete:**
  - `apps/web/src/modules/feature-store/_components/stat-strip.tsx`
  - `apps/web/src/modules/feature-store/_components/filter-rail.tsx`
- **Verify untouched:**
  - `apps/web/src/modules/feature-store/_logic/filter.ts` — filter logic preserved
  - `apps/web/src/modules/feature-store/_logic/sort.ts`, `group.ts`, `usage-count.ts` — preserved

## Implementation Steps

1. Confirm Phase 1, 2, 3 all merged / present locally:
   - `apps/web/src/utils/pinned-features-store.ts` exists
   - `apps/web/src/components/sidebar/sidebar-feature-store-section.tsx` exists and wired in `sidebar.tsx`
   - `apps/web/src/modules/feature-store/_components/filter-bar.tsx` exists
   - `apps/web/src/modules/feature-store/_components/feature-row-card.tsx` rewritten (grid template differs from main)
2. Modify `library.tsx`:
   - Delete `import { StatStrip } from './_components/stat-strip'`
   - Delete `import { FilterRail } from './_components/filter-rail'`
   - Add `import { FilterBar } from './_components/filter-bar'`
   - Remove `<StatStrip features={features} />` render
   - Remove the body-level flex layout `<div style={{ display: 'flex', padding: '24px 40px' }}>`; collapse to a single column
   - Above the existing toolbar (`<GroupByControl />` row), mount `<FilterBar features={features} state={filterState} onChange={setFilterState} />`
   - Move the entry-point chip strip and FilterBar into a single sticky-header wrapper at the top of the page (background #fff, border-bottom T.n200, padding 16px 40px 12px)
   - Toolbar + groups render below in a content wrapper with `padding: 16px 40px`
   - Extract `DRIFT_THRESHOLD = 0.4` to a shared constant — import from `drift-indicator.tsx` or a new `_logic/thresholds.ts`; replace inline `>= 0.4` literal in `driftedCount` memo
3. Delete `_components/stat-strip.tsx` and `_components/filter-rail.tsx`
4. Verify no stragglers:
   - `git grep -n stat-strip apps/web/src` → only library.tsx (now removed) should match; expect zero
   - `git grep -n filter-rail apps/web/src` → expect zero
5. Run full toolchain:
   - `pnpm --filter @hermes/web typecheck` → clean
   - `pnpm --filter @hermes/web build` → succeeds
6. Smoke test (manual, in browser):
   - Visit `/feature-store` → no KPI strip visible; chips + search + filter row visible at top
   - Type in search → list filters live
   - Press `/` from anywhere → search input focuses
   - Open Latency dropdown → click `Realtime` → list filters; chip appears below; close popover
   - Click `Realtime ×` chip → filter cleared
   - Hover any row → ★ + ⋯ buttons visible; click ★ → sidebar PINNED section updates
   - Click ⋯ → menu opens with Pin/View/Used by/Add to draft
   - Click row body → navigates to detail page
   - Resize sidebar collapsed (60px) → main content reflows; filter bar still sticky and usable
7. Verify all 10 acceptance criteria from `plan.md` (§ Acceptance Criteria)

## Success Criteria

- [ ] `library.tsx` no longer imports or renders StatStrip / FilterRail
- [ ] `stat-strip.tsx` and `filter-rail.tsx` files deleted from filesystem
- [ ] `git grep` for both filenames returns zero matches under `apps/web/src`
- [ ] `pnpm --filter @hermes/web typecheck` clean
- [ ] `pnpm --filter @hermes/web build` succeeds
- [ ] All 10 plan-level acceptance criteria pass (manual smoke test)
- [ ] No console errors / warnings during a full demo walk-through
- [ ] Layout is stable when toggling sidebar collapsed/expanded

## Risk Assessment

- **Risk:** Some other module / test imports `StatStrip` or `FilterRail`.
  - Mitigation: pre-delete grep (Step 4). If any reference, fix it before delete; don't force-remove.
- **Risk:** Sticky filter bar overlaps detail page header on next navigation if z-index leaks.
  - Mitigation: filter bar is rendered inside library.tsx only; route change unmounts it. Verify with route navigation in smoke test.
- **Risk:** Drift threshold drift between row indicator (Phase 3) and entry-point chip count (library.tsx).
  - Mitigation: Step 2.7 — extract single shared `DRIFT_THRESHOLD` constant; all consumers import it.
- **Risk:** Typescript build fails because removed exports.
  - Mitigation: dedicated typecheck pass before declaring phase complete.
- **Risk:** Manual smoke test reveals visual regression on a specific viewport / sidebar state.
  - Mitigation: test at three widths: sidebar expanded (260px) on 1920px screen, sidebar collapsed (60px) on 1366px screen, sidebar expanded on 1366px screen (worst-case narrow).
