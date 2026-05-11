---
phase: 1
title: "Section types & components"
status: completed
priority: P2
effort: "3h"
dependencies: []
---

# Phase 1: Section types & React components (foundation)

## Overview

Add 3 new payload interfaces to `response-types.ts` + extend the `ResponseSection.type` union. Build 4 new React components (`working-status-block`, `task-progress-panel`, `subagent-panel`, `subagent-list`) under a new `apps/web/src/components/chat/sections/` directory. NO dispatch wiring yet — phase 6 owns the conditional renderer changes. NO content scripting — phases 3/4/5 own per-thread content. Helper module `agent-first-thread-ids.ts` lives in `utils/` and exposes a `Set` of the 3 thread IDs + a typed predicate.

## Context links

- Brainstorm: `plans/reports/brainstorm-260511-1209-deep-thinking-trace.md`
- Existing response types: `apps/web/src/data/chat/response-types.ts`
- Existing tool_call chip (closest reference): `apps/web/src/components/chat/tool-call-chip.tsx`
- Theme tokens: `apps/web/src/theme.tsx`
- Reference screenshots: in the original /fix request (Working.. block + Task progress vertical rail + 9 subagent panels)

## Requirements

**Functional**
- 3 new payload interfaces added to `response-types.ts` (exact shapes below)
- `ResponseSection.type` union extended with `'working_status' | 'task_progress' | 'subagent_panel'`
- 4 new React components rendering the screenshot shapes
- `working-status-block.tsx` supports `state: 'working' | 'done'` with subtle pulse on `'working'` dot
- `task-progress-panel.tsx` renders vertical connected rail (per screenshot) with 3 step states (done = check, in_progress = pulsing dot, pending = empty circle)
- `subagent-panel.tsx` renders single agent: icon + name + task count badge + summary + expand chevron + collapsible 5-task list
- `subagent-list.tsx` simply iterates `agents[]` and renders `subagent-panel` per entry
- Helper `agent-first-thread-ids.ts` exports `AGENT_FIRST_THREAD_IDS: ReadonlySet<string>` + `isAgentFirstThread(id: string | null | undefined): boolean`

**Non-functional**
- Components < 130 lines each
- Inline styles via `T.*` theme tokens (no new CSS files; matches existing component convention)
- No runtime imports of thread fixtures (components are pure presenters)
- TypeScript strict — payloads correctly typed
- Components are exported as named exports

## Architecture

### 1.1 Type definitions (response-types.ts)

Append after `ProvenancePayload` (around current line 163):

```ts
/**
 * Working-status block — header for a deep-research trace.
 *
 * Renders "Working.." (or "Done") with the agent's intent statement beneath.
 * "Hide details" affordance lives on the surrounding container (parent
 * concern). Drives the visual that signals "this is a deep research turn,
 * not a one-shot answer."
 */
export interface WorkingStatusPayload {
  /** 1-2 sentence intent statement, e.g. "I will analyze CFM ARPDAU drift…" */
  intent: string;
  /** 'working' shows a pulsing dot; 'done' shows a filled circle. Default 'working'. */
  state?: 'working' | 'done';
}

/**
 * Task-progress panel — vertical checklist of canonical pipeline steps with
 * per-step state + percent header. Steps are rendered in given order; the
 * connecting rail visually links them. Used as the second section of a deep
 * trace, after working_status, before subagent_panel.
 */
export interface TaskProgressPayload {
  /** 0–100 progress percent. Drives the badge in the panel header. */
  percent: number;
  steps: Array<{
    label: string;
    state: 'done' | 'in_progress' | 'pending';
  }>;
}

/**
 * Subagent-panel section — list of named specialized agents, each with a
 * 1-line summary and an expandable task list. Visually echoes the screenshot
 * pattern from the reference deep-research UI.
 */
export interface SubagentPanelPayload {
  agents: Array<{
    /** Display name. e.g. "Acquisition Analysis Agent". */
    name: string;
    /** 1-line summary of what the agent analyzed (past tense). */
    summary: string;
    /** 5 short task strings (typical), rendered when the panel expands. */
    tasks: string[];
  }>;
}
```

Update the `ResponseSection.type` union (search for `'tool_call' | 'provenance'` and extend):

```ts
type: 'narrative' | 'h2' | 'widget' | 'insights' | 'follow_ups'
    | 'action_card_segment' | 'action_card_campaign' | 'feature_chip'
    | 'pin_to_board' | 'soft_hint' | 'tool_call' | 'provenance'
    | 'working_status' | 'task_progress' | 'subagent_panel';
```

(Find the actual union shape in the file and extend per the existing pattern. The brainstorm's snippet is illustrative — the real union may differ slightly.)

### 1.2 Helper — agent-first-thread-ids.ts

```ts
// apps/web/src/utils/agent-first-thread-ids.ts

/** Stable ids of every agent-first chat thread (Hermes-detected anomalies).
 *  Surfaces the Deep Research toggle in chat input + gates deep-trace render. */
export const AGENT_FIRST_THREAD_IDS: ReadonlySet<string> = new Set([
  'thread-demo-agent-livops-2026',
  'thread-demo-agent-d7-fb-cohort-2026',
  'thread-demo-agent-whale-recall-2026',
]);

export function isAgentFirstThread(id: string | null | undefined): boolean {
  if (!id) return false;
  return AGENT_FIRST_THREAD_IDS.has(id);
}
```

### 1.3 Working-status-block component

```ts
// apps/web/src/components/chat/sections/working-status-block.tsx

import React from 'react';
import { T } from '../../../theme';
import type { WorkingStatusPayload } from '../../../data/chat/response-types';

interface Props {
  payload: WorkingStatusPayload;
  /** Optional collapsed-state controller — owned by parent. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function WorkingStatusBlock({ payload, collapsed, onToggleCollapsed }: Props) {
  const state = payload.state ?? 'working';
  return (
    <div data-hermes-section="working-status" style={{
      borderTop: `1px solid ${T.n100}`,
      padding: '14px 0 4px',
      marginBottom: 4,
      maxWidth: 820,
    }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dot state={state} />
          <h3 style={{
            fontFamily: T.fSans, fontSize: 15, fontWeight: 600,
            color: T.n900, margin: 0,
          }}>{state === 'done' ? 'Done' : 'Working..'}</h3>
        </div>
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            style={{
              background: 'transparent', border: 'none', color: T.n500,
              fontFamily: T.fSans, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              padding: 0,
            }}
          >{collapsed ? 'Show details ▾' : 'Hide details ▴'}</button>
        )}
      </header>
      <p style={{
        margin: '8px 0 0', fontFamily: T.fSans, fontSize: 13.5,
        color: T.n700, lineHeight: 1.55, maxWidth: 720,
      }}>{payload.intent}</p>
    </div>
  );
}

function Dot({ state }: { state: 'working' | 'done' }) {
  // 'working' pulses; 'done' is filled grey-900.
  return (
    <span aria-hidden style={{
      width: 8, height: 8, borderRadius: '50%',
      background: T.n900,
      opacity: state === 'working' ? 0.85 : 1,
      animation: state === 'working' ? 'hermesPulse 1.4s ease-in-out infinite' : 'none',
    }} />
  );
}
```

(If `hermesPulse` keyframes don't exist yet, add a `@keyframes` block to `apps/web/src/theme.tsx` or use a one-line inline `<style>` injection.)

### 1.4 Task-progress-panel component

```ts
// apps/web/src/components/chat/sections/task-progress-panel.tsx
// ~100 lines

import React from 'react';
import { Check, RefreshCw, Circle } from 'lucide-react';
import { T, Icon } from '../../../theme';
import type { TaskProgressPayload } from '../../../data/chat/response-types';

interface Props {
  payload: TaskProgressPayload;
}

export function TaskProgressPanel({ payload }: Props) {
  const [expanded, setExpanded] = React.useState(true);
  return (
    <div data-hermes-section="task-progress" style={{
      border: `1px solid ${T.n200}`, borderRadius: 8, background: T.surface,
      padding: '12px 14px 8px', margin: '8px 0', maxWidth: 820,
    }}>
      <header
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon icon={RefreshCw} size={13} color={T.n500} />
          <span style={{ fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.n800 }}>
            Task progress
          </span>
        </div>
        <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500 }}>
          {payload.percent}% {expanded ? '▾' : '▸'}
        </span>
      </header>
      {expanded && (
        <ol style={{ listStyle: 'none', padding: 0, margin: '12px 0 4px' }}>
          {payload.steps.map((s, i) => (
            <Row key={i} step={s} isLast={i === payload.steps.length - 1} />
          ))}
        </ol>
      )}
    </div>
  );
}

function Row({ step, isLast }: { step: TaskProgressPayload['steps'][number]; isLast: boolean }) {
  const color = step.state === 'done' ? T.n900 : step.state === 'in_progress' ? T.brand : T.n400;
  return (
    <li style={{
      position: 'relative', paddingLeft: 26, paddingBottom: isLast ? 0 : 10,
      fontFamily: T.fSans, fontSize: 13, color: step.state === 'pending' ? T.n500 : T.n800,
      lineHeight: 1.5,
    }}>
      {/* Connector rail */}
      {!isLast && (
        <span aria-hidden style={{
          position: 'absolute', left: 7, top: 16, bottom: 0, width: 1,
          background: T.n200,
        }} />
      )}
      {/* Marker */}
      <span aria-hidden style={{
        position: 'absolute', left: 0, top: 1, width: 16, height: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: T.surface, color,
      }}>
        {step.state === 'done'        && <Icon icon={Check}   size={13} color={color} />}
        {step.state === 'in_progress' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, animation: 'hermesPulse 1.4s ease-in-out infinite' }} />}
        {step.state === 'pending'     && <Icon icon={Circle}  size={13} color={color} />}
      </span>
      {step.label}
    </li>
  );
}
```

### 1.5 Subagent-panel + subagent-list components

```ts
// apps/web/src/components/chat/sections/subagent-panel.tsx

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { T, Icon } from '../../../theme';
import type { SubagentPanelPayload } from '../../../data/chat/response-types';

type Agent = SubagentPanelPayload['agents'][number];

interface Props {
  agent: Agent;
}

export function SubagentPanel({ agent }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div style={{
      borderTop: `1px solid ${T.n100}`,
      padding: '14px 0',
      maxWidth: 820,
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          all: 'unset', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
        aria-expanded={expanded}
      >
        <AgentAvatar />
        <span style={{ flex: 1, fontFamily: T.fSans, fontSize: 14, fontWeight: 600, color: T.n900 }}>
          {agent.name}
        </span>
        <span style={{
          fontFamily: T.fSans, fontSize: 12, color: T.n500, marginRight: 6,
        }}>{agent.tasks.length} tasks</span>
        <Icon icon={ChevronRight} size={14} color={T.n400} style={{
          transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .12s',
        }} />
      </button>
      <p style={{
        margin: '8px 0 0 36px', fontFamily: T.fSans, fontSize: 12.5,
        color: T.n600, lineHeight: 1.55,
      }}>{agent.summary}</p>
      {expanded && (
        <ul style={{ margin: '10px 0 0 36px', padding: 0, listStyle: 'none' }}>
          {agent.tasks.map((t, i) => (
            <li key={i} style={{
              fontFamily: T.fSans, fontSize: 12.5, color: T.n700,
              padding: '4px 0', lineHeight: 1.5,
            }}>· {t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AgentAvatar() {
  // Small grey square — placeholder for per-agent icon if we add one later.
  return (
    <span aria-hidden style={{
      width: 22, height: 22, borderRadius: 5, background: T.n100,
      display: 'inline-block', flexShrink: 0,
    }} />
  );
}
```

```ts
// apps/web/src/components/chat/sections/subagent-list.tsx
// ~30 lines

import React from 'react';
import { SubagentPanel } from './subagent-panel';
import type { SubagentPanelPayload } from '../../../data/chat/response-types';

interface Props {
  payload: SubagentPanelPayload;
}

export function SubagentList({ payload }: Props) {
  return (
    <div data-hermes-section="subagent-list" style={{ marginTop: 4 }}>
      {payload.agents.map((a, i) => (
        <SubagentPanel key={a.name + i} agent={a} />
      ))}
    </div>
  );
}
```

### 1.6 Pulse keyframes

If `hermesPulse` isn't defined globally, add it once. Cheapest path: a one-line injected style at the top of `working-status-block.tsx`:

```ts
const PULSE_KEYFRAMES = `@keyframes hermesPulse { 0%,100%{opacity:.4} 50%{opacity:1} }`;
// Inside component: <style>{PULSE_KEYFRAMES}</style>
```

Or define it once in `theme.tsx` if a global stylesheet exists. Check first; default to inline injection.

## Related code files

**Create (5)**
- `apps/web/src/components/chat/sections/working-status-block.tsx`
- `apps/web/src/components/chat/sections/task-progress-panel.tsx`
- `apps/web/src/components/chat/sections/subagent-panel.tsx`
- `apps/web/src/components/chat/sections/subagent-list.tsx`
- `apps/web/src/utils/agent-first-thread-ids.ts`

**Modify (1)**
- `apps/web/src/data/chat/response-types.ts` (3 new payload interfaces + extend `ResponseSection.type` union)

**Do NOT modify in this phase**
- `assistant-response.tsx` — phase 6 owns the dispatch + gating
- `chat-input-box.tsx` / `chat-rail.tsx` / `thread-page.tsx` — phase 2 owns toggle visibility
- Any thread fixture file — phases 3/4/5 own content

## Implementation steps

1. **Type changes** — open `response-types.ts`. Append 3 new payload interfaces after `ProvenancePayload`. Extend `ResponseSection.type` union. `pnpm --filter @hermes/web typecheck` should still pass (no consumers yet).
2. **Helper module** — create `apps/web/src/utils/agent-first-thread-ids.ts` with the Set + predicate.
3. **Working-status-block** — create component, inject `hermesPulse` keyframes if needed.
4. **Task-progress-panel** — create component with vertical rail + 3 step-state styles.
5. **Subagent-panel + subagent-list** — create both files.
6. **Index re-exports (optional)** — if the existing `apps/web/src/components/chat/` directory has an `index.ts` barrel, add the 4 new components. If not, skip.
7. **Standalone smoke** — in `assistant-response.tsx`, do NOT wire dispatch yet (phase 6). To verify the components render, you can temporarily render `<WorkingStatusBlock payload={{intent:'…',state:'working'}} />` in a dev playground; remove before commit.
8. **Typecheck** — `pnpm --filter @hermes/web typecheck` must pass.

## Todo list

- [x] 3 new payload interfaces appended to response-types.ts
- [x] `ResponseSection.type` union extended with 3 new strings
- [x] `agent-first-thread-ids.ts` helper created
- [x] `working-status-block.tsx` created (state working/done, pulse animation)
- [x] `task-progress-panel.tsx` created (vertical rail + 3 step states + percent header)
- [x] `subagent-panel.tsx` created (expandable single agent)
- [x] `subagent-list.tsx` created (iterates agents)
- [x] `hermesPulse` keyframes available (one location, not duplicated)
- [x] `pnpm typecheck` passes (no consumers, just shape validation)

## Success criteria

- [x] All 4 new components compile and render in isolation (verified via temp dev playground or React DevTools)
- [x] Type safety: any consumer providing a malformed payload fails typecheck
- [x] Components don't import thread fixtures (purity)
- [x] No regression in existing chat rendering (other section types unaffected)
- [x] `pnpm typecheck && pnpm build` passes

## Risk assessment

| Risk | Mitigation |
|---|---|
| `ResponseSection.type` union shape may not be a simple string literal union (could be a discriminated union with payload typing) | Read the actual union first; extend the existing pattern. If discriminated by payload type, add 3 new variants matching the existing shape. |
| `hermesPulse` keyframes may already exist | Check `theme.tsx` and any global CSS first; if yes, reuse; if no, inject once in one component and reference from others. |
| Inline-style approach may not match existing component aesthetics for some tokens | Verify `T.brand`, `T.n100`, `T.n200`, `T.n500`, `T.n800`, `T.n900`, `T.surface` exist in `theme.tsx` (most likely yes). |
| Components are too verbose (>150 lines) | Keep mostly inline-styled; split sub-components only when reused (avoided already). |
