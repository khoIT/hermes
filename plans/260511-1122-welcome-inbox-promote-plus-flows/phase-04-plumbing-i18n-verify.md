---
phase: 4
title: Plumbing & i18n & Verify
status: completed
priority: P2
effort: 2h
dependencies:
  - 1
  - 2
  - 3
---

# Phase 4: Plumbing & i18n Parity & Verify

## Overview

Wire the two new thread exports (from phases 2 & 3) into all the chat-flow plumbing — auto-play registration, multi-turn follow-ups, chat-rail, restart-demo. Add entity-name localizations (en + vi) for the new thread titles. Run `pnpm typecheck && pnpm build` + visual smoke across all 3 inbox cards' end-to-end demo arcs.

Centralizing all plumbing edits in this single phase keeps phases 2 and 3 conflict-free (they only create their own `.ts` thread files).

## Context links

- Brainstorm: `plans/reports/brainstorm-260511-1122-welcome-inbox-promote-plus-flows.md`
- Template registration pattern reference: existing `thread-demo-agent-livops-2026` registrations across the 5 plumbing files

## Requirements

**Functional**
- Both new threads auto-play T1 when user clicks their inbox card
- Each new thread's follow-up prompts (`'Build a rescue segment'`, `'Launch the rescue campaign'`, `'Show me the 2-week retrospective'`) play T2/T3/T4 in registry order
- Restart-demo chip resets both new threads to slim seed
- Entity-names localizer surfaces VI title in sidebar/breadcrumbs when language=vi
- `pnpm typecheck && pnpm build` pass cleanly from repo root

**Non-functional**
- No regression in existing canonical thread arcs (analyst arc + arc A)
- No new files created in this phase (only edits to existing plumbing files)

## Architecture

### Files touched and exact edits

#### 1. `apps/web/src/utils/chat-bootstrap.ts`
- Add 2 imports next to existing `threadDemoAgentLivops2026`:
  ```ts
  import { threadDemoAgentD7FbCohort2026 } from '../data/chat/threads/thread-demo-agent-d7-fb-cohort-2026';
  import { threadDemoAgentWhaleRecall2026 } from '../data/chat/threads/thread-demo-agent-whale-recall-2026';
  ```
- In the seeding section (currently seeds `threadDemoAgentLivops2026`), add seed calls for both new threads following the identical pattern (look at line ~95 area where the agent-first thread is seeded).

#### 2. `apps/web/src/data/chat/multi-turn-registry.ts`
- Add 2 imports next to existing `threadDemoAgentLivops2026Turns`:
  ```ts
  import { threadDemoAgentD7FbCohort2026Turns } from './threads/thread-demo-agent-d7-fb-cohort-2026';
  import { threadDemoAgentWhaleRecall2026Turns } from './threads/thread-demo-agent-whale-recall-2026';
  ```
- After the existing 3-line block for `thread-demo-agent-livops-2026` (lines 50-52), add **6 new registry entries**:
  ```ts
  // ─── thread-demo-agent-d7-fb-cohort-2026: AGENT-FIRST arc — D7 FB rescue ──
  ['thread-demo-agent-d7-fb-cohort-2026', 'Build a rescue segment',           { assistantMsg: threadDemoAgentD7FbCohort2026Turns.segment }],
  ['thread-demo-agent-d7-fb-cohort-2026', 'Launch the rescue campaign',       { assistantMsg: threadDemoAgentD7FbCohort2026Turns.campaign }],
  ['thread-demo-agent-d7-fb-cohort-2026', 'Show me the 2-week retrospective', { assistantMsg: threadDemoAgentD7FbCohort2026Turns.retrospective, isTerminal: true }],
  // ─── thread-demo-agent-whale-recall-2026: AGENT-FIRST arc — Whale rescue ──
  ['thread-demo-agent-whale-recall-2026', 'Build a rescue segment',           { assistantMsg: threadDemoAgentWhaleRecall2026Turns.segment }],
  ['thread-demo-agent-whale-recall-2026', 'Launch the rescue campaign',       { assistantMsg: threadDemoAgentWhaleRecall2026Turns.campaign }],
  ['thread-demo-agent-whale-recall-2026', 'Show me the 2-week retrospective', { assistantMsg: threadDemoAgentWhaleRecall2026Turns.retrospective, isTerminal: true }],
  ```

#### 3. `apps/web/src/modules/chat/thread-page.tsx`
- Add 2 imports next to existing `threadDemoAgentLivops2026Turns` (line 25):
  ```ts
  import { threadDemoAgentD7FbCohort2026Turns } from '../../data/chat/threads/thread-demo-agent-d7-fb-cohort-2026';
  import { threadDemoAgentWhaleRecall2026Turns } from '../../data/chat/threads/thread-demo-agent-whale-recall-2026';
  ```
- Extend the auto-play turn map (line 34 area) with 2 entries:
  ```ts
  'thread-demo-agent-d7-fb-cohort-2026': threadDemoAgentD7FbCohort2026Turns.t1,
  'thread-demo-agent-whale-recall-2026': threadDemoAgentWhaleRecall2026Turns.t1,
  ```
- Extend the user-message-id map (line 39 area) with 2 entries:
  ```ts
  'thread-demo-agent-d7-fb-cohort-2026': 'm-agent-b-u1',
  'thread-demo-agent-whale-recall-2026': 'm-agent-c-u1',
  ```

#### 4. `apps/web/src/components/chat-rail/chat-rail.tsx`
- Add 2 imports next to existing `threadDemoAgentLivops2026Turns` (line 21):
  ```ts
  import { threadDemoAgentD7FbCohort2026Turns } from '../../data/chat/threads/thread-demo-agent-d7-fb-cohort-2026';
  import { threadDemoAgentWhaleRecall2026Turns } from '../../data/chat/threads/thread-demo-agent-whale-recall-2026';
  ```
- Extend the T1 map ternary chain at line 134:
  ```ts
  activeThreadId === 'thread-demo-agent-livops-2026'    ? threadDemoAgentLivops2026Turns.t1 :
  activeThreadId === 'thread-demo-agent-d7-fb-cohort-2026' ? threadDemoAgentD7FbCohort2026Turns.t1 :
  activeThreadId === 'thread-demo-agent-whale-recall-2026' ? threadDemoAgentWhaleRecall2026Turns.t1 :
  ```

#### 5. `apps/web/src/components/chat-rail/restart-demo-chip.tsx`
- Add 2 imports next to existing `threadDemoAgentLivops2026` (line 15):
  ```ts
  import { threadDemoAgentD7FbCohort2026 } from '../../data/chat/threads/thread-demo-agent-d7-fb-cohort-2026';
  import { threadDemoAgentWhaleRecall2026 } from '../../data/chat/threads/thread-demo-agent-whale-recall-2026';
  ```
- Extend the conversation map (line 19) with 2 entries:
  ```ts
  'thread-demo-agent-d7-fb-cohort-2026': threadDemoAgentD7FbCohort2026,
  'thread-demo-agent-whale-recall-2026': threadDemoAgentWhaleRecall2026,
  ```

#### 6. `apps/web/src/i18n/entity-names.ts`
- Add 2 entity-name entries after `'thread-demo-agent-livops-2026'` (line 64):
  ```ts
  'thread-demo-agent-d7-fb-cohort-2026':  'Hermes phát hiện: D7 cohort FB giảm 4pp',
  'thread-demo-agent-whale-recall-2026':  'Hermes phát hiện: Recall whale giảm còn 38%',
  ```
- (English titles come from the `Conversation.title` field on each thread — no entity-names entry needed for en.)

## Related code files

**Modify** (6 files)
- `apps/web/src/utils/chat-bootstrap.ts`
- `apps/web/src/data/chat/multi-turn-registry.ts`
- `apps/web/src/modules/chat/thread-page.tsx`
- `apps/web/src/components/chat-rail/chat-rail.tsx`
- `apps/web/src/components/chat-rail/restart-demo-chip.tsx`
- `apps/web/src/i18n/entity-names.ts`

**Create:** none

## Implementation steps

1. **Confirm phases 1, 2, 3 complete** — `pnpm typecheck` must already pass after each phase
2. **Edit `chat-bootstrap.ts`** — add imports, add seed calls for both threads
3. **Edit `multi-turn-registry.ts`** — add imports, add 6 new tuple entries (3 per thread)
4. **Edit `thread-page.tsx`** — add imports, extend auto-play turn map + user-message-id map
5. **Edit `chat-rail.tsx`** — add imports, extend T1 ternary chain
6. **Edit `restart-demo-chip.tsx`** — add imports, extend conversation map
7. **Edit `entity-names.ts`** — add 2 Vietnamese title entries
8. **Run `pnpm typecheck`** — fix any type errors
9. **Run `pnpm build`** from repo root — must complete without errors
10. **Visual smoke (manual)**:
    - `pnpm dev` (or `pnpm dev:turbo` if Postgres already running)
    - Open `http://localhost:5173/`
    - Confirm 3 inbox rows render above Active Campaigns
    - Click card A → T1 plays → type `'Build a rescue segment'` → T2 plays → continue full arc
    - Click card B → T1 plays (D7 FB cohort narrative) → run full arc B
    - Click card C → T1 plays (whale recall narrative) → run full arc C
    - Toggle EN ↔ VI in settings → confirm all 3 card copies + 3 thread titles localize
    - Try restart-demo chip on each new thread → conversation resets to slim seed

## Todo list

- [x] `chat-bootstrap.ts` imports + seed calls added *(verified: code-review symmetric edits check)*
- [x] `multi-turn-registry.ts` 6 new entries added *(verified: code-review registry tuple entries, no cross-thread collision)*
- [x] `thread-page.tsx` auto-play map + user-message-id map extended *(verified: code-review slim seed structure + auto-play guard)*
- [x] `chat-rail.tsx` T1 ternary chain extended *(verified: code-review dispatch chain)*
- [x] `restart-demo-chip.tsx` conversation map extended *(verified: code-review restart chip handles both threads)*
- [x] `entity-names.ts` 2 VI entries added *(verified: code-review EN/VI parity check)*
- [x] `pnpm typecheck` passes *(verified: clean, 0 new errors)*
- [x] `pnpm build` passes *(verified: 2679 modules clean from repo root)*
- [ ] Manual smoke: 3 cards click → 3 threads auto-play T1 → 3 follow-up arcs complete to T4 *(deferred to user browser demo)*
- [ ] EN ↔ VI toggle preserves all card + thread localizations *(deferred to user browser demo)*

## Success criteria

- [ ] All top-level plan success criteria met *(7/8 verified, 1 deferred to user browser demo)*
- [x] `pnpm typecheck && pnpm build` exits 0 *(verified: clean)*
- [ ] All 3 inbox cards take user from `/welcome` → respective thread → full T1-T4 arc *(deferred to user browser demo)*
- [x] No regression in canonical analyst arcs (`thread-demo-livops-2026`) or arc A (`thread-demo-agent-livops-2026`) *(verified: code-review "canonical arc untouched" + "diffs only add adjacent map entries")*
- [x] Restart-demo chip works on all 3 agent-first threads *(verified: code-review "Restart chip works for all 5 demo threads")*

## Risk assessment

| Risk | Mitigation |
|---|---|
| Registry tuple typo causes silent follow-up miss (no compile error) | After build, run all 3 arcs end-to-end manually; verify T4 is reached on all 3 |
| Mismatched user-message-id between thread file (`m-agent-b-u1`) and `thread-page.tsx` map breaks auto-play guard | Cross-check phase-2/3 thread `messages[0].id` against the strings registered here |
| Vietnamese title rendering issues in sidebar breadcrumbs | Pre-verify against existing `entity-names.ts` patterns; existing arc-A title uses identical structure |
| Build slow (full monorepo) | `pnpm typecheck` runs faster; use for iterative; reserve `pnpm build` for final verification |

## Next steps

After phase 4 passes:
1. Commit on `agent_demo` branch with conventional message
2. Update `docs/codebase-summary.md` if it lists welcome modules or agent-first threads (line ~108-112 area per the README excerpt)
3. Update `docs/project-roadmap.md` Phase 1 entry to note 3-card inbox addition
4. Demo dry-run with stakeholder rep before May-12 alignment meeting
