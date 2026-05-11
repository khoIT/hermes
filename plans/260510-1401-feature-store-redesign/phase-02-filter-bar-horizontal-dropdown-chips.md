---
phase: 2
title: "Filter bar (horizontal) + dropdown chips"
status: completed
priority: P1
effort: "0.4d"
dependencies: []
---

# Phase 2: Filter bar (horizontal) + dropdown chips

## Overview

Replace the 196px page-level `<FilterRail>` with an inline horizontal filter bar at the top of the canvas. Six dropdowns (Type · Latency · Games · Platform · Source · Status) each open an anchored popover containing the same chip groups that exist in the rail today. Active filters render as removable chips below the dropdown row. Search input is promoted to a wide top bar with `/` global focus shortcut.

## Requirements

- **Functional:**
  - 6 dropdown buttons, each shows category name + count badge when filters active in that category (e.g. `Latency (2)`)
  - Click dropdown → anchored popover with chip group; click outside or another dropdown closes
  - Active filters render as removable chips in row below: `[Realtime ×] [CFM ×] [Active ×]` + `Clear all` button
  - Active-chips row hidden entirely when no filters active (saves 28px)
  - Search input full-width in row above dropdowns; `/` keyboard shortcut focuses it from anywhere on the page (no modifiers, ignored when typing in another input)
  - Same `FilterState` shape consumed; filter logic untouched
- **Non-functional:**
  - Filter bar sticky at top of canvas during scroll (z-index just below sidebar)
  - Below 768px viewport, fall back to single `Filters (N)` popover button (mobile fallback — out of demo scope but stub it cleanly)
  - Popover positioning: anchored below trigger, clips to viewport, max-height with internal scroll

## Architecture

```
apps/web/src/modules/feature-store/_components/filter-bar.tsx       ← orchestrator
  ├ filter-search-input.tsx       wide search box w/ '/' shortcut
  ├ filter-dropdown-chip.tsx      single dropdown + popover wrapper (×6 instances)
  └ active-filter-chips.tsx       removable chips row + Clear all

State: lifted to library.tsx (existing FilterState — unchanged)
Search: existing FilterState.query (unchanged)

Popover anchoring: hand-rolled (no Radix dependency added). Use a ref + getBoundingClientRect to position absolutely. Click-outside via document mousedown listener inside the popover effect.
```

## Related Code Files

- **Create:**
  - `apps/web/src/modules/feature-store/_components/filter-bar.tsx`
  - `apps/web/src/modules/feature-store/_components/filter-search-input.tsx`
  - `apps/web/src/modules/feature-store/_components/filter-dropdown-chip.tsx`
  - `apps/web/src/modules/feature-store/_components/active-filter-chips.tsx`
- **Modify (read-only here, integration in Phase 4):**
  - None this phase — `library.tsx` swap happens in Phase 4 to keep this phase isolated for unit testing
- **Reuse:**
  - `apps/web/src/modules/feature-store/_logic/filter.ts` (FilterState, EMPTY_FILTER, applyFilter — unchanged)

## Implementation Steps

1. Build `filter-search-input.tsx`:
   - Controlled input bound to `state.query` / `onChange`
   - 32px height, full-width within parent, search icon prefix, placeholder `"Search by name, owner, domain…"`
   - `useEffect` global keydown listener: if `e.key === '/'` AND active element is not an input/textarea/contenteditable, preventDefault + focus input
2. Build `filter-dropdown-chip.tsx`:
   - Props: `label: string`, `activeCount: number`, `children: ReactNode` (popover body)
   - Trigger button: pill style, shows `label` + `(N)` when activeCount > 0, chevron-down icon, active outline when count > 0
   - Popover: useState `open`, ref-based outside-click handler, position `absolute` with `top: 100% + 6px`, `left: 0` of trigger
   - Popover body: white bg, border `T.n200`, rounded 8px, padding 12px, max-width 280px, max-height 320px with internal `overflow-y: auto`
3. Build `active-filter-chips.tsx`:
   - Props: `state: FilterState`, `onChange: (FilterState) => void`
   - Flatten active selections into list of `{label, kind, value}` entries (e.g. one entry per type, one per game, etc.)
   - Render each as a small pill with × button removing that single entry
   - "Clear all" button on right when any active
   - Returns null when no filters active (caller renders nothing)
4. Build `filter-bar.tsx`:
   - Props: `features`, `state`, `onChange`
   - Layout: stacked
     - Row 1: `<FilterSearchInput>` (full width)
     - Row 2: 6 `<FilterDropdownChip>` instances (Type, Latency, Games, Platform, Source, Status), gap 8px
     - Row 3: `<ActiveFilterChips>` (renders null when empty)
   - Each dropdown body reuses the existing `Chip` component pattern from old `filter-rail.tsx` — copy the chip rendering inline, don't import the rail
   - Counts (e.g. type counts, game counts) computed via `useMemo` same as in `filter-rail.tsx`
   - Sticky positioning: `position: sticky; top: 0; z-index: 50; background: #fff; border-bottom: 1px solid T.n200; padding: 12px 40px`
5. Optional mobile fallback: detect `window.innerWidth < 768` (resize listener) → render single `<FilterDropdownChip label="Filters" activeCount={total}>` containing all 6 chip groups stacked. Keep this minimal — empty stub if it adds >30 minutes of work, since mobile is out of scope.
6. Run `pnpm --filter @hermes/web typecheck` → must pass

## Success Criteria

- [ ] 4 new files created under `_components/`
- [ ] `<FilterBar>` mounts standalone in a Storybook-like harness or simple test page (verify via temporary route or import in `library.tsx` with old + new side-by-side; revert before commit)
- [ ] Pressing `/` from anywhere on the Feature Store page focuses the search input
- [ ] Pressing `/` while typing in any other input does NOT hijack focus
- [ ] Each of 6 dropdowns opens a popover; click outside closes; opening another auto-closes the previous
- [ ] Active filters render as removable chips below; × removes that filter; "Clear all" clears every filter
- [ ] Active count badge appears on dropdown when its category has selections
- [ ] `pnpm --filter @hermes/web typecheck` clean

## Risk Assessment

- **Risk:** Hand-rolled popover positioning breaks on viewport edge.
  - Mitigation: clip via `right: max(0, X - viewportWidth)` shift; standard pattern. Test with sidebar collapsed at 60px (less right space).
- **Risk:** Adding sticky filter bar conflicts with existing sticky page header in `library.tsx`.
  - Mitigation: drop the existing page-header `padding: 16px 40px 0` wrapper in Phase 4; filter bar becomes the new sticky surface.
- **Risk:** Popover click-outside accidentally closes on nested click (e.g. clicking a chip inside the popover).
  - Mitigation: ref check — only close when click target is outside the popover's root ref.
- **Risk:** Storybook/test harness not present in repo; can't isolate.
  - Mitigation: mount old + new bars side-by-side in `library.tsx` during dev, revert side-by-side before committing Phase 4.
