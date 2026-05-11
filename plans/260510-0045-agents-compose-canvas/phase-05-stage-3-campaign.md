---
phase: 5
title: "Stage 3 — Campaign"
status: pending
priority: P1
effort: "5h"
dependencies: [1, 2, 3, 4]
---

# Phase 5: Stage 3 — Campaign

## Overview

The closing stage. Agent composes the trigger event, action card, cooldown, A/B holdout, platform cap; surfaces alignment score + sample profiles. User reviews, optionally adds a free-text refinement that swaps the action payload, then hits **Continue in Campaigns →** which creates the campaign draft and routes to `/campaigns/new/realtime?from=compose-{sessionId}`. After this phase, the canonical demo flow loops back into the existing Campaigns module.

## Requirements

- **Functional:**
  - Render headline ("The moment a player loses 5 in a row…") — built from playbook template
  - Event source banner (dark inverted strip) showing event name + peak rate + lifecycle (pulled from playbook template)
  - Action card with channel · payload · cooldown · platform cap · A/B holdout
  - Alignment card: 4R tag + score + one-line rationale ("Pattern recognized as frustration-rescue…")
  - 4 fire metrics: forecast daily fires, peak rate, latency, est. lift
  - Trigger lifecycle strip (event → predicate → match → IAM → cooldown → resume)
  - 3 sample profile cards from playbook
  - Free-text refinement input *"Refine this campaign…"*; user submits → matches against playbook's `scriptedReplies` (e.g. *"don't make it generous"* → swap action payload + agent reply)
  - Three action buttons:
    - **Test in shadow** → dispatches placeholder dispatch + toast "shadow test queued" (UI-only)
    - **Save draft** → toast + add entry to existing `allDrafts` (in-memory, session-scoped)
    - **Continue in Campaigns →** primary CTA, navigates to `/campaigns/new/realtime?from=compose-{sessionId}`
  - Destination campaign canvas shows banner: *"✦ Authored from agent session sa-… · ← back to agent"* (this requires touching `realtime.tsx` minimally)
  - Stale handling: if upstream changes, re-render campaign card on re-open with fresh data
- **Non-functional:**
  - Files ≤ 200 LOC

## Architecture

```
_components/
  stage-campaign.tsx            ← stage 3 container (~180 lines)
  trigger-headline.tsx          ← serif "The moment…" sentence builder (~60 lines)
  event-source-banner.tsx       ← dark inverted strip (~80 lines)
  action-card.tsx               ← channel/payload/cooldown grid (~100 lines)
  alignment-card.tsx            ← 4R + score + rationale (~80 lines)
  fire-metrics-row.tsx          ← 4-up metric row (~60 lines)
  trigger-lifecycle-strip.tsx   ← event → predicate → match flow (~100 lines)
  sample-profiles-row.tsx       ← 3 sample cards (~80 lines)
  refinement-input.tsx          ← free-text refine + scripted reply matcher (~100 lines)

_state/
  campaign-builder.ts           ← session → CampaignTemplate (~80 lines)
  campaign-handoff.ts           ← serialize session for /campaigns destination (~60 lines)
```

### Handoff payload

Session → handoff blob (set on `sessionStorage` keyed by `compose-{sessionId}`):

```ts
interface ComposeHandoff {
  sessionId: string;
  intent: string;
  predicate: PredicateGroup[];
  segmentId: string | null;            // existing match if used
  audienceCount: number;
  campaignTemplate: CampaignTemplate;
  fourR: { tag: FourRTag; alignment: number };
}
```

`/campaigns/new/realtime` reads `?from=compose-{sessionId}`, looks up the blob, and pre-fills:
- intent block (existing `<IntentBlock>`)
- audience block (existing `<AudienceBlock>` with seedSegment)
- event source picker (matches `playbook.campaignTemplate.eventSource`)
- action block (existing `<ActionBlock>`)

## Related Code Files

- **Create:**
  - `apps/web/src/modules/agents/compose/_components/stage-campaign.tsx`
  - `apps/web/src/modules/agents/compose/_components/trigger-headline.tsx`
  - `apps/web/src/modules/agents/compose/_components/event-source-banner.tsx`
  - `apps/web/src/modules/agents/compose/_components/action-card.tsx`
  - `apps/web/src/modules/agents/compose/_components/alignment-card.tsx`
  - `apps/web/src/modules/agents/compose/_components/fire-metrics-row.tsx`
  - `apps/web/src/modules/agents/compose/_components/trigger-lifecycle-strip.tsx`
  - `apps/web/src/modules/agents/compose/_components/sample-profiles-row.tsx`
  - `apps/web/src/modules/agents/compose/_components/refinement-input.tsx`
  - `apps/web/src/modules/agents/compose/_state/campaign-builder.ts`
  - `apps/web/src/modules/agents/compose/_state/campaign-handoff.ts`
- **Modify:**
  - `apps/web/src/modules/campaigns/canvas/realtime.tsx` — accept `?from=compose-{sessionId}`, read `sessionStorage`, pre-fill blocks, render banner
  - `compose-page.tsx` — mount stage 3, wire dispatch + refinement
- **Reuse:**
  - Existing campaign canvas blocks (`_blocks/event-trigger-block.tsx`, `_blocks/action-block.tsx`, etc.) — Stage 3 borrows their visual primitives but renders read-only

## Implementation Steps

1. Write `campaign-builder.ts`. Pure function: session → CampaignTemplate (the playbook's template with values substituted).
2. Build small primitives in order: `<TriggerHeadline>`, `<EventSourceBanner>`, `<ActionCard>`, `<AlignmentCard>`, `<FireMetricsRow>`, `<TriggerLifecycleStrip>`, `<SampleProfilesRow>`. Each is a near-static render of its slice of the template; styling matches the mockup but reuses existing campaign block visuals where possible.
3. Build `<RefinementInput>`. Textarea + send button. On submit: match against `playbook.scriptedReplies`; if match, dispatch `CAMPAIGN_REFINE` with template patch + agent reply; else generic *"Got it — here are 2 ways I can interpret that"* fallback (acceptable for May-12).
4. Build `<StageCampaign>` container. Composes all primitives in order. Three action buttons in sticky footer.
5. Write `campaign-handoff.ts`. Serializes session to handoff blob, writes to `sessionStorage`. On stage 3 advance to Campaigns: write blob, navigate.
6. Modify `realtime.tsx`: detect `?from=compose-{sessionId}`, read blob from sessionStorage. Pre-fill intent / segment / event / action. Render banner above the page header: *"✦ Authored from agent session sa-… · ← back to agent"* (link back to `/agents/compose?session={id}` — but session is in-memory only, so the link routes to `/agents/compose` with intent text pre-loaded as a graceful fallback).
7. Wire dispatch in `compose-page.tsx`: stage 3 active state, refinement handler, save-draft handler.
8. End-to-end test: full demo flow from `/agents` → compose → stage 1 → stage 2 → stage 3 → "Continue in Campaigns →" → land on real-time canvas with banner + all blocks pre-filled.

## Success Criteria

- [ ] Stage 3 auto-renders the campaign card after stage 2 approve
- [ ] All 8 visual primitives render with playbook data; styling consistent with mockup + existing campaign canvas
- [ ] Refinement input swaps action payload for the *"don't make it generous"* trigger word
- [ ] **Continue in Campaigns →** writes session to sessionStorage and routes correctly
- [ ] `/campaigns/new/realtime?from=compose-{sessionId}` shows the banner + pre-filled blocks (intent, segment, event, action)
- [ ] Banner "← back to agent" link returns to `/agents/compose` with intent pre-loaded
- [ ] Save Draft adds an entry visible in existing `/agents/drafts` page (in-memory)
- [ ] No file exceeds 200 LOC
- [ ] `pnpm typecheck` passes; full demo flow runs end-to-end

## Risk Assessment

- **Risk:** `realtime.tsx` modification breaks existing `?from=draft-…` flow. **Mitigation:** keep both code paths; add a switch on the param prefix; add a regression test by manually opening an existing opportunity → draft → realtime canvas.
- **Risk:** sessionStorage cleared between tabs. **Mitigation:** acceptable since Compose → Campaigns happens in same tab; document in plan.
- **Risk:** Stage 3 visuals duplicate campaign canvas blocks instead of reusing them. **Mitigation:** explicit reuse list — `EventTriggerBlock`, `ActionBlock`, `ForecastBlock` props are inspected; if their props are stable, instantiate them read-only inside Stage 3 instead of recreating from scratch. If their internal state coupling makes reuse messy (likely), copy the visual primitives into Stage 3 components — accept the modest duplication.
- **Risk:** Banner is intrusive on existing real-time canvas. **Mitigation:** thin strip, dismissable; only renders when `from=compose-…` param present.

## Notes for Phase 6+

- Phase 6 (Routing & Inbox Entry) makes `/agents/compose` discoverable from inbox + opportunity card
- Phase 7 (Polish) fills out the remaining 4 playbooks' campaign templates
