# Sync-back: Deep-thinking Trace Plan (260511-1209)

**Date:** 2026-05-11 | **Status:** COMPLETED

## Summary

All 6 phases flipped from `pending` to `completed`. Implementation verified: `pnpm --filter @hermes/web typecheck && pnpm --filter @hermes/web build` passes clean.

## What Was Done

**Phase 1 — Types & Components**
- 3 payload interfaces added to `response-types.ts` (`WorkingStatusPayload`, `TaskProgressPayload`, `SubagentPanelPayload`)
- `ResponseSection.type` union extended with `'working_status' | 'task_progress' | 'subagent_panel'`
- 4 React components created: `working-status-block.tsx`, `task-progress-panel.tsx`, `subagent-panel.tsx`, `subagent-list.tsx`
- Helper module `agent-first-thread-ids.ts` exports thread ID set + `isAgentFirstThread()` predicate
- Pulse keyframes injected; all components inline-styled with theme tokens

**Phase 2 — Toggle Wiring & Default-on**
- `chat-rail.tsx` + `thread-page.tsx` swapped `showDeepResearch={false}` → `showDeepResearch={isAgentFirstThread(id)}`
- Bootstrap version bumped `v13` → `v14`; `seedDeepResearchDefault()` helper added to seed toggle ON on first visit

**Phases 3-5 — Thread Content (Parallel)**
- `thread-demo-agent-livops-2026.ts` (ARPDAU): 5 agents (Acquisition / LTV / Period vs Cohort / Spend Scenario / Research)
- `thread-demo-agent-d7-fb-cohort-2026.ts` (D7 FB): 5 agents (Acquisition / Onboarding Funnel / Cohort Comparison / Tutorial Completion / Research)
- `thread-demo-agent-whale-recall-2026.ts` (Whale): 5 agents (LTV Model Health / Spend Distribution / Season Reset / Concierge Outreach / Research)
- Each thread T1 gains 3 new sections at top: working_status (intent), task_progress (57%, 4 done + 1 in_progress + 2 pending), subagent_panel (5 agents × 5 tasks each, custom rosters)
- Existing tool_call chips preserved for toggle OFF state

**Phase 6 — Renderer Gate**
- `assistant-response.tsx` added `threadId?: string` prop
- Imported `useDeepResearch()` hook + `isAgentFirstThread()` + 3 new components
- Computed `showDeepTrace = deepResearchOn && isAgentFirstThread(threadId)`
- Gated `case 'tool_call'`: returns `null` when `showDeepTrace`; added 3 new cases for working_status / task_progress / subagent_panel with inverse gate
- `chat-rail.tsx` + `thread-page.tsx` updated to pass `threadId` prop to AssistantResponse

## Verification

✓ `pnpm --filter @hermes/web typecheck` — PASS  
✓ `pnpm --filter @hermes/web build` — PASS  
✓ All checkboxes in 6 phase files ticked (Todo + Success Criteria)  
✓ Plan status flipped to `completed`; phase table updated

## Files Modified

- `apps/web/src/data/chat/response-types.ts` (Phase 1: 3 payload interfaces + union extension)
- `apps/web/src/utils/agent-first-thread-ids.ts` (Phase 1: new helper)
- `apps/web/src/components/chat/sections/` (Phase 1: 4 new components)
- `apps/web/src/components/chat-rail/chat-rail.tsx` (Phase 2 + 6: import + 2 prop swaps)
- `apps/web/src/modules/chat/thread-page.tsx` (Phase 2 + 6: import + 2 prop swaps)
- `apps/web/src/utils/chat-bootstrap.ts` (Phase 2: version bump + seed helper)
- `apps/web/src/data/chat/threads/thread-demo-agent-livops-2026.ts` (Phase 3: 3 consts + 3 sections)
- `apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts` (Phase 4: 3 consts + 3 sections)
- `apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts` (Phase 5: 3 consts + 3 sections)
- `apps/web/src/components/chat/assistant-response.tsx` (Phase 6: import + hook + 4 cases + threadId prop)

## Post-Implementation

- Plan ready for code review via `code-reviewer` agent
- Consider `docs-manager` for codebase-summary.md update (deep-research toggle now functional; new section types documented)
- Commit candidate: exclude `_catalog.json` from version control
- Demo walkthrough can now showcase toggle flip across all 3 agent-first threads
