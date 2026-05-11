---
phase: 5
title: "Refinement Playbooks + Resize + Apply"
status: pending
priority: P2
effort: "1.5–2d"
dependencies: []
demo_status: "POST-DEMO — moved out of May-12 scope per red-team review"
---

# Phase 5: Refinement Playbooks + Resize + Apply

## Overview

Extend the existing `<ChatRail>` (already built per `260510-1519`) with three new capabilities, all delivered for **segments only** in this phase:

1. **Resize handle** — drag-to-resize on left edge, persisted width.
2. **Refinement playbook** — keyword-keyed scripted responses that suggest concrete predicate clauses for the segment in scope, each with a one-click **Apply** button.
3. **One-click Apply** — mutates the segment's predicate via `segments-client.update()` with optimistic UI + 5s undo toast.

This is the demo's "magic moment" per the user's mockup screenshots: open the rail on a segment detail page, ask "can you change this organic power users segment", get back 3–4 actionable filter suggestions, click Apply, watch audience count update inline. Phase 6 rolls the same shell to boards/campaigns/features.

## Requirements

**Functional:**
- Rail width persists in localStorage (`hermes.chat-rail.width.v1`), default 400px, min 320px, max 640px.
- Drag handle on left edge of rail, 4px wide, cursor: col-resize, hover/active visual feedback.
- When rail is open on a `/segments/:id` page, the placeholder shows "What do you want to know?" + scope chip "Segments".
- Free-text refinement keywords trigger scripted playbook responses:
  - "refine" / "change" / "add condition" -> RefinementResponse with 3–4 clause cards
  - "increase engagement" / "tighten" / "narrow" -> NarrowResponse + audience preview
  - "ios vs android" / "compare platforms" -> ComparisonResponse + sample chart
  - "tier-1" / "filter to" / "geographic" -> GeoFilterResponse with country picker
  - generic refinement fallback for any "modify this segment" intent miss
- Each `<RefinementAction>` row shows clause text + Apply button. Click Apply:
  - Optimistic UI: predicate updates in detail page immediately
  - Audience count fetched via `/api/v1/audience/count` and updates within 800ms
  - Toast pops with 5s "Undo" affordance — Undo reverts predicate
- Threads created via the rail are tagged with `scope: { type: 'segment', id: <segmentId> }` and visible in sidebar Recent Chats with a small segment-icon indicator.

**Non-functional:**
- Resize must not cause layout thrash; main content compresses smoothly.
- Apply must not block UI > 200ms; failures revert state + toast error.
- Each new component ≤200 LOC.

## Architecture

### Resize

```
<ChatRail>
  ├── <ResizeHandle> (NEW, absolute-positioned on left edge)
  │     onDragStart -> setDragging(true), capture initial mouseX
  │     onDrag      -> compute delta, clamp [320, 640], call setRailWidth
  │     onDragEnd   -> persist localStorage
  └── (existing header / body / input)
```

`chat-rail-store.ts` already exports `RAIL_WIDTH`. Refactor: add `getRailWidth()`, `setRailWidth()`, `onRailWidthChange()`.

### Refinement playbook routing

```
user types into rail
   |
   v
respondToText(text, threadId, scope)
   |
   v
if scope?.type === 'segment':
   contextualPlaybooks.match(text, scope) -> PlaybookResponse | null
   if null -> fallback to existing intent matcher
```

`contextual-playbooks.ts` exports keyword maps per scope type:

```ts
export const SEGMENT_REFINEMENT_PLAYBOOK = {
  'refine|change|add condition': segmentRefineResponse,
  'increase|tighten|narrow':     segmentNarrowResponse,
  'ios|android|platform':         segmentPlatformCompareResponse,
  'tier-1|filter to|country':     segmentGeoFilterResponse,
  '*':                            segmentGenericRefinementResponse,
};
```

Each response builder receives the segment context (id + predicate + audience) and returns `AssistantMessage` with `<RefinementAction>` rows.

### One-click Apply

```
<RefinementAction clause={…} onApply={handleApply} />
   |
   v on click
applySegmentRefinement(segmentId, clause)
   |
   v
1. Snapshot current predicate -> stash in undo buffer
2. Compute new predicate (merge clause)
3. Optimistic update: emit predicate-changed event, detail page subscribes
4. POST audience-count to compute new size
5. PATCH /segments/:id with new predicate
6. Show toast: "Filter applied · 3,974 -> 2,816 users · Undo"
7. Toast 5s timer. Undo click: revert predicate from snapshot + PATCH.
```

## Related Code Files

- **Modify:**
  - `apps/web/src/components/chat-rail/chat-rail.tsx` — mount `<ResizeHandle>`, read width from store
  - `apps/web/src/utils/chat-rail-store.ts` — width getters/setters + listener pattern (mirror sidebar-collapsed-store)
  - `apps/web/src/utils/chat-respond.ts` — accept optional `scope` param, route to contextual playbook first
  - `apps/web/src/data/chat/types.ts` — add `scope?: ConversationScope` to `Conversation`
  - `apps/web/src/utils/chat-store.ts` — persist scope in createThread; expose getter
  - `apps/web/src/components/chat-rail/page-context-chip.tsx` — emit scope into createThread on submit
  - `apps/web/src/components/sidebar/recent-items.tsx` — render small icon indicator if `thread.scope` is set
  - `apps/web/src/modules/segments/_components/detail-layout.tsx` — subscribe to predicate-changed event, refetch audience-count on apply

- **Create:**
  - `apps/web/src/components/chat-rail/resize-handle.tsx`
  - `apps/web/src/components/chat-rail/refinement-action.tsx` — Apply button row
  - `apps/web/src/data/chat/contextual-playbooks.ts` — keyword maps per scope type
  - `apps/web/src/data/chat/responses/segment-refinement-responses.ts` — builders for each refinement playbook
  - `apps/web/src/utils/segment-refinement-apply.ts` — apply + undo logic
  - `apps/web/src/utils/predicate-merge.ts` — pure function: `mergePredicateClause(existing, clause): Predicate`

- **Delete:** none

## Implementation Steps

1. **Width persistence** (45 min)
   - Refactor `chat-rail-store.ts`: replace `RAIL_WIDTH` constant with `getRailWidth()` reading localStorage (default 400), `setRailWidth(n: number)`, `onRailWidthChange(cb)` (event-based).
   - `chat-rail.tsx` reads width via `useSyncExternalStore` with `getRailWidth()` snapshot — make sure the snapshot is reference-stable (simple number is fine; learnings from prior `useSyncExternalStore snapshot stability` apply).

2. **`<ResizeHandle>`** (1.5h)
   - Component absolute-positioned at `left: -2px`, `width: 4px`, `top: 0`, `bottom: 0`.
   - On mousedown: capture initial clientX + initial width, attach mousemove + mouseup listeners on document.
   - mousemove: `next = clamp(initial - (e.clientX - startX), 320, 640)` — minus sign because rail is on right.
   - mouseup: `setRailWidth(next)` (persists), remove listeners.
   - Hover state: `background: T.brand`. Active drag: same + cursor: col-resize on document.body.
   - Accessibility: `role="separator"`, `aria-orientation="vertical"`, keyboard `ArrowLeft/ArrowRight` to nudge ±20px.

3. **Conversation scope** (45 min)
   - Extend `Conversation` type with `scope?: { type: 'segment' | 'board' | 'campaign' | 'feature'; id: string }`.
   - `chat-store.createThread` accepts optional scope; persists in storage.
   - `<ChatRail>.submit`: when creating new thread on a detail page with `ctx`, pass scope `{ type: ctx.entityType, id: ctx.entityId }`.

4. **Contextual playbook router** (45 min)
   - `contextual-playbooks.ts`: export `matchContextualPlaybook(text, scope, getters)` -> `AssistantMessage | null`.
   - For now wires only segment scope. Other scopes return null (Phase 6 fills them).
   - `chat-respond.ts`: when called with scope, try `matchContextualPlaybook` first; if null, fall through to existing matcher.

5. **Segment refinement responses** (2h)
   - 5 response builders in `segment-refinement-responses.ts`:
     - `segmentRefineResponse(seg)` — narrative ("This segment can be refined by adding…") + 3 RefinementAction rows (e.g., monetization threshold, retention filter, deep engagement).
     - `segmentNarrowResponse(seg)` — narrative + RefinementAction row to add a tightening clause + audience-delta preview chart.
     - `segmentPlatformCompareResponse(seg)` — narrative + comparison chart (iOS vs Android sample data) + 2 RefinementActions for splitting segment by platform.
     - `segmentGeoFilterResponse(seg)` — narrative + country picker + RefinementAction to add `country_code IN (…)` clause.
     - `segmentGenericRefinementResponse(seg)` — fallback "Let me explore that — here's what stands out" with 2 generic clauses.
   - Each response computes against the live segment's current predicate (passed in via getters).

6. **`<RefinementAction>`** (1h)
   - Renders single clause card: clause description text, predicate preview pill (e.g., `net_revenue > $10`), Apply button.
   - Apply onClick -> calls passed-in `onApply(clause)` handler.
   - Disabled state during apply in flight (200ms minimum).

7. **Apply + undo logic** (2h)
   - `segment-refinement-apply.ts`:
     - `applyRefinement(segmentId, clause): Promise<ApplyResult>` — snapshot, merge predicate via `predicate-merge.ts`, PATCH, fetch new audience-count, return result.
     - `revertRefinement(segmentId, snapshot): Promise<void>` — PATCH back.
     - `showApplyToast(result, onUndo)` — 5s toast with "Undo" link.
   - Predicate-changed event: emit on window via custom event so segment detail page can refetch audience count.
   - Detail page subscribes to `hermes:segment-changed` event; on receipt, refetch + animate count change.

8. **Sidebar scope indicator** (30 min)
   - In `recent-items.tsx`, when rendering a chat item with `thread.scope`, prepend a small icon (Users / Layers / Send / Database based on scope type) at 12px size.
   - Tooltip: "Scoped to {scope.type}: {scope.entityName}".

9. **Verification:**
   - Drag rail handle from 400px to 520px, refresh — width persists.
   - Drag below 320px — clamps. Drag above 640px — clamps.
   - Open `/segments/{id}` -> rail open -> type "refine this segment" -> playbook responds with 3 RefinementActions.
   - Click Apply on first action -> predicate updates in segment detail header within 800ms; toast pops with Undo.
   - Click Undo within 5s -> predicate reverts.
   - Test "ios vs android" -> comparison chart renders inline.
   - Test totally off-script "what about retention?" -> generic fallback fires.
   - Sidebar shows segment-icon next to scoped threads.
   - `pnpm typecheck` clean.

## Success Criteria

- [ ] Resize handle works smoothly; width persists across reloads.
- [ ] All 5 segment refinement playbook entries respond to their keywords with appropriate RefinementActions.
- [ ] One-click Apply mutates predicate optimistically + audience count updates <800ms.
- [ ] Undo within 5s reverts predicate.
- [ ] Threads created via rail on segment detail show scope indicator in sidebar.
- [ ] Existing chat-rail flow (page-context chip, scripted prompts, recent threads) unaffected.
- [ ] No regressions on `/segments/:id` predicate composer.
- [ ] Typecheck clean.

## Risk Assessment

- **Risk:** Resize handle conflicts with sticky-left sidebar drag (rare but possible).
  - **Mitigation:** Sidebar collapse uses click, not drag — no conflict at the layer level.
- **Risk:** `useSyncExternalStore` snapshot for rail width returns new object refs, infinite-loops React.
  - **Mitigation:** Width is a primitive number — referentially stable by definition. Memo edge: `getSnapshot` must always return the same number for the same state.
- **Risk:** Apply optimistic update gets out of sync with actual server state if PATCH fails.
  - **Mitigation:** On PATCH error, revert optimistic state + toast error.
- **Risk:** Predicate-merge produces invalid predicates (e.g., merging into wrong group).
  - **Mitigation:** `predicate-merge.ts` is a pure function — exhaustively unit-test merge behavior for AND-of-OR + exclusion paths.
- **Risk:** Demo timing budget pushed >90s by predicate refinement step.
  - **Mitigation:** Phase 5 is stretch; demo arc (Phase 4) ends at activate before refinement is needed. Refinement is its own beat.
- **Risk:** Audience-count API (:3002) flaky during demo.
  - **Mitigation:** Cache last-known count + 1s timeout + cheerful "Estimating…" placeholder.
- **Risk:** Phase 5 components grow >200 LOC each.
  - **Mitigation:** Decompose response builders into per-playbook files if needed.
