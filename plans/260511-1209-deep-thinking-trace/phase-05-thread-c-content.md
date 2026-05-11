---
phase: 5
title: "Thread C content (Whale)"
status: completed
priority: P2
effort: "2.5h"
dependencies: [1]
parallel_eligible: true
parallel_with: [3, 4]
file_ownership: ["apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts"]
---

# Phase 5: Thread C content — Top-1% whale recall deep trace

## Overview

Same pattern as phases 3 and 4, applied to `thread-demo-agent-whale-recall-2026.ts`. Subagent roster customized for whale recall subject: LTV Model Health · Spend Distribution · Season Reset Impact · Concierge Outreach · Research Agent.

**Strict file ownership:** This phase owns ONLY `thread-demo-agent-whale-recall-2026.ts`. Parallel-eligible with phases 3 and 4.

## Context links

- Brainstorm: `plans/reports/brainstorm-260511-1209-deep-thinking-trace.md`
- Sibling phases: phase-03 (ARPDAU) and phase-04 (D7 FB) for structural template
- Target file: `apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts`
- Section payload types (from phase 1): `WorkingStatusPayload`, `TaskProgressPayload`, `SubagentPanelPayload`

## Requirements

**Functional**
- T1 (`m-agent-c1`) gains 3 new sections at the top (working_status, task_progress, subagent_panel)
- Existing tool_call chips REMAIN — OFF-state content
- Subagent roster: 5 agents (see 5.2 below)
- Shared 7-step task-progress checklist, percent=57
- No edits to T2/T3/T4

**Non-functional**
- File grows ~480 → ~680 lines
- Roster defined as top-of-file consts
- English-only copy
- Past-tense summaries

## Architecture

### 5.1 Section order

Same as phases 3-4 — prepend 3 new sections to T1's `sections: []` array.

### 5.2 Subagent roster for Thread C

```ts
const SUBAGENTS_WHALE: SubagentPanelPayload['agents'] = [
  {
    name: 'LTV Model Health Agent',
    summary: 'Audited Pareto-NBD LTV model fit on top-1% spenders. Model fit healthy (RMSE 0.18, no drift in residuals) — the recall drop is a real behavior change, not a model artifact.',
    tasks: [
      'Pull 90-day spend histories for top-1% cohort (1,240 users)',
      'Refit Pareto-NBD model on April vs March data',
      'Compare predicted vs actual recall rates',
      'Compute residuals; check for systematic bias',
      'Conclude: model healthy, drop is behavioral',
    ],
  },
  {
    name: 'Spend Distribution Agent',
    summary: 'Surfaced bimodal dormancy across spend tiers. Mid-whale tiers ($100-300/30d) dormancy stable at ~30%; $500+ tier spiked to 61% post-April 21. The "named whales" account for the spike.',
    tasks: [
      'Bucket top-1% cohort into 4 spend tiers',
      'Compute 14-day dormancy per tier',
      'Identify bimodal distribution ($500+ spike)',
      'Cross-reference with named-whale registry',
      'Conclude: 4 of 12 named whales drive the $500+ spike',
    ],
  },
  {
    name: 'Season Reset Impact Agent',
    summary: 'Correlated dormancy onset with April 21 ranked-season reset. Whales who dropped 2+ tiers post-reset have 4.3× higher dormancy than tier-stable peers. Season reset is the strongest precipitating event.',
    tasks: [
      'Pull ranked-tier histories around the April 21 reset',
      'Compute per-user tier-change deltas',
      'Segment by tier-drop magnitude (0 / 1 / 2+)',
      'Compute dormancy rate per segment',
      'Conclude: 2+ tier drop is the dormancy precipitator',
    ],
  },
  {
    name: 'Concierge Outreach Agent',
    summary: 'Modeled concierge-outreach capacity for the CFM team. 50 weekly outreach slots available. Recommends prioritizing the 4 named whales + 50 highest-LTV lookalikes in week 1, remaining 39 in week 2.',
    tasks: [
      'Survey CFM concierge team capacity (50 slots/week)',
      'Rank 89-UID cohort by historical LTV',
      'Allocate week-1 slots to top-50 LTV',
      'Schedule week-2 slots for remaining 39',
      'Define appreciation-drop inventory (skin / currency / ranked-protect)',
    ],
  },
  {
    name: 'Research Agent',
    summary: 'Cross-referenced industry case studies on top-spender recovery via concierge outreach. Found 3 comparable cases (Supercell whales, mobile MMO post-season churns) with 55-70% recovery rates. Our 76% recovery outcome lands at the high end.',
    tasks: [
      'Search internal archive for whale-recovery cases',
      'Pull comparable industry studies (Supercell, MMO post-season)',
      'Extract historical recovery rate range (55-70%)',
      'Validate forecast against industry baseline',
      'Note: outcome exceeded benchmark (76% vs 55-70%)',
    ],
  },
];
```

### 5.3 Working-status + task-progress for Thread C

```ts
const WORKING_STATUS_WHALE: WorkingStatusPayload = {
  intent: 'I will analyze top-1% spender recall decline, isolate the precipitating event behind the post-April-21 dormancy spike, and identify a recoverable cohort for concierge intervention.',
  state: 'working',
};

const TASK_PROGRESS_WHALE: TaskProgressPayload = {
  percent: 57,
  steps: [
    { label: 'Read schema and understand available data structure',                state: 'done' },
    { label: 'Gather initial data from specialized agents in parallel',            state: 'done' },
    { label: 'Build and validate hypotheses from initial findings',                state: 'done' },
    { label: 'Conduct statistical significance tests on top insights',             state: 'done' },
    { label: 'Synthesize findings and create comprehensive report with visualizations', state: 'in_progress' },
    { label: 'Get critique and refine report',                                     state: 'pending' },
    { label: 'Send final report to client',                                        state: 'pending' },
  ],
};
```

### 5.4 T1 sections array prepend

Same shape as phases 3 and 4.

## Related code files

**Modify (1)**
- `apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts`

**Do NOT modify**
- Other thread files (phases 3 and 4 own them)
- Shared files (phases 1, 2, 6 own them)

## Implementation steps

1. Add type imports
2. Add top-of-file consts (`SUBAGENTS_WHALE`, `WORKING_STATUS_WHALE`, `TASK_PROGRESS_WHALE`)
3. Prepend 3 sections to T1's `sections: []` array
4. `pnpm --filter @hermes/web typecheck` passes

## Todo list

- [x] Imports added
- [x] `SUBAGENTS_WHALE` const defined
- [x] `WORKING_STATUS_WHALE` const defined
- [x] `TASK_PROGRESS_WHALE` const defined
- [x] T1 `sections` array gains 3 new entries at the top
- [x] Existing T1 sections preserved
- [x] `pnpm typecheck` passes

## Success criteria

- [x] File compiles standalone
- [x] T1's `sections[0..2]` are the new types
- [x] Existing tool_call + narrative + chart sections preserved
- [x] T2/T3/T4 untouched
- [x] Conversation + named-turn exports unchanged

## Risk assessment

| Risk | Mitigation |
|---|---|
| Numerical anchors in subagent summaries (1,240 / 4 named whales / 76% recovery) must match T1+T4 narrative | Cross-check existing T1/T4 narrative; use the exact same numbers in summary copy. |
| "Pareto-NBD" terminology may not be in the existing thread narrative | Acceptable — deep trace can surface internal modeling primitives the narrative abstracts. Reads as agent depth. |
