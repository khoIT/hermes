---
title: "Agents Compose canvas — three-stage AI authoring"
description: "/agents/compose lets a LiveOps PM describe a problem and walk through Features → Segment → Campaign with agent-assisted authoring. Output flows into existing Segments + Campaigns modules. No real LLM — keyword-matched scripted playbooks."
status: pending
priority: P1
branch: "master"
tags: [agents, demo, may-12, compose, frontend]
blockedBy: []
blocks: []
created: "2026-05-09T17:49:10.555Z"
createdBy: "ck:plan"
source: skill
demo_target: "May-12 alignment meeting"
---

# Agents Compose canvas — three-stage AI authoring

## Overview

- Note (2026-05-10): Code not yet implemented; deferred post-May-12 demo. See `plans/260510-1640-chat-artifact-connectivity` for May-12 scope.

A new screen `/agents/compose` that turns the Agents module from purely reactive (inbox of pre-computed opportunities) into a proactive surface where a LiveOps PM types a problem and walks through three stages of agent-assisted authoring:

1. **Features** — agent proposes 3–5 catalog features, user approves/swaps/drops via side drawer
2. **Segment** — agent composes AND-of-OR predicate, fetches live audience count, detects existing-segment matches
3. **Campaign** — agent composes trigger event + action payload, hands off to existing Campaigns module

No real LLM. Pattern-matching is scripted via internal `compose-playbooks.ts`. 4R goal is auto-tagged from the problem description, NOT user-selected. Free hop-back navigation; downstream stages re-validate when upstream changes.

## Why this matters

Today the Agents tab only shows **pre-computed opportunities** the system surfaced. Users can't ask "I have a problem — what would help?" The mockup at `LiveOps_AI_Native_Authoring_Mockup.html` shows the missing motion: intent-first authoring. This plan ports the *idea* of that mockup into the existing three-module architecture (Feature Store / Segments / Campaigns), avoiding the mockup's standalone "Apollo Nexus" framing.

The output is a single new screen that reuses every existing module. Net new is one canvas, one data file, ~8 components.

## Locked decisions (from brainstorm)

| # | Decision |
|---|---|
| 1 | Two-column layout: persistent conversation rail (left) + three-stage stepper (right) |
| 2 | 4R goal auto-tagged by system from problem text — NOT a user selector |
| 3 | Free hop-back; editing upstream marks downstream `stale` and auto-recomputes on re-open |
| 4 | Agent waits for input during stages 2/3 (no proactive narration after initial proposal) |
| 5 | One problem per session; stage 3 has "Continue in Campaigns →" CTA that hands off |
| 6 | Side drawer for feature swap with two tabs: `Suggested` (correlated + type-compat) and `All features` (full catalog) |
| 7 | "Playbook" is internal-only — pattern recognition shows up as conversational flavor, not as a clickable artifact |
| 8 | Empty state: textarea + 4–5 starter chips that pre-fill on click |
| 9 | Conversation persists across hop-back; system messages annotate edits |

## Reuse map

| New surface needs | Existing source |
|---|---|
| Feature catalog + provenance + distribution | `apps/web/src/data/catalog/features/*` + `/api/v1/features` |
| Audience count (single-feature) | `/api/v1/features/{id}/audience-count` (catalog-api :3001) |
| Audience count (multi-feature predicate) | `/api/v1/audience/count` (query-svc :3002) |
| Correlated features (swap drawer suggestions) | `/api/v1/features/{id}/correlated` |
| Segment catalog (existing-match detection) | `apps/web/src/data/catalog/segments.ts` |
| Predicate composer destination | `/segments/new?from=compose-{sessionId}` (existing param) |
| Campaign canvas destination | `/campaigns/new/realtime?from=compose-{sessionId}` (new param wired alongside existing `from=draft-…`) |
| OpportunityCard for inbox entry | `apps/web/src/components/opportunity-card.tsx` |
| Theme tokens | `apps/web/src/theme.tsx` |

## Phases

| # | Phase | Priority | Effort | Status |
|---|-------|----------|--------|--------|
| 1 | [Foundation & State](./phase-01-foundation-state.md) | P1 | 4h | Completed |
| 2 | [Conversation Rail & Intent](./phase-02-conversation-rail-intent.md) | P1 | 4h | Completed |
| 3 | [Stage 1 — Features](./phase-03-stage-1-features.md) | P1 | 6h | Completed |
| 4 | [Stage 2 — Segment](./phase-04-stage-2-segment.md) | P1 | 5h | Completed |
| 5 | [Stage 3 — Campaign](./phase-05-stage-3-campaign.md) | P1 | 5h | Completed |
| 6 | [Routing & Inbox Entry](./phase-06-routing-inbox-entry.md) | P1 | 3h | Completed |
| 7 | [Polish & Demo Hardening](./phase-07-polish-demo-hardening.md) | P2 | 4h | Completed |

**Critical path for May-12:** phases 1–6. Phase 7 = demo-day hardening + 4 extra playbooks; can land after the meeting if needed.

## Demo flow (target 90s)

1. Open `/agents` → click `+ Describe a problem` (new primary CTA in header).
2. Compose canvas opens, conversation empty. Type *"players are losing 5+ ranked matches in a row and getting frustrated"*.
3. Stage 1 expands; agent narrates 3 feature picks; 4R chip fills in *Retain · 92%*.
4. Click `consecutive_ranked_losses_streak` → side drawer opens with real distribution; close.
5. Approve all 3 features → Stage 2 opens with predicate + audience count from real API; *"Matches existing seg-cfm-loss-streak…"* pill appears.
6. Approve segment → Stage 3 opens with full campaign card; type *"don't make the offer too generous"* in rail; action card swaps payload.
7. **Continue in Campaigns →** routes to `/campaigns/new/realtime?from=compose-{id}` with banner. Demo loops back into existing flow.

## Constraints

- Front-end only. No backend changes. APIs already shipped.
- All files ≤ 200 lines per project conventions.
- Match design language: Spectral serif (display), Inter (body), JetBrains Mono (technical), brand red `#f05a22`.
- Use existing `T` theme tokens from `apps/web/src/theme.tsx`.
- Demo must run in 90s; degrade gracefully if catalog-api or query-svc unreachable.

## Risks

| Risk | Mitigation |
|---|---|
| Free-text input lands outside any playbook → demo dies on stage | 5 playbooks with broad keyword sets; fallback message *"I don't recognize this pattern — try one of these"* with chips |
| Live audience count API slow during demo | Show optimistic placeholder ("computing…") then real number; cache last-fetched per session |
| Hop-back staleness propagation breaks state | Pure-reducer pattern; unit-test transitions in phase 1 |
| Stage 3 → Campaigns handoff loses context | Pass session ID via query param; banner in destination shows session link |
| Files exceed 200 LOC | Aggressive componentization; rationale-chip / metric-card / action-card extracted as shared primitives |

## Out of scope

- Real LLM integration (Phase 2 wiring, post-May-12)
- Persisting compose sessions across page reloads (in-memory only)
- Multi-problem sessions (one-per-session)
- Mobile/tablet layout (desktop demo only)
- Editing the underlying campaign template inside the Compose canvas (that's what "Continue in Campaigns →" is for)

## Dependencies

None — front-end only, all data + APIs already shipped.
