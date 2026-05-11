---
phase: 4
title: "Guided Demo Arc Thread"
status: completed
priority: P0
effort: "1–1.5d"
dependencies: [1, 2]
---

# Phase 4: Guided Demo Arc Thread

## Overview

Pre-seed a single canonical demo thread (`thread-demo-livops-2026`) that walks the May-12 stakeholder through all three artifact terminuses — Board pin -> Segment confirm -> Campaign activate — in one ≤90s session. Each turn surfaces one primary CTA + auto-suggested chips that walk the user forward without reading. Each artifact detail page (driven by Phase 2's `sourceThreadId`) gets a "← Continue in chat" pill that returns to the demo thread.

## Requirements

**Functional:**
- Single thread fixture: `thread-demo-livops-2026.ts` with title "Why is CFM ARPDAU dipping last quarter?"
- T1 response: line chart (CFM-13 ARPDAU trend), brief narrative + insight bullets, a `pin_to_board` section pointing to a "LiveOps 2026" board.
- T1 follow-ups (chips): primary "Who's most at risk right now?" — leads to T2 segment proposal.
- T2 response: bar chart (loss-streak distribution) + 3 feature chips + `action_card_segment` for `seg-cfm-loss-streak-non-paying-2026-0508-a3f9` (existing seeded segment) with audience preview ~52,600.
- T2 follow-ups: primary "Build a rescue intervention" — leads to T3 campaign proposal.
- T3 response: short narrative justifying campaign + `action_card_campaign` (realtime, seedSegment from T2) — name "CFM-13 Loss-Streak Rescue · 2026 LiveOps Demo", type realtime.
- "Continue in chat" pill on each detail page (board / segment / campaign) navigates back to `/chat/thread-demo-livops-2026`.
- Thread auto-pinned to top of sidebar Recent Chats and surfaced as the first scripted prompt in chat-rail empty state.

**Non-functional:**
- Walkthrough rehearses to ≤90s confidently.
- All scripted chips registered in `multi-turn-registry.ts`.
- Thread fixture file ≤200 LOC; widgets reuse existing patterns.

## Architecture

```
Sidebar Recent Chats (top entry, pinned)
       |
       v
/chat/thread-demo-livops-2026
       |
   T1 (chart) -> [Pin to LiveOps 2026 board] -> /canvas/{id}
                                                   |
                                                   v
                                        <ContinueInChatPill> -> /chat/thread-demo-livops-2026 (T1 still visible)
       |
   T1 chip "Who's most at risk?" -> T2
       |
   T2 (segment proposal) -> [Confirm] -> POST /segments + nav -> /segments/{seg-id}
                                                                    |
                                                                    v
                                                          <ContinueInChatPill>
       |
   T2 chip "Build a rescue intervention" -> T3
       |
   T3 (campaign proposal) -> [Confirm] -> POST /campaigns + nav -> /campaigns/{id}
                                                                     |
                                                                     v
                                                            <ContinueInChatPill> + activate banner
       |
   T3 chip "Activate" -> opens activate flow on /campaigns/{id}
       |
   monitoring banner: "Activated · Source: 'Why is CFM ARPDAU dipping…'"
```

## Related Code Files

- **Modify:**
  - `apps/web/src/data/chat/multi-turn-registry.ts` — add 3 entries keyed off the demo thread chip texts
  - `apps/web/src/data/chat/thread-index.ts` (or fixture loader) — register the new thread
  - `apps/web/src/components/chat-rail/scripted-prompts-section.tsx` — add demo prompt as first item
  - `apps/web/src/modules/canvas/detail-page.tsx` — mount `<ContinueInChatPill>`
  - `apps/web/src/modules/segments/_components/detail-layout.tsx` — mount `<ContinueInChatPill>`
  - `apps/web/src/modules/campaigns/monitoring.tsx` — mount `<ContinueInChatPill>`

- **Create:**
  - `apps/web/src/data/chat/threads/thread-demo-livops-2026.ts` — full multi-turn fixture
  - `apps/web/src/components/chat-rail/continue-in-chat-pill.tsx` — reverse-link pill
  - `apps/web/src/components/chat-rail/restart-demo-chip.tsx` — recovery affordance
  - `scripts/pre-demo-warmup.ps1` — pre-meeting cache warmup

- **Delete:** none

## Implementation Steps

1. **Fixture data** (3h)
   - File `thread-demo-livops-2026.ts` exports a `Conversation` with id `thread-demo-livops-2026` and 6 messages (3 user H1/H2 + 3 assistant responses).
   - **T1 (assistant):** title "ARPDAU dropped 7% Apr -> May. Here's the breakdown." narrative ~80 words, line chart with 12 weekly points, 3 insight bullets (loss-streak players, lapsed mid-tier, F2P churn), `pin_to_board` section targeting board "LiveOps 2026" (auto-create on click).
   - **T1 follow-ups:** ["Who's most at risk right now?" — primary; "Compare to Q1 2026"; "Show competitor benchmarks"].
   - **T2 (assistant):** title "5,200 players hit a 4+ ranked-loss streak this week." bar chart (loss-streak buckets), 3 FeatureChips (`consecutive_ranked_losses_streak`, `is_paying_user_lifetime`, `iam_received_count_24h`), `action_card_segment` for the existing `seg-cfm-loss-streak-non-paying-2026-0508-a3f9` (audience ~52,600).
   - **T2 follow-ups:** ["Build a rescue intervention" — primary; "Tighten to non-paying only"; "Show 7d retention impact"].
   - **T3 (assistant):** narrative ~60 words explaining trigger event + payload + holdout, `action_card_campaign` (realtime, seedSegment id, payload preview).
   - **T3 follow-ups:** ["Activate" — primary; "Tweak holdout %"; "Add a control variant"].
   - All widget data reuses existing fixtures from CFM scenarios in `data/catalog/`.

2. **Multi-turn registry entries** (30 min)
   - Three new entries keyed by `(threadId, lastUserText)`:
     - `(thread-demo-livops-2026, "Who's most at risk right now?")` -> T2
     - `(thread-demo-livops-2026, "Build a rescue intervention")` -> T3
     - `(thread-demo-livops-2026, "Activate")` -> opens campaign activate flow (or just routes the user to monitoring page; or re-renders T3 with confirmation)
   - Confirm registry behavior aligns with existing thread-005..008 pattern.

3. **Auto-pin to sidebar** (15 min)
   - On app boot, ensure `pushRecent('chats', { id: 'thread-demo-livops-2026', title: …, updatedAt: now, pinned: true })` runs once.
   - Sidebar `<RecentItems module="chats">` already orders by `updatedAt` — pinned flag elevates above it (small adjustment to recent-items-store).

4. **Scripted prompt entry** (15 min)
   - In `scripted-prompts-section.tsx`, add new entry as first item under "Demo" pill: "Why is CFM ARPDAU dipping last quarter?" — clicking creates a NEW thread copy of the demo (not reuses the seeded one) so demo is rerunnable.

5. **`<ContinueInChatPill>`** (45 min)
   - Component file `continue-in-chat-pill.tsx` under `chat-rail/`.
   - Props: `threadId: string`, optional `label?: string` (default "← Continue in chat").
   - Renders pill aligned bottom-right of detail viewport (sticky), `T.brand` background, white text, 13px font.
   - Click -> `navigate(/chat/{threadId})`.
   - Hidden if no `sourceThreadId` on the artifact.
   - Slightly elevated z-index to sit above content.

6. **Mount on detail surfaces** (20 min)
   - Boards, Segments, Campaigns detail pages render the pill near the bottom-right when artifact has `sourceThreadId`.
   - Coexists with Phase 2's header pill (header pill shows the title, footer pill is the action button).

7. **Demo timing rehearsal** (30 min)
   - Cold-start `pnpm dev`, click through full arc with stopwatch.
   - Tune narrative lengths if any turn's response feels slow to scan (>8s).
   - Verify chip primary buttons are visually obvious vs secondary.

8. **Pre-seed demo artifacts** (red-team mitigation, 30 min)
   - Update segment seed (`apps/catalog-api/src/seed/seed-boards.ts` neighbor or segments seed) to set `sourceThreadId: 'thread-demo-livops-2026'` on `seg-cfm-loss-streak-non-paying-2026-0508-a3f9` AND on the demo board ("LiveOps 2026" auto-create).
   - Reverse pills now work for the demo path even if Phase 2 plumbing slips.
   - Action cards still call `client.create({ ..., sourceThreadId })` for non-demo paths — no behavior change there.

9. **`scripts/pre-demo-warmup.ps1`** (red-team mitigation, 30 min)
   - PowerShell script that hits: `GET /api/v1/features`, `POST /api/v1/audience/count` with the demo segment predicate, `GET /api/v1/segments`, `GET /api/v1/campaigns`, `GET /api/v1/boards` — all in sequence.
   - Run before demo to pre-warm caches + flush any cold-start retry tail.
   - Add to repo `scripts/` (creating dir if missing).

10. **"Restart demo" chip** (red-team mitigation, 20 min)
    - In demo thread T1 response, add small chip near header: "↻ Restart demo".
    - Click handler: deletes existing thread copy + recreates fresh from fixture, navigates to `/chat/{newId}`.
    - Catches PM-ad-libbed dead-ends without leaving the demo path.

11. **Verification:**
   - Demo thread opens at `/chat/thread-demo-livops-2026` from sidebar.
   - T1 -> pin -> board page -> back via pill -> T1 still visible -> chip -> T2 -> confirm -> segment page -> back -> chip -> T3 -> confirm -> campaign page -> activate -> monitoring banner shows source title.
   - Total click count ≤ 8; total time ≤ 90s.
   - Restart-demo chip from any turn returns to fresh T1 within 1s.
   - Pre-warmup script completes ≤8s and reports OK on all endpoints.
   - `pnpm typecheck` clean.

## Success Criteria

- [x] Demo thread loads with all 3 turns pre-rendered.
- [x] Each chip transitions to next turn within 250ms (matches existing multi-turn cadence).
- [x] Pin-to-board, confirm-segment, confirm-campaign all create real artifacts with sourceThreadId set to demo thread id.
- [x] Each detail page shows `<ContinueInChatPill>` returning to the demo thread.
- [x] Activate flow on demo campaign lands on monitoring with the source banner.
- [x] Demo prompt visible in chat-rail empty state under "Demo" pill.
- [x] End-to-end walkthrough completes in ≤90s with confident click cadence.
- [x] Typecheck clean.

## Risk Assessment

- **Risk:** Demo thread's terminal CTAs leak into normal chat flow (free-text "Activate" triggers campaign activate from any thread).
  - **Mitigation:** Registry keys on `(threadId, text)` tuple — only matches demo thread.
- **Risk:** Auto-creating "LiveOps 2026" board on first pin creates duplicate boards on rerun.
  - **Mitigation:** Use existing `find-or-create` board pattern (`pin-to-board-section.tsx` already idempotent).
- **Risk:** Demo segment id `seg-cfm-loss-streak-non-paying-2026-0508-a3f9` exists in seeded data but might collide with new segment created from T2 confirm.
  - **Mitigation:** T2 action card "Confirm" uses `find-or-use-existing` semantics — if id matches seeded, reuse; otherwise create.
- **Risk:** ContinueInChatPill obstructs important page elements.
  - **Mitigation:** Bottom-right corner with 16px margin; user can dismiss with × on hover (Phase 5 polish).
- **Risk:** Walkthrough rehearses long because PM ad-libs questions mid-flow.
  - **Mitigation:** Phase 1 free-text fallback handles graceful degradation; chips prominently visible.
