---
phase: 2
title: "Toggle wiring & default-on"
status: completed
priority: P2
effort: "1.5h"
dependencies: [1]
---

# Phase 2: Toggle wiring + default-on seed

## Overview

Promote the existing `DeepResearchToggle` from cosmetic to surfaced — but only when the active thread is one of the 3 agent-first threads. Add a bootstrap version bump (`v13` → `v14`) that seeds the `localStorage['hermes.chat.deepResearch']` to `'1'` (ON) on first-visit if the key doesn't already exist. Does NOT yet wire the rendering gate — that lives in phase 6.

## Context links

- Brainstorm: `plans/reports/brainstorm-260511-1209-deep-thinking-trace.md`
- Existing toggle: `apps/web/src/components/chat/deep-research-toggle.tsx` (cosmetic v1, persists to localStorage)
- Toggle visibility flags:
  - `apps/web/src/components/chat-rail/chat-rail.tsx:359` (`showDeepResearch={false}`)
  - `apps/web/src/modules/chat/thread-page.tsx:220` (`showDeepResearch={false}`)
- Bootstrap version: `apps/web/src/utils/chat-bootstrap.ts:33` (currently `v13-260511-1145`)
- Helper from Phase 1: `apps/web/src/utils/agent-first-thread-ids.ts`

## Requirements

**Functional**
- `chat-rail.tsx` shows `DeepResearchToggle` ONLY when the active thread id matches `isAgentFirstThread()`
- `thread-page.tsx` shows `DeepResearchToggle` ONLY when the route's `:id` matches `isAgentFirstThread()`
- `chat-bootstrap.ts` bumps `BOOTSTRAP_VERSION` to `'v14-260511-1209'` AND on version mismatch, if `localStorage['hermes.chat.deepResearch']` is unset, writes `'1'` (ON) — preserves user's prior toggle if they previously interacted with it
- Non-agent-first threads continue to hide the toggle (unchanged behavior)

**Non-functional**
- Default-ON seed runs at most once per `BOOTSTRAP_VERSION` change (don't clobber user preference on every load)
- No new files this phase
- All edits surgical (single-line conditional swaps, plus a small helper call)

## Architecture

### 2.1 chat-rail.tsx wiring

Find `showDeepResearch={false}` near line 359. Replace with `showDeepResearch={isAgentFirstThread(activeThreadId)}`.

Add import at top:
```ts
import { isAgentFirstThread } from '../../utils/agent-first-thread-ids';
```

### 2.2 thread-page.tsx wiring

Find `showDeepResearch={false}` near line 220. Replace with `showDeepResearch={isAgentFirstThread(id)}` (using the `id` from `useParams()`).

Add import at top:
```ts
import { isAgentFirstThread } from '../../utils/agent-first-thread-ids';
```

### 2.3 Bootstrap version bump + default-ON seed

In `chat-bootstrap.ts`:

1. Bump:
   ```ts
   const BOOTSTRAP_VERSION = 'v14-260511-1209';
   ```

2. Add a one-time deep-research-default seed. The cleanest insertion point is inside the version-changed branch (after `clearRecent('chats')` and the canonical seed, before `pruneStaleSegmentRecents()`). Add a new helper:

   ```ts
   /** One-time seed: enable Deep Research toggle for agent-first threads on
    *  first install OR on bootstrap version bump. Preserves an existing user
    *  preference if they previously interacted with the toggle. */
   function seedDeepResearchDefault(): void {
     try {
       const KEY = 'hermes.chat.deepResearch';
       const existing = localStorage.getItem(KEY);
       if (existing === null) {
         localStorage.setItem(KEY, '1');
       }
     } catch { /* localStorage unavailable */ }
   }
   ```

   Call `seedDeepResearchDefault()` inside the version-bump branch.

**Why preserve existing user preference:** If the user previously interacted with the toggle (presumably during cosmetic-mode testing), their choice persists. Only first-time visitors get the ON-default.

### 2.4 Bootstrap-version compatibility

The version bump v13 → v14 will trigger:
- Wipe of ad-hoc threads (existing behavior, harmless — agent-first threads are in CANONICAL_IDS)
- Re-seed canonical threads (idempotent)
- Default-ON of Deep Research toggle (NEW)

No regression in the prior plan's behavior — agent-first threads stay in `HIDDEN_THREADS` and continue to NOT push to recents.

## Related code files

**Modify (3)**
- `apps/web/src/components/chat-rail/chat-rail.tsx` (import + 1-line swap)
- `apps/web/src/modules/chat/thread-page.tsx` (import + 1-line swap)
- `apps/web/src/utils/chat-bootstrap.ts` (version bump + new helper call)

**Create:** none

**Do NOT modify** (phases 3-5 own thread content; phase 6 owns rendering gate):
- `assistant-response.tsx`
- Any thread fixture
- `deep-research-toggle.tsx` itself (no changes needed — it already reads localStorage)

## Implementation steps

1. **Add imports** in `chat-rail.tsx` and `thread-page.tsx` for `isAgentFirstThread`
2. **Swap visibility flags** in both files
3. **Bump `BOOTSTRAP_VERSION`** in `chat-bootstrap.ts` to `'v14-260511-1209'`
4. **Add `seedDeepResearchDefault()` helper** + call it in the version-changed branch
5. **Manual smoke** (recommend):
   - `pnpm --filter @hermes/web dev`
   - Clear localStorage `hermes.chat.bootstrap.version` and `hermes.chat.deepResearch`
   - Reload `/welcome` → check `localStorage['hermes.chat.deepResearch']` = `'1'`
   - Click an agent-first inbox card → toggle visible in chat input
   - Click a canonical analyst thread (e.g. `thread-001`) → toggle NOT visible
6. **Typecheck:** `pnpm --filter @hermes/web typecheck` must pass

## Todo list

- [x] `chat-rail.tsx` imports + visibility flag swapped
- [x] `thread-page.tsx` imports + visibility flag swapped
- [x] `chat-bootstrap.ts` BOOTSTRAP_VERSION bumped to v14
- [x] `seedDeepResearchDefault()` helper added + called in version-changed branch
- [x] Manual smoke: toggle appears on agent-first threads, hidden on others
- [x] Manual smoke: localStorage default-ON works for first-time visitors
- [x] `pnpm typecheck` passes

## Success criteria

- [x] Toggle renders in chat input on the 3 agent-first threads
- [x] Toggle does NOT render on non-agent-first threads (regression check on `thread-001`, `thread-demo-livops-2026`)
- [x] Fresh localStorage → toggle defaults to ON
- [x] User-set preference (toggle OFF, then reload) survives next bootstrap version bump
- [x] `pnpm typecheck && pnpm build` passes

## Risk assessment

| Risk | Mitigation |
|---|---|
| `chat-rail.tsx` line 359 may have shifted since the brainstorm scout | Use grep `'showDeepResearch={false}'` to locate. There should only be 2 hits (chat-rail + thread-page). |
| Version bump v13→v14 wipes ad-hoc threads created on v13 | Existing behavior — the v12→v13 bump already had this risk and it shipped fine. Agent-first threads stay in `CANONICAL_IDS`. Worth flagging to demo team though. |
| Default-ON seeding accidentally overwrites a deliberate OFF preference | Guarded by `existing === null` check. Only seeds when key is absent. |
| Toggle visibility logic interacts poorly with thread-switch animation (toggle appears/disappears mid-transition) | Trivial — toggle is in chat input which already re-renders on thread switch. Acceptable. |
