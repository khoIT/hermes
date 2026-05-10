# Segment Detail View Redesign

Date: 2026-05-10
Branch: `actioneer`
Plan: [`plans/260510-1847-segment-detail-redesign/`](../../plans/260510-1847-segment-detail-redesign/plan.md)

## What shipped

Restructured `/segments/:id` from 7 redundant tabs to 5 LiveOps-PM-aligned
tabs: **Overview · Composition · Users · Predicate · Campaigns**. Added a
hero header with name, count, drift pill, source-thread pill, and right-side
action bar (Pin · SQL · Send campaign · Rebuild · ⋯). The Canvas/Threshold
edit experience folds into a merged Predicate tab — read-mode by default,
visible `[Edit]` button + `e` keyboard shortcut + `?edit=1` deeplink
into edit mode, sticky Save/Discard ribbon during edit.

7 phases, 1 typecheck/build cycle, no failing tests.

## Files

- 16 created (5 tab pages, 4 composition cards + primitives, 4 overview
  components, 1 read-view, synth utility, csv export, override map, edit-mode
  context, `useSegment` hook).
- 6 modified (`detail-tabs.tsx`, `detail-layout.tsx`, `routes.tsx`,
  `library.tsx`, `segments-client.ts`, `action-card-segment.tsx`).
- 1 deleted (`monitoring.tsx` — content lifted into Overview tab via
  `<SegmentSizeChart>`).

## Key decisions

- **Override map for predicate Save.** `allSegments` is a static module
  import — runtime predicate edits cannot mutate it. `useSegment(id)` reads
  override-then-catalog via `useSyncExternalStore`; `updateSegment(id, patch)`
  writes to the override map and PATCHes the backend best-effort. WeakMap
  cache keyed on (base, override) keeps snapshot stability.
- **AST ↔ internal-predicate converters in `predicate.tsx`.** Contract
  shape uses `groups[].conditions[]` with `op`; the canvas reducer uses
  `groups[].rows[]` with `operator`. Round-trip via two pure converters,
  same pattern as `canvas.tsx`.
- **Pin/SQL/Duplicate/Archive/Export ship disabled.** Per red-team
  mitigation #8, placeholder behaviour reads worse than absent on demo
  machines. Visual slot preserved with "Coming soon" tooltip.
- **PRNG isolation per generator.** Every synth generator instantiates a
  fresh `mulberry32(hashSegmentId(id))` — no module-level shared PRNG state,
  so call order across Composition + Users + Overview generators doesn't
  couple results. "Demo data" pill on synth cards (Composition, vs-All,
  Trend, Overlap) prevents demo-day "where did 14.2% come from?" footgun.
- **`audienceRef` not `segmentId`.** Phase 6 filters campaigns on the
  contract field that actually exists. `lift` column shows `—` rather than
  synthesize numbers that read as real.
- **`RedirectWithSearch` wrapper preserves `?search` + `#hash`.** React
  Router v6 `<Navigate>` does not preserve query strings — bookmarked
  `/canvas?focus=row3` URLs would lose state without this. Three legacy
  redirects flow through it: `/canvas → /predicate`, `/monitoring → /`,
  `/threshold → /predicate`.
- **`e` shortcut guards.** Skips when any input/textarea/select/contenteditable
  is focused, when any `role=combobox|listbox|menu|dialog|textbox` ancestor
  exists, when any modifier (ctrl/meta/alt/shift) held. Bare `e` only.

## Verification

- `pnpm --filter @hermes/web typecheck` — clean.
- `pnpm --filter @hermes/web build` — clean (1.21 MB main bundle, expected).
- 5 tabs render in correct order; hero header mounts; legacy `/canvas`,
  `/monitoring`, `/threshold` redirects fire.

## Unresolved

- **Custom date range** in Overview chart shows preset options only — true
  date-pair picker deferred.
- **Threshold popover from read-mode** not yet wired (Tune button is in the
  read-view component but no popover renderer in this phase). Edit-mode
  composer keeps its existing `inline-threshold-playground.tsx` flow.
- **Pin/SQL/overflow actions** ship disabled — needs a follow-up polish
  pass once Pin-to-board widget contract for non-chart payloads is settled.
- **Real backend `PATCH /api/v1/segments/:id`** route not yet verified in
  `apps/catalog-api` — `updateSegment` falls back to override-map-only when
  the route is absent. Demo machine works either way.
