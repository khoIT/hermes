---
phase: 2
title: "Conversation Rail & Intent"
status: pending
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: Conversation Rail & Intent

## Overview

Mount the page shell at `/agents/compose`: two-column layout, header with auto-tag chip, intent textarea + starter chips, persistent conversation rail. Right column is a placeholder until phases 3–5 land. After this phase, a user can type an intent, see the agent reply, see the 4R tag fill in — but stages haven't rendered yet.

## Requirements

- **Functional:**
  - Route `/agents/compose` mounts page with empty session
  - Intent textarea + 4–5 starter chips (click pre-fills textarea, Enter or Submit dispatches `INTENT_SUBMIT`)
  - Conversation rail renders chat log with two message types: `user` and `agent` (system annotations come in later phases)
  - Header shows 4R chip (empty until intent submitted, then animates in with playbook tag)
  - Sticky intent textarea at bottom of rail; rail scrolls independently of right pane
  - Submit non-matching intent → fallback agent message *"I don't recognize this pattern yet — try one of these"* with chips
- **Non-functional:**
  - Layout responsive only down to 1280px (desktop demo)
  - All styling uses `T` theme tokens; no inline hex outside the existing `ACCENT = '#f05a22'` constant
  - Files ≤ 200 LOC

## Architecture

```
apps/web/src/modules/agents/compose/
  compose-page.tsx              ← top-level page (~150 lines)
  _components/
    intent-input.tsx            ← textarea + starter chips (~80 lines)
    conversation-rail.tsx       ← chat thread + sticky input (~140 lines)
    chat-message.tsx            ← single message renderer (~60 lines)
    four-r-tag.tsx              ← header chip with alignment % (~50 lines)
    stage-stepper-shell.tsx     ← 3 placeholder stage cards (~80 lines)
```

### Layout (CSS grid)

```
┌──────────────────────────────────────────────────────────┐
│  [back]  ✦ Authoring Agent · sa-…       [4R · Retain 92%]│  ← header
├────────────────────────┬─────────────────────────────────┤
│                        │                                 │
│ Conversation rail      │  Stage stepper (placeholders)   │
│ (scrollable)           │  ┌─ Stage 1 · Features ─────┐   │
│                        │  └──────────────────────────┘   │
│                        │  ┌─ Stage 2 · Segment ─────┐    │
│                        │  └──────────────────────────┘   │
│                        │  ┌─ Stage 3 · Campaign ────┐    │
│ ┌─[textarea]─────────┐ │  └──────────────────────────┘   │
│ │chip chip chip chip │ │                                 │
│ └────────────────────┘ │                                 │
└────────────────────────┴─────────────────────────────────┘
```

Grid: `grid-template-columns: 380px 1fr` · `min-height: 100vh`. Left rail has `overflow-y:auto`, right pane has its own scroll.

## Related Code Files

- **Create:**
  - `apps/web/src/modules/agents/compose/compose-page.tsx`
  - `apps/web/src/modules/agents/compose/_components/intent-input.tsx`
  - `apps/web/src/modules/agents/compose/_components/conversation-rail.tsx`
  - `apps/web/src/modules/agents/compose/_components/chat-message.tsx`
  - `apps/web/src/modules/agents/compose/_components/four-r-tag.tsx`
  - `apps/web/src/modules/agents/compose/_components/stage-stepper-shell.tsx`
- **Modify:**
  - `apps/web/src/routes.tsx` — add `<Route path="/agents/compose" element={<AgentsComposePage />} />`
- **Reuse:**
  - `apps/web/src/theme.tsx` — `T` tokens
  - `_state/compose-reducer.ts` from Phase 1
  - `_state/keyword-matcher.ts` from Phase 1

## Implementation Steps

1. Create `compose-page.tsx` with `useReducer` initialized from Phase 1's reducer. Two-column grid layout. Empty session state.
2. Create `intent-input.tsx`. Textarea with placeholder *"What outcome do you want to drive?"*. 4 starter chips below: `losing streaks`, `whales gone dormant`, `stuck on first match`, `7-day non-payers`. Chip click → set textarea value.
3. Create `chat-message.tsx`. Avatar + bubble for `user` (right-aligned, dark) and `agent` (left-aligned, gold/serif). System type added in later phases.
4. Create `conversation-rail.tsx`. Maps `session.chatLog` to `<ChatMessage>`. Mounts `<IntentInput>` sticky at bottom. Initial empty state shows agent placeholder *"Describe a problem and I'll help you build a campaign."*
5. Create `four-r-tag.tsx`. Reads `session.fourR`; renders empty chip "..." until populated, then animates in with tag + alignment. Match badge styling from existing `Badge` component.
6. Create `stage-stepper-shell.tsx`. Renders 3 collapsed cards labeled Features/Segment/Campaign with disabled state. Phase 3+ replaces this.
7. Add route in `routes.tsx` (preserve alphabetical/numeric order under "Module 05: Agents").
8. Wire intent submit: on Enter/click → `keywordMatcher(intent)` → `dispatch({ type: 'INTENT_SUBMIT', intent, playbookId })`. Reducer (Phase 1) appends user message + agent's first scripted reply to `chatLog` and sets `fourR`.
9. Verify `/agents/compose` renders, type *"loss streak"* → see agent reply + 4R chip fill.

## Success Criteria

- [ ] Navigating to `/agents/compose` renders the page with empty conversation
- [ ] Typing *"players losing 5+ in a row"* and hitting Enter triggers agent reply within 200ms
- [ ] 4R chip animates in with `Retain · 92%` for the loss-streak playbook
- [ ] Clicking a starter chip pre-fills the textarea; submit works
- [ ] Submitting an unrecognized intent (e.g. *"hello world"*) shows the fallback message
- [ ] Conversation rail scrolls; intent textarea stays sticky at bottom
- [ ] Right pane shows 3 placeholder stage cards (Phase 3+ wiring lives there)
- [ ] No file exceeds 200 LOC
- [ ] `pnpm typecheck` passes

## Risk Assessment

- **Risk:** CSS grid + sticky positioning collides on narrow viewports. **Mitigation:** test at 1440 / 1280; document min-width in plan; demo machine is wider anyway.
- **Risk:** Conversation rail re-renders flicker as messages append. **Mitigation:** key by `chatLog[i].id`; avoid index keys.
- **Risk:** Starter chips look like a navbar / get confused with the existing tabs. **Mitigation:** style as soft pills below the textarea with mono-uppercase eyebrow label *"Or try one of these"*.

## Notes for Phase 3+

- Phase 3 replaces `stage-stepper-shell.tsx` with the real `stage-stepper.tsx` + `stage-features.tsx`
- All dispatches go through `compose-page.tsx`; child components receive `session` + `dispatch` via props (no context provider — only one consumer tree)
