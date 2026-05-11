---
title: Welcome Inbox Promote + 2 New Agent Self-Detection Flows
description: >-
  Promote HermesNoticedPanel to full-width above ActiveCampaigns on /welcome
  with 3 staggered cards; add 2 sibling agent-first chat threads following the
  established thread-demo-agent-livops-2026 template.
status: completed
priority: P2
branch: agent_demo
tags:
  - welcome
  - agent-first
  - chat
  - i18n
  - demo
  - may-12
blockedBy: []
blocks: []
created: '2026-05-11T04:30:11.303Z'
createdBy: 'ck:plan'
source: skill
---

# Welcome Inbox Promote + 2 New Agent Self-Detection Flows

## Overview

Promote `HermesNoticedPanel` (the "agent inbox") from the `/welcome` right rail to a full-width row above `ActiveCampaignsPanel`. Extend from 1 → 3 stacked agent-detected anomaly cards with staggered timestamps. Each card routes to a sibling agent-first chat thread that auto-plays a 4-turn diagnose → segment → campaign → retrospective arc (parity with existing `thread-demo-agent-livops-2026`).

**Source brainstorm:** `plans/reports/brainstorm-260511-1122-welcome-inbox-promote-plus-flows.md`

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Layout & Inbox Extension](./phase-01-layout-inbox-extension.md) | Completed |
| 2 | [Thread B - D7 FB Cohort](./phase-02-thread-b-d7-fb-cohort.md) | Completed |
| 3 | [Thread C - Whale Recall](./phase-03-thread-c-whale-recall.md) | Completed |
| 4 | [Plumbing & i18n & Verify](./phase-04-plumbing-i18n-verify.md) | Completed |

**Parallel-eligible:** Phases 2 and 3 are independent (each authors a separate new `.ts` thread file; no shared file edits). All plumbing wire-ups land in phase 4 to keep 2 and 3 conflict-free.

**Strict order:** 1 → (2 ∥ 3) → 4

## Dependencies

No cross-plan blocks. Self-contained on `agent_demo` branch.

## Out of scope (do not creep)

- No sidebar "Inbox" entry
- No backend wiring (catalog-api stays out)
- No unread badge / notification counter
- No real anomaly detection logic (scripted fixtures only)
- No filter/preference UI on the inbox panel

## Success criteria (top-level)

- [ ] `/welcome` renders 3-row inbox above Active Campaigns, no regression
- [ ] Card B click → thread B, T1 auto-plays + 3 follow-ups unlock T2/T3/T4
- [ ] Card C click → thread C, T1 auto-plays + 3 follow-ups unlock T2/T3/T4
- [ ] Vietnamese toggle covers all 3 card copies + 2 new thread titles
- [ ] `pnpm typecheck && pnpm build` passes from repo root
