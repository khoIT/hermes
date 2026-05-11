---
title: "Hermes Demo Overlays P3/P4/P5"
description: >-
  Overlays on existing Hermes surfaces to demo Pre-Read Part 3 principles
  (Show the math, Learn from portfolio, Curate don't author) in the
  GDS+Apollo alignment meeting. Live demo, not slides. All fixtures,
  labelled "illustrative". Reuses existing components throughout.
status: pending
priority: P2
branch: "agent_demo"
tags:
  - demo
  - agent-first
  - may-12
  - p3
  - p4
  - p5
  - fixtures
blockedBy: []
blocks: []
created: "2026-05-11T05:20:20.119Z"
createdBy: "ck:plan"
source: skill
---

# Hermes Demo Overlays P3/P4/P5

## Overview

Layer three sets of overlays onto existing Hermes surfaces so the live demo
illustrates Part 3 principles (P3 Show the math, P4 Learn from the portfolio,
P5 Curate don't author). No new pages or modules; only small visible additions
plus one fixture file as a single source of truth for demo numbers.

**Source brainstorm:** `plans/reports/brainstormer-260511-1218-hermes-demo-overlays-p3-p4-p5.md`

**Demo spine:** chat-rail inbox is the hub; two demo threads chained
(`thread-demo-agent-livops-2026` → `thread-demo-agent-whale-recall-2026`).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [P3 Show the Math](./phase-01-p3-show-the-math.md) | Pending |
| 2 | [P4 Learn from Portfolio](./phase-02-p4-learn-from-portfolio.md) | Pending |
| 3 | [P5 Curate Reinforcements](./phase-03-p5-curate-reinforcements.md) | Pending |

Each phase is independently shippable and visually verifiable. Ship in order —
P3 lays the fixture-numbers foundation that P4 and P5 build on.

## Demo Choreography (verify after Phase 3)

1. Open on chat-rail with inbox badge — `3 proposals · 1 drift · 2 awaiting`.
2. Click drift item → livops thread, scripted drift turn.
3. Apollo proposes fix as action-card-campaign with math strip above content.
4. Hover `Audience` → "Why this number?" popover (features cited).
5. Scroll → "Similar in portfolio" rail; click "Fork from CFM Rank Protection".
6. Land on campaign canvas with math strip + "Forked from CFM …" line.
7. Jump to whale-recall thread — show breadth.
8. End on monitoring view: math strip + 7d uplift sparkline.

Total demo ≈ 5 minutes.

## Budget

1.5 working days. P3 ~6–8h · P4 ~3–4h · P5 ~2h · choreography polish spread across phases.

## Dependencies

None. Prior plan `260511-1122-welcome-inbox-promote-plus-flows` is `completed` —
this plan extends the surfaces it shipped (HermesNoticedPanel, agent-first threads)
but does not modify their core flow.

## Out of Scope

- New pages or modules.
- Renaming TriggerID → Campaign at platform contracts (meeting ask, not code).
- Goal-alignment score chip.
- Real backend wiring (everything is fixtures).
