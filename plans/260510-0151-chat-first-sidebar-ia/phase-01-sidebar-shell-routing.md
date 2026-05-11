---
phase: 1
title: "Sidebar shell + routing"
status: pending
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: Sidebar shell + routing

## Overview

Replace the top horizontal `Nav` with a 260px left sidebar matching the Actioneer/Presto layout. Add routing for new pages. This is the foundation — all other UI phases depend on this.

## Requirements

- **Functional:** sidebar renders 13 items + bottom row, expandable sections work, active route highlighted, recent-items load from localStorage
- **Non-functional:** no layout shift on page transitions, ≤16ms interaction, sidebar bg `#F9F6F2`

## Architecture

```
App.tsx
  BrowserRouter
    <div flex-row>
      <Sidebar />               ← NEW (260px fixed left)
      <main flex-1>
        <AppRoutes />
        <AskHermesFab />        ← Phase 7
      </main>
```

`Sidebar` composes `SidebarHeader` (workspace pill + search bar trigger) + `SidebarSection[]` + `SidebarBottomRow`. Each `SidebarSection` is either flat (link) or expandable (caret reveals `RecentItems`).

## Related Code Files

**Create:**
- `apps/web/src/components/sidebar/sidebar.tsx` — main composite
- `apps/web/src/components/sidebar/sidebar-section.tsx` — expandable / flat section
- `apps/web/src/components/sidebar/sidebar-item.tsx` — leaf nav item
- `apps/web/src/components/sidebar/recent-items.tsx` — reads localStorage, renders titles
- `apps/web/src/components/sidebar/workspace-pill.tsx` — top brand pill
- `apps/web/src/components/sidebar/bottom-row.tsx` — Data / Settings / Account
- `apps/web/src/utils/recent-items-store.ts` — localStorage helper (LRU max 8, dedup, versioned key)

**Modify:**
- `apps/web/src/App.tsx` — replace `<Nav />` with `<Sidebar />`, wrap in flex-row
- `apps/web/src/routes.tsx` — add stub routes for `/chat`, `/chat/:id`, `/canvas`, `/canvas/:boardId`, `/playbooks`, `/funnels`, `/retentions`, `/knowledge`, `/data`, `/settings`, `/account`, `/welcome` (route stubs only — pages built in later phases)

**Delete:**
- `apps/web/src/nav.tsx` — delete after Sidebar component verified

## Implementation Steps

1. Install `lucide-react` if not present (`pnpm --filter @hermes/web add lucide-react`)
2. Create `recent-items-store.ts` with `getRecent(module)`, `pushRecent(module, item)`, schema-version key (`hermes.recent.v1.{module}`)
3. Create `sidebar-item.tsx` — single nav row with icon + label + optional caret + active-route detection
4. Create `sidebar-section.tsx` — wraps `sidebar-item.tsx`, persists `expanded` state in localStorage (`hermes.sidebar.expand.{section}`)
5. Create `recent-items.tsx` — reads from store, renders 4 most-recent + `See all…` link
6. Create `workspace-pill.tsx` — Hermes brand mark + dropdown chevron (dropdown deferred)
7. Create `bottom-row.tsx` — divider + Data / Settings / Account links
8. Compose `sidebar.tsx` with the 13 items (per brainstorm §3.2 table); pass `recentItems` source per module
9. Wire `App.tsx` to render `Sidebar` left + main right (flex-row, sidebar 260px fixed)
10. Add route stubs in `routes.tsx` returning placeholder `<div>Coming soon</div>` for new paths
11. Delete `nav.tsx` after typecheck passes
12. `pnpm typecheck && pnpm --filter @hermes/web build`

## Success Criteria

- [ ] Sidebar renders at 260px width, full-height, sticky on left
- [ ] All 13 sidebar items + bottom row clickable, route to correct paths (or stubs)
- [ ] Active route shows 3px brand-tinted left bar + semi-bold text
- [ ] All Chats / Feature Store / Segments / Campaigns / Boards expand and persist state across reload
- [ ] Recent-items show 0 items pre-seeded (later phases populate)
- [ ] No regression on existing pages (Feature Store / Segments / Campaigns library still render)
- [ ] `pnpm typecheck` passes; `pnpm build` succeeds

## Risk Assessment

- **Layout shift on first paint:** sidebar must render server-side or with deterministic width. Mitigation: hardcode 260px width, no async measure.
- **localStorage SSR:** Hermes is SPA-only (Vite dev), so no SSR risk.
- **lucide-react bundle bloat:** ~12kb gzipped for tree-shaken icons. Acceptable.
- **Nav.tsx deletion breaks something:** grep for `import.*Nav` first; no other importers expected.
