---
title: "Chat Rail + 4 Scripted Multi-Turn Flows"
description: "Adopt Actioneer's contextual right-rail chat surface (anchored on every detail page with page-context chip) replacing the existing AskHermesFab/Panel. Add 4 categorized scripted multi-turn flows: 2 deep-research → Board (PT-6 gem-burn, CFM-11 tier ROI) and 2 features → Segment (CFM loss-streak, PT at-risk whales). Hybrid backend — real catalog-api lookups for Feature Store cards, canned analytics for charts. Frontend-only, ~14 files in apps/web."
status: pending
priority: P2
branch: "actioneer"
tags: [ui, chat, rail, frontend]
blockedBy: []
blocks: []
created: "2026-05-10T08:26:06.060Z"
createdBy: "ck:plan"
source: skill
brainstorm_ref: "plans/reports/brainstorm-260510-1519-chat-rail-scripted-flows.md"
predecessor_plans:
  - 260510-0151-chat-first-sidebar-ia
  - 260510-1330-actioneer-shell-redesign
---

# Chat Rail + 4 Scripted Multi-Turn Flows

## Overview

Two structural moves:

1. **Contextual right-rail chat surface** — replaces existing `<AskHermesFab>` + `<AskHermesPanel>` with a 400px-wide rail anchored on every detail page. Auto-resolves page-context chip from URL (`Segments · Name`, `Feature · Name`, `Board · Name`, `Campaigns · Name`). Persists open/closed in localStorage. Hidden on `/chat`, `/chat/:id`, `/`.

2. **4 scripted multi-turn flows** — replaces 5 generic suggested prompts with 4 categorized prompts under 2 pills (`Deep research → Board`, `Find features → Segment`). Each plays in 3 turns guided by follow-up chips. Terminal artifacts: `pin_to_board` (auto-create board) or `action_card_segment` (navigate to `/segments/:id`). Hybrid plumbing: `<FeatureChip>` widgets call real `catalog-api /api/v1/features/:name` with hardcoded fallback on 5xx; chart data + counts canned.

All 11 brainstorm decisions locked. Detail pages (LM/DA/DE on Feature Store, Threshold playground, Segments composer/canvas, Boards, Campaigns) untouched.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Contextual right-rail shell](./phase-01-contextual-right-rail-shell.md) | Pending |
| 2 | [Multi-turn registry + 4 scripted flows](./phase-02-multi-turn-registry-4-scripted-flows.md) | Pending |
| 3 | [Empty-state polish](./phase-03-empty-state-polish.md) | Pending |

P1 → P2 → P3. P2 depends on P1 (rail must exist to host scripted flows). P3 depends on P1 + P2 (polishes empty state with prompts + recents).

## Dependencies

- **Predecessor (completed):** `260510-0151-chat-first-sidebar-ia` — delivered chat module + `SUGGESTED_PROMPTS` + thread fixtures (thread-001..004).
- **Predecessor (completed):** `260510-1330-actioneer-shell-redesign` — delivered Topbar + sidebar polish + library tightening + segments detail tabs.
- **No active blockers.**

## Success Metrics

- Rail opens by default on detail pages; closed on library pages; hidden on chat routes.
- Page-context chip auto-resolves on every detail page; click `×` clears to workspace-wide.
- 4 prompts visible in rail empty state under 2 categorized pills.
- Each scripted flow reaches terminal artifact in 3 turns.
- Both research flows pin a chart to an auto-created Board, viewable at `/canvas/:id`.
- Both segment flows produce an `action_card_segment` confirmable to `/segments/:id`.
- Each segment flow shows ≥3 real catalog-api FeatureChips on T2 (proves hybrid plumbing).
- catalog-api 5xx → FeatureChip falls back to hardcoded card; demo never breaks.
- `pnpm typecheck` passes for `apps/web`.
- No regression on `/feature-store/:name`, `/segments/:id`, `/canvas/:id`, `/campaigns/:id`.

## Open Questions (carried from brainstorm, non-blocking)

1. Multi-turn registry keying — by `threadId+stepIndex` vs `(threadId, lastUserMessageText)`? **Default:** `lastUserMessageText`.
2. Rail width tuning at <1280px viewport — fall back to 360px? **Default:** 400px, verify during P1.
3. Cross-thread context bleed — page-context chip stays anchored to current URL across thread switches. **Default:** yes.
