---
phase: 7
title: "Ask Hermes FAB + panel"
status: pending
priority: P2
effort: "0.5d"
dependencies: [3, 4]
---

# Phase 7: Ask Hermes FAB + panel

## Overview

Floating "Ask Hermes" button bottom-right on every page except `/` and `/chat/*`. Click opens 380px right slide-in panel containing a compact chat UI that resumes the user's latest active thread (or starts new via panel header `+ New chat`). Page-context chip injects current artifact (segment/feature/campaign) on first send.

## Requirements

- **Functional:** FAB renders globally minus exceptions, panel slides in/out smoothly, thread state syncs with `/chat` (same store), context chip dismissable, `View ↗` navigation keeps panel open
- **Non-functional:** slide animation 200ms ease-out, panel z-index above modals (z-1000), main content does NOT shrink (panel overlays)

## Architecture

```
<App>
  <Sidebar />
  <main>
    <AppRoutes />
    <AskHermesFab />     ← absolute bottom-right, hidden on / and /chat/*
    <AskHermesPanel />   ← controlled by zustand store; renders compact chat UI
```

State: light zustand store (or React context) `panelOpen`, `currentThreadId`, `pageContext`. Panel reuses `<ChatThreadView>` from Phase 2 in `compact` mode (smaller padding, no H1 question).

## Related Code Files

**Create:**
- `apps/web/src/components/fab/ask-hermes-fab.tsx`
- `apps/web/src/components/fab/ask-hermes-panel.tsx`
- `apps/web/src/components/fab/page-context-chip.tsx`
- `apps/web/src/components/fab/panel-header.tsx` — title + new-chat + close buttons
- `apps/web/src/utils/panel-store.ts` — zustand or simple useState-context for `{open, threadId, context}`
- `apps/web/src/utils/page-context.ts` — derives current artifact from URL (`/segments/:id` → `{type:"segment", id}`, etc.)

**Modify:**
- `apps/web/src/App.tsx` — render `<AskHermesFab />` and `<AskHermesPanel />` at root
- `apps/web/src/modules/chat/thread-page.tsx` — accept `compact` prop OR wrap in shared `<ChatThreadView>` used by both standalone and panel
- `apps/web/src/components/chat/chat-input-box.tsx` — accept smaller variant for panel (380px width)

## Implementation Steps

1. Build `panel-store.ts` — `useChatPanel()` hook returning `{open, threadId, context, setOpen, setThread, setContext, openWithContext}`; persist to `hermes.chat.panel.{open,threadId}`
2. Build `page-context.ts` — `useCurrentPageContext()` reads `useLocation()` and parses URL into `{type: 'segment'|'feature'|'campaign'|'board'|null, id, name}`
3. Build `ask-hermes-fab.tsx` — fixed bottom-right 24px margin; circular dark button with sparkle icon; tooltip "Ask Hermes about this [artifact]"; hidden on `/` and matches `/chat/`; on click → `panelStore.setOpen(true)` + `setContext(currentPageContext)`
4. Build `panel-header.tsx` — Hermes label + `+ New chat` button + close (✕)
5. Build `page-context-chip.tsx` — small dismissable bubble "Context: Organic Power Users (segment)" above input on first send per page; persists dismissed state per artifact id in localStorage
6. Build `ask-hermes-panel.tsx` — fixed right, 380px width, full-height, slide-in animation; renders panel-header + compact ChatThreadView + page-context-chip + chat input
7. Refactor `thread-page.tsx` to extract `<ChatThreadView>` shared component used by both `/chat/:id` page and `<AskHermesPanel>`
8. On `+ New chat` in panel: create thread via chat-store, switch panel's currentThreadId, also push to sidebar All Chats (symmetric with /chat)
9. On action card View click inside panel: `navigate('/segments/:id')`, panel STAYS open with thread continuing
10. Add escape-key handler to close panel
11. Test:
    - Visit `/segments/organic-power-users`, click FAB → panel opens, chip shows "Context: Organic Power Users"
    - Send "what's the segment overlap?" → context prefix sent, response renders
    - Dismiss chip → reload → chip stays dismissed for that segment
    - Navigate to /campaigns/:id, click FAB → same thread continues, new context chip
    - Click `+ New chat` in panel header → fresh thread, sidebar updates

## Success Criteria

- [ ] FAB visible on all pages except `/`, `/chat/*`, and `/welcome`
- [ ] Click FAB → panel slides in from right
- [ ] Panel resumes most recent thread by default
- [ ] Page-context chip renders on first FAB-open per page; dismissable; sticky-dismissed per artifact
- [ ] `+ New chat` in panel creates thread that also appears in sidebar
- [ ] Action card View navigation keeps panel open
- [ ] Esc key + ✕ button close panel
- [ ] Panel state persists across reload
- [ ] `pnpm typecheck` clean

## Risk Assessment

- **Z-index conflicts** with existing modals (handoff, threshold deep): audit all `z-index` and put panel at 1000.
- **Panel overlay vs sidebar:** sidebar stays visible; panel overlays main only. Confirm no width-measure feedback loops.
- **Compact vs standalone divergence:** keep ChatThreadView one component with `compact` prop; don't fork.
- **Context chip overload:** if user navigates 5 pages with FAB, 5 chips clutter. Show only LATEST page's chip + auto-dismiss after first send.
