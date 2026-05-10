# Chat Artifact Connectivity + Sidebar Auto-Expand

**Date:** 2026-05-10 18:45  
**Severity:** High  
**Component:** Chat, Artifacts (Segments, Campaigns, Boards), Sidebar  
**Status:** Resolved  

## What Happened

Two coordinated commits landed May-12 demo prep work:

1. **Commit 4332776** — Full chat↔artifact bidirectional linking (Phases 1–4 of plan `260510-1640`):
   - 45 files, ~1,660 lines added
   - Reverse navigation badges (sourceThreadId end-to-end: chat → artifact → back to source)
   - Universal CTAs on every assistant response (Save as segment / Pin to board / Build campaign)
   - Guided 90s demo arc thread (`thread-demo-livops-2026`, 3-turn chained workflow)
   - Demo polish (campaign confirm nav, compose status fix, Activate banner gating, fallback registry)

2. **Commit 8ba5595** — Sidebar auto-expand UX fix:
   - 4 files changed
   - Route change → auto-expand matching module section (segments/boards/campaigns/features)
   - Active item scrolls into view (`scrollIntoView({block:'nearest'})`)
   - Custom event `hermes:sidebar-expand-changed` wires programmatic expansion to mounted sections
   - Closes UX gap: "navigating to artifact from chat left sidebar collapsed"

## The Brutal Truth

The reverse-navigation work closes the most-felt prototype gap we've heard: **"where did this artifact come from?"** Board/Segment/Campaign all now link back to source chat thread. This feels like the thing that turns three loosely-connected modules into a single agent surface.

**But code review caught 5 integration blockers that typecheck missed.** These were NOT type errors—they were live integration gaps:
- FAB/pill z-index collision on campaign monitoring page
- `sourceThreadId` not passed through action-card POST bodies (mismatch between static catalog id and runtime POST payload)
- Campaign detail routing to wrong endpoint (`/canvas` vs `/campaigns/{id}`)
- Activate chip stranding in demo thread (fixed by Phase 3's `suppressUniversalCtas` flag)
- RestartDemoChip not mutating thread state correctly

Every one of these would have broken the live May-12 demo. None were caught by `pnpm typecheck`.

The sidebar fix was a cherry-pick win: one afternoon, closes a real UX problem, ships clean.

## Technical Details

### Commit 4332776: Chat Artifact Connectivity

**DB Migration (Phase 2):**
```sql
-- drizzle/0012_add_source_thread_id.sql
ALTER TABLE "segments" ADD COLUMN IF NOT EXISTS "source_thread_id" text;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "source_thread_id" text;
```
Idempotent, nullable, reversible. No constraints = existing rows unaffected.

**Reverse Navigation Pipeline:**
- Schema updated: `apps/catalog-api/src/db/schema.ts` L103, `schema-campaigns.ts` L45
- Service pass-through: `segments.service.ts` L62, `campaigns.service.ts` L86
- Contracts: `packages/contracts/src/hermes-segment.ts` L114, `hermes-campaign.ts` L81
- Client wiring: `apps/web/src/api/segments-client.ts`, `campaigns-client.ts`
- UI component: `<SourceThreadPill>` mounted on `/segments/:id`, `/campaigns/:id`, `/canvas/:id` detail pages

**Universal CTAs (Phase 3):**
- `<UniversalCtaRow>` mounted on every `<AssistantResponse>` (respects `suppressUniversalCtas` flag to prevent demo CTA pile-up)
- Four-r inference engine in `quick-segment-dialog.tsx` + `quick-campaign-dialog.tsx` (extracts context from chat, prefills forms)
- Inline dialogs: QuickSegmentDialog (167 LOC), QuickCampaignDialog (169 LOC)
- Smart-hide logic: doesn't render when response already includes `action_card_*` components

**Demo Arc Thread (Phase 4):**
- `thread-demo-livops-2026.ts` — 3-turn fixture (199 LOC), each message tagged `suppressUniversalCtas: true`
- Chained workflow: Board pin → Segment create → Campaign activate
- Pre-seeded artifacts: LIVOPS_2026_BOARD has `sourceThreadId: 'thread-demo-livops-2026'`
- Navigation aids: `<ContinueInChatPill>` (67 LOC), `<RestartDemoChip>` (68 LOC)
- Bootstrap bump: `BOOTSTRAP_VERSION = 'v4-260510-1815'` triggers canonical thread reset on first boot

**Code Review Findings (5 blockers, all fixed in same session):**
1. **FAB collision:** pill rendering below FloatingActionButton on campaign monitoring
2. **sourceThreadId pass-through:** Action cards creating segments/campaigns weren't including sourceThreadId from `useActiveThreadId()`
3. **Campaign routing:** Detail nav went to `/canvas/{id}` instead of `/campaigns/{id}`
4. **Activate chip stranding:** Demo thread had static Activate chip (fixed by Phase 3's suppressUniversalCtas gating)
5. **RestartDemoChip mutation:** Wasn't calling `putThread` to mutate state before navigate (fixed to use `putThread` directly)

**Test Verification (Tester Report):**
- ✅ Typecheck: @hermes/web + @hermes/catalog-api both pass
- ✅ Build: Vite (2,647 modules, 1,182 kB main JS) + NestJS both succeed
- ✅ Integration: ActiveThreadProvider wired correctly in thread-page; ContinueInChatPill handles undefined threadId safely; SourceThreadPill guarded with if-check; RestartDemoChip checks threadId match before rendering
- ✅ Schema: Migration idempotent, service layer pass-through correct, contracts match reality
- ✅ Demo arc: Bootstrap version bumped, canonical thread includes demo, all 3 turns have suppressUniversalCtas: true, demo board/segment seeded with sourceThreadId

### Commit 8ba5595: Sidebar Auto-Expand

**Files:**
- `apps/web/src/components/sidebar/sidebar.tsx` — Custom event listener for `hermes:sidebar-expand-changed`
- `apps/web/src/components/sidebar/sidebar-section.tsx` — Expanded state wired to event payload
- `apps/web/src/components/sidebar/sidebar-item.tsx` — Active item gets `scrollIntoView({block:'nearest', behavior:'smooth'})`
- `apps/web/src/utils/recent-items-store.ts` — Helper to match current pathname against section items

**UX Impact:**
On route change (e.g., user clicks artifact detail from chat), sidebar:
1. Detects pathname matches (e.g., `/segments/` → Segments section)
2. Fires custom event with section name
3. Mounted section auto-expands
4. Active item scrolls into view

Prevents: "User clicks artifact in chat, detail page opens, but sidebar is still collapsed → where am I?"

## What We Tried

**For the 5 code review blockers:**
- C1 (FAB collision): Increased z-index on pill component, added offset margin
- C2 (sourceThreadId missing): Traced action-card POST flow; added `sourceThreadId: activeThreadId` to segment/campaign create payloads
- C3 (campaign routing): Updated navigation path to use `/campaigns/{id}` endpoint instead of canvas fallback
- C5 (Activate chip stranding): Demo thread turned on Phase 3 suppressUniversalCtas flag to hide universal CTAs entirely
- M6 (RestartDemoChip mutation): Changed to `putThread(updatedThread)` before navigate instead of relying on context update

**For sidebar expansion:**
- Initial approach (route change listener) worked but required custom event to decouple sidebar-section from global router
- Final approach cleaner: sidebar listens for custom event, dispatches on pathname change, sidebar-section respects payload

## Root Cause Analysis

**Why code review caught 5 blockers that typecheck missed:**

Typecheck validates *type correctness* but not *integration correctness*. These were all integration gaps:
- Z-index collision is CSS, not types
- sourceThreadId missing from POST bodies = type-correct but semantically wrong (structure matches, but value missing at call site)
- Wrong route endpoint = type-correct fetch call, wrong URL
- Activate chip visible on demo = type-correct conditional, wrong flag/timing
- RestartDemoChip not mutating state = valid function call, missing side effect

**Lesson:** For cross-module integration work (chat → segment/campaign → detail pages → back to chat), a typecheck-only gate is insufficient. Code review + integration testing are mandatory.

**Why sidebar was left collapsed:**

Sidebar expansion state was hardcoded to user interaction (click) rather than linked to programmatic navigation. When artifact detail page opened via chat link, sidebar state wasn't notified. Custom event pattern decouples sidebar from router, making expansion trigger reliable.

## Lessons Learned

1. **Typecheck ≠ Integration Verification.** Add code-reviewer pass to any work that flows data across 3+ modules. Catch C2-style "pass-through missing value" errors before demo.

2. **Pre-seed fixtures with production fields.** Demo thread pre-seeded sourceThreadId on board/segment artifacts so reverse pills worked even if Phase 2 migration slipped. This paid off when code review forced refactoring.

3. **suppressUniversalCtas is a demo anti-pattern cheat code.** Setting this flag on scripted threads prevented PM from clicking the wrong CTA and derailing the flow. It's a band-aid, not a feature, but it worked.

4. **Custom events > prop drilling for sidebar state.** Event-driven expansion scales; prop drilling from router to nested section would've been brittle.

5. **5 blockers caught mid-session cost us 2 hours of rework.** Worth it vs. finding them on stage 5 minutes before the demo.

## Next Steps

1. **Phase 5–6 deferred POST-DEMO** per red-team risk profile. Contextual-refinement rail + resize adds friction to tight May-12 timeline.

2. **Live walkthrough rehearsal T-3h before demo.** Go/no-go gate: if thread-demo-livops-2026 walkthrough fails any step, drop to existing scripted threads (005/008 + board pin only).

3. **Pre-demo-warmup.ps1 must run before meeting.** Hits feature loader, audience-count, segments-list, campaigns-list to pre-warm caches and eliminate :3002 cold-start risk.

4. **Plan 260510-1519 (chat-rail-scripted-flows) marked complete.** Rail + multi-turn registry already in place; Phase 4 extended it. No rework needed.

5. **Monitor bundle size.** Main JS now 1,182 kB (305 kB gzipped) with demo fixture embedded. If future phases push >1.3 MB, consider code-splitting response components.

**Owner:** Khoi (follow-up: demo runner for rehearsal gate; post-demo: phases 5–6 planning)

---

**Status:** RESOLVED — Phases 1–4 delivered, code review blockers fixed, tests passing, demo arc complete. Ready for May-12 stakeholder walkthrough.
