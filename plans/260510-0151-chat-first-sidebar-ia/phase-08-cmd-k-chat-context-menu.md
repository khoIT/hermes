---
phase: 8
title: "Cmd-K + chat context menu"
status: pending
priority: P2
effort: "0.5d"
dependencies: [4]
---

# Phase 8: Cmd-K + chat context menu

## Overview

Two polish features:
1. **⌘+K / Ctrl+K global search modal** — date-grouped chat threads with keyboard navigation (↑↓ + Enter + Esc)
2. **Three-dot context menu** on each sidebar chat item — Add to folder (toast stub), Convert to playbook (toast stub), Delete chat (working)

## Requirements

- **Functional:** ⌘+K opens modal globally; ↑↓ navigates; Enter opens thread; Esc closes; threads grouped by Today/Yesterday/Last 7 days/Older. Three-dot menu hover-reveals on chat row.
- **Non-functional:** modal renders <50ms, search filter debounced 100ms, keyboard nav works without mouse

## Architecture

```
<App>
  <CmdKModal />              ← global, mounted once; controlled by CmdK store
  ...

CmdK store: open, query, focusedIndex
Threads grouped via date-bucketing util (today / yesterday / last-7d / older)
```

Three-dot menu uses Radix DropdownMenu (or hand-rolled — check existing UI lib).

## Related Code Files

**Create:**
- `apps/web/src/components/global-search/cmd-k-modal.tsx`
- `apps/web/src/components/global-search/cmd-k-result-row.tsx`
- `apps/web/src/components/global-search/cmd-k-empty-state.tsx`
- `apps/web/src/components/sidebar/chat-context-menu.tsx`
- `apps/web/src/utils/cmd-k-store.ts` — open, query state
- `apps/web/src/utils/date-buckets.ts` — `bucketByDate(items)` returns grouped
- `apps/web/src/utils/keyboard-shortcut.ts` — global hotkey listener helper

**Modify:**
- `apps/web/src/App.tsx` — mount `<CmdKModal />`; bind global ⌘+K listener
- `apps/web/src/components/sidebar/sidebar-item.tsx` — add three-dot trigger on hover for chat-type items, render `<ChatContextMenu />`

## Implementation Steps

1. Build `keyboard-shortcut.ts` helper: `useGlobalShortcut('mod+k', handler)` — handles Cmd vs Ctrl per platform, ignores when in input fields
2. Build `cmd-k-store.ts` — `useCmdK()` returning `{open, query, focusedIndex, setOpen, setQuery, moveFocus, selectFocused}`
3. Build `date-buckets.ts` — pure util: take `[{updatedAt, ...}]` → return `{today: [...], yesterday: [...], last7Days: [...], older: [...]}`
4. Build `cmd-k-result-row.tsx` — single row with thread title + relative time + arrow icon when focused
5. Build `cmd-k-modal.tsx` — centered overlay 600x500 with input + grouped result list; ↑↓ moves focus; Enter navigates `/chat/:id`; Esc closes; click outside closes
6. Build `cmd-k-empty-state.tsx` — "No chats found" + tip
7. Mount in `App.tsx` and bind global listener
8. Build `chat-context-menu.tsx` — Radix DropdownMenu (or simple div if Radix not present): 3 items
   - "Add to folder" → toast "Coming soon"
   - "Convert to playbook" → toast "Coming soon"
   - "Delete chat" → confirm dialog → `chatStore.deleteThread(id)` + sidebar refresh
9. Wire `sidebar-item.tsx` to render three-dot trigger on row-hover for chat-type items
10. Test:
    - Press ⌘+K → modal opens, threads visible grouped
    - Type "cpi" → filters to thread-001
    - ↑↓ moves focus indicator; Enter opens thread
    - Esc closes
    - Hover sidebar chat → three-dot appears → click Delete → confirm → thread removed

## Success Criteria

- [ ] ⌘+K (Mac) / Ctrl+K (Win/Linux) opens modal from any page
- [ ] Modal shows all threads grouped Today/Yesterday/Last 7 days/Older
- [ ] Typing filters results in real-time
- [ ] ↑↓ + Enter + Esc work as expected
- [ ] Click outside closes modal
- [ ] Sidebar chat row hover reveals three-dot menu
- [ ] Delete chat removes from store + sidebar updates immediately
- [ ] Add to folder + Convert to playbook each toast "Coming soon"
- [ ] No interference with shortcuts in active input fields
- [ ] `pnpm typecheck` clean

## Risk Assessment

- **Browser ⌘+K reserved:** Chrome address bar binds ⌘+K on Windows in some flows. Test both platforms; if conflict, use `e.preventDefault()` aggressively when our app has focus.
- **Radix dependency:** if not present, hand-roll dropdown — don't add Radix just for this menu.
- **Date bucketing edge cases:** "yesterday" depends on user timezone; use locale-aware `Intl.DateTimeFormat` not raw subtraction.
- **Focus trap:** ensure modal traps focus correctly for accessibility (basic tab cycling).
