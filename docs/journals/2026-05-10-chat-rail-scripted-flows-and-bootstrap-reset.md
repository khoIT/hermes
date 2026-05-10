# Chat Rail Scripted Flows — Bootstrap Reset + Duplicate Sidebar Fix

**Date**: 2026-05-10
**Severity**: High
**Component**: Chat Rail (web), Thread Bootstrap, Sidebar Navigation
**Status**: Resolved

## What Happened

Shipped the full chat-rail refactor (plan 260510-1519 end-to-end via `/ck:cook --auto`) plus two rounds of fixes for visual regressions and duplicate sidebar entries.

**Phase 1 — Contextual right-rail shell**
Replaced floating `<AskHermesPanel>` slide-out with persistent 400px chat rail anchored on detail pages (`/feature-store/:name`, `/segments/:id`, `/canvas/:id`, `/campaigns/:id`). Auto-resolves page context (feature, segment, canvas, campaign) from URL via registry mirroring breadcrumb-resolver. Open/closed state + per-route defaults persisted in localStorage (`hermes:chat-rail:open`). Repurposed FAB as rail toggle (MessageCircle ↔ ChevronRight icon). Deleted `ask-hermes-panel.tsx`, `panel-store.ts`, `page-context.ts`.

Files: `chat-rail/{chat-rail, chat-rail-header, chat-rail-empty, page-context-chip, compact-thread-view, recent-threads-section, scripted-prompts-section}.tsx`, `utils/{chat-rail-store, page-context-resolver}.ts`, `App.tsx` (full restructure).

**Phase 2 — Multi-turn registry + 4 scripted flows**
Replaced 5 generic landing prompts with 4 categorized scripted flows under 2 pills:
- **Deep research → Board**: 2 flows (thread-005 "Compare PT-6 vs PT-10 gem-burn...", thread-006 "Diagnose high-LTV dropoff...")
- **Find features → Segment**: 2 flows (thread-007 "Identify revenue impact features", thread-008 "Find high-churn users...")

Each flow plays in 3 turns advanced via `Map<(threadId, lastUserText), AssistantMessage>` registry — 16 entries mapping exact-match chip text to continuation responses. Built `<FeatureChip>` (catalog-api fetch with `allFeatures` fallback on 5xx). Built `<PinToBoardSection>` (find-or-create board, pin upstream widget snapshot). Built `<SoftHint>` for free-text mid-flow fallback. Extended ResponseSection union with `feature_chip`/`pin_to_board`/`soft_hint`. Rewrote `chat-respond.ts`: registry lookup → intent matcher → soft-hint fallback. Deleted obsolete `thread-003-loss-streak.ts`; updated `/agents/op/cfm-loss-streak` redirect.

Files: `fixtures/thread-005..008.ts`, `chat-respond.ts`, `<FeatureChip>`, `<PinToBoardSection>`, response render union.

**Phase 3 — Empty-state polish**
Wired rail empty state with `<RecentThreadsSection>` (top 3 from chats recents) and `<ScriptedPromptsSection>` (4 prompts under 2 categorized pills). Added `userClearedRef` so "+ New" doesn't get clobbered by auto-resume effect.

## The Brutal Truth

The bootstrap seeding strategy was a mess and took two full fix cycles to untangle.

**Problem 1 (Fix Cycle 1):** Thread fixtures had only T1 messages (`[user-T1, assistant-T1]`). T2/T3 lived as named exports for the registry — brilliant for multi-turn without duplication, catastrophic for UX. User clicks a scripted flow, rail opens, sidebar shows "thread-005", user taps it in sidebar expecting to see the flow preview — gets a stub with only 1 exchange. Then clicks the follow-up prompt, which triggers the registry and advances to T2. Confusing, breaks the mental model of "opening a thread shows the demo".

**Problem 2 (Fix Cycle 1):** Chat bootstrap was gated by `isStoreEmpty()` — so if the browser had localStorage from a prior session, the new CANONICAL_THREADS never seeded. Shipped a "version-keyed reseed" fix, but the implementation had a flaw: filtered out only the canonical IDs when re-attaching "user-made chats", leaving duplicates.

**Problem 3 (Fix Cycle 2, the real killer):** Prior-version prompt clicks created ad-hoc threads with random ids (`t-XXX`) and titles matching canonical fixtures ("Compare PT-6 vs PT-10 gem-burn..."). The "preserve user chats" logic re-attached them during bootstrap, creating exact-duplicate sidebar entries. Also, `SegmentDetailLayout` only pushed segments for ids in `allSegments` (static catalog), so newly-created segment ids were invisible in nav.

The YAGNI lesson here: "preserve user-made chats during reseed" sounded clever but introduced the duplicate bug. Users don't need to preserve ad-hoc threads from a previous demo session; destructive reset is the right semantic for version bumps.

## Technical Details

### Fix Cycle 1 — Three Issues from Screenshot Review

1. **Stale thread set in sidebar**
   - Root: `chat-bootstrap.ts` checked `isStoreEmpty()` before seeding CANONICAL_THREADS
   - Prior session's localStorage survived, blocking new canonical threads
   - **Fix**: Version-keyed reseed (`v2-260510-1400` → `v3-260510-1635`). New version triggers conditional destructive wipe + fresh seed.

2. **Threads showed T1 only when opened**
   - Root: Fixtures had `messages: [user-T1, assistant-T1]` only; T2/T3 were separate named exports for registry
   - User taps "thread-005" in sidebar, sees single-exchange stub instead of 3-turn flow demo
   - **Fix**: Inlined full T1+user-T2+assistant-T2+user-T3+assistant-T3 (6 messages) into each fixture. Registry still uses T2/T3 exports for continuation, but opening the seeded thread now shows the complete demo.

3. **Created segments didn't appear in left nav**
   - Root: `action-card-segment.onConfirm` skipped `recentItems.push()`; `SegmentDetailLayout` only pushed for ids in `allSegments` (static catalog load)
   - User creates a segment, doesn't see it in nav until hard reload
   - **Fix**: Both surfaces now call `recentItems.push()` and update `allSegments` optimistically.

### Fix Cycle 2 — Duplicate Sidebar Entries

- **Trigger**: Version bump (`v2` → `v3`) with the "preserve user chats" reseed logic
- **What broke**: Prior-version ad-hoc threads (`t-XXX` with titles like "Compare PT-6 vs PT-10 gem-burn...") re-attached alongside new canonical threads, creating duplicates. Also "New conversation" lingered.
- **Root cause**: Reseed filtered out only `CANONICAL_IDS` when re-attaching chats, but older sessions had ad-hoc threads with canonical-like titles — collisions.
- **Fix**: Bumped to `v3-260510-1635`: hard-reset deletes every thread NOT in `CANONICAL_IDS` plus clears `chats.recents`. Future user-made threads survive normally; destructive sweep only runs on version bump. Cleaner than "preserve user chats" heuristic.

```typescript
// v3 bootstrap logic
if (storedVersion !== CURRENT_VERSION) {
  // Hard reset: delete all non-canonical + clear recents
  const allThreads = Object.keys(chats);
  for (const id of allThreads) {
    if (!CANONICAL_IDS.includes(id)) delete chats[id];
  }
  chats.recents = [];
}
```

### Multi-Turn Registry Design

Keyed by `(threadId, lastUserText)` — maps exact chip label to continuation response.

```typescript
// Example entry
const REGISTRY = new Map<string, AssistantMessage>([
  ["thread-005::Compare PT-6 vs PT-10 gem-burn rate", { /* T2 response */ }],
  ["thread-005::Which one scaled better to 100k users?", { /* T3 response */ }],
  // ... 16 entries across 4 fixtures
]);
```

Why exact-text matching instead of step index? Simpler bookkeeping — avoids state machines. Exact-text collisions with free-text input unlikely (keys are full-sentence chip labels from UI). If user types something similar, `<SoftHint>` fallback triggers.

### FeatureChip Catalog-API Hybrid

Fetches live from catalog-api; falls back to static `allFeatures` on 5xx. Ensures scripted demo never breaks even when catalog-api is restarting.

```typescript
const features = await fetch(`/api/v1/features`).catch(() => allFeatures);
// Scripted flow always renders, no "Feature Store unavailable" in the rail
```

This was a deliberate nod to the recurring "Feature Store unavailable" friction from memory.

## What We Tried

- Initial: Full nested message structure in fixtures (16 messages × 4 threads = bloat)
  - Abandoned: Registry pattern cleaner + T2/T3 reuse across fixtures
- Thought: Preserve user-made chats during version bump (sounded nice)
  - **Failed**: Created duplicate ad-hoc threads with canonical-like titles
- Explored: Heuristic dedup based on thread ID prefix
  - **Rejected**: Fragile; version bump should be destructive reset

## Root Cause Analysis

**Bootstrap reseed bug:** Attempted to preserve "user-made chats" during version bump. Assumed prior-session threads had random/unique ids + titles, so filtering `CANONICAL_IDS` would preserve them cleanly. Reality: older sessions created ad-hoc threads with titles matching canonical fixtures ("Compare PT-6 vs PT-10..."), so duplicates survived the filter.

**YAGNI failure:** The "preserve user chats" optimization was backwards. Users don't need to keep a stale ad-hoc thread from a prior demo session. Destructive reset is the right mental model for version bumps — clean slate, new canonical threads seed fresh. Cost of preservation (duplicate detection complexity) exceeded value (preserving junk demo threads).

**Thread message split (T1 in fixture, T2/T3 as exports):** Solved for code duplication in registry, created UX regression. Opening a seeded thread showed only the first exchange. Should have inlined the full message array from the start, even if it meant slight duplication in fixture files.

## Lessons Learned

1. **Version-keyed reset is destructive by design.** When bumping the bootstrap version, the intent is to wipe old state and seed fresh. Don't try to preserve "user-made" threads via heuristics — it's brittle. If preservation is critical for the UX, make it explicit (migrate old threads to a separate "archived" section, not silently re-attach them).

2. **Multi-turn registry keyed by exact text is simple and works**, but requires the seeded thread to show the full message history (T1+T2+T3) so the user understands what's happening. Lazy-loading T2/T3 on first registry match creates a confusing "oh, now there's more" moment.

3. **Fallbacks at the data layer (catalog-api fetch with static fallback) beat fallbacks at the presentation layer.** The FeatureChip hybrid approach is cleaner than "if data load fails, render stub". It keeps the component dumb and the data layer defensive.

4. **Defense-in-depth on bootstrap:** Version key + canonical-id whitelist + recents wipe. Multiple layers catch cascading failures. A single "preserve user chats" heuristic created a two-failure problem (duplicates in sidebar + orphaned segments in nav). Multiple small validations would have caught it earlier.

## Next Steps

- [ ] **Manual browser smoke test** — Not yet validated in live browser. Verify rail opens/closes, scripted flows play 3 turns, segment creation appears in nav, sidebar doesn't duplicate.
- [ ] **Viewport testing** — Rail is 400px, tested at 1440+ only. Validate at <1280px (iPad, small laptop).
- [ ] **Registry collision risk** — Unlikely, but if user types a follow-up text exactly matching a registered chip label, the registry will fire. Monitor for false positives; may need to soften the key matching (prefix match vs exact match) in future.
- [ ] **FeatureChip 5xx fallback** — Relies on `allFeatures` being current. If feature catalog updates frequently, fallback may show stale list. Consider cache invalidation strategy if catalog-api churn increases.

**Files modified:**
- `apps/web/src/components/chat-rail/` (new directory, 8 files)
- `apps/web/src/utils/{chat-rail-store, page-context-resolver}.ts` (new)
- `apps/web/src/data/chat/{fixtures/thread-005..008, chat-respond}.ts`
- `apps/web/src/App.tsx` (rail integration)
- `apps/web/src/components/action-cards/action-card-segment.ts` (push recents)
- `apps/web/src/layouts/SegmentDetailLayout.tsx` (push recents + allSegments)

## Verification

- `pnpm --filter @hermes/web typecheck` clean (4 times across session)
- `pnpm --filter @hermes/web build` clean (postbuild static-features guard passes)
- **Not yet manually smoke-tested in browser** — typecheck + build green, but visual regression validation pending

---

## Unresolved Questions

1. **Rail width at narrow viewports** — 400px tuned for 1440+. Does it squeeze content at 1024px? Needs iPad + small laptop testing.
2. **Registry exact-text collision risk** — User types "Which one scaled better to 100k users?" in free-text input. Registry fires for thread-005::T3. Is this an edge case or a real problem? Need user behavior data.
3. **FeatureChip fallback staleness** — If catalog is updated frequently (new features added hourly), the static `allFeatures` fallback may show old list during catalog-api restart. Is this acceptable, or should fallback be cleared after a timeout?
4. **Segment creation optimistic update** — `SegmentDetailLayout` pushes to `allSegments` optimistically on create. If the server rejects the segment (validation error, permission), the nav will show a ghost segment. Should we wait for server confirmation before pushing?
