---
phase: 3
title: "Library Tightening + Segments Detail Tabs"
status: completed
priority: P2
effort: "5h"
dependencies: [1]
---

# Phase 3: Library Tightening + Segments Detail Tabs

## Overview

Reduce vertical chrome on the two heaviest landing pages (`/feature-store`, `/segments`) by leaning on the new topbar's breadcrumb. Add a sub-tab strip on Segments detail pages that NavLinks to existing routes.

## Requirements

**Functional:**
- Drop in-page H1 on both library pages (breadcrumb owns context).
- Compress entry-points strip on Feature Store to a row of 4 chip buttons (28px tall).
- StatStrip becomes a hairline card (1px border, no shadow).
- On `/segments`, move `+ New segment` CTA into topbar trailing slot (right of search, before avatar).
- Segments detail pages render a sub-tab strip (40px tall, sticky `top: 56px`) with NavLinks to existing routes.
- Stub `/segments/:id/composition` and `/segments/:id/users` if they don't exist (Coming soon page).

**Non-functional:**
- Vertical chrome on `/feature-store` ≤ 160px before first row (down from ~280px).
- Active tab style: 2px brand bottom-bar + bold label. Inactive: `T.n600`.
- Sub-tab strip background matches topbar (light surface), 1px bottom border.
- Topbar CTA slot must not interfere with avatar menu — append to right of search input, before avatar.

## Architecture

**Topbar trailing-slot mechanism:**

Topbar already has Breadcrumb | Search | Avatar. Add an optional `trailing` slot rendered between Search and Avatar. Page components inject content via a small context:

```ts
// utils/topbar-trailing-context.ts
type TrailingContent = React.ReactNode;
const TopbarTrailingContext = React.createContext<{
  set: (n: TrailingContent) => void;
}>({ set: () => {} });

export function useTopbarTrailing(node: TrailingContent, deps: any[]) {
  const { set } = React.useContext(TopbarTrailingContext);
  React.useEffect(() => {
    set(node);
    return () => set(null);
  }, deps);
}
```

App.tsx wraps `<Topbar>` with provider; Segments library calls `useTopbarTrailing(<Button>+ New segment</Button>, [])`.

**Feature Store library tightening:**
- Remove `<h1>Feature Store</h1>` block.
- Replace 4 entry-point cards with a single `<div>` flex row of 4 `<button>` chips at 28px tall: `Browse by domain · Register · Recently added · Drift detected`. Counts shown inline as `(N)`.
- StatStrip: replace shadowed card with a `1px hairline` outer border, reduce padding `16px → 12px 16px`, drop any large numerals if they exceed `font-size: 28px` → `22px`.

**Segments library tightening:**
- Same H1 drop.
- Remove the in-page `+ New segment` CTA; inject via `useTopbarTrailing`.
- Existing GROUP BY / 4R GOAL / STATUS / HAS OPEN CAMPAIGNS sidebar unchanged.

**Segments detail tabs:**

```tsx
// modules/segments/_components/detail-tabs.tsx
const SEGMENT_TABS = [
  { label: 'Overview',     to: (id: string) => `/segments/${id}` },
  { label: 'Composition',  to: (id: string) => `/segments/${id}/composition` },
  { label: 'Users',        to: (id: string) => `/segments/${id}/users` },
  { label: 'Campaigns',    to: (id: string) => `/segments/${id}/campaigns` },
  { label: 'Monitoring',   to: (id: string) => `/segments/${id}/monitoring` },
  { label: 'Threshold',    to: (id: string) => `/segments/${id}/threshold-deep` },
  { label: 'Canvas',       to: (id: string) => `/segments/${id}/canvas` },
];
```

Renders as `<nav>` with NavLink children using `end` prop on Overview only. Active style: 2px brand bottom border + `font-weight: 600`. 40px tall, `padding: 0 24px`, sticky `top: 56px`, background matches topbar.

**Stub routes:**
- For `/segments/:id/composition` and `/segments/:id/users` if not existing, create `<ComingSoon title="Composition" />` and `<ComingSoon title="Users" />` placeholders.

## Related Code Files

**Create:**
- `apps/web/src/utils/topbar-trailing-context.ts`
- `apps/web/src/modules/segments/_components/detail-tabs.tsx`
- `apps/web/src/components/coming-soon.tsx` (if not exists; check `modules/explore/stub.tsx` for reuse)

**Modify:**
- `apps/web/src/components/topbar/topbar.tsx` — wrap children with `<TopbarTrailingContext.Provider>`; render trailing slot between Search and Avatar.
- `apps/web/src/modules/feature-store/library.tsx` — drop H1, compress entry-points to chip row, hairline StatStrip.
- `apps/web/src/modules/feature-store/_components/stat-strip.tsx` — adjust styles for hairline mode (or pass `dense` prop).
- `apps/web/src/modules/segments/library.tsx` — drop H1, hoist CTA via `useTopbarTrailing`, hairline StatStrip if present.
- `apps/web/src/modules/segments/detail.tsx` (or wrapping component) — render `<DetailTabs />` after topbar, before existing content.
- `apps/web/src/routes.tsx` — register `/segments/:id/composition` and `/segments/:id/users` stub routes if missing.

## Implementation Steps

1. **Topbar trailing context** — `utils/topbar-trailing-context.ts` + `useTopbarTrailing` hook.
2. **Update Topbar** — add trailing slot rendered between Search and Avatar.
3. **Feature Store library** — drop H1; build 4-chip entry-points row; switch StatStrip to hairline mode.
4. **Segments library** — drop H1; replace in-page CTA with `useTopbarTrailing`; tighten StatStrip if applicable.
5. **DetailTabs component** — `modules/segments/_components/detail-tabs.tsx` with NavLinks per route.
6. **Audit existing segment detail routes** — confirm which exist (monitoring, threshold-deep, canvas, handoff-modal). Stub the missing ones (composition, users, campaigns) with `<ComingSoon>`.
7. **Wire DetailTabs into segment detail layout** — render after topbar, before existing route content. May require a layout wrapper component if routes are flat.
8. **Verify** — measure vertical chrome on `/feature-store` (DevTools); navigate all segment detail tabs; confirm topbar CTA appears only on `/segments`.

## Success Criteria

- [ ] `/feature-store` chrome (top of viewport to first feature row) ≤ 160px
- [ ] `/feature-store` H1 absent; breadcrumb in topbar reads "Feature Store"
- [ ] Entry-points strip: 4 chips, 28px tall, with counts where applicable
- [ ] `/segments` H1 absent; `+ New segment` CTA appears in topbar trailing slot
- [ ] CTA disappears when navigating away from `/segments`
- [ ] Segments detail pages show 7-tab strip just below topbar
- [ ] Tab active state: 2px brand bottom-bar + bold
- [ ] Stub routes (Composition, Users) render "Coming soon" without console errors
- [ ] No regression on detail pages (LM/DA/DE on Feature Store, monitoring/threshold-deep/canvas on Segments)
- [ ] `pnpm typecheck` passes for `apps/web`

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Topbar trailing-slot context causes re-render of entire topbar on CTA mount/unmount | Use `useEffect` cleanup to reset to null; React reconciliation handles efficiently. |
| Removing H1 hurts a11y (no landmark) | Topbar's breadcrumb last-crumb is the de-facto page title; add `aria-current="page"` on the last crumb. |
| Sub-tab strip's sticky `top: 56px` fights topbar's sticky `top: 0` | Both stick correctly because they're in different DOM layers; sub-tab strip is inside the page content scroll container. |
| Existing segment detail routes use different layout components, hard to inject DetailTabs uniformly | Add DetailTabs at the route level (wrapping `<Outlet>` if using nested routes) OR include in each leaf component. Pick whichever is less invasive after audit. |
| StatStrip "hairline mode" prop bloats component | Either pass `dense` boolean OR fork into `stat-strip-hairline.tsx` if styles diverge significantly. Decide during implementation. |
| `+ New segment` CTA in topbar collides with Avatar on narrow viewports | Acceptable for v1 (desktop-only app). Add `flex-wrap: wrap` if needed. |
