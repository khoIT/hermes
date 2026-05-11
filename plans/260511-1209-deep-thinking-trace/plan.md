---
title: "Deep-thinking Trace + Functional Deep Research Toggle"
description: "Add 3 new ResponseSection types (working_status, task_progress, subagent_panel) and corresponding React components. Promote the cosmetic DeepResearchToggle to functional — gating T1 trace shape in the 3 agent-first threads. 5 customized subagent panels per thread × 3 threads with expandable 5-task lists."
status: pending
priority: P2
branch: "agent_demo"
tags: [chat, agent-first, deep-research, sections, may-12]
blockedBy: []
blocks: []
related: [260511-1122-welcome-inbox-promote-plus-flows]
created: "2026-05-11T05:22:18.200Z"
createdBy: "ck:plan"
source: skill
---

# Deep-thinking Trace + Functional Deep Research Toggle

## Overview

Faithful reproduction of the reference deep-research UI: Working.. block + task-progress checklist + named specialized agent panels. Gated by the existing `DeepResearchToggle` (currently cosmetic — promoted to functional). Each of the 3 agent-first threads (CFM ARPDAU drift, D7 FB cohort drop, Top-1% whale recall) gets its own customized 5-agent roster + scripted intent/checklist/agent task content.

**Source brainstorm:** `plans/reports/brainstorm-260511-1209-deep-thinking-trace.md`

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Section types & components](./phase-01-section-types-components.md) | Pending |
| 2 | [Toggle wiring & default-on](./phase-02-toggle-wiring-default-on.md) | Pending |
| 3 | [Thread A content (ARPDAU)](./phase-03-thread-a-content.md) | Pending |
| 4 | [Thread B content (D7 FB)](./phase-04-thread-b-content.md) | Pending |
| 5 | [Thread C content (Whale)](./phase-05-thread-c-content.md) | Pending |
| 6 | [Renderer gate & verify](./phase-06-renderer-gate-verify.md) | Pending |

**Strict order:** `1 → 2 → (3 ∥ 4 ∥ 5) → 6`

**Parallel-eligible:** Phases 3, 4, 5 are independent (each owns one thread file; no shared edits). All shared edits (`assistant-response.tsx` gating, `response-types.ts` union, `chat-bootstrap.ts` version bump) live in phases 1-2 and phase 6.

## Dependencies

No active cross-plan blockers. The prior plan `260511-1122-welcome-inbox-promote-plus-flows` is complete and authored the 3 agent-first thread files this plan extends.

## Out of scope (do not creep)

- No real backend (all scripted)
- No live progress animation (static snapshot)
- No subagent drill-in beyond task expand
- No per-thread toggle override (one global state)
- No collapse-state persistence
- No mobile responsive deep panel

## Success criteria (top-level)

- [ ] Agent-first thread chat inputs show Deep Research toggle; non-agent-first threads do NOT
- [ ] Toggle ON → deep trace renders in T1 (working_status + task_progress + 5 subagent panels)
- [ ] Toggle OFF → existing tool_call chips render in T1
- [ ] Each thread renders 5 customized subagent panels with expandable 5-task lists
- [ ] Task-progress checklist renders with vertical rail visual per screenshot
- [ ] First-visit agent-first thread defaults to toggle ON (bootstrap v14 seed)
- [ ] `pnpm typecheck && pnpm build` passes
