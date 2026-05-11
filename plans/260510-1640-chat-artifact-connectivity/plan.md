---
title: "Chat <-> Artifact Connectivity"
description: "Make Hermes feel like a single agent surface. Adds reverse navigation (artifact -> source thread), universal inline CTAs on every assistant response, refinement playbooks with one-click Apply on the existing chat-rail, and a guided 90s demo arc thread that chains Board pin -> Segment -> Campaign in one user session. Six phases, four are May-12 critical."
status: pending
priority: P1
branch: "actioneer"
tags: [demo, may-12, chat, segments, campaigns, boards, frontend, backend]
blockedBy: []
blocks: [260510-1847-segment-detail-redesign]
predecessors: [260510-0151-chat-first-sidebar-ia, 260510-1330-actioneer-shell-redesign, 260510-1519-chat-rail-scripted-flows]
created: "2026-05-10T10:16:54.937Z"
createdBy: "ck:plan"
source: skill
brainstorm_ref: "plans/reports/brainstorm-260510-1640-chat-artifact-connectivity.md"
demo_target: "May-12 alignment meeting"
estimate_days: 3.5
---

# Chat <-> Artifact Connectivity

## Overview

Hermes promises a centralized chatbot agent that lets LiveOps PMs ask plain-language questions and produce one of three actionable artifacts: **Boards** (pinned analysis), **Segments** (configurable + exportable predicates), **Campaigns** (rules + activate). Today the forward edges work but the surface is thin and reverse edges are missing — the prototype reads as three loosely-connected modules sharing a chat surface, not a cohesive agent experience.

This plan closes that gap with six phases. Four are May-12 critical (Phases 1–4); Phase 5 is a stretch goal that lights up the contextual-refinement vision shown in the user's mockups; Phase 6 rolls the same pattern to all artifact types post-demo.

**Demo goal:** complete a 90s end-to-end walkthrough where a single user session lands all three artifact terminuses (Board pin -> Segment confirm -> Campaign activate), with reverse links visible on each detail page and at least one one-click predicate refinement on a segment.

## Locked decisions (from brainstorm)

| # | Decision |
|---|---|
| 1 | Approach C — Contextual rail extension + universal CTAs + reverse edges. Compose stays separate plan. |
| 2 | Reuse existing `<ChatRail>` (already built per `260510-1519`). Extend with resize handle + refinement playbooks + one-click Apply. |
| 3 | Universal CTAs on every `<AssistantResponse>`: 🎯 Save as segment · 📊 Pin to board · 📣 Build campaign. Smart-hide when payload already includes matching `action_card_*`. |
| 4 | Reverse navigation: persist `sourceThreadId` on segment+campaign POSTs; show pill on detail headers; banner on activate flow. |
| 5 | One-click refinement Apply mutates predicate immediately + 5s undo toast. |
| 6 | Guided demo arc = single pre-seeded thread chaining all three terminuses with auto-suggested chips between stages. |
| 7 | Compose canvas (`260510-0045`) marked `completed` but zero code exists. Phase 1 reverts status to `pending` + adds deferral note. |

## Phases

| Phase | Name | Priority | Effort (revised post red-team) | Status |
|-------|------|---------:|-------:|--------|
| 1 | [Demo Polish + Compose Status Fix](./phase-01-demo-polish-compose-status-fix.md) | P0 | 0.5–0.75d | Completed |
| 2 | [Reverse Navigation Badges](./phase-02-reverse-navigation-badges.md) | P0 | 0.75–1d | Completed |
| 3 | [Universal Inline CTAs](./phase-03-universal-inline-ctas.md) | P0 | 1–1.5d | Completed |
| 4 | [Guided Demo Arc Thread](./phase-04-guided-demo-arc-thread.md) | P0 | 1–1.5d | Completed |
| 5 | [Refinement Playbooks + Resize + Apply](./phase-05-refinement-playbooks-resize-apply.md) | P2 | 1.5–2d | Pending — **POST-DEMO** |
| 6 | [Rollout to Board, Campaign, Feature](./phase-06-rollout-to-board-campaign-feature.md) | P3 | 2–3d | Pending — **POST-DEMO** |

**May-12 critical:** Phases 1–4. Realistic budget: **3.25–4.75 dev-days** (red-team revised from 2.5d original optimistic estimate). With ≤2 days to demo, this is tight — see Demo-Day Mitigations below.

**Phase 5 demoted to post-demo (P2).** Composer race conditions, :3002 cold-start failures, and bottom-right corner UI stack with Phase 4's pill made the risk profile unacceptable for a 90s live demo. Phase 5 ships after May-12 once Phase 6's broader rollout has time to bake.

## Phase dependencies

- **Phase 1** standalone.
- **Phase 2** standalone (drizzle migration + contracts changes).
- **Phase 3** standalone.
- **Phase 4** depends on Phase 1 (campaign confirm-nav) + Phase 2 (sourceThreadId for reverse pill).
- **Phase 5** standalone but reuses Phase 1's fallback registry pattern.
- **Phase 6** depends on Phase 5 (panel shell + provider + playbook structure).

## Dependencies

- **Predecessors (in the codebase):**
  - `260510-0151-chat-first-sidebar-ia` (completed) — sidebar + chat module + thread fixtures + Boards backend.
  - `260510-1330-actioneer-shell-redesign` (status unknown) — Topbar + segments detail tabs.
  - `260510-1519-chat-rail-scripted-flows` (status: pending in plan, but `apps/web/src/components/chat-rail/*` already exists) — delivered the 400px chat-rail shell, page-context chip, scripted-prompt empty state, multi-turn registry. Phase 5 of THIS plan extends that rail.
- **Related (out-of-scope, separate plan):**
  - `260510-0045-agents-compose-canvas` (status: completed but zero code exists) — Phase 1 housekeeping reverts to `pending` + deferral note. Compose canvas itself stays as its own track.

## Reuse / constraints

- **Reuse:** `<ChatRail>` shell, `<ResponseActionBar>`, `<AssistantResponse>`, `respondToText()`, `chat-rail-store.ts`, segments-client / campaigns-client, audience-count APIs (`/api/v1/audience/count` on :3002).
- **No new backend** beyond Phase 2 schema columns + sourceThreadId pass-through.
- **Match design tokens** (`T.brand`, `T.fSans`, etc. from `apps/web/src/theme.tsx`).
- **File size ≤200 lines** each per `./.claude/rules/development-rules.md`.
- **YAGNI/KISS/DRY** throughout.

## Success metrics

- Demo walkthrough completes in ≤90s with no dead-ends.
- ≤2 clicks from any artifact detail to its source chat thread.
- Side-panel refine -> apply -> count update <800ms.
- 3 ad-libbed PM-style questions per stage degrade gracefully (no dead-ends).
- Resize 280 -> 520px, content reflows cleanly (Phase 5 success).
- `pnpm typecheck` passes for `apps/web` and `apps/catalog-api`.
- No regression on `/segments/:id`, `/canvas/:id`, `/campaigns/:id`, `/feature-store/:name`.

## Risks (top-level)

| # | Risk | Mitigation |
|---|------|------------|
| 1 | Side-panel resize collision with sticky-left sidebar | Main content gets `min-width: 0` + flex compression; sidebar untouched |
| 2 | One-click Apply demo accidents (wrong filter applied) | 5s undo toast on every Apply; confirm + animated pre-flight banner |
| 3 | Scripted refinement coverage gaps when PM ad-libs | Generic fallback playbook entry in registry |
| 4 | CTA hierarchy stacking (universal + chips + action_card_*) | Smart-hide logic in `<UniversalCtaRow>` |
| 5 | Recent Chats pollution from scoped threads | Scope indicator on thread items; optional filter chip |
| 6 | Drizzle migration on running Postgres (Phase 2) | ALTER TABLE ADD COLUMN with default null — safe, reversible |
| 7 | Plan claims Phase 5 builds rail from scratch but rail already exists | Phase 5 explicitly extends, doesn't recreate (see phase doc) |

## Demo-Day Mitigations (locked in via red-team review)

These are mandatory plan revisions, not suggestions. Each addresses a specific failure mode identified in red-team scoring 7+/10.

1. **Pre-seed demo artifacts with `sourceThreadId` baked in** — don't rely on Phase 2 plumbing for the demo path. The demo segment (`seg-cfm-loss-streak-non-paying-2026-0508-a3f9`) and demo board ("LiveOps 2026") get fixture-level `sourceThreadId: 'thread-demo-livops-2026'` so reverse pills work even if Phase 2 migration slips. (Ownership: Phase 4)

2. **Phase 3 must respect `suppressUniversalCtas` flag on scripted-thread responses** — demo thread T1/T2/T3 set this flag so the demo's curated chips remain the singular forward path. Prevents "PM clicks Save-as-segment instead of the chip" derail. (Ownership: Phase 3)

3. **Phase 4 demo thread gets a "Restart demo" affordance** — visible chip in T1 header that recreates the thread fresh in case PM ad-libs into a dead-end. (Ownership: Phase 4)

4. **`scripts/pre-demo-warmup.ps1` runs before the meeting** — hits feature loader, audience-count, segments-list, campaigns-list to pre-warm all caches before the live walkthrough. Removes :3002 cold-start risk. (Ownership: Phase 4 verification step)

5. **Phase 1 activate banner does NOT ship with optional-chaining fallback** — gate behind Phase 2's `thread-title-lookup.ts` actually existing. If Phase 2 slips, banner is hidden, not "broken-but-silent". (Ownership: Phase 1)

6. **Phase 3 dependency upgraded to `[2]`** — frontmatter corrected. QuickSegmentDialog/QuickCampaignDialog won't ship `sourceThreadId` until contract change lands. (Ownership: Phase 3)

7. **Go/no-go gate at T-3h before demo** — if Phase 4 walkthrough fails any step at rehearsal, drop to "regular chat threads (005/008) only" demo path. Existing scripted threads cover board-pin + segment terminuses; campaign demo is the only gap. (Ownership: demo runner)

## Implementation summary

**Delivery:** 2026-05-10 — Phases 1–4 completed in single auto-cook session.

- **Phase 1** (demo polish + compose status fix): Reverted compose plan status; added campaign confirm navigation; gated activate banner behind Phase 2; implemented registry fallback for off-script questions; added Q-marker icons to user messages.
- **Phase 2** (reverse navigation badges): Applied migration `0012_add_source_thread_id.sql`; updated contracts with `sourceThreadId` field; mounted `<SourceThreadPill>` on all three detail surfaces (boards, segments, campaigns); ActiveThreadProvider wired.
- **Phase 3** (universal inline CTAs): Implemented `<UniversalCtaRow>` with smart-hide logic; created `<QuickSegmentDialog>` + `<QuickCampaignDialog>` with response-prefill + four-r inference; pinboard CTA reuses existing popover.
- **Phase 4** (guided demo arc thread): Built `thread-demo-livops-2026` fixture (199 LOC, 3-turn arc); registered multi-turn chips; seeded demo artifacts with `sourceThreadId`; mounted `<ContinueInChatPill>` on all detail pages; added RestartDemoChip; created `pre-demo-warmup.ps1`; extended LIVOPS_2026_BOARD with demo segment seed.

**Code review findings (2026-05-10 1820):** Identified 5 critical demo blockers; all fixed in same session:
- C1: Pill/FAB clearance on campaign monitoring page.
- C2: sourceThreadId pass-through in action cards.
- C3: Campaign detail nav to `/campaigns/{id}` instead of `/canvas`.
- C5: Activate chip removal from demo thread (already handled by phase 3 suppressUniversalCtas).
- M6: RestartDemoChip now uses putThread directly.

**Testing verification (2026-05-10 1822):** All test suites pass; demo walkthrough validated against 25-point acceptance gate (13-step flow confirmed).

**Phases 5–6 deferred:** POST-DEMO per red-team review. Rationale: Phase 5's contextual-refinement rail + resize adds risk to May-12 tight timeline; Phase 6's rollout (boards/campaigns/features) depends on Phase 5. Plan structure retained for post-May-12 execution.

**References:**
- Code review report: `plans/reports/code-review-260510-1820-chat-artifact-connectivity.md`
- Test verification: `plans/reports/tester-260510-1822-chat-artifact-connectivity-verification.md`

## Open questions (carried forward, non-blocking)

1. **Recent threads sidebar segregation** — should scoped contextual threads appear in main "All Chats" or in a per-artifact "Pinned conversations"? Default: main list with a small scope-icon indicator.
2. **One-click Apply persistence** — call segments PATCH immediately or stage as draft? Default: immediate apply + undo (demo cleaner).
3. **Compose canvas integration vector** — does post-demo plan integrate Compose's stage-stepper into the contextual rail, or stay separate? Decided post-demo.
4. **Timing budget for free-text fallback response** — should it stream a generic narrative or just acknowledge? Default: short acknowledgment + 1–2 follow-up chips back on-rails.
