---
phase: 2
title: "Sidebar Polish"
status: completed
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: Sidebar Polish

## Overview

Four visual moves to the existing 260px sidebar: (1) tree-line guide under expanded children, (2) sub-row box highlight in place of left brand-bar, (3) workspace pill subtitle, (4) 60px icon-rail collapse mode with persisted state and toggle.

## Requirements

**Functional:**
- When a SidebarSection is expanded, render a 1px vertical guide line at `left: 23px` spanning the children block.
- Sub-row active state uses box highlight (`background: rgba(0,0,0,0.05)` + 1px border) instead of 3px brand left bar. Top-level rows keep the brand bar.
- Workspace pill shows subtitle `Thinking Data → Actionable Data` below the HERMES wordmark.
- Collapse toggle button at sidebar bottom toggles between 260px (expanded) and 60px (icon rail) modes.
- Collapsed state persists in `localStorage['hermes:sidebar:collapsed']`. Default false (expanded).
- Collapsed mode hides labels, hides workspace subtitle, hides children entirely. Hover over icon shows tooltip with section label. Click navigates to section's `to` route.
- Width transitions smoothly (`transition: width 0.16s ease`).

**Non-functional:**
- Tree line: 1px width, `rgba(0,0,0,0.08)`, `top: 4px; bottom: 4px`.
- Indent change: child rows go from `padding-left: 36px` to `padding-left: 28px` so leading icon aligns with guide.
- Subtitle: `T.fSans, 11px, font-weight: 400, color: T.n500, line-height: 1.3, letter-spacing: 0.01em`.
- Subtitle copy uses em-arrow `→` (U+2192), NOT em-dash.
- Collapsed icon column: 60px wide, icons centered, 28px row height.
- Tooltip: small floating div, 8px right of icon, `background: T.n900, color: white, padding: 4px 8px, border-radius: 4px, fontSize: 11px`.

## Architecture

```
sidebar.tsx
└── reads localStorage collapsed state
    ├── width branch: 260 vs 60
    ├── workspace-pill: hide subtitle when collapsed
    ├── nav: render children only when !collapsed
    ├── bottom-row + collapse-toggle
    └── all SidebarItems get `collapsed` prop

sidebar-section.tsx
└── when expanded && children:
    └── <div style={position:relative, paddingLeft:24}>
        ├── <div style={position:absolute, left:23, top:4, bottom:4, width:1, background: rgba(0,0,0,0.08)} />  ← guide line
        └── {children}

sidebar-item.tsx
├── if (collapsed): render icon-only with tooltip
├── else if (indent && isActive): box highlight (no left bar)
└── else if (!indent && isActive): 3px brand left bar (today's behavior)
```

**Persistence helper:**
```ts
// utils/sidebar-collapsed-store.ts
const KEY = 'hermes:sidebar:collapsed';
export function getCollapsed(): boolean {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}
export function setCollapsed(v: boolean): void {
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch {}
}
```

**Collapse-toggle component:**
- Small icon button (24px) in `bottom-row.tsx`, before the existing Data/Settings/Account row, OR adjacent to it depending on layout.
- Icon: `ChevronLeft` (when expanded, click to collapse) / `ChevronRight` (when collapsed, click to expand).
- Tooltip: "Collapse sidebar" / "Expand sidebar".

**State propagation:**
- Sidebar reads from store on mount; passes `collapsed` boolean down to children.
- Toggle dispatches both `setCollapsed(next)` AND a custom event `hermes:sidebar:collapsed-changed` so other listeners (none yet, but available) can react.
- Re-render driven by `useState` in sidebar root.

## Related Code Files

**Create:**
- `apps/web/src/utils/sidebar-collapsed-store.ts`
- `apps/web/src/components/sidebar/collapse-toggle.tsx`

**Modify:**
- `apps/web/src/components/sidebar/sidebar.tsx` — read collapsed state; width branch; pass `collapsed` to children; render `<CollapseToggle>`.
- `apps/web/src/components/sidebar/sidebar-section.tsx` — wrap children in tree-line container when expanded.
- `apps/web/src/components/sidebar/sidebar-item.tsx` — accept `collapsed` prop; render icon-only mode with tooltip; switch sub-row active treatment to box highlight.
- `apps/web/src/components/sidebar/workspace-pill.tsx` — add subtitle (hidden when collapsed); shrink to icon-only when collapsed.
- `apps/web/src/components/sidebar/bottom-row.tsx` — collapsed-mode rendering; add `<CollapseToggle>`.

## Implementation Steps

1. **Store helper** — `utils/sidebar-collapsed-store.ts` with safe localStorage access.
2. **CollapseToggle component** — chevron button + tooltip, dispatches setCollapsed + change event.
3. **Update sidebar.tsx** — `useState` for collapsed; useEffect listens to event for cross-instance sync; conditionally render width.
4. **Tree-line in sidebar-section.tsx** — wrap children when expanded with relative + guide div.
5. **Update sidebar-item.tsx** — accept `collapsed` prop; if collapsed, render only the icon (centered, no label, with hover tooltip); switch sub-row (`indent`) active state to box highlight.
6. **Update sidebar-item.tsx indent value** — 36px → 28px.
7. **Update workspace-pill.tsx** — add subtitle below wordmark; pass `collapsed` to hide subtitle and shrink layout.
8. **Update bottom-row.tsx** — render CollapseToggle; in collapsed mode, stack icons vertically (Data, Settings, Account, divider, toggle).
9. **Verify** — toggle expand/collapse on every route; persist across reload; tree-line aligns under each section's children; sub-row active state visible without brand bar.

## Success Criteria

- [ ] Sidebar expands/collapses with smooth 160ms transition
- [ ] Collapsed state persists across page reloads
- [ ] Tree-line guide visible under all expanded sections (All Chats, Feature Store, Boards, Segments, Campaigns)
- [ ] Sub-row active state shows box highlight, not brand bar
- [ ] Top-level row active state still shows 3px brand bar
- [ ] Workspace subtitle reads `Thinking Data → Actionable Data`, hidden when collapsed
- [ ] Collapsed mode: icons centered, no labels, hover tooltip works, click navigates correctly
- [ ] BottomRow (Data/Settings/Account) renders correctly in both modes
- [ ] No layout shift when toggling
- [ ] `pnpm typecheck` passes for `apps/web`

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Tree line clashes visually with active sub-row brand bar | Switch sub-row active to box highlight (decision locked). |
| Collapsed mode renders wrong on initial mount (flash from 260 → 60) | Read store synchronously in `useState` initializer (no useEffect); avoids hydration flash. |
| Tooltip in collapsed mode requires portal to escape sidebar overflow | Sidebar already has `overflow: hidden`; render tooltip with `position: fixed` and compute coords from icon `getBoundingClientRect()`. |
| RecentItems re-render in collapsed mode (children hidden) wastes work | Conditionally render children only when expanded — already gated by `expanded` flag in SidebarSection. |
| BottomRow gets cramped in 60px column | Stack vertically (one icon per row) when collapsed; widen back to horizontal when expanded. |
| Width transition causes layout reflow on every frame | `width` transition is GPU-friendly when paired with `will-change: width` on the aside. |
