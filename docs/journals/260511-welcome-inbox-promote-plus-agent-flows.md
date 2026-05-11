# Welcome Inbox Promoted to Main Column + Agent-First Parallel Threads

**Date**: 2026-05-11 11:22  
**Severity**: Low  
**Component**: Chat demo content, welcome page layout  
**Status**: Completed  

## What Shipped

Welcome inbox promoted from sidebar → full-width main column above ActiveCampaigns on `/welcome`. Inbox grew from 1 card → 3 stacked cards with staggered timestamps (today, yesterday −1d, −2d). Added 2 sibling agent-first demo threads:
- **Thread B**: D7 FB cohort churn drop (cohort dropped 8% WoW)
- **Thread C**: Whale recall decline (high-LTV players ARPPU −12% YTD)

Both threads follow the canonical 4-turn arc: diagnose → segment → campaign → retrospective, parallel to `thread-demo-livops-2026`. Thread A remains unmodified.

## Process & Parallel Execution

Workflow: brainstorm → plan → cook --auto across 4 phases.

**Phases 2 & 3 executed in parallel** (fullstack-developer subagents). Possible because:
- Phase 1 (plan + shared infrastructure): centralized all multi-file edits
- Phase 2 (Thread B): created `thread-fb-cohort-churn-2026.ts` only
- Phase 3 (Thread C): created `thread-whale-recall-2026.ts` only
- Phase 4 (integration): unified chat-bootstrap, thread registry, chat-rail, restart-demo, entity-names

**Shared files edited in Phase 4 only:**
- `chat-bootstrap.ts` (cache version bump v9 → v10)
- `multi-turn-registry.ts` (added threads B & C entries)
- `chat-rail.tsx` (welcome inbox card layout)
- `restart-demo.tsx` (chip labels for all 3 threads)
- `entity-names.ts` (D7 FB cohort, whale LTV references)

Zero overlap → zero merge conflicts. Saved ~3h vs serial workflow.

## Key Design Decision

Parallel eligibility required **upfront ownership definition**: each subagent owned exactly one `.ts` thread file. Shared code lived in phase 4 exclusively. No mid-flight coordination needed. Pattern worth repeating for future multi-thread additions.

## Code Review Results

**Score**: 8.5/10. **P0 Critical**: 0.  

**Medium findings** (1):
- **M1 — Timestamp anchor inconsistency**: Inbox card labels show "today", "yesterday", "2 days ago" but threads B & C had `createdAt` timestamps (T1) at current server time (2026-05-11), not staggered. Fixed: shifted B & C thread T1 createdAt back 1 day each (to 2026-05-10, matching canonical thread A convention from earlier arc). Inbox display → thread internal times now align.

**Low findings** (deferred as cosmetic):
- L1: silent `treatment_count` field drift between thread payloads (minor inconsistency, user doesn't see)
- L2: `campaign.type` enum mislabel in Thread B T2 (says "retention" should be "winback")
- L3: markdown newline polish in T3 narrative blocks
- L4: `_catalog.json` regeneration scope (asset pipeline question, not blocking)

## Build Artifact Note

`apps/web/public/_catalog.json` is tracked in git but regenerated on every `pnpm build` via `tsx scripts/export-feature-catalog.ts`. **Not committed in this session** to avoid noisy diffs. May resurface on next commit. Worth deciding policy long-term: untrack via `.gitignore` or accept regeneration diffs?

## Verifications Deferred to User

- Visual smoke test on `/welcome`: 3 inbox rows render, EN/VI toggle works, click each card → T1 auto-plays → full 4-turn arc flows
- Restart-demo chip appears on both Thread B & C
- Dry-run demo before May 12 alignment meeting (stakeholder walkthrough)

## Files Modified

**New:**
- `apps/web/src/data/chat/threads/thread-fb-cohort-churn-2026.ts`
- `apps/web/src/data/chat/threads/thread-whale-recall-2026.ts`

**Modified:**
- `apps/web/src/utils/chat-bootstrap.ts`
- `apps/web/src/modules/chat/multi-turn-registry.ts`
- `apps/web/src/components/chat-rail/chat-rail.tsx`
- `apps/web/src/components/restart-demo.tsx`
- `apps/web/src/utils/entity-names.ts`
- `package.json`

## Next Steps

- User to visually verify `/welcome` (3 inbox cards, card → thread flow)
- User to confirm demo dry-run before stakeholder session
- Decide: track `_catalog.json` in git or exclude via `.gitignore`?
