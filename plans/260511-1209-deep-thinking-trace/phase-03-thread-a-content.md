---
phase: 3
title: "Thread A content (ARPDAU)"
status: completed
priority: P2
effort: "2.5h"
dependencies: [1]
parallel_eligible: true
parallel_with: [4, 5]
file_ownership: ["apps/web/src/data/chat/threads/thread-demo-agent-livops-2026.ts"]
---

# Phase 3: Thread A content — CFM ARPDAU drift deep trace

## Overview

Add `working_status`, `task_progress`, and `subagent_panel` sections to T1 of `thread-demo-agent-livops-2026.ts`. The new sections sit ALONGSIDE the existing `tool_call` chips (both authored; phase 6 gates which renders). Subagent roster customized for ARPDAU subject: Acquisition Analysis · LTV Projections · Period vs Cohort · Spend Scenario · Research Agent.

**Strict file ownership:** This phase owns ONLY `thread-demo-agent-livops-2026.ts`. Parallel-eligible with phases 4 and 5.

## Context links

- Brainstorm: `plans/reports/brainstorm-260511-1209-deep-thinking-trace.md`
- Target file: `apps/web/src/data/chat/threads/thread-demo-agent-livops-2026.ts`
- Section payload types (from phase 1): `WorkingStatusPayload`, `TaskProgressPayload`, `SubagentPanelPayload`
- Reference shape: existing tool_call sections at the top of T1 (lines 36-67)

## Requirements

**Functional**
- T1 (`m-agent-a1`) gains 3 new sections at the top, BEFORE the existing `tool_call` chips:
  1. `working_status` — intent: "I will analyze CFM ARPDAU drift across ARPPU vs Paying-DAU%, segment loss-streak cliffs by skill tier, and surface the cohort most at risk of churning unconverted."
  2. `task_progress` — 7 canonical pipeline steps, 57% percent, 4 done / 1 in_progress / 2 pending (states per brainstorm section 4.5)
  3. `subagent_panel` — 5 agents (table below)
- Existing tool_call chips REMAIN in T1 (don't delete) — they're the OFF-state content for the toggle
- T1 must remain a valid `ChatMessage`; all new sections type-check against the payloads from phase 1
- No edits to T2/T3/T4

**Non-functional**
- File grows ~480 → ~700 lines (acceptable; subagent rosters consume ~150 of those)
- Roster definition extracted as a top-of-file `const` for readability
- All copy English-only (consistent with chart text policy)
- Past-tense summaries (matches screenshot)

## Architecture

### 3.1 Section order in T1

Existing T1 currently starts with 3 `tool_call` sections. New order:

```
T1 sections array:
  1.  working_status        ← NEW
  2.  task_progress         ← NEW
  3.  subagent_panel        ← NEW
  4.  tool_call (query_trino)        ← EXISTING (kept for OFF state)
  5.  tool_call (compute_decomp)     ← EXISTING
  6.  tool_call (bucket_by)          ← EXISTING
  7.  narrative                       ← EXISTING (unchanged)
  8.  h2 + widget + provenance × 2   ← EXISTING
  9.  insights + soft_hint            ← EXISTING
```

The new sections render first when toggle ON; the tool_call chips render when toggle OFF. Phase 6 implements the gate.

### 3.2 Subagent roster for Thread A

**Define as top-of-file const** (above T1):

```ts
const SUBAGENTS_ARPDAU: SubagentPanelPayload['agents'] = [
  {
    name: 'Acquisition Analysis Agent',
    summary: 'Analyzed 13 weeks of CFM acquisition data — channel mix stable across Q1 (Facebook 41%, Admob 27%, Organic 18%, Moloco 9%, Vungle 5%). No channel-level drift; the ARPDAU regression is downstream of acquisition.',
    tasks: [
      'Pull channel-attribution table from cfm_vn (Jan 25 → May 9)',
      'Compute weekly D0/D1/D7 retention by channel',
      'Rank channels by ARPDAU contribution',
      'Compare channel mix Q1 vs Q2 (so far)',
      'Conclude: no channel-level drift explains the ARPDAU drop',
    ],
  },
  {
    name: 'LTV Projections Agent',
    summary: 'Modeled forward LTV by paying-tier. Whale and mid-spender LTVs unchanged ($840 / $112). Drop is concentrated in the F2P→first-purchase conversion rate, not paying user spend.',
    tasks: [
      'Load 90-day paying-user spend histories',
      'Segment users into 4 spend tiers (F2P / micro / mid / whale)',
      'Fit Pareto-NBD model per tier',
      'Project 90d LTV per tier under current behavior',
      'Surface conversion-rate compression as the deltas-driver',
    ],
  },
  {
    name: 'Period vs Cohort Agent',
    summary: 'Confirmed the regression is period-driven, not cohort-driven. April-acquired cohort behaves like Q1 cohorts at matched tenure — the drop is a behavior shift in the active player base, not a quality drop in new players.',
    tasks: [
      'Build 8 weekly cohorts of new players Jan 25 → Apr 27',
      'Track ARPDAU per cohort at days 7/14/30',
      'Compare cohort curves; flag deviations',
      'Calendar-period vs cohort-period decomposition',
      'Conclude: drop is period-driven (active base behavior shift)',
    ],
  },
  {
    name: 'Spend Scenario Agent',
    summary: 'Simulated 5 rescue scenarios: targeted IAM, ranked-protect grant, daily-bonus boost, store-discount push, and the stacked 3-touch rescue. Stacked rescue projects highest D7 lift (+24pp) per $1 spent.',
    tasks: [
      'Define candidate-rescue inventory (5 mechanics)',
      'Pull historical lift from Jan 2026 A/B tests',
      'Model audience reach and cost per mechanic',
      'Rank by ROI = (projected D7 lift × cohort size) / cost',
      'Recommend stacked 3-touch IAM grant',
    ],
  },
  {
    name: 'Research Agent',
    summary: 'Cross-referenced internal anomaly patterns with industry literature on ranked-PvP fatigue. Confirms loss-streak cliffs at 5+ are a known industry pattern (cf. Riot 2023 ranked-MMR analysis); rescue mechanics from Riot and Supercell informed our intervention list.',
    tasks: [
      'Search internal anomaly archive for prior loss-streak patterns',
      'Pull comparable industry case studies (Riot, Supercell, Krafton)',
      'Extract historical rescue-mechanic outcomes',
      'Validate hypotheses against industry baselines',
      'Cite 3 sources in the final recommendation',
    ],
  },
];
```

### 3.3 Working-status intent + task-progress for Thread A

```ts
const WORKING_STATUS_ARPDAU: WorkingStatusPayload = {
  intent: 'I will analyze CFM ARPDAU drift across ARPPU vs Paying-DAU% decomposition, segment loss-streak cliffs by skill tier, and surface the cohort most at risk of churning unconverted.',
  state: 'working',
};

const TASK_PROGRESS_ARPDAU: TaskProgressPayload = {
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

### 3.4 T1 sections array prepend

Insert at the top of T1's `sections: [` array (before the first `tool_call`):

```ts
sections: [
  { type: 'working_status',  payload: WORKING_STATUS_ARPDAU },
  { type: 'task_progress',   payload: TASK_PROGRESS_ARPDAU },
  { type: 'subagent_panel',  payload: { agents: SUBAGENTS_ARPDAU } },
  // ─── existing tool_call chain (kept for toggle OFF state) ─────────────
  { type: 'tool_call', payload: { /* …existing… */ } },
  { type: 'tool_call', payload: { /* …existing… */ } },
  { type: 'tool_call', payload: { /* …existing… */ } },
  // ─── rest of T1 (narrative, charts, etc.) ───────────────────────────
  ...
],
```

Imports at top of file (adjust path to match existing imports in file):
```ts
import type {
  WorkingStatusPayload, TaskProgressPayload, SubagentPanelPayload,
} from '../response-types';
```

## Related code files

**Modify (1)**
- `apps/web/src/data/chat/threads/thread-demo-agent-livops-2026.ts`

**Do NOT modify** (other phases own them):
- `thread-demo-agent-d7-fb-cohort-2026.ts` (Phase 4)
- `thread-demo-agent-whale-recall-2026.ts` (Phase 5)
- `response-types.ts`, `chat-bootstrap.ts`, `assistant-response.tsx` (Phases 1, 2, 6)

## Implementation steps

1. **Add imports** at top of `thread-demo-agent-livops-2026.ts` for the 3 new payload types
2. **Add top-of-file consts** `SUBAGENTS_ARPDAU`, `WORKING_STATUS_ARPDAU`, `TASK_PROGRESS_ARPDAU`
3. **Prepend 3 new sections** to T1's `sections: []` array (before the first tool_call)
4. **Standalone typecheck** — `pnpm --filter @hermes/web typecheck` must pass

## Todo list

- [x] Imports added
- [x] `SUBAGENTS_ARPDAU` const defined (5 agents × 5 tasks × full summaries)
- [x] `WORKING_STATUS_ARPDAU` const defined
- [x] `TASK_PROGRESS_ARPDAU` const defined
- [x] T1 `sections` array gains 3 new entries at the top
- [x] Existing T1 tool_call + narrative + chart sections unchanged
- [x] `pnpm typecheck` passes

## Success criteria

- [x] File compiles standalone
- [x] T1's `sections[0..2]` are the new types
- [x] T1's existing sections preserved at original positions (now shifted by 3)
- [x] T2/T3/T4 untouched
- [x] Conversation export + named-turn exports unchanged
- [x] No new imports beyond the 3 payload types

## Risk assessment

| Risk | Mitigation |
|---|---|
| Subagent task strings feel like LLM-generated padding | Each task references a real cfm_vn table or a specific historical reference (Jan 2026 A/B, Pareto-NBD, ranked-MMR). Stays grounded. |
| Roster size: 5 agents × 5 tasks = 25 strings + 5 summaries = 30 distinct strings per thread | Accept — this is the brainstorm-locked scale. Each string short (<80 chars). |
| ARPDAU subagent overlap with the canonical analyst arc's narrative | Acceptable. The deep trace surfaces analytical primitives; the analyst arc shows the user-facing reasoning chain. They co-exist as ON/OFF states. |
| Subagent summaries written in past tense for Q2 2026 data | Use neutral past tense — no specific dates in summary copy. Dates okay in task strings. |
