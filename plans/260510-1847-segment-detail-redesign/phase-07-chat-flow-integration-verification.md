---
phase: 7
title: "Chat-Flow Integration + Canonical Creation Path"
status: completed
priority: P0
effort: "0.5d"
dependencies: [1, 5]
---

# Phase 7: Chat-Flow Integration + Canonical Creation Path

## Overview

Hardens every chat-thread-to-segment entry point against the redesigned detail surface. Verifies post-create navigation lands cleanly on the new Overview, canonicalizes "Edit existing segment" to use the merged Predicate tab (instead of `/segments/new?from=draft-…`), wires May-12 Phase 5's Refinement Playbooks one-click Apply through the new `updateSegment` + override-map pattern, and resolves the bottom-screen z-index collision between `<ContinueInChatPill>` (May-12) and `<SaveRibbon>` (this plan's Phase 5).

## Requirements

**Functional:**
- Every chat-side segment-creation entry point lands on `/segments/{id}` (Overview) post-confirm:
  - `action-card-segment.tsx` `onView` → `/segments/{id}` ✓ (already correct)
  - `quick-segment-dialog.tsx` post-save navigate ✓ (already correct, May-12 Phase 3)
  - Demo thread T2 confirm flow (May-12 Phase 4) ✓ (uses action-card pattern)
- "Edit existing segment" entry points use `/segments/{id}/predicate?edit=1` (NOT `/segments/new?from=draft-…`):
  - `apps/web/src/modules/segments/library.tsx:448` `onEdit` handler updated.
  - Any other call sites of `?from=draft-…` audited and updated.
  - `/segments/new` standalone route preserved for true new-creation flows (anchor segment, seedFeature flows).
- May-12 Phase 5 Refinement Playbooks (when implemented post-demo) call `updateSegment(id, patch)` from `segments-client.ts` (added in this plan's Phase 5) and trigger override-map refresh so Overview re-renders with new audience count.
- `<ContinueInChatPill>` bottom-right and `<SaveRibbon>` bottom-center coexist without overlap:
  - SaveRibbon takes priority during edit mode (z-index higher).
  - ContinueInChatPill auto-offsets upward (or hides) when SaveRibbon visible.
- E2E smoke: thread T2 → Confirm → `/segments/{id}` Overview → click Predicate tab → click Edit → make change → Save → return to Overview with updated count → click ContinueInChatPill → return to thread with T2 still visible.

**Non-functional:**
- This phase ships **only if** Phase 5 has shipped (depends on `updateSegment` + override-map).
- No new components — pure integration + audit + small handler edits.
- `library.tsx` edit-handler change ≤5 LoC.
- Bottom-stack coordination ≤30 LoC (positioning constants in a shared util or shared via component prop).

## Architecture

```
Chat-side entry points (verify or rewire):

action-card-segment.tsx
  ├─ onConfirm → createSegment() → setCreatedId
  ├─ onView → navigate('/segments/{id}')      ✓ unchanged
  └─ onRefine → navigate('/segments/new?from=chat')   ✓ unchanged (new flow)

quick-segment-dialog.tsx (May-12 Phase 3)
  └─ post-save → navigate('/segments/{id}')   ✓ unchanged

library.tsx
  └─ onEdit (was: '/segments/new?from=draft-{id}')
            now:  '/segments/{id}/predicate?edit=1'   <-- REWIRE

Refinement Playbook Apply (May-12 Phase 5)
  └─ apply → segments-client.updateSegment(id, { predicate })
            → override-map refresh
            → emit 'segment:updated' event (Overview re-renders)

Bottom-screen z-stack:
  z=10  ContinueInChatPill   (auto-offset bottom += 56px when ribbon visible)
  z=20  SaveRibbon            (bottom-center, only during edit mode)
```

Shared positioning constants in `apps/web/src/components/chat-rail/bottom-stack-constants.ts`:
- `CONTINUE_PILL_BOTTOM_DEFAULT = 16`
- `CONTINUE_PILL_BOTTOM_WITH_RIBBON = 72` (16 base + 48 ribbon + 8 gap)
- `SAVE_RIBBON_BOTTOM = 16`

`<ContinueInChatPill>` reads `useEditMode()` context (provided by `<Predicate>` orchestrator in Phase 5) to decide which offset to use. If no provider in scope, defaults to base.

## Related Code Files

**Modify:**
- `apps/web/src/modules/segments/library.tsx` — onEdit handler points to `/segments/{id}/predicate?edit=1`.
- `apps/web/src/components/chat-rail/continue-in-chat-pill.tsx` — read edit-mode context, apply conditional offset.
- `apps/web/src/modules/segments/predicate.tsx` (Phase 5 file) — provide an EditModeContext so the pill can subscribe.
- `apps/web/src/components/chat/action-cards/action-card-segment.tsx` — add canonical-pattern comment block at top.
- `apps/web/src/api/segments-client.ts` — confirm `updateSegment` exported (landed in Phase 5).

**Create:**
- `apps/web/src/components/chat-rail/bottom-stack-constants.ts` — shared positioning constants.
- `apps/web/src/utils/edit-mode-context.tsx` — `<EditModeProvider>` + `useEditMode()` hook.

**Delete:** none.

## Implementation Steps

1. **Audit chat-side segment creation paths** (45 min)
   - Grep for `navigate.*segments` and `href.*segments` across `apps/web/src` to enumerate every entry point.
   - Confirm action-card, quick-dialog, and feature-store flows already navigate to base `/segments/{id}`.
   - Document the canonical pattern in a small comment block at top of `action-card-segment.tsx`:
     ```
     Canonical chat-side segment creation:
       1. createSegment({ ..., sourceThreadId }) -> POST /api/v1/segments
       2. navigate(`/segments/${result.id}`) -> lands on Overview
       3. user clicks Predicate tab -> reads predicate
       4. (optional) clicks Edit -> updateSegment(id, patch) on Save
       5. ContinueInChatPill returns to source thread
     ```

2. **Rewire `library.tsx` onEdit** (15 min)
   - Change line 448: `onEdit={() => navigate('/segments/' + s.id + '/predicate?edit=1')}` (was `/segments/new?from=draft-${s.id}`).
   - Verify no other consumers of `?from=draft-` pattern remain via grep — if any, rewire similarly.

3. **EditModeContext + provider** (45 min)
   - Create `apps/web/src/utils/edit-mode-context.tsx` exporting `<EditModeProvider value={isEdit}>` + `useEditMode(): boolean`.
   - In `predicate.tsx` (Phase 5): wrap content in `<EditModeProvider value={mode === 'edit'}>`.
   - This is a context, not a global store — re-renders only when mode flips.

4. **Bottom-stack positioning constants** (15 min)
   - Create `bottom-stack-constants.ts` with the three constants documented above.
   - Refactor `<ContinueInChatPill>`: import constants, read `useEditMode()` (defensive: hook returns `false` when no provider), set `bottom` style accordingly.
   - Refactor `<SaveRibbon>` (Phase 5 component): import `SAVE_RIBBON_BOTTOM`.

5. **Refinement Playbook integration check** (45 min, conditional)
   - **Only run if** May-12 Phase 5 (Refinement Playbooks) has shipped.
   - Find the playbook Apply handler (in `apps/web/src/components/chat-rail/`) — verify it calls `updateSegment(id, patch)` from `segments-client.ts` (NOT a direct mutation of `allSegments`).
   - Verify it dispatches the `'segment:updated'` event (or equivalent) so Overview re-fetches via the override-map.
   - If May-12 Phase 5 hasn't shipped at integration time, document the contract in a code comment for whoever lands it: "Apply must use `updateSegment` + emit `segment:updated`."

6. **E2E smoke** (45 min)
   - Open `/chat/thread-demo-livops-2026` (May-12 Phase 4 demo arc).
   - T2 confirm action card → land on `/segments/{id}` Overview ✓.
   - Click Predicate tab → read view ✓.
   - Click `[Edit]` → composer + SaveRibbon visible.
   - Verify `<ContinueInChatPill>` shifted up by 56px ✓.
   - Make a trivial predicate change → click Save → return to read mode → Overview audience count refreshed via override-map ✓.
   - Click `<ContinueInChatPill>` → returns to demo thread with T2 still rendered ✓.
   - Click Cancel/Discard path also tested (Save and Discard).

7. **Verification:**
   - All chat-side entry points still functional.
   - `pnpm --filter @hermes/web typecheck` clean.
   - Manual: open Library → click Edit on existing segment → lands on Predicate tab in edit mode (NOT new-canvas).
   - Bottom-stack: pill never overlaps ribbon visually.

## Success Criteria

- [ ] All chat-side segment-creation paths navigate to `/segments/{id}` base (Overview).
- [ ] Library "Edit" button navigates to `/segments/{id}/predicate?edit=1`.
- [ ] No remaining `?from=draft-` patterns for editing existing segments (new flows preserved).
- [ ] `<EditModeProvider>` wraps Predicate tab content; `useEditMode()` returns correct boolean.
- [ ] `<ContinueInChatPill>` auto-offsets when SaveRibbon visible.
- [ ] Refinement Playbook Apply (when present) routes through `updateSegment()` and triggers override-map refresh.
- [ ] E2E demo arc completes: chat → segment → edit → save → back to chat without regression.
- [ ] Canonical creation-path comment block added to `action-card-segment.tsx`.
- [ ] `pnpm typecheck` clean.

## Risk Assessment

- **Risk:** May-12 Phase 5 (Refinement Playbooks) hasn't shipped when this phase runs.
  - **Mitigation:** Step 5 is conditional. If absent, ship a documentation comment in this plan's Phase 5 enforcing the contract. Do not block.
- **Risk:** EditModeContext leaks: pill reads `useEditMode()` even outside Predicate tab → false negatives.
  - **Mitigation:** `useEditMode()` defaults to `false` when no provider. ContinueInChatPill renders only on segment routes, so context is provided where needed. Defensive `|| false`.
- **Risk:** Library edit handler change breaks the "Continue draft" flow in Library start-pills.
  - **Mitigation:** "Continue draft" remains `/segments/new` (new creation from draft). Only the per-row Edit button changes. Distinct controls — separate handlers.
- **Risk:** E2E smoke depends on demo thread fixture which is May-12 Phase 4 — if that hasn't shipped, smoke can't run.
  - **Mitigation:** Plan is `blockedBy` May-12 plan completion (declared at plan.md level). All May-12 phases including Phase 4 must be in before this phase runs.
- **Risk:** Z-index/positioning still collides on small viewports.
  - **Mitigation:** Visual QA step in Step 6 covers a 1280px viewport check. Real fix if collision persists is to stack vertically (pill on top of ribbon) instead of competing for the same anchor — escalate to a follow-up polish task if found.
