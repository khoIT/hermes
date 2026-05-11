---
phase: 1
title: "Demo Polish + Compose Status Fix"
status: completed
priority: P0
effort: "0.5d"
dependencies: []
---

# Phase 1: Demo Polish + Compose Status Fix

## Overview

Four small surgical fixes that close gaps in the existing forward-edge flows + revert the Compose plan's lying status. No new components, no architecture moves — pure polish and correctness so the demo flow doesn't dead-end.

## Requirements

**Functional:**
- `action_card_campaign` Confirm navigates to `/campaigns/{id}` (mirroring segment behavior).
- Activate flow lands on monitoring page with banner: "Activated · Source: {thread title}" if `sourceThreadId` is set (banner hidden if not).
- Multi-turn registry returns a graceful fallback response when keyword miss occurs (instead of returning the last canned response or breaking).
- User-message rendering shows a tiny `Q` marker so questions read as questions not section headers.
- `260510-0045-agents-compose-canvas/plan.md` frontmatter status reverts `completed -> pending` with deferral note.

**Non-functional:**
- Each change ≤30 LOC; surgical, no regressions on existing chat flows.
- Q-marker must not affect existing thread fixture rendering (icon prefix, not text mutation).

## Architecture

| Change | Surface | Pattern |
|---|---|---|
| Campaign Confirm nav | `action-card-campaign.tsx` | After successful POST, `navigate(/campaigns/${id})` (already pattern in segment card) |
| Activate banner | `monitoring.tsx` | Read `sourceThreadId` from campaign record, look up title via `thread-title-lookup.ts` (created in Phase 2 — guard with optional chaining for Phase 1 standalone) |
| Registry fallback | `multi-turn-registry.ts` | When `getMultiTurnResponse(threadId, text)` returns null AND no scripted match, return `genericFallbackResponse(text)` instead of throwing |
| Q-marker | `user-message.tsx` + `thread-header.tsx` | Prefix H1/H2 with `<HelpCircle size={14}/>` icon (lucide-react), 8px gap |
| Compose status fix | `260510-0045-agents-compose-canvas/plan.md` | YAML frontmatter edit: `status: completed -> pending`; add 1-line note in body |

## Related Code Files

- **Modify:**
  - `apps/web/src/components/chat/action-cards/action-card-campaign.tsx` — add navigate-on-confirm
  - `apps/web/src/modules/campaigns/prelaunch.tsx` — pass sourceThreadId through activate
  - `apps/web/src/modules/campaigns/monitoring.tsx` — render activate banner if `sourceThreadId`
  - `apps/web/src/data/chat/multi-turn-registry.ts` — add `genericFallbackResponse()` export + wire fallback path
  - `apps/web/src/utils/chat-respond.ts` — call fallback when registry miss occurs
  - `apps/web/src/components/chat/user-message.tsx` — add HelpCircle icon prefix
  - `apps/web/src/components/chat/thread-header.tsx` — add HelpCircle icon prefix (slightly larger size)
  - `plans/260510-0045-agents-compose-canvas/plan.md` — frontmatter status revert + deferral note

- **Create:** none

- **Delete:** none

## Implementation Steps

1. **Compose plan housekeeping** (5 min)
   - Edit `plans/260510-0045-agents-compose-canvas/plan.md` frontmatter: `status: completed` -> `status: pending`.
   - Add bullet under Overview: "Note (2026-05-10): Code not yet implemented; deferred post-May-12 demo. See `plans/260510-1640-chat-artifact-connectivity` for May-12 scope."

2. **Campaign Confirm navigation** (10 min)
   - Open `action-card-campaign.tsx`. Find the existing `onConfirm` handler that POSTs.
   - After successful POST, mirror segment card pattern: `navigate(/campaigns/${created.id})`.
   - Verify the existing toast pattern stays intact for parity.

3. **Activate banner** (20 min) — **red-team revision: gated behind Phase 2**
   - Phase 1 ships the banner ONLY if Phase 2's `thread-title-lookup.ts` is present. If Phase 2 hasn't landed yet, this step is skipped (banner code stays in a feature flag).
   - When unblocked: in `prelaunch.tsx` activate handler, ensure `sourceThreadId` is passed from campaign record into post-activate state.
   - In `monitoring.tsx`, near the header, render: `{campaign.sourceThreadId && <ActivateBanner threadId={…} />}`. Banner copy: "🎯 Activated 8s ago · Source: '{thread title}' →" with link to `/chat/{threadId}`.
   - Phase 2 ultimately replaces this banner with the shared `<SourceThreadPill>`.
   - **Rationale:** red-team flagged the original "ship-broken-but-silent" pattern as a demo footgun. Hidden > broken-fallback.

4. **Registry fallback** (15 min)
   - In `multi-turn-registry.ts`, export `genericFallbackResponse(text: string): AssistantMessage` returning a short narrative ("Let me explore that angle — here's what stands out…") + 2 generic follow-up chips that map to existing scripted scenarios ("Show me at-risk segments", "Compare to last week").
   - In `chat-respond.ts`, where multi-turn lookup returns null + no canned response matches, call `genericFallbackResponse(text)` instead of dropping.

5. **Q-marker** (10 min)
   - In `user-message.tsx`, add `<HelpCircle size={14} style={{ color: T.n500, marginRight: 6, verticalAlign: 'middle' }} />` before the text span.
   - In `thread-header.tsx`, same icon at `size={18}` with appropriate spacing.
   - Verify alignment doesn't shift line-height; consider `display: inline-flex; align-items: baseline` on the wrapper if needed.

6. **Verification:**
   - `pnpm --filter @hermes/web typecheck`
   - Manual smoke: open existing thread, confirm Q icon appears on H1; type a fully off-script question, confirm fallback fires.

## Success Criteria

- [x] Compose plan frontmatter shows `status: pending` + deferral note.
- [x] Clicking "Confirm" on a campaign action card navigates to `/campaigns/{id}` within 300ms.
- [x] Activating a campaign created with `sourceThreadId` shows a banner on `/campaigns/{id}` linking back to the chat thread.
- [x] Typing an off-script question in any open thread renders a graceful fallback response with 2 generic follow-up chips.
- [x] Every user message and ThreadHeader shows a small `❓` icon prefix.
- [x] No existing scripted thread regresses (turn 1 / 2 / 3 still play correctly for thread-005..008).
- [x] `pnpm typecheck` clean for `apps/web`.

## Risk Assessment

- **Risk:** Q-marker icon shifts thread layout, looks misaligned vs existing fixture screenshots.
  - **Mitigation:** Use `vertical-align: middle`; test against thread-005..008 screenshots before merging.
- **Risk:** Registry fallback over-triggers and replaces legitimate scripted matches.
  - **Mitigation:** Fallback is the last branch in `respondToText` after all keyword + multi-turn checks; covered by manual smoke against scripted threads.
- **Risk:** Activate banner shows undefined thread title if `thread-title-lookup` isn't built yet (Phase 2).
  - **Mitigation:** Guard with optional chaining + fallback string ("Source: chat thread"); Phase 2 tightens the lookup.
