---
phase: 1
title: "Contextual right-rail shell"
status: pending
priority: P1
effort: "6h"
dependencies: []
---

# Phase 1: Contextual right-rail shell

## Overview

Replace `<AskHermesFab>`-triggered slide-out panel with a persistent 400px right-rail anchored on detail pages. Auto-resolves page-context chip from URL. Preserves open/closed state in localStorage. Repurposes the existing FAB as a rail toggle button.

## Requirements

**Functional:**
- `<ChatRail>` renders inside `<main>` right gutter on detail pages.
- Rail width 400px; layout = sidebar 260 + main content (flex) + rail 400.
- Header: title (current thread title or "Chat") · `+ New` button · `×` close button.
- Empty state: HERMES brand mark · "Ask about this page or your data" tagline · stub sections for Recent Threads + scripted prompts (filled in P3).
- Active-thread state: compact thread renderer (charts max 320px wide, tables horizontal scroll if >3 cols, FeatureChip vertical stack).
- Input box at bottom with auto-resolved page-context chip.
- Click thread title in rail header → opens `/chat/:threadId` full-page.
- `+ New` → creates fresh thread inside rail (no nav).
- `×` → closes rail, persists state.
- FAB toggles rail open/closed (icon flips: chat-bubble when closed, right-arrow when open).

**Non-functional:**
- Rail open/closed default per route:
  - Open: `/feature-store/:name`, `/segments/:id`, `/segments/:id/:tab`, `/canvas/:id`, `/campaigns/:id`
  - Closed: `/feature-store`, `/segments`, `/canvas`, `/campaigns`, `/playbooks`, `/funnels`, `/retentions`, `/knowledge`
  - Hidden: `/`, `/chat`, `/chat/:id`
- localStorage key `hermes:chat-rail:open` (boolean, per-workspace).
- Width transition `0.16s ease`.
- Background: `T.n50`, `border-left: 1px solid rgba(0,0,0,0.06)`.
- Z-index: 15 (below topbar 20, below CmdK modal 100).
- Page-context chip styling: `T.n200` background, 4px radius, 11px font, removable via inline `×`.

## Architecture

**Component tree:**

```
App.tsx
└── <main>
    ├── <Topbar />
    ├── <Outlet />          ← page content (flex: 1)
    └── <ChatRail />        ← NEW · 400px when open · 0px when closed
        ├── <ChatRailHeader title onNew onClose onTitleClick />
        ├── if !activeThread:
        │     <ChatRailEmpty>
        │       <BrandMark />
        │       <Tagline />
        │       {/* P3: <RecentThreadsSection /> */}
        │       {/* P3: <ScriptedPromptsSection /> */}
        │     </ChatRailEmpty>
        │   else:
        │     <CompactThreadView messages />
        └── <ChatRailInput>
              <PageContextChip />
              <ChatInputBox onSubmit />
            </ChatRailInput>
```

**Page-context resolver** — pure function `resolvePageContext(pathname, getters): PageContext | null`. Same registry pattern as breadcrumb resolver.

```ts
type PageContext = { kind: 'feature' | 'segment' | 'board' | 'campaign'; label: string; entityId: string };
type ContextResolver = (params: Record<string, string>, getters: Getters) => PageContext;

const CONTEXT_REGISTRY: Array<{ pattern: string; resolver: ContextResolver }> = [
  { pattern: '/feature-store/:name', resolver: ({name}) => ({ kind: 'feature', label: `Feature · ${name}`, entityId: name }) },
  { pattern: '/segments/:id', resolver: ({id}, g) => ({ kind: 'segment', label: `Segments · ${g.getSegment(id)?.name ?? id}`, entityId: id }) },
  { pattern: '/segments/:id/:tab', resolver: ({id}, g) => ({ kind: 'segment', label: `Segments · ${g.getSegment(id)?.name ?? id}`, entityId: id }) },
  { pattern: '/canvas/:id', resolver: ({id}, g) => ({ kind: 'board', label: `Board · ${g.getBoard(id)?.name ?? id}`, entityId: id }) },
  { pattern: '/campaigns/:id', resolver: ({id}, g) => ({ kind: 'campaign', label: `Campaigns · ${g.getCampaign(id)?.name ?? id}`, entityId: id }) },
];
```

Reuses existing breadcrumb getters (added in `260510-1330-actioneer-shell-redesign` Phase 1).

**Rail open/closed state** — `useState` in App.tsx, defaults from `chat-rail-store`:

```ts
// utils/chat-rail-store.ts
const KEY = 'hermes:chat-rail:open';
const HIDDEN_ROUTES = ['/', '/chat'];
const HIDDEN_PREFIXES = ['/chat/'];
const DEFAULT_OPEN_PATTERNS = ['/feature-store/:name', '/segments/:id', '/canvas/:id', '/campaigns/:id'];

export function isRailHidden(pathname: string): boolean {
  if (HIDDEN_ROUTES.includes(pathname)) return true;
  return HIDDEN_PREFIXES.some(p => pathname.startsWith(p));
}

export function getDefaultOpen(pathname: string): boolean {
  // matchPath against DEFAULT_OPEN_PATTERNS
  return DEFAULT_OPEN_PATTERNS.some(p => matchPath(p, pathname));
}

export function getStoredOpen(): boolean | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === null) return null;
    return v === '1';
  } catch { return null; }
}

export function setStoredOpen(v: boolean): void {
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch {}
}
```

App.tsx logic on every route change: hidden? → don't render. Otherwise: `stored ?? defaultOpen(pathname)`.

**Active thread state** — `useState<string | null>` for `activeThreadId` inside ChatRail. `+ New` clears to null (empty state). Submitting a prompt or clicking a scripted prompt creates new thread via existing `createThread` and sets activeThreadId.

**Compact thread view** — wraps existing `<AssistantResponse>` and message components in a CSS scope that constrains chart widths. Reuses message rendering — does NOT fork.

**FAB repurpose:**
- Existing `<AskHermesFab>` is a floating circular button at bottom-right of `<main>`.
- New behavior: click toggles rail open/closed + persists state. Icon = `MessageCircle` when closed, `ChevronRight` when open.
- Hidden when rail itself is hidden (on chat routes).

**Deprecate `<AskHermesPanel>`:**
- Delete `components/fab/ask-hermes-panel.tsx` (rail supersedes).
- Remove `<AskHermesPanel>` mount from App.tsx.
- If existing CmdK or other code references it, update to navigate to full-page chat instead.

## Related Code Files

**Create:**
- `apps/web/src/components/chat-rail/chat-rail.tsx` — main rail panel
- `apps/web/src/components/chat-rail/chat-rail-header.tsx`
- `apps/web/src/components/chat-rail/chat-rail-empty.tsx`
- `apps/web/src/components/chat-rail/page-context-chip.tsx`
- `apps/web/src/components/chat-rail/compact-thread-view.tsx` — compact wrapper around existing thread renderer
- `apps/web/src/utils/chat-rail-store.ts` — open/closed persistence + route gating
- `apps/web/src/utils/page-context-resolver.ts` — pathname → PageContext

**Modify:**
- `apps/web/src/App.tsx` — render `<ChatRail>` in `<main>` right gutter, conditional on route; pass open/setOpen state.
- `apps/web/src/components/fab/ask-hermes-fab.tsx` — repurpose as rail toggle (click → setOpen(!open)); icon flips by `open` prop.

**Delete:**
- `apps/web/src/components/fab/ask-hermes-panel.tsx` — superseded by rail.

## Implementation Steps

1. **Store helper** — `utils/chat-rail-store.ts` with `isRailHidden`, `getDefaultOpen`, `getStoredOpen`, `setStoredOpen` per spec.
2. **Page-context resolver** — `utils/page-context-resolver.ts` mirroring breadcrumb-resolver structure; reuse breadcrumb getters.
3. **PageContextChip** — reads `useLocation().pathname`, calls resolver, renders chip with × to clear (clears = parent removes context from input box).
4. **ChatRailHeader** — title (thread title or "Chat") · `+ New` button · `×` close. Click title → `navigate('/chat/' + threadId)` if thread active.
5. **ChatRailEmpty** — brand mark + tagline + stub sections (P3 fills these).
6. **CompactThreadView** — wraps existing message renderer with CSS scope constraining widget widths to 320px and table column overflow handling.
7. **ChatRail composition** — flex column layout: header (44px) → body (flex 1, scrollable) → input (auto height). 400px width.
8. **App.tsx integration** — conditionally render `<ChatRail>` based on `isRailHidden(pathname)`. Manage open/closed state with `useState` initialized from `getStoredOpen() ?? getDefaultOpen()`. Pass setOpen down.
9. **Repurpose AskHermesFab** — accept `open: boolean; onToggle: () => void` props. Icon flips. Hide button when rail is hidden.
10. **Delete AskHermesPanel** — remove file + all references in App.tsx.
11. **Verify** — navigate every route from the hidden/closed/open table; confirm rail behavior matches; reload preserves state; FAB icon flips correctly.

## Success Criteria

- [ ] Rail renders 400px wide on detail pages, closed on library pages, hidden on chat routes
- [ ] Page-context chip resolves correctly: Feature · {name}, Segments · {name}, Board · {name}, Campaigns · {name}
- [ ] Click chip × clears context (input remains, chip removed)
- [ ] Open/closed state persists across reloads (localStorage `hermes:chat-rail:open`)
- [ ] FAB icon flips between MessageCircle (closed) and ChevronRight (open)
- [ ] FAB is hidden on chat routes (where rail is hidden)
- [ ] `+ New` creates fresh thread in rail, returns to empty state
- [ ] `×` closes rail, button shows MessageCircle again
- [ ] Click thread title in header navigates to `/chat/:threadId` full-page
- [ ] Compact thread view: charts max 320px wide; tables scroll horizontally if >3 cols
- [ ] Sidebar 260 + main flex + rail 400 layout works at 1440px+ viewport
- [ ] No regression on existing `/chat/:id` full-page or `/` landing
- [ ] `<AskHermesPanel>` deleted; no broken imports
- [ ] `pnpm typecheck` passes for `apps/web`

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Rail at 400px compresses content too much | Toggle always available; user collapses on demand. Tunable via `chat-rail-store.RAIL_WIDTH`. |
| Layout shift when rail opens/closes | Width transition 0.16s ease; main content uses flex-grow; no reflow on toggle. |
| Hidden-route detection misses edge cases (`/chat?foo=bar`) | Use `useLocation().pathname` (no query); test all chat-prefix paths. |
| Breadcrumb getters not yet imported in page-context-resolver scope | They live in `utils/breadcrumb-resolver.ts` from prior plan; re-export from a shared `utils/route-getters.ts` if collision. |
| Deleting AskHermesPanel breaks existing imports | Grep for `AskHermesPanel` in apps/web; remove all references; verify build. |
| FAB toggle conflicts with CmdK modal Escape handler | Both use Escape; FAB doesn't listen to Escape — it's a button click only. No collision. |
| Initial mount flash from default-open before stored value loads | Read storage synchronously in `useState` initializer; no useEffect fetch. |
| Rail open default set globally then user closes — they expect closed default on next visit | Persisted state always wins over default. User intent respected. |
| Layout breaks at <1280px viewport | Acceptable for v1 (desktop-only app); future mobile work out of scope. |
