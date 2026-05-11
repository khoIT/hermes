---
phase: 4
title: "Thread B content (D7 FB)"
status: pending
priority: P2
effort: "2.5h"
dependencies: [1]
parallel_eligible: true
parallel_with: [3, 5]
file_ownership: ["apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts"]
---

# Phase 4: Thread B content — D7 FB cohort drop deep trace

## Overview

Same pattern as phase 3, applied to `thread-demo-agent-d7-fb-cohort-2026.ts`. Subagent roster customized for D7 FB cohort subject: Acquisition Analysis · Onboarding Funnel · Cohort Comparison · Tutorial Completion · Research Agent.

**Strict file ownership:** This phase owns ONLY `thread-demo-agent-d7-fb-cohort-2026.ts`. Parallel-eligible with phases 3 and 5.

## Context links

- Brainstorm: `plans/reports/brainstorm-260511-1209-deep-thinking-trace.md`
- Sibling phase: phase-03-thread-a-content.md (use as structural template)
- Target file: `apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts`
- Section payload types (from phase 1): `WorkingStatusPayload`, `TaskProgressPayload`, `SubagentPanelPayload`

## Requirements

**Functional**
- T1 (`m-agent-b1`) gains 3 new sections at the top (working_status, task_progress, subagent_panel)
- Existing tool_call chips REMAIN — they're the OFF-state content
- Subagent roster: 5 agents (see 4.2 below)
- Shared 7-step task-progress checklist (same as phase 3, percent=57)
- No edits to T2/T3/T4

**Non-functional**
- File grows ~520 → ~720 lines
- Roster defined as top-of-file consts
- English-only copy
- Past-tense summaries

## Architecture

### 4.1 Section order

```
T1 sections array:
  1.  working_status        ← NEW
  2.  task_progress         ← NEW
  3.  subagent_panel        ← NEW
  4-6. tool_call × 3         ← EXISTING (kept for OFF state)
  7+.  rest of T1            ← EXISTING (unchanged)
```

### 4.2 Subagent roster for Thread B

```ts
const SUBAGENTS_D7_FB: SubagentPanelPayload['agents'] = [
  {
    name: 'Acquisition Analysis Agent',
    summary: 'Compared D7 retention across acquisition channels for the May 2026 cohort. Facebook = 18.2% vs blended 22.4% — a 4.2pp gap. Google, Organic, and Referral cohorts at parity with baseline.',
    tasks: [
      'Pull May 2026 install attribution from cfm_vn',
      'Segment by acquisition channel (FB / Google / Organic / Referral)',
      'Compute D1/D3/D7 retention curves per channel',
      'Flag channels deviating > 2pp from blended baseline',
      'Conclude: FB cohort isolated for further analysis',
    ],
  },
  {
    name: 'Onboarding Funnel Agent',
    summary: 'Decomposed the FB cohort funnel D0→D1→D3→D7. Drop opens between D3 and D7. D0/D1/D3 retention matches baseline within 1pt; gap concentrates at D7.',
    tasks: [
      'Load D0-D7 retention snapshots for FB May cohort',
      'Compute per-day retention deltas vs blended baseline',
      'Identify the day-window where the gap opens',
      'Cross-check against tutorial-completion timestamps',
      'Conclude: D3→D7 transition is the leak point',
    ],
  },
  {
    name: 'Cohort Comparison Agent',
    summary: 'Compared April 2026 and May 2026 FB cohorts. April FB cohort behaved like baseline; May FB cohort regressed. Onset of the regression aligns with the May 2 onboarding A/B mishap that exposed legacy variant to all FB users.',
    tasks: [
      'Build paired FB cohorts: Apr 1-30 vs May 1-9',
      'Run two-sample test on D7 retention',
      'Cross-reference with deployment-history table',
      'Identify May 2 onboarding-variant rollback as inflection point',
      'Confirm regression is variant-driven, not seasonal',
    ],
  },
  {
    name: 'Tutorial Completion Agent',
    summary: 'Measured tutorial-completion% across onboarding variants. Legacy v1 completion = 58%; new v2 (the rolled-back one) = 81%. Users who saw legacy and partially completed (40-60%) drive the D7 gap.',
    tasks: [
      'Pull tutorial-completion percentages by variant',
      'Bucket users by completion % (0-25 / 25-60 / 60-90 / 90+)',
      'Compute D7 retention per bucket',
      'Identify the 25-60% bucket as the lift target',
      'Confirm legacy variant correlates with low completion',
    ],
  },
  {
    name: 'Research Agent',
    summary: 'Cross-referenced internal cohort archive for prior onboarding regressions. Found 2 comparable cases (Q3 2024, Q1 2025) where tutorial-rollback caused D7 drops of 3-5pp; both recovered with re-trigger campaigns.',
    tasks: [
      'Search anomaly archive for "tutorial rollback" + "D7 drop"',
      'Pull 2024-Q3 and 2025-Q1 case studies',
      'Compare regression magnitudes (3-5pp range)',
      'Extract historical rescue mechanic (tutorial re-trigger)',
      'Validate +6pp lift forecast against prior case outcomes',
    ],
  },
];
```

### 4.3 Working-status + task-progress for Thread B

```ts
const WORKING_STATUS_D7_FB: WorkingStatusPayload = {
  intent: 'I will analyze D7 retention drop on the FB-acquired May 2026 cohort, isolate the funnel stage where retention diverges from baseline, and identify the in-cohort sub-segment most responsive to rescue.',
  state: 'working',
};

const TASK_PROGRESS_D7_FB: TaskProgressPayload = {
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

### 4.4 T1 sections array prepend

Same shape as phase 3 — prepend 3 entries to T1's `sections: [` array.

## Related code files

**Modify (1)**
- `apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts`

**Do NOT modify**
- Any other thread file (phases 3 and 5 own them)
- Shared files (phases 1, 2, 6 own them)

## Implementation steps

1. Add type imports
2. Add top-of-file consts (`SUBAGENTS_D7_FB`, `WORKING_STATUS_D7_FB`, `TASK_PROGRESS_D7_FB`)
3. Prepend 3 sections to T1's `sections: []` array
4. `pnpm --filter @hermes/web typecheck` passes

## Todo list

- [ ] Imports added
- [ ] `SUBAGENTS_D7_FB` const defined
- [ ] `WORKING_STATUS_D7_FB` const defined
- [ ] `TASK_PROGRESS_D7_FB` const defined
- [ ] T1 `sections` array gains 3 new entries at the top
- [ ] Existing T1 sections preserved
- [ ] `pnpm typecheck` passes

## Success criteria

- [ ] File compiles standalone
- [ ] T1's `sections[0..2]` are the new types
- [ ] Existing tool_call + narrative + chart sections preserved
- [ ] T2/T3/T4 untouched
- [ ] Conversation + named-turn exports unchanged

## Risk assessment

| Risk | Mitigation |
|---|---|
| Tutorial completion percentages (58% / 81%) may conflict with T1 narrative anchors | Cross-check existing T1 narrative for stated completion numbers. If a conflict exists, prefer the existing narrative's numbers in this phase's summary copy. |
| "May 2 onboarding A/B mishap" detail not in existing thread narrative | Acceptable — the deep trace can introduce supplementary detail. The mishap is a plausible backstory consistent with the legacy-tutorial hypothesis from T1. |
