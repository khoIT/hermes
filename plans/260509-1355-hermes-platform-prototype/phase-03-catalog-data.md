---
phase: 3
title: "Catalog Data"
status: pending
priority: P1
effort: "6h"
dependencies: [1]
---

# Phase 03: Catalog Data

## Context Links
- Hermes_Demo_Data.md Part 1 (67 features), Part 2 (47 events), Part 3 (5 campaigns), Part 4 (naming), Part 6 (mockup mapping)
- PRD_Hermes_Agentic.md §7 (9 opportunities, 3 drafts, 2 recs, 3 rejected)
- PRD_Hermes_Design.md §8.9 (5 audience patterns), §9.11 (7 intervention archetypes)

## Overview
Hand-write all static catalog content the web bundles. No Trino dependency — runs in parallel with P-2/P-4. Every PRD-named entity (feature/event/segment/campaign/opportunity/etc.) materialised as TS const exports keyed by ID.

## Key Insights
- All names verbatim from `Hermes_Demo_Data.md` — no fabrication. PRD §14 acceptance #12 enforces.
- Type definitions live in `@hermes/contracts` (P-1 forked) — extend with new schemas: opportunity, agent-draft, agent-recommendation.
- Distributions and audience counts come from P-4 (separate `crawled/` dir); this phase populates `catalog/` only.
- `is_test_account = true` rows excluded by convention everywhere.

## Requirements
**Functional**
- 67 feature objects with: name, displayName, type, latency, owner, domain, status, definition (expr-lang + dbt), 7d-sparkline keys, "used by N segments / M campaigns" backlink stubs.
- 47 event objects with: name, displayName, key_properties, used_by, daily_volume key, sparkline key.
- ~13 segment objects (5 demo + 6-8 fictional) per Part 6 §6.
- ~7 campaign objects (5 representative + 2 variants for agent-drafted) per Part 3.
- 9 opportunity objects per Agentic §7.1.
- 3 draft objects per Agentic §7.2.
- 2 recommendation objects per Agentic §7.3.
- 3 rejected-opportunity objects for activity log per Agentic §7.4.
- 5 audience patterns per Design §8.9.
- 7 intervention archetypes per Design §9.11.

**Non-functional**
- All exports typed against `@hermes/contracts` schemas.
- IDs follow naming conventions per Hermes_Demo_Data Part 4 (seg-{game}-{purpose}-{year}, trg-{game}-{purpose}, cmp-{game}-{seq}).
- Files <200 lines each — split by domain (per CLAUDE.md modularization).

## Architecture
```
apps/web/src/data/catalog/
├── index.ts                    re-exports
├── features/
│   ├── index.ts                aggregates all 67
│   ├── identity-lifecycle.ts   11 features
│   ├── monetization.ts         12
│   ├── currency.ts             3
│   ├── engagement.ts           9
│   ├── gameplay-cfm.ts         10
│   ├── stateful-streaks.ts     2 (dual-tier)
│   ├── inventory.ts            5
│   ├── promotion-config.ts     3
│   ├── social-playstyle.ts     12
│   ├── test-system.ts          2
│   └── campaign-engagement.ts  4
├── events/
│   ├── index.ts                aggregates all 47
│   ├── match-gameplay.ts       6
│   ├── session-login.ts        7
│   ├── purchase-monetization.ts 6
│   ├── item-inventory.ts       6
│   ├── progression.ts          8
│   ├── social.ts               6
│   ├── campaign-ui.ts          8
│   └── ugc-moderation.ts       4
├── segments.ts                 13 segments
├── campaigns.ts                7 campaigns
├── audience-patterns.ts        5 patterns
├── intervention-archetypes.ts  7 archetypes
└── agents/
    ├── index.ts
    ├── opportunities.ts        9
    ├── drafts.ts               3
    ├── recommendations.ts      2
    └── activity.ts             3 rejected + meta
```

## Related Code Files
**Create**
- All files in `apps/web/src/data/catalog/` (per architecture above)
- `packages/contracts/src/opportunity.ts` (Zod schema for Opportunity)
- `packages/contracts/src/agent-draft.ts`
- `packages/contracts/src/agent-recommendation.ts`
- `packages/contracts/src/agent-activity.ts`

**Modify**
- `packages/contracts/src/index.ts` — re-export new schemas
- `packages/contracts/src/feature.ts` — confirm has fields needed (latencyTier, dualTier, definition.exprLang, definition.dbtSql)
- `packages/contracts/src/segment.ts` — confirm has predicate AST fields
- `packages/contracts/src/campaign.ts` — confirm trigger types, holdout, journey

## Implementation Steps
1. Extend `@hermes/contracts/src/`:
   - `opportunity.ts`: Zod schema with id, agent, surfacedAt, confidence, window, intent, evidence[], proposed, whyNow, game, goal4r, status.
   - `agent-draft.ts`: id, fromOpportunity, type ('segment'|'campaign'), draft data, status.
   - `agent-recommendation.ts`: id, campaignId, type ('scale'|'extract'|'extend'|'kill'|'drop_variant'), reason, projection.
   - `agent-activity.ts`: id, agent, action, outcome, timestamp.
2. Write `data/catalog/features/*.ts`. Each file exports an array of `Feature` objects. All 67 names from Hermes_Demo_Data Part 1.
3. Write `data/catalog/events/*.ts`. All 47 events from Part 2.
4. Write `data/catalog/segments.ts`:
   - 5 demo: seg-cfm-ss1-weapon-owners-2026, seg-cfm-loss-streak-non-paying-2026-0508-a3f9, seg-cfm-rfm-tier-1..4-2026 (ladder), seg-tf-returning-coaches-2026, seg-cfm-low-coin-vip-2026
   - 6-8 fictional for library variety: seg-cfm-veteran-pvp, seg-cfm-whale-at-risk, seg-cfm-new-player-d2, seg-cfm-shop-window-shopper, seg-cfm-lapsed-mid-spender, etc.
   - Mark ≥1 as `author: 'agent-drafted'` per Agentic §6.1
5. Write `data/catalog/campaigns.ts`:
   - 5 representative: CFM-2 Voting SS1, CFM-11 Year-End, CFM-13 Pass Stuck (canonical demo), CFM-18 Low CF Coin, TF-1 Football Hub Hybrid
   - 2 agent-drafted variants: cmp-cfm-pass-stuck-variant-b (from opportunity #1), cmp-nth-whale-comeback (from opportunity #2)
   - Each: trigger type, audienceRef (segmentId or null), schedule, eventTrigger (if real-time), action variants, holdout, journey
6. Write `data/catalog/agents/opportunities.ts` — 9 opportunities verbatim per Agentic §7.1. Anchor #1 (CFM Loss Streak) drives demo flow step 11.
7. Write `data/catalog/agents/drafts.ts` — 3 per §7.2.
8. Write `data/catalog/agents/recommendations.ts` — 2 per §7.3.
9. Write `data/catalog/agents/activity.ts` — 3 rejected + meta-records of approvals.
10. Write `data/catalog/audience-patterns.ts` — Loss Streak, Whale at Risk, Lapsed Mid-Spender, New Player D2, Shop Window Shopper.
11. Write `data/catalog/intervention-archetypes.ts` — Pass Stuck Rescue, Loss Streak Rescue, Whale Comeback, NRU D2 Nudge, Shop Window Shopper, Friend-of-Lapsed, Mid-Session Step-up.
12. `index.ts` re-exports.
13. Run `pnpm typecheck` — verify all data conforms to contracts.
14. Commit: `feat(data): hand-write Hermes catalog from PRD demo data`.

## Todo List
- [ ] Extend `@hermes/contracts` with opportunity / agent-draft / recommendation / activity schemas
- [ ] Write 67-feature catalog split across 11 domain files
- [ ] Write 47-event catalog split across 8 domain files
- [ ] Write 13 segments (5 demo + 8 fictional, ≥1 agent-drafted)
- [ ] Write 7 campaigns (5 representative + 2 variants)
- [ ] Write 9 opportunities (anchor: CFM Loss Streak)
- [ ] Write 3 drafts, 2 recommendations, 3 rejected activity entries
- [ ] Write 5 audience patterns + 7 intervention archetypes
- [ ] `pnpm typecheck` green
- [ ] Commit checkpoint

## Success Criteria
- [ ] All 67 PRD feature names present in `data/catalog/features/`
- [ ] All 47 PRD event names present in `data/catalog/events/`
- [ ] All 5 demo segments + 5 demo campaigns from Hermes_Demo_Data Part 3 present
- [ ] 9 opportunities + 3 drafts + 2 recommendations populate Module 05 inbox
- [ ] `pnpm typecheck` exits 0 — all data types check against contracts
- [ ] Each catalog file ≤200 lines per CLAUDE.md modularization

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Verbatim copy errors (PRD names mistyped) | Write a smoke test that asserts specific load-bearing names: `consecutive_ranked_losses_streak`, `event_match_end`, `seg-cfm-loss-streak-non-paying-2026-0508-a3f9`, `cmp-cfm-407`, `trg-cfm-pass-stuck` |
| Predicate AST shape doesn't match composer needs | Coordinate with P-7 canvas implementation; iterate schema if needed |
| Agent opportunity copy bloat (intent paragraphs long) | Cap intent at 2 sentences; longer goes to `whyNow` |

## Security Considerations
- No PII in catalog data — sample player UIDs use `uid-####` format (synthetic) until P-4 produces real samples (which are themselves anonymised by Trino source policy).
- Agent reasoning threads are illustrative copy, not real audit logs.

## Next Steps
- P-6 (Feature Store) reads from `features/`.
- P-7 (Segments) reads from `segments.ts`, `audience-patterns.ts`.
- P-8 (Campaigns) reads from `campaigns.ts`, `intervention-archetypes.ts`, `events/`.
- P-9 (Agents) reads from `agents/*`.
