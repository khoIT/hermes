---
phase: 6
title: "Rollout to Board, Campaign, Feature"
status: pending
priority: P3
effort: "2–3d"
dependencies: [5]
---

# Phase 6: Rollout to Board, Campaign, Feature

## Overview

Post-May-12 phase. Reuses the chat-rail + contextual-playbook pattern delivered in Phase 5 and rolls it out to the remaining three artifact types: Boards, Campaigns, Features. Each gets its own scripted playbook (different intents per artifact type) and, where applicable, one-click Apply actions that mutate the artifact in place.

## Requirements

**Functional:**
- Chat-rail on `/canvas/:boardId` resolves scope `{type: 'board', id}` and renders board-specific scripted playbooks.
- Same on `/campaigns/:id` with campaign scope.
- Same on `/feature-store/:name` with feature scope.
- Per-artifact playbook coverage:
  - **Boards:** "explain this metric" / "compare to last week" / "drill down by segment" / generic fallback.
  - **Campaigns:** "why is lift below target" / "explain holdout" / "suggest variant tweaks" / "show monitoring delta" / generic fallback.
  - **Features:** "what does this feature mean" / "show top values" / "find correlated features" / "save as segment with this feature" / generic fallback.
- Where actionable, one-click Apply mutates the artifact:
  - **Boards:** "Pin this metric to {section}" -> insert PinnedCard.
  - **Campaigns:** "Increase holdout to 15%" -> PATCH campaign rules.
  - **Features:** "Save as segment" -> opens QuickSegmentDialog with feature pre-seeded.

**Non-functional:**
- Each playbook file ≤200 LOC.
- All Apply mutations have 5s undo affordance.
- Sidebar scope indicators differentiate by icon: Layers (board), Send (campaign), Database (feature).

## Architecture

Phase 5 delivered the routing infrastructure:

```
matchContextualPlaybook(text, scope, getters)
  switch scope.type:
    case 'segment': return SEGMENT_REFINEMENT_PLAYBOOK.match(...)   // Phase 5
    case 'board':    return BOARD_PLAYBOOK.match(...)                // Phase 6
    case 'campaign': return CAMPAIGN_PLAYBOOK.match(...)             // Phase 6
    case 'feature':  return FEATURE_PLAYBOOK.match(...)              // Phase 6
```

Each playbook file follows the same shape: keyword regex map + response builders that consume artifact context.

Apply mutations follow the pattern from `segment-refinement-apply.ts` — snapshot, optimistic, PATCH, toast undo.

## Related Code Files

- **Modify:**
  - `apps/web/src/data/chat/contextual-playbooks.ts` — add board/campaign/feature dispatchers
  - `apps/web/src/utils/chat-respond.ts` — already accepts scope; verify all four scopes route correctly
  - `apps/web/src/modules/canvas/detail-page.tsx` — subscribe to `hermes:board-changed` event
  - `apps/web/src/modules/campaigns/monitoring.tsx` — subscribe to `hermes:campaign-changed` event
  - `apps/web/src/modules/feature-store/detail.tsx` — subscribe to `hermes:feature-context-changed` event (mostly read-only; only triggers Quick dialogs)

- **Create:**
  - `apps/web/src/data/chat/responses/board-responses.ts`
  - `apps/web/src/data/chat/responses/campaign-responses.ts`
  - `apps/web/src/data/chat/responses/feature-responses.ts`
  - `apps/web/src/utils/board-pin-apply.ts`
  - `apps/web/src/utils/campaign-rule-apply.ts`

- **Delete:** none

## Implementation Steps

1. **Board playbook + responses** (4h)
   - `board-responses.ts` builders:
     - `boardExplainMetricResponse(board, hoveredCardId?)` — narrative explaining the highlighted metric, definition + recent trend.
     - `boardCompareLastWeekResponse(board)` — sample comparison table.
     - `boardDrilldownBySegmentResponse(board)` — narrative + RefinementAction to add a per-segment slice card.
     - `boardGenericResponse(board)` — fallback.
   - Apply: "Pin this metric to {section}" -> insert PinnedCard into board via existing `boards-client.pinCard()`. Undo via `unpinCard()`.

2. **Campaign playbook + responses** (4h)
   - `campaign-responses.ts` builders:
     - `campaignExplainLiftResponse(campaign)` — narrative on current lift vs target, holdout balance.
     - `campaignSuggestVariantTweaksResponse(campaign)` — 2 RefinementActions (e.g., raise CF coin grant by 25%, swap variant copy).
     - `campaignAdjustHoldoutResponse(campaign)` — RefinementAction to PATCH holdout %.
     - `campaignMonitoringDeltaResponse(campaign)` — sample line chart showing today vs yesterday.
     - `campaignGenericResponse(campaign)` — fallback.
   - Apply: rule mutations via `campaigns-client.update()` — only on draft campaigns; activated campaigns show "preview only" badge.

3. **Feature playbook + responses** (4h)
   - `feature-responses.ts` builders:
     - `featureExplainResponse(feature)` — narrative pulling from feature catalog metadata.
     - `featureTopValuesResponse(feature)` — sample bar chart of top distribution buckets.
     - `featureCorrelatedResponse(feature)` — calls real `/api/v1/features/{id}/correlated` endpoint, renders chip list.
     - `featureSaveAsSegmentResponse(feature)` — narrative + Apply that opens `<QuickSegmentDialog>` from Phase 3 with feature pre-seeded.
     - `featureGenericResponse(feature)` — fallback.
   - No mutations on feature itself (read-only artifact); Apply triggers segment-creation dialog instead.

4. **Subscribe to predicate events on each detail page** (1h)
   - `canvas/detail-page.tsx`: listen for `hermes:board-changed`, refetch board.
   - `campaigns/monitoring.tsx`: listen for `hermes:campaign-changed`, refetch campaign.
   - `feature-store/detail.tsx`: listen for `hermes:feature-context-changed`, no-op (or light highlight animation).

5. **Sidebar icons** (30 min)
   - `recent-items.tsx` icon mapping: segment -> Users, board -> Layers, campaign -> Send, feature -> Database.

6. **Verification:**
   - `/canvas/{id}` open rail, type "explain this metric" -> board playbook fires.
   - `/campaigns/{id}` open rail, type "why is lift below target" -> campaign playbook fires; click "raise holdout" Apply -> rules update + undo toast.
   - `/feature-store/{name}` open rail, type "save as segment with this feature" -> QuickSegmentDialog opens with feature pre-filled.
   - Each scope shows correct sidebar icon.
   - Typecheck clean.

## Success Criteria

- [ ] Chat-rail playbooks respond correctly on all four artifact types.
- [ ] At least 4 keyword matches per artifact-type playbook respond appropriately.
- [ ] One-click Apply works for board pin + campaign rule + feature -> segment.
- [ ] All mutations have 5s undo.
- [ ] Sidebar scope icons differ per artifact type.
- [ ] No regressions on existing detail pages or chat flows.
- [ ] Typecheck clean.

## Risk Assessment

- **Risk:** Campaign mutation on activated campaign breaks live config.
  - **Mitigation:** Apply is preview-only on activated campaigns; toast says "Activate a draft to apply changes".
- **Risk:** Feature catalog metadata may not have all the explain-text needed.
  - **Mitigation:** Fall back to short generic narrative if metadata missing; flag features with low quality for follow-up curation.
- **Risk:** Each playbook file balloons past 200 LOC.
  - **Mitigation:** Split per-playbook files if needed (e.g., `board-explain-metric.ts`, `board-drilldown.ts`).
- **Risk:** Correlated-features endpoint flaky / slow.
  - **Mitigation:** Cache by feature name + 2s timeout + degraded "Couldn't fetch correlated features — try again" placeholder.
- **Risk:** Phase 6 effort underestimated; multi-day scope creeps to a week.
  - **Mitigation:** Phase 6 is post-demo — ship in batches (one artifact type per session if needed).
