---
phase: 5
title: "Predicate Tab + Edit Toggle"
status: completed
priority: P0
effort: "1.5d"
dependencies: [1]
---

# Phase 5: Predicate Tab + Edit Toggle

## Overview

Implements `/segments/:id/predicate` with a static read-only render of the segment's `PredicateAST` by default and a visible `[✏ Edit]` button + `e` keyboard shortcut + `?edit=1` deeplink that flips into the existing reducer-backed canvas composer. Sticky Save/Discard ribbon during edit. Threshold tool inline per condition row via popover (reuses existing `threshold-deep`). `/segments/:id/canvas` redirect (added in Phase 1) lands here.

## Requirements

**Functional:**
- `/segments/:id/predicate` shows read-mode by default: hierarchical group blocks with feature pills and operator/value tokens, separated by AND/OR labels.
- Top-right `[✏ Edit]` button (visible always, primary brand color).
- Keyboard: pressing `e` (when no input has focus) toggles to edit mode.
- `?edit=1` query param: load directly in edit mode (also accept `?edit=true`).
- Edit mode wraps the existing `<PredicateComposer>` (from `_composer/predicate-composer.tsx`) backed by `canvas-reducer` state initialized from `seg.predicate`.
- During edit: sticky bottom ribbon — `[Discard] [Save]`. Save calls `segments-client.update(id, { predicate: dispatchedState.predicate })` and returns to read mode + refreshes audience count. Discard reverts to original `seg.predicate` and exits.
- Per-condition threshold tool: each row in read mode shows a small "📊 Tune" affordance opening `<ThresholdDeep>` in a popover scoped to that single condition. In edit mode the same affordance lives inside the row.
- `/segments/:id/canvas` redirect (Phase 1) and `/segments/:id/threshold` redirect both terminate here.

**Non-functional:**
- `predicate.tsx` ≤180 LoC (orchestrates read/edit toggle + ribbon).
- `predicate-read-view.tsx` ≤180 LoC (pure renderer over `PredicateAST`).
- No new dependencies.
- Exit-without-save warns via `beforeunload` if there are unsaved edits.

## Architecture

```
predicate.tsx
  state: mode = 'read' | 'edit'
  effects:
    - parse ?edit query param → initial mode
    - keyboard listener for 'e' (skip if document.activeElement is input/textarea)
    - beforeunload listener while in edit + dirty
  render:
    if (mode === 'read') {
      <PredicateReadView predicate={seg.predicate} onTuneRow={openThresholdPopover}/>
      <button [Edit] onClick={() => setMode('edit')}/>
    } else {
      <PredicateComposer
         dispatch={canvasDispatch}
         state={canvasState}
         onTuneRow={openThresholdPopover}
      />
      <SaveRibbon onSave={handleSave} onDiscard={handleDiscard} dirty={dirty}/>
    }

predicate-read-view.tsx
  walks PredicateAST → renders group blocks
  group: card with "{i+1}. {label or implicit}" header + AND-joined rows
  row: <feature-pill> + <op-token> + <value-pill> + <tune-button>
  groups joined by visual "OR" divider
  exclusions section at bottom: "Exclude where ..." with same row layout
```

Threshold popover: reuse `threshold-deep.tsx` (currently a route component) by extracting a render-only component or by mounting it inside a `Popover` shell. If extraction is non-trivial, ship a minimal inline threshold preview (single-feature threshold playground from `_composer/inline-threshold-playground.tsx` already exists — wrap that).

## Related Code Files

**Create:**
- `apps/web/src/modules/segments/predicate.tsx`
- `apps/web/src/modules/segments/_components/predicate-read-view.tsx`

**Modify:**
- `apps/web/src/routes.tsx` — replace `predicate` Phase-1 stub with `<Predicate/>`.
- `apps/web/src/modules/segments/_composer/predicate-composer.tsx` — accept optional `onTuneRow(rowId)` callback prop (≤10 LoC change).

**Reuse (no modification needed):**
- `_state/canvas-reducer.ts`
- `_state/predicate-types.ts`
- `_composer/inline-threshold-playground.tsx` (for popover content)
- `api/segments-client.ts` (`update` method — verify exists; if not, add ≤20 LoC)

**Delete:** none in this phase. `threshold-deep.tsx` remains as a possible deep route but is no longer reachable through the tab strip.

## Implementation Steps

0. **Pre-flight backend verification (BLOCKING — do first)** (45 min)
   - Verify `apps/catalog-api` exposes `PATCH /api/v1/segments/:id` accepting `{ predicate: PredicateAST }` payload. If not, add the route + service method in this same phase (budget already includes this).
   - Verify `apps/web/src/api/segments-client.ts` (real path — NOT under modules/segments) — currently exports only `createSegment`. Add `updateSegment(id, patch)` and (if needed) `rebuildSegment(id)`.
   - Decide post-save state strategy: `allSegments` is a **static catalog import** (immutable) — Save cannot mutate it directly. Options:
     - (a) Maintain a `segmentOverrides` map in a small Zustand-style store; `useSegment(id)` reads from override-then-catalog. Lightweight (~40 LoC).
     - (b) Refetch through a thin `useSegment(id)` hook that hits `GET /api/v1/segments/:id` after Save.
     - **Pick (a)** for lower latency on demo machines.
   - Verify `apps/web/src/modules/segments/_composer/inline-threshold-playground.tsx` exists and is reusable in popover form. If absent, fall back to a one-feature inline threshold viz (not the full `threshold-deep` page).

1. **`<PredicateReadView>`** (2h)
   - Walk `predicate.groups`: for each group render a card with header "Group {i+1}" + AND-joined rows.
   - Each row: feature-pill (reuse FeaturePill style from composer) + operator (e.g. `>=`, `is`) + value pill.
   - Between groups: vertical "OR" divider.
   - If `predicate.exclusions` present: separate "Exclude where" card at bottom with rows.
   - `onTuneRow?` callback — render small "📊 Tune" button per row when callback provided.

2. **`<Predicate>` orchestrator** (2h)
   - Pull `seg` and `id`. Initial `canvasState` from `seg.predicate` via `initialState({ draftPredicate: seg.predicate })`.
   - URL `?edit=1` → mode = 'edit' on mount.
   - Keyboard listener: `keydown` on `document`, fire only if `e.key === 'e'` AND `document.activeElement?.closest('input, textarea, [contenteditable], [role="combobox"], [role="listbox"], [role="menu"], [role="dialog"], [role="textbox"]')` is null. Skip if any modifier key (ctrl/meta/alt) — only bare `e` triggers.
   - `dirty = !deepEqual(canvasState.draftPredicate, seg.predicate)`.
   - `beforeunload`: if mode === 'edit' && dirty → set returnValue.
   - `handleSave`: call `segments-client.update(id, { predicate: state.draftPredicate })`, on success revert to read mode and refresh `seg` (event bus or local state).
   - `handleDiscard`: dispatch reset action; setMode('read').

3. **Save ribbon** (30 min)
   - Sticky bottom bar (position: fixed, bottom: 16, centered, max-width 600).
   - Two buttons: Discard (ghost) + Save (brand). Show "Unsaved changes" caption when dirty.
   - Hide ribbon when mode === 'read'.

4. **Threshold popover** (1h)
   - Anchored popover (reuse existing popover primitive in codebase if any; else inline absolute-positioned div).
   - Content: `<InlineThresholdPlayground>` for the row's feature.
   - Closes on outside click + Esc.
   - Apply button inside popover writes back to canvas state (edit mode) or no-ops (read mode advisory only).

5. **`segments-client.update`** (30 min)
   - Verify exported in `api/segments-client.ts`. If absent, add `update(id, patch)` that does PATCH `/api/v1/segments/{id}` with the predicate payload.
   - On success: dispatch event bus `'segment:updated'` so `Overview` re-fetches if needed.

6. **Composer prop addition** (15 min)
   - Edit `predicate-composer.tsx`: accept optional `onTuneRow?: (rowId: string) => void` and forward to row components.
   - Existing call sites (e.g. `canvas.tsx` for `/segments/new`) unaffected — prop is optional.

7. **Route swap** (10 min)
   - Edit `routes.tsx`: replace Phase-1 ComingSoon `predicate` element with `<Predicate/>`.
   - Verify `/canvas` and `/threshold` redirects still resolve through the parent layout.

8. **Verification:**
   - Load `/segments/seg-cfm-loss-streak-non-paying-2026-0508-a3f9/predicate` → read view renders with all rows.
   - Click `[Edit]` → composer appears, ribbon shows.
   - Press `e` (no input focused) → toggles modes.
   - Visit `/segments/{id}/predicate?edit=1` → loads directly into edit.
   - Make a change → ribbon shows "Unsaved"; click Discard → reverts; click Save → returns to read with updated predicate.
   - Tune button on a row opens popover; Apply writes back.
   - Visit `/segments/{id}/canvas` → redirects to `/predicate`; visit `/segments/{id}/threshold` → also redirects to `/predicate`.
   - `pnpm typecheck` clean.

## Success Criteria

- [ ] Read-mode renders any seeded `PredicateAST` shape without crash.
- [ ] `[Edit]` button visible and flips to edit mode.
- [ ] `e` shortcut toggles modes (skipped when input focused).
- [ ] `?edit=1` deeplink loads directly in edit mode.
- [ ] Save ribbon shows during edit when dirty.
- [ ] Save persists via `segments-client.update`; read view reflects new predicate.
- [ ] Discard reverts to original predicate.
- [ ] Tune popover opens on row click; Apply writes back in edit mode.
- [ ] `/canvas` and `/threshold` redirects land on `/predicate`.
- [ ] No regression on `/segments/new` standalone composer.
- [ ] `pnpm typecheck` clean.

## Risk Assessment

- **Risk:** `segments-client.update` may not exist — POST-only client.
  - **Mitigation:** Verify in Phase 1 or early Phase 5; add a thin wrapper if absent.
- **Risk:** `threshold-deep.tsx` is route-coupled, not extractable into popover cleanly.
  - **Mitigation:** Use `inline-threshold-playground.tsx` (already a component) as fallback popover content — narrower, but matches need.
- **Risk:** `e` shortcut conflicts with text-editing inside any rich input.
  - **Mitigation:** Strict guard — skip if `activeElement.tagName ∈ {INPUT, TEXTAREA}` or `[contenteditable]`.
- **Risk:** Sticky save ribbon overlaps Phase 1's `ContinueInChatPill` (also bottom-positioned).
  - **Mitigation:** Stack ribbon above pill (z-index higher); offset pill upward when ribbon visible. Both components conditional on context — coordinate via shared positioning constants.
- **Risk:** Beforeunload guard fires unexpectedly on tab close.
  - **Mitigation:** Strict `mode === 'edit' && dirty` check; remove listener on unmount.
- **Risk:** Existing `/segments/:id/canvas` URL is shared in Slack/email — redirect must include the segment id.
  - **Mitigation:** React Router `<Navigate>` with `replace` preserves `:id` from the parent route param.
