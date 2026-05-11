---
type: brainstorm
date: 2026-05-11 12:09 (Asia/Saigon)
branch: agent_demo
status: approved
related:
  - apps/web/src/data/chat/response-types.ts
  - apps/web/src/components/chat/deep-research-toggle.tsx
  - apps/web/src/components/chat/tool-call-chip.tsx
  - apps/web/src/components/chat/response-section.tsx
  - apps/web/src/modules/chat/thread-page.tsx
  - apps/web/src/components/chat-rail/chat-rail.tsx
  - apps/web/src/data/chat/threads/thread-demo-agent-livops-2026.ts
  - apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts
  - apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts
prior:
  - plans/reports/brainstorm-260511-1122-welcome-inbox-promote-plus-flows.md (parent feature)
  - docs/journals/260511-agent-first-seed-message-convention.md (seed convention)
---

# Brainstorm — Deep-thinking trace, gated by Deep Research toggle

## 1. Problem statement

Agent-first chat threads currently surface "agent did work" via 3 `tool_call` chips at the top of T1. The screenshots reference a much richer pattern:
- "Working.." block with intent statement
- Task-progress checklist with connected vertical rail
- Named specialized sub-agent panels (Acquisition Analysis Agent, LTV Projections Agent, etc.) with task counts + expandable task lists
- "Deep Research" toggle in chat input

Goal: bring agent-first threads to that visual fidelity for the May-12 demo, gated by the existing (but cosmetic) `DeepResearchToggle`.

**Scope:** 3 existing agent-first threads. Replace tool_call chips with the deep trace WHEN toggle ON; preserve tool_call chips when OFF.

## 2. Existing affordances (scouted)

- `DeepResearchToggle` + `useDeepResearch` hook → `apps/web/src/components/chat/deep-research-toggle.tsx`. Persists to `localStorage['hermes.chat.deepResearch']`. v1: cosmetic only.
- Toggle visible default in `ChatInputBox`, but hidden in chat-rail (`showDeepResearch={false}`) and thread-page (`showDeepResearch={false}`). One-line flip to surface.
- Existing `tool_call` + `provenance` payloads in `response-types.ts` cover the "thinking trace" minimum.
- All 3 agent-first thread T1s already structured: 3 tool_calls + narrative + 2 charts + provenance + insights. ~110 lines per T1.

## 3. Approaches considered

### Render slot (chose A1)
- **A1 · Conditional on toggle, in T1** — toggle drives which renders · chosen
- A2 · Replace tool_call chips entirely — non-revertable, loses compact mode
- A3 · Render before tool_call chips — double-stacks "thinking" trace, bloats T1

### Toggle behavior (chose B2)
- B1 · Cosmetic — toggle does nothing
- **B2 · Gate trace shape (ON=deep, OFF=compact)** — interactive, earns its place in the chat input · chosen
- B3 · Drive follow-up depth — too much content (every follow-up needs both shapes)
- B4 · Always-on for agent-first threads — un-clickable toggle is poor UX

### Subagent panel count (chose C1)
- **C1 · 5 panels, customized per thread** — semantic alignment + manageable scope · chosen (15 total)
- C2 · 9 panels shared — faithful but repetitive (27 total)
- C3 · 9 panels customized — overkill (27 distinct authoring tasks)
- C4 · Variable per thread — inconsistent across demo

### Panel depth (chose D1)
- **D1 · Name + task count + summary + expandable 5 tasks** — full screenshot fidelity · chosen
- D2 · Name + task count + summary (no expand) — simpler but loses the "5 tasks" reveal that justifies the count
- D3 · Name + summary only — minimalist, weakest deep-feel

## 4. Final design

### 4.1 Section types (new)

```ts
export interface WorkingStatusPayload {
  intent: string;          // 1-2 sentences ("I will analyze...")
  state: 'working' | 'done';
}

export interface TaskProgressPayload {
  percent: number;         // 0-100
  steps: Array<{
    label: string;
    state: 'done' | 'in_progress' | 'pending';
  }>;
}

export interface SubagentPanelPayload {
  agents: Array<{
    name: string;          // e.g. "Acquisition Analysis Agent"
    summary: string;       // 1-line analysis blurb
    tasks: string[];       // 5 short task strings (expandable)
  }>;
}
```

Plus 3 new entries (`'working_status' | 'task_progress' | 'subagent_panel'`) in the `ResponseSection.type` union.

### 4.2 React components

| Component | Path | Purpose | ~LoC |
|---|---|---|---|
| `working-status-block.tsx` | `components/chat/sections/` | "Working.." header + intent + "Hide details" collapse | 60 |
| `task-progress-panel.tsx` | `components/chat/sections/` | Vertical checklist with connected dot/check rail + percent badge | 100 |
| `subagent-panel.tsx` | `components/chat/sections/` | Single-agent card · icon + name + task count + summary + expand chevron | 90 |
| `subagent-list.tsx` | `components/chat/sections/` | Stack driven by `SubagentPanelPayload.agents[]` | 30 |
| `response-section.tsx` updated | existing | Dispatch new types · gate on `useDeepResearch()` for agent-first threads | +25 |

### 4.3 Toggle wiring

- Promote existing `DeepResearchToggle` from cosmetic to functional
- `chat-rail.tsx:359` and `thread-page.tsx:220`: `showDeepResearch={false}` → `showDeepResearch={isAgentFirstThread(threadId)}`
- Helper `isAgentFirstThread(id)` returns true for the 3 IDs (lives in `utils/chat-store.ts` or a new `agent-first-thread-ids.ts`)
- `response-section.tsx` reads `useDeepResearch()` and:
  - ON + section type ∈ {`working_status`, `task_progress`, `subagent_panel`}: render
  - ON + section type = `tool_call`: skip
  - OFF + section type ∈ {`working_status`, `task_progress`, `subagent_panel`}: skip
  - OFF + section type = `tool_call`: render (current behavior)
- **Default state for first-time visitors:** ON. Bootstrap version bump v13→v14 writes `'1'` to `localStorage['hermes.chat.deepResearch']` if key absent

### 4.4 Subagent rosters (5 per thread)

**Thread A (CFM ARPDAU drift):** Acquisition Analysis · LTV Projections · Period vs Cohort · Spend Scenario · Research Agent
**Thread B (D7 FB cohort drop):** Acquisition Analysis · Onboarding Funnel · Cohort Comparison · Tutorial Completion · Research Agent
**Thread C (Top-1% whale recall):** LTV Model Health · Spend Distribution · Season Reset Impact · Concierge Outreach · Research Agent

1 shared agent (Research Agent) + 4 subject-specific per thread.

### 4.5 Task-progress checklist (shared, 7 steps, 57% complete)

1. Read schema and understand available data structure → done
2. Gather initial data from specialized agents in parallel → done
3. Build and validate hypotheses from initial findings → done
4. Conduct statistical significance tests on top insights → done
5. Synthesize findings and create comprehensive report with visualizations → in_progress
6. Get critique and refine report → pending
7. Send final report to client → pending

Same 7 steps across all 3 threads (canonical pipeline).

### 4.6 Localization

All new structured sections **English-only** (consistent with chart/tool_call text policy in `dictionary.ts`). Subagent names are proper-noun-like terms of art; task strings are domain data. Toggle button label remains EN+VI.

### 4.7 Content authoring budget

- Per thread: 1 intent string + 5 subagent panels × (1 name + 1 summary + 5 tasks) + 7 reused checklist labels (defined once, shared)
- Per thread: 5 + 5 + 25 = 35 strings of new content
- 3 threads: ~105 distinct strings authored

## 5. Files affected

**Create (4 components + 1 helper)**
- `apps/web/src/components/chat/sections/working-status-block.tsx`
- `apps/web/src/components/chat/sections/task-progress-panel.tsx`
- `apps/web/src/components/chat/sections/subagent-panel.tsx`
- `apps/web/src/components/chat/sections/subagent-list.tsx`
- `apps/web/src/utils/agent-first-thread-ids.ts` (small helper module)

**Modify (8)**
- `apps/web/src/data/chat/response-types.ts` (add 3 payload interfaces + extend ResponseSection union)
- `apps/web/src/components/chat/response-section.tsx` (dispatch + gating)
- `apps/web/src/modules/chat/thread-page.tsx:220` (`showDeepResearch=true` for agent-first)
- `apps/web/src/components/chat-rail/chat-rail.tsx:359` (same)
- `apps/web/src/utils/chat-bootstrap.ts` (version bump, default-ON seed)
- `apps/web/src/data/chat/threads/thread-demo-agent-livops-2026.ts` (add new sections)
- `apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts` (add new sections)
- `apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts` (add new sections)

## 6. Risks + mitigations

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | Content authoring scale — ~105 distinct strings | HIGH | Parallel `fullstack-developer` subagents for phases 3-5 (one per thread, no shared edits) |
| R2 | Toggle UX confusion | MEDIUM | Default ON for agent-first threads; first-use tooltip on Deep Research toggle |
| R3 | T1 file size growth ~480→~750 lines | MEDIUM | Extract subagent rosters into top-of-file consts; accept the size; threads still <800 |
| R4 | "Working.." implies live, content is static | LOW | Static rendering w/ subtle pulse on the dot; flip to "Done" after first render if desired |
| R5 | Demo timing | LOW | Same mitigation as parent feature — walk one fully, browse others |
| R6 | Toggle drift after user manually flips OFF | LOW | localStorage persists per intent; pre-demo dry-run resets to ON |

## 7. Out of scope (explicit)

- No real backend
- No live progress animation (static snapshot)
- No subagent drill-in beyond task expand
- No per-thread toggle override (one global state)
- No collapse-state persistence (resets on remount)
- No mobile responsive deep panel

## 8. Success criteria

- Agent-first thread chat inputs show Deep Research toggle; non-agent-first threads do not
- Toggle ON → deep trace renders in T1; OFF → tool_call chips render
- Each thread renders 5 customized subagent panels with expandable 5-task lists
- Task-progress checklist renders with vertical rail visual matching screenshot
- Default state ON for first-visit agent-first threads
- `pnpm typecheck && pnpm build` passes

## 9. Implementation plan suggestion (for `/ck:plan`)

6 phases:
1. **Section types + components (foundation)** — response-types, 4 React components, agent-first-thread-ids helper
2. **Toggle wiring + bootstrap default-ON** — chat-rail, thread-page, chat-bootstrap version bump
3. **Thread A content** — author new sections in `thread-demo-agent-livops-2026.ts` ∥ with 4, 5
4. **Thread B content** — author new sections in `thread-demo-agent-d7-fb-cohort-2026.ts` ∥ with 3, 5
5. **Thread C content** — author new sections in `thread-demo-agent-whale-recall-2026.ts` ∥ with 3, 4
6. **Conditional renderer + verify + visual smoke** — gate logic in response-section.tsx, typecheck, build, smoke

Strict order: `1 → 2 → (3 ∥ 4 ∥ 5) → 6`. Phases 3-5 parallel-eligible (each owns one thread file; no shared edits).

## 10. Unresolved questions

1. **Tooltip copy** — should the first-use Deep Research tooltip be EN-only or EN+VI? (Probably EN since the button itself stays decorative for non-agent-first threads.) Defer to planner.
2. **Order of new sections in T1** — working_status first, then task_progress, then subagent_list? Confirm in phase 1 design step.
3. **"Hide details" affordance** — implemented in working_status_block or as a wrapper around all 3 deep sections? Probably wrapper (collapses the whole trace).
4. **Subagent panel summary tone** — past-tense ("Analyzed 6 months...") matching screenshot, or present-tense ("Analyzing...")? Past-tense to match screenshot.

---

**Status:** approved · ready for `/ck:plan`
