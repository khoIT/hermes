---
phase: 6
title: "Renderer gate & verify"
status: completed
priority: P2
effort: "2h"
dependencies: [1, 2, 3, 4, 5]
---

# Phase 6: Renderer gate (assistant-response.tsx) + verify

## Overview

Wire the conditional render gate in `assistant-response.tsx`. When the active message belongs to an agent-first thread AND the Deep Research toggle is ON, render `working_status` / `task_progress` / `subagent_panel` sections and SKIP `tool_call` sections. When toggle is OFF, render `tool_call` as today and SKIP the 3 new section types. Final verification: typecheck + build + manual smoke (toggle flip, all 3 threads, EN/VI parity).

## Context links

- Brainstorm: `plans/reports/brainstorm-260511-1209-deep-thinking-trace.md`
- Target dispatcher: `apps/web/src/components/chat/assistant-response.tsx:92-131`
- Toggle hook: `apps/web/src/components/chat/deep-research-toggle.tsx` (exports `useDeepResearch`)
- Thread-id helper: `apps/web/src/utils/agent-first-thread-ids.ts` (from Phase 1)
- New components (from Phase 1): `working-status-block`, `task-progress-panel`, `subagent-list`

## Requirements

**Functional**
- `assistant-response.tsx` reads `useDeepResearch()` and resolves the thread id of the current message (passed in via props or context — see 6.2)
- Section dispatch logic:
  - `tool_call` → render only if (toggle OFF OR not an agent-first thread)
  - `working_status` / `task_progress` / `subagent_panel` → render only if (toggle ON AND agent-first thread)
  - All other section types → unchanged behavior
- Live toggle flip — flipping the toggle re-renders the trace immediately, no page reload required
- Smoke: all 3 agent-first threads render the new trace when toggle is ON; all 3 render existing tool_call chips when toggle is OFF

**Non-functional**
- Hook calls inside `assistant-response.tsx` follow React rules (no conditional hook calls)
- Dispatch logic stays in a single `switch` (no helper-function fan-out unless it improves readability)
- Final build clean

## Architecture

### 6.1 Thread-id resolution

`assistant-response.tsx` renders per-message. To know if the message belongs to an agent-first thread, we need the thread id. Two options:

**Option A (preferred):** Add an optional `threadId?: string` prop to `AssistantResponseProps`. Pass it down from the existing callers in `chat-rail.tsx` and `thread-page.tsx` where they already have it.

**Option B:** Use `ActiveThreadContext` (already wraps the thread page per `thread-page.tsx:23`). Read with a `useActiveThread()` hook.

Pick A — explicit prop. Simpler than reaching into context, easier to test, and clearer dependency.

### 6.2 Render gate

Inside the `case 'tool_call':` and the 3 new cases, wrap with the gate:

```ts
import { useDeepResearch } from './deep-research-toggle';
import { isAgentFirstThread } from '../../utils/agent-first-thread-ids';
import { WorkingStatusBlock } from './sections/working-status-block';
import { TaskProgressPanel } from './sections/task-progress-panel';
import { SubagentList } from './sections/subagent-list';
import type {
  WorkingStatusPayload, TaskProgressPayload, SubagentPanelPayload,
} from '../../data/chat/response-types';

// Inside component:
const [deepResearchOn] = useDeepResearch();
const isAgentFirst = isAgentFirstThread(threadId);  // threadId from props
const showDeepTrace = deepResearchOn && isAgentFirst;

// In the switch:
case 'tool_call':
  if (showDeepTrace) return null;  // skip in deep mode
  return <ToolCallChip key={i} {...(s.payload as ToolCallPayload)} />;

case 'working_status':
  if (!showDeepTrace) return null;
  return <WorkingStatusBlock key={i} payload={s.payload as WorkingStatusPayload} />;

case 'task_progress':
  if (!showDeepTrace) return null;
  return <TaskProgressPanel key={i} payload={s.payload as TaskProgressPayload} />;

case 'subagent_panel':
  if (!showDeepTrace) return null;
  return <SubagentList key={i} payload={s.payload as SubagentPanelPayload} />;
```

### 6.3 Caller updates

`chat-rail.tsx` and `thread-page.tsx` both render `<AssistantResponse>` inside the message map. Add `threadId={activeThreadId}` (chat-rail) or `threadId={id}` (thread-page) to the prop list.

Both files already have these IDs in scope — single-prop addition each.

### 6.4 Re-render on toggle flip

`useDeepResearch()` returns React state — flipping the toggle causes a re-render of every consumer naturally. No additional plumbing needed.

## Related code files

**Modify (3)**
- `apps/web/src/components/chat/assistant-response.tsx` — imports + `useDeepResearch` hook call + thread-id resolution + 4 case branches (1 modified, 3 new)
- `apps/web/src/components/chat-rail/chat-rail.tsx` — add `threadId={activeThreadId}` to the AssistantResponse call site
- `apps/web/src/modules/chat/thread-page.tsx` — add `threadId={id}` to the AssistantResponse call site

**Create:** none

## Implementation steps

1. **Add `threadId?: string`** to `AssistantResponseProps` interface in `assistant-response.tsx`
2. **Add imports** for `useDeepResearch`, `isAgentFirstThread`, 3 new components, 3 new payload types
3. **Inside the function component**, derive `deepResearchOn`, `isAgentFirst`, `showDeepTrace`
4. **Modify `case 'tool_call':`** to return `null` when `showDeepTrace`
5. **Add 3 new cases** for `working_status`, `task_progress`, `subagent_panel` — each returns `null` when `!showDeepTrace`
6. **Update `chat-rail.tsx`** call site — add `threadId={activeThreadId}` prop
7. **Update `thread-page.tsx`** call site — add `threadId={id}` prop
8. **Typecheck:** `pnpm --filter @hermes/web typecheck` must pass
9. **Build:** `pnpm --filter @hermes/web build` must pass
10. **Manual smoke** (all 3 threads):
    - `pnpm dev`
    - Open `/welcome` → click each inbox card
    - Confirm Deep Research toggle visible in chat input
    - Toggle ON → working_status + task_progress + 5 subagent panels render; tool_call chips hidden
    - Toggle OFF → tool_call chips render; new sections hidden
    - Expand a subagent panel → 5 tasks revealed
    - Switch to canonical analyst thread (e.g. `thread-001`) → toggle NOT visible

## Todo list

- [x] `AssistantResponseProps.threadId` added (optional)
- [x] `useDeepResearch` + `isAgentFirstThread` imported
- [x] 3 new component imports added
- [x] 3 new payload type imports added
- [x] `showDeepTrace` computed from hook + thread id
- [x] `case 'tool_call':` returns null when `showDeepTrace`
- [x] `case 'working_status':` added with gate
- [x] `case 'task_progress':` added with gate
- [x] `case 'subagent_panel':` added with gate
- [x] `chat-rail.tsx` passes `threadId` prop
- [x] `thread-page.tsx` passes `threadId` prop
- [x] `pnpm typecheck` passes
- [x] `pnpm build` passes
- [x] Manual smoke: all 3 threads toggle ON/OFF correctly
- [x] Manual smoke: subagent expand works
- [x] Manual smoke: non-agent-first threads unaffected

## Success criteria

- [x] All top-level plan success criteria met
- [x] Live toggle flip re-renders the trace instantly
- [x] No regression on canonical analyst arcs (`thread-001..008`, `thread-demo-livops-2026`)
- [x] No regression on arc A's existing tool_call display when toggle OFF
- [x] Subagent expand chevron works, 5 tasks revealed

## Risk assessment

| Risk | Mitigation |
|---|---|
| `useDeepResearch()` is called inside the component on every render — could cause toggle race if user flips during typing-dots animation | Acceptable. The hook reads from React state which is synchronous. Worst case: flip mid-typing causes the typing-dots to swap content type — visually fine. |
| `threadId` prop is optional — falls back to `undefined` if a caller doesn't pass it | `isAgentFirstThread(undefined)` returns `false`, so undefined gracefully degrades to OFF-state rendering. No new code path needed. |
| Existing callers we may have missed (other places that render `AssistantResponse`) | Run `grep -rn '<AssistantResponse' apps/web/src` to find all call sites; update each. |
| Section ordering issue — `working_status` first in T1 array, but if it's not rendered (toggle OFF), the next rendered section may have a weird spacing | Acceptable — sections render with `null` placeholders in between, which collapse with React's natural rendering. Visual smoke will catch this. |
| Build artifact `_catalog.json` re-regenerates during `pnpm build` | Same as prior phases — exclude from commit. |

## Next steps after phase 6 passes

1. Run code-review on the full plan via `code-reviewer` agent
2. Update plan-level success criteria boxes
3. Run docs-sync via `docs-manager` (add deep-research toggle + new section types to codebase-summary.md, design-guidelines.md if applicable)
4. Commit on `agent_demo` (excluding `_catalog.json`)
5. Update demo dry-run script — note toggle ON default; demonstrate flipping toggle as part of the walkthrough
6. Run `/ck:journal` for session log
