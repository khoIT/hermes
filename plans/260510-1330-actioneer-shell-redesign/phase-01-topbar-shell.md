---
phase: 1
title: "Topbar Shell"
status: completed
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: Topbar Shell

## Overview

New `<Topbar>` component (56px, sticky, blur backdrop) inside `<main>`. Surfaces breadcrumb (left), ⌘K-trigger search input (center-right), and avatar menu (right). Re-anchors `<AskHermesFab>` to `<main>` bottom-right.

## Requirements

**Functional:**
- Topbar renders on every route except possibly the welcome splash.
- Breadcrumb auto-resolves from current `pathname`. Last crumb bold; preceding crumbs are NavLinks.
- Search input is a `<button>` styled as input; click opens existing `<CmdKModal>` via shared state in App.tsx.
- ⌘K keyboard shortcut continues to work (no change to existing `useGlobalShortcut`).
- Avatar menu opens a dropdown: Account / Settings / Data sources / divider / Sign out.
- AskHermesFab positions relative to `<main>`, not viewport.

**Non-functional:**
- Topbar height fixed 56px. Padding `0 24px`. `font-family: T.fSans`.
- Background `rgba(249,246,242,0.92)` + `backdrop-filter: blur(8px)`. Fallback to opaque `T.n50` if backdrop-filter unsupported.
- `border-bottom: 1px solid rgba(0,0,0,0.06)`.
- `z-index: 20` (below CmdK modal portal at 100+).
- Sticky `top: 0` so page content scrolls underneath.

## Architecture

```
App.tsx
├── <BrowserRouter>
│   ├── <Sidebar /> (unchanged)
│   └── <main>
│       ├── <Topbar              ← NEW
│       │     onSearchClick={() => setCmdKOpen(true)} />
│       │   ├── <Breadcrumb />
│       │   ├── <SearchTrigger />
│       │   └── <AvatarMenu />
│       └── <AppRoutes />
├── <AskHermesFab /> (re-anchored)
├── <CmdKModal /> (existing)
```

**Breadcrumb resolver** — pure function `resolveBreadcrumb(pathname, getters): Crumb[]`. Route registry approach:

```ts
type Crumb = { label: string; to?: string };
type Resolver = (params: Record<string, string>, getters: Getters) => Crumb[];
type Getters = {
  getFeature: (name: string) => HermesFeature | undefined;
  getSegment: (id: string) => HermesSegment | undefined;
  getBoard: (id: string) => Board | undefined;
  getCampaign: (id: string) => HermesCampaign | undefined;
  getThread: (id: string) => ChatThread | undefined;
};

const ROUTE_REGISTRY: Array<{ pattern: string; resolver: Resolver }> = [
  { pattern: '/', resolver: () => [{ label: 'Home' }] },
  { pattern: '/chat', resolver: () => [{ label: 'All Chats' }] },
  { pattern: '/chat/:id', resolver: ({id}, g) => [
    { label: 'All Chats', to: '/chat' },
    { label: g.getThread(id)?.title ?? 'Conversation' }
  ]},
  { pattern: '/feature-store', resolver: () => [{ label: 'Feature Store' }] },
  { pattern: '/feature-store/:name', resolver: ({name}, g) => {
    const f = g.getFeature(name);
    if (!f) return [{ label: 'Feature Store', to: '/feature-store' }, { label: name }];
    return [
      { label: 'Feature Store', to: '/feature-store' },
      { label: f.domainGroup ?? f.domain, to: `/feature-store?group=${encodeURIComponent(f.domainGroup ?? f.domain)}` },
      { label: f.name }
    ];
  }},
  { pattern: '/segments', resolver: () => [{ label: 'Segments' }] },
  { pattern: '/segments/:id', resolver: ({id}, g) => [
    { label: 'Segments', to: '/segments' },
    { label: g.getSegment(id)?.name ?? id }
  ]},
  { pattern: '/segments/:id/:tab', resolver: ({id, tab}, g) => [
    { label: 'Segments', to: '/segments' },
    { label: g.getSegment(id)?.name ?? id, to: `/segments/${id}` },
    { label: titleCase(tab) }
  ]},
  { pattern: '/canvas', resolver: () => [{ label: 'Boards' }] },
  { pattern: '/canvas/:id', resolver: ({id}, g) => [
    { label: 'Boards', to: '/canvas' },
    { label: g.getBoard(id)?.name ?? id }
  ]},
  { pattern: '/campaigns', resolver: () => [{ label: 'Campaigns' }] },
  { pattern: '/campaigns/:id', resolver: ({id}, g) => [
    { label: 'Campaigns', to: '/campaigns' },
    { label: g.getCampaign(id)?.name ?? id }
  ]},
  { pattern: '/playbooks', resolver: () => [{ label: 'Playbooks' }] },
  { pattern: '/funnels', resolver: () => [{ label: 'Funnels' }] },
  { pattern: '/retentions', resolver: () => [{ label: 'Retentions' }] },
  { pattern: '/knowledge', resolver: () => [{ label: 'Knowledge' }] },
];
```

Fallback: titlecase first path segment if no pattern matches. Use `react-router-dom`'s `matchPath` for pattern matching.

**SearchTrigger spec:**
```tsx
<button onClick={onSearchClick} style={{
  flex: '0 1 420px', display: 'flex', alignItems: 'center', gap: 8,
  height: 36, padding: '0 12px',
  background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8,
  cursor: 'pointer', textAlign: 'left',
}}>
  <Icon icon={Search} size={14} color={T.n500} />
  <span style={{ flex: 1, color: T.n500, fontSize: 13 }}>Search</span>
  <kbd style={{ /* monospace pill */ }}>⌘ + K</kbd>
</button>
```

**AvatarMenu spec:**
- 32px circle, brand-tinted, initials `K` (hardcoded for now — see open question 1).
- Click → 200px popover anchored bottom-right of avatar. Items: Account · Settings · Data sources · ─── · Sign out.
- Outside-click + Escape closes. Re-uses Account/Settings/Data routes.

## Related Code Files

**Create:**
- `apps/web/src/components/topbar/topbar.tsx`
- `apps/web/src/components/topbar/breadcrumb.tsx`
- `apps/web/src/components/topbar/search-trigger.tsx`
- `apps/web/src/components/topbar/avatar-menu.tsx`
- `apps/web/src/utils/breadcrumb-resolver.ts`

**Modify:**
- `apps/web/src/App.tsx` — render `<Topbar>` inside `<main>`; lift `cmdKOpen` state if not already.
- `apps/web/src/components/fab/ask-hermes-fab.tsx` — change positioning context (parent `<main>` instead of viewport).

## Implementation Steps

1. **Build resolver first** — `utils/breadcrumb-resolver.ts` with route registry + tests scenario (manual). Pure function, no React.
2. **Build Breadcrumb component** — consumes `resolveBreadcrumb(useLocation().pathname, getters)`. Getters wired from existing data modules (`allFeatures`, `allSegments`, etc.). NavLinks for non-terminal crumbs.
3. **Build SearchTrigger** — button styled as input, `onClick` prop calls cmdK toggle.
4. **Build AvatarMenu** — local `useState` for open/close, outside-click handler, Escape key handler. Hardcode initials `K`.
5. **Compose Topbar** — flex row: Breadcrumb (flex:1, truncate overflow) | SearchTrigger (flex: 0 1 420px) | AvatarMenu (32px). Sticky styles.
6. **Wire into App.tsx** — wrap `<AppRoutes>` with Topbar. Pass `setCmdKOpen` to SearchTrigger.
7. **Re-anchor AskHermesFab** — add `position: relative` to `<main>`, change FAB from `position: fixed` to `position: absolute` (or keep fixed but reduce z-index so topbar can sit above on overlap edge cases).
8. **Verify on every route** — `/`, `/chat`, `/chat/:id`, `/feature-store`, `/feature-store/:name`, `/segments`, `/segments/:id`, `/segments/:id/monitoring`, `/canvas`, `/canvas/:id`, `/campaigns`, `/campaigns/:id`, `/playbooks`, `/funnels`, `/retentions`, `/knowledge`.

## Success Criteria

- [ ] Topbar renders 56px tall on all routes
- [ ] Breadcrumb shows correct crumbs for all 12+ routes (manual verify)
- [ ] Feature detail breadcrumb includes domain group: `Feature Store / Numeric / account_age_days`
- [ ] Search button click opens CmdKModal; ⌘K keyboard still works
- [ ] Avatar menu opens, navigates to Account/Settings/Data routes, closes on outside-click and Escape
- [ ] AskHermesFab anchors to main content, not viewport — no overlap with sidebar
- [ ] Backdrop blur renders correctly in Chrome; opaque fallback works in Safari/Firefox without breaking layout
- [ ] No regression on existing routes (manual smoke test)
- [ ] `pnpm typecheck` passes for `apps/web`

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Breadcrumb mis-renders before data loads (e.g. `/segments/abc-123` opens, `getSegment` returns undefined) | Resolver returns id as fallback label; once data loads, re-render naturally picks up name. No skeleton needed. |
| Topbar z-stack conflicts with CmdK modal portal or AskHermesPanel | Set Topbar `z:20`, modal `z:100`, panel `z:50`. Verify portal renders above topbar. |
| AskHermesFab repositioning breaks on routes where `<main>` is unusually short | Keep FAB `position: fixed` with `bottom: 24px; right: 24px` but offset by sidebar width using `left: calc(260px + 24px)` is wrong direction — instead just leave `position: fixed; bottom: 24px; right: 24px` since sidebar is to the LEFT and won't conflict. **Actually no change needed.** Re-verify during implementation. |
| Avatar menu outside-click handler conflicts with CmdK modal close | Both use Escape; menu listener should `stopPropagation` only when its menu is open. |
