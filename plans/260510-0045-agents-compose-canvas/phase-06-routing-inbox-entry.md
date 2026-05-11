---
phase: 6
title: "Routing & Inbox Entry"
status: pending
priority: P1
effort: "3h"
dependencies: [2, 3, 4, 5]
---

# Phase 6: Routing & Inbox Entry

## Overview

Make the new Compose canvas discoverable. Add the primary "✦ Describe a problem" CTA to the Agents inbox header. Add an "Open in Compose" affordance on each `OpportunityCard` that pre-loads the canvas with the opportunity's intent, agent thread, and proposed predicate. After this phase, the demo entry path is unmistakable from the inbox.

## Requirements

- **Functional:**
  - `/agents/compose` route already exists (Phase 2). This phase adds entry points.
  - Primary CTA in `inbox.tsx` page header: button labeled `✦ Describe a problem` styled as primary brand-red.
  - Each `OpportunityCard` (in inbox grid) gets a new tertiary action: `Open in Compose →` (alongside existing Approve / Edit / Dismiss).
  - Click "Open in Compose" pre-loads `/agents/compose?fromOp={opId}` with:
    - Intent textarea pre-filled from `opportunity.intent`
    - Conversation rail seeded with `opportunity.agentThread` entries (formatted as agent system messages)
    - Stage 1 features pre-populated from `opportunity.proposed.segment` → looked up in `allSegments` → segment.predicate features
    - 4R tag pre-filled from `opportunity.goal4r`
  - Compose canvas header shows badge *"From opportunity ag-op-1042"* with link back to opportunity detail
- **Non-functional:**
  - URL-driven entry only (no auto-open from session storage); avoids hidden-state confusion
  - Files ≤ 200 LOC

## Architecture

```
Modify-only phase. No new components beyond minor inline tweaks.
```

### Pre-load logic

`compose-page.tsx` reads `?fromOp={opId}` on mount:

1. Look up `opportunity` in `allOpportunities`
2. If not found → render fresh canvas + warning toast *"Opportunity ag-op-… not found, starting fresh"*
3. If found → dispatch a single `INTENT_FROM_OPPORTUNITY` action that the reducer handles by:
   - Setting intent text
   - Seeding chat log with agent thread entries (transformed)
   - Populating proposed features (skip stage 1 proposing, go straight to reviewing)
   - Setting 4R tag
   - Optionally: jumping to stage 2 if features look approved (decision: stay at stage 1 reviewing — user still confirms)

## Related Code Files

- **Modify:**
  - `apps/web/src/modules/agents/inbox.tsx` — add primary CTA in header (next to existing stat strip)
  - `apps/web/src/components/opportunity-card.tsx` — add "Open in Compose" action (only in `mode='card'`)
  - `apps/web/src/modules/agents/compose/compose-page.tsx` — read query param on mount, dispatch pre-load action
  - `apps/web/src/modules/agents/compose/_state/compose-reducer.ts` — add `INTENT_FROM_OPPORTUNITY` action
- **Reuse:**
  - `allOpportunities` from `apps/web/src/data/catalog/agents/opportunities.ts`
  - `allSegments` from `apps/web/src/data/catalog/segments.ts`

## Implementation Steps

1. Add `+ Describe a problem` button in `inbox.tsx` header. Place it in the existing stat-strip area (currently shows 4 badges). Match existing primary-button style (`background: T.brand`, white text, ✦ glyph prefix). Click → `navigate('/agents/compose')`.
2. Open `opportunity-card.tsx`. Find the action row (currently Approve / Edit / Dismiss). Add fourth action `Open in Compose →` styled as a subtle text link. Only render in `mode='card'` (not `mode='detail'` or `mode='embedded'`). Click → `navigate(`/agents/compose?fromOp=${opportunity.id}`)`.
3. Add `INTENT_FROM_OPPORTUNITY` action to `compose-reducer.ts`. It should:
   - Set `intent` from `opportunity.intent`
   - Look up matching playbook by intent OR by direct mapping (e.g. `ag-op-1042` → `loss-streak` playbook)
   - Pre-populate stage 1's `proposed` rows from playbook
   - Seed `chatLog` with: 1 user message (the intent) + N agent system messages from `opportunity.agentThread` formatted as a single block + 1 agent reply with the playbook intro
   - Set `fourR` from `opportunity.goal4r`
   - Set `activeStage = 'features'`, `stages.features.status = 'reviewing'`
4. In `compose-page.tsx`, on mount: parse `?fromOp=` query param. If present, look up opportunity. If found → dispatch pre-load. Else show warning toast.
5. Add small "From opportunity ag-op-1042 · view" badge in compose page header (top right, near 4R chip), link → `/agents/op/{numericId}`.
6. Test: from `/agents`, click `Open in Compose →` on the loss-streak opportunity card; verify canvas pre-loads correctly.

## Success Criteria

- [ ] `/agents` shows primary `✦ Describe a problem` CTA in header
- [ ] Clicking CTA navigates to `/agents/compose` (fresh)
- [ ] Each OpportunityCard in inbox shows `Open in Compose →` action
- [ ] Clicking it for ag-op-1042 navigates to `/agents/compose?fromOp=ag-op-1042`
- [ ] Compose canvas pre-loads with intent text, chat log seeded with agent thread, stage 1 features populated, 4R = retain
- [ ] "From opportunity ag-op-1042" badge visible in compose header with link back
- [ ] Warning toast shows for invalid opportunity ID
- [ ] No regression in existing inbox/opportunity flows
- [ ] `pnpm typecheck` passes

## Risk Assessment

- **Risk:** Existing OpportunityCard layout breaks adding a 4th action. **Mitigation:** check current width / actions; if cramped, add as overflow menu or replace "Edit" with "Open in Compose" (Edit goes to segments composer which Compose already does).
- **Risk:** `INTENT_FROM_OPPORTUNITY` reducer complexity creeps. **Mitigation:** keep the action thin — it just unions an existing playbook proposal with opportunity-derived intent text; do not invent new state shapes.
- **Risk:** Mapping `ag-op-1042` → `loss-streak` playbook is brittle. **Mitigation:** add a small `opportunityToPlaybookMap` table in `compose-playbooks.ts`; explicit and readable.

## Notes for Phase 7+

- Phase 7 might add a "Recent Compose sessions" section in the inbox; out of scope for May-12
- Hot reload note: pre-load via query string survives reloads cleanly; no localStorage needed for this entry path
