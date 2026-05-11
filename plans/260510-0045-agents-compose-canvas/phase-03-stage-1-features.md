---
phase: 3
title: "Stage 1 — Features"
status: pending
priority: P1
effort: "6h"
dependencies: [1, 2]
---

# Phase 3: Stage 1 — Features

## Overview

The first stage card. Agent proposes 3–5 features from the catalog (sourced from the matched playbook); user approves / swaps / drops. Includes the side drawer with two tabs (`Suggested` / `All features`) for swap and detail viewing. After this phase, a user can complete stage 1 end-to-end for the canonical loss-streak playbook.

## Requirements

- **Functional:**
  - Stage 1 expands automatically when intent submitted
  - Each proposed feature row shows: provenance dot, feature name, plain-English rephrase, rationale chip (`core signal` / `filter bots` / `avoid spam` / `cohort filter`), mini-distribution sparkline, threshold hint, three actions (Approve / Swap / Drop)
  - "Open in Feature Store" link on each row → opens side drawer with full detail (existing Feature Store detail components reused)
  - Swap drawer: two tabs — `Suggested` (correlated features via `/api/v1/features/{id}/correlated`, falls back to playbook-provided alternatives) and `All features` (filterable list reusing data from `/api/v1/features`)
  - Approval gate: "Continue to segment →" CTA disabled until ≥1 feature approved; enabled state pulses subtly
  - Stage card collapses to one-line summary on advance: *"3 features approved · consecutive_ranked_losses_streak ≥ 5 · …"*
  - On hop-back from a later stage: re-expand, show all original rows, mark stage `reviewing` again
- **Non-functional:**
  - Drawer animation 200ms ease-out
  - Live-fetch correlated features but cache per-feature for the session
  - Files ≤ 200 LOC

## Architecture

```
_components/
  stage-stepper.tsx             ← replaces stage-stepper-shell, manages collapse/expand (~150 lines)
  stage-features.tsx            ← Stage 1 content (~180 lines)
  feature-row.tsx               ← single proposed feature row (~140 lines)
  feature-swap-drawer.tsx       ← side drawer with 2 tabs (~180 lines)
  feature-detail-drawer.tsx     ← read-only "view in Feature Store" drawer (~120 lines, may share scaffold with swap drawer)
  rationale-chip.tsx            ← shared chip primitive (~40 lines)
  provenance-dot.tsx            ← shared dot primitive (~30 lines)
```

### Drawer behavior

Both drawers use the same `<SideDrawer>` shell (extracted as a primitive). One drawer instance at a time, controlled by `composeUiState` local to `compose-page.tsx`:

```ts
type DrawerState =
  | { kind: 'closed' }
  | { kind: 'detail'; featureId: string }
  | { kind: 'swap'; replacingRowId: string; tab: 'suggested' | 'all' };
```

### Approve flow

1. User clicks **Approve** on row → `dispatch({ type: 'FEATURE_APPROVE', rowId })`
2. Reducer moves row from `proposed` → `approved`, no other side effect
3. When ≥1 row approved AND no rows left in proposed (or user clicks "Continue to segment →"), `dispatch({ type: 'STAGE_ADVANCE', from: 'features' })`
4. Reducer marks `features.status = 'approved'`, `segment.status = 'computing'` (Phase 4 picks this up)

## Related Code Files

- **Create:**
  - `apps/web/src/modules/agents/compose/_components/stage-stepper.tsx`
  - `apps/web/src/modules/agents/compose/_components/stage-features.tsx`
  - `apps/web/src/modules/agents/compose/_components/feature-row.tsx`
  - `apps/web/src/modules/agents/compose/_components/feature-swap-drawer.tsx`
  - `apps/web/src/modules/agents/compose/_components/feature-detail-drawer.tsx`
  - `apps/web/src/modules/agents/compose/_components/side-drawer.tsx` (shared shell)
  - `apps/web/src/modules/agents/compose/_components/rationale-chip.tsx`
  - `apps/web/src/modules/agents/compose/_components/provenance-dot.tsx`
- **Modify:**
  - `apps/web/src/modules/agents/compose/compose-page.tsx` — replace shell with real stepper, add drawer state
- **Reuse:**
  - Feature Store detail panels (`apps/web/src/modules/feature-store/_components/...`) for swap drawer's "All features" tab and the read-only detail drawer
  - `getAllFeatures()` snapshot from `apps/web/src/data/catalog/features/index.ts`

## Implementation Steps

1. Extract `<SideDrawer>` primitive: right-side fixed pane, 480px wide, backdrop, close on Esc/backdrop click. Shared by both drawers.
2. Build `<ProvenanceDot>` and `<RationaleChip>` primitives matching existing Feature Store visual language.
3. Build `<FeatureRow>` consuming a `ProposedFeatureRow`. Props: `row`, `onApprove`, `onSwap`, `onDrop`, `onViewDetail`. No internal state — pure render.
4. Build `<StageFeatures>`. Lists rows via `<FeatureRow>`, shows the "Continue to segment →" CTA when gate met, dispatches stage advance.
5. Build `<StageStepper>`. Receives `session.activeStage` + `stages` slice. Renders 3 cards; only the active one is expanded; completed ones show summary + "Edit" affordance.
6. Build `<FeatureDetailDrawer>`: takes `featureId`, fetches from cached snapshot (or `/api/v1/features/{id}` if not in snapshot). Reuses Feature Store detail panels (provenance card + distribution + cohort breakdown).
7. Build `<FeatureSwapDrawer>`: two tabs.
   - `Suggested` tab: calls `/api/v1/features/{currentFeatureId}/correlated`, lists top 5 by correlation; fallback to playbook's provided alternatives if API fails or empty.
   - `All features` tab: filterable list of all features (search + provenance filter), reuses Feature Store library row component.
   - Click "Use this" → `dispatch({ type: 'FEATURE_SWAP', rowId, newFeatureId })`, drawer closes.
8. Wire `compose-page.tsx`: drawer state, drawer mounting, dispatch handlers.
9. End-to-end test: load `/agents/compose`, type loss-streak intent, approve 3 features, see stage 1 collapse + stage 2 placeholder activate.

## Success Criteria

- [ ] Stage 1 auto-expands after intent submit; renders 3 rows for loss-streak playbook
- [ ] Approve / Drop work and update the rows visibly
- [ ] Swap drawer opens, both tabs render real catalog data, selecting a new feature replaces the row
- [ ] "Open in Feature Store" opens the detail drawer with real distribution and cohort breakdown
- [ ] "Continue to segment →" CTA disabled until ≥1 approval; enabled afterward
- [ ] Stage 1 collapses to one-line summary after advance; clicking summary re-expands and re-marks `reviewing`
- [ ] No file exceeds 200 LOC (drawer shell may shave content via composition)
- [ ] `pnpm typecheck` passes

## Risk Assessment

- **Risk:** Reusing Feature Store panels inside the drawer pulls in too much (sticky headers, page-level layout). **Mitigation:** identify the smallest existing component (likely `SourceProvenanceCard` + `CoverageSegmentation`) and embed those directly; if scaffold leaks, copy the panel and trim.
- **Risk:** `/correlated` endpoint flaky during demo. **Mitigation:** cache last successful response per feature; fall back to playbook-provided alternatives on error.
- **Risk:** Drawer tab state lost when user closes/reopens. **Mitigation:** persist `tab` in `composeUiState` until drawer closes via different feature row.

## Notes for Phase 4+

- Phase 4 reads `session.stages.features.approved` to compute the predicate
- `STAGE_ADVANCE` from features → segment dispatched here triggers Phase 4's audience-count fetch
- Hop-back behavior: clicking the collapsed stage 1 summary while stage 2 or 3 is open dispatches `STAGE_REOPEN`, which marks downstream stale (reducer logic from Phase 1)
