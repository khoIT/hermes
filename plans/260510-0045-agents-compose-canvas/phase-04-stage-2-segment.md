---
phase: 4
title: "Stage 2 — Segment"
status: pending
priority: P1
effort: "5h"
dependencies: [1, 2, 3]
---

# Phase 4: Stage 2 — Segment

## Overview

The middle stage. Agent composes the AND-of-OR predicate from approved features, calls `/api/v1/audience/count` for live audience size, runs cohort breakdown, detects existing-segment matches in the catalog. User approves the segment as new draft, picks the matching existing segment, or jumps out to `/segments/new` for manual tuning.

## Requirements

- **Functional:**
  - On stage advance from features (or on re-open after hop-back), build predicate from `session.stages.features.approved`
  - Fetch live audience count via POST `/api/v1/audience/count` (query-svc :3002) with the predicate; show "computing…" placeholder during fetch
  - Render predicate blocks visually (mockup-style: WHEN / AND / AND… with feature name, op, value, rationale chip)
  - Threshold slider on the headline numeric feature; live-bound to audience count (debounced 300ms)
  - Cohort breakdown (lifecycle / region / spend tier) using `/api/v1/audience/count` per cohort dimension OR cached cohort fixture (decision below)
  - Existing-segment match detection: scan `allSegments`, find one where predicate features overlap ≥ 80%; if match → "Already exists as `seg-…` — use it?" pill linking to `/segments/{id}`
  - Three approval actions:
    - **Approve as new draft** → advance to stage 3
    - **Use existing** → set `session.stages.segment.decision = 'use-existing'`, advance to stage 3 with the existing segment's predicate
    - **Open in /segments/new** → route to `/segments/new?from=compose-{sessionId}` with predicate pre-filled (existing param wired through)
  - Stale handling: if features change → on re-entering stage 2, refetch audience count, re-render predicate, banner *"Predicate changed · re-validating audience…"*
- **Non-functional:**
  - Audience count fetch with 5s timeout; on timeout show ghost number with retry button
  - Slider debounce 300ms; show pulsing "..." while waiting
  - Files ≤ 200 LOC

## Architecture

```
_components/
  stage-segment.tsx             ← stage 2 container (~180 lines)
  predicate-blocks.tsx          ← visual predicate rendering (~120 lines)
  audience-count-card.tsx       ← big number + cohort breakdown (~140 lines)
  threshold-slider.tsx          ← slider on headline feature (~80 lines)
  existing-segment-match.tsx    ← "matches seg-…" pill (~60 lines)

_state/
  audience-fetch.ts             ← API client + cache + debounce (~120 lines)
  predicate-builder.ts          ← approved features → predicate shape (~80 lines)
  segment-matcher.ts            ← scan allSegments for overlap (~80 lines)
```

### Predicate-to-API shape

The query-svc accepts AND-of-OR. Build the simplest form: each approved feature becomes a single-leaf condition under one AND group:

```ts
{ predicate: { all: [
  { leaf: { feature: 'consecutive_ranked_losses_streak', op: 'gte', value: 5 } },
  { leaf: { feature: 'tenure_days',                     op: 'gte', value: 7 } },
  { leaf: { feature: 'last_intervention_at',            op: 'lt',  value: '72h-ago' } },
] } }
```

Op values come from playbook spec (`gte` / `lt` / `eq`); shape matches existing query-svc spec from `feature-store-demo-script.md` line 154.

### Segment-match heuristic

Compute Jaccard similarity over `featureIds`:

```ts
const overlap = approvedFeatureIds ∩ segmentFeatureIds
const jaccard = overlap.size / (approvedFeatureIds ∪ segmentFeatureIds).size
match = jaccard >= 0.8
```

For the canonical demo, `seg-cfm-loss-streak-non-paying-2026-0508-a3f9` will match.

### Cohort breakdown decision

For demo speed, **don't** call API per cohort. Use a cached cohort fixture from the existing Feature Store coverage-segmentation panel. Annotate that this is fixture-derived in a small footnote (consistent with current Analyst tab behavior).

## Related Code Files

- **Create:**
  - `apps/web/src/modules/agents/compose/_components/stage-segment.tsx`
  - `apps/web/src/modules/agents/compose/_components/predicate-blocks.tsx`
  - `apps/web/src/modules/agents/compose/_components/audience-count-card.tsx`
  - `apps/web/src/modules/agents/compose/_components/threshold-slider.tsx`
  - `apps/web/src/modules/agents/compose/_components/existing-segment-match.tsx`
  - `apps/web/src/modules/agents/compose/_state/audience-fetch.ts`
  - `apps/web/src/modules/agents/compose/_state/predicate-builder.ts`
  - `apps/web/src/modules/agents/compose/_state/segment-matcher.ts`
- **Modify:**
  - `compose-page.tsx` — mount stage 2 inside stepper, wire dispatch
  - `compose-reducer.ts` (Phase 1) — finalize `SEGMENT_DECISION` action if not already
- **Reuse:**
  - `apps/web/src/data/catalog/segments.ts` — `allSegments`
  - Cohort breakdown bars from Feature Store Analyst tab (likely `coverage-segmentation.tsx` — copy the visual primitive, do not import the page)

## Implementation Steps

1. Write `predicate-builder.ts`. Pure function: approved feature rows → predicate shape (AND group) + display rows.
2. Write `audience-fetch.ts`. POST to query-svc :3002 with AbortController + 5s timeout. Return `{ count, fetchedAt }` or throw.
3. Write `segment-matcher.ts`. Scan `allSegments`, return best match if Jaccard ≥ 0.8 else null.
4. Build `<PredicateBlocks>`. WHEN / AND row layout matching the mockup. Each row: feature pill, op, value, rationale chip, mini-link to "edit feature" → dispatches `STAGE_REOPEN: features`.
5. Build `<AudienceCountCard>`. Big serif number + 3 cohort breakdown bars (lifecycle, region, spend tier) from cached fixture. Loading shimmer while audience fetch in flight.
6. Build `<ThresholdSlider>`. Bound to the headline numeric feature in the predicate. On change → debounced re-fetch via `audience-fetch.ts`. Updates predicate value in session.
7. Build `<ExistingSegmentMatch>`. Pill that says *"Matches existing seg-cfm-loss-streak-… · 84,200 UIDs"*. Click → `/segments/{id}` (new tab).
8. Build `<StageSegment>`. On mount or stage advance: build predicate, fetch audience, run match. Render predicate / audience / slider / match pill / 3 action buttons.
9. Wire dispatch handlers in `compose-page.tsx`. On approve: `STAGE_ADVANCE: segment`. On hop-back during stale: re-run all 3 computations.
10. Test: full flow from intent → features → segment for loss-streak playbook. Verify audience count is real (~23,890 expected based on opportunity data) — ±10% acceptable.

## Success Criteria

- [ ] Stage 2 auto-fetches audience count after stage advance, shows real number
- [ ] Predicate blocks render with rationale chips matching the playbook spec
- [ ] Threshold slider re-fetches audience count on drag (debounced)
- [ ] Cohort breakdown bars render for lifecycle/region/spend tier
- [ ] "Matches existing segment" pill appears for the loss-streak playbook
- [ ] "Open in /segments/new" routes with predicate pre-filled (existing `?from=…` param)
- [ ] Hop-back from stage 3 → modify stage 1 → return to stage 2 triggers re-fetch
- [ ] No file exceeds 200 LOC
- [ ] `pnpm typecheck` passes; `pnpm dev` runs cleanly with stage 2 functional

## Risk Assessment

- **Risk:** query-svc audience-count endpoint not yet deployed in production. **Mitigation:** check at start of phase; if unavailable, use catalog-api `/api/v1/features/{id}/audience-count` for the headline feature only. Plan-level note: this endpoint is referenced as live in `feature-store-demo-script.md`.
- **Risk:** Audience number drifts each fetch (data churn). **Mitigation:** cache per-session; fetch once on advance, refetch only on slider change or stale-recompute.
- **Risk:** Cohort breakdown fixture doesn't match the predicate audience accurately. **Mitigation:** annotate the panel as illustrative; acceptable for demo per the Feature Store Analyst panel precedent.

## Notes for Phase 5+

- Phase 5 reads `session.stages.segment.decision` + audience count + matched-segment ID to compose the campaign card
- "Continue in Campaigns →" route includes session ID + predicate seed
- "Open in /segments/new" already routes correctly per `seg_canvas` `?from=compose-…` param parsing (verify this flow lands clean predicate; may need a small modification to `apps/web/src/modules/segments/canvas.tsx` to accept the new param prefix)
