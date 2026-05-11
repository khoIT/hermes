---
title: "Chat Rail + 4 Scripted Multi-Turn Flows (Research → Board, Features → Segment)"
type: brainstorm
date: 2026-05-10
slug: chat-rail-scripted-flows
status: design-locked
related:
  - design-reference/Hermes/uploads/PRD_Hermes_Agentic.md
  - design-reference/Hermes/uploads/Hermes_Demo_Data.md
  - design-reference/Hermes/uploads/liveops_2026_campaign_requirements.md
  - C:/Users/CPU12830-local/Downloads/actioneer/prd-master.md
predecessor_plans:
  - 260510-0151-chat-first-sidebar-ia (chat module + suggested prompts)
  - 260510-1330-actioneer-shell-redesign (topbar + sidebar polish + library tightening)
---

# Chat Rail + 4 Scripted Multi-Turn Flows

## Problem statement

Hermes prototype must demonstrate that the chatbot **routes users to existing modules**, not just answers questions. Two use-cases:

1. **Deep research → Board** — user queries data, agent draws charts, user pins to Board for revisit.
2. **Features → Segment** — user describes a player problem, agent recommends Feature Store features + composes a Segment artifact.

The chat surface today is a full-page route (`/chat/:id`) plus a FAB pop-out. Both lack page context. The Actioneer reference shows a contextual right-rail anchored on every detail page — that's the demo polish target.

## Requirements

**Functional:**
- 4 pregenerated prompts on chat empty state, grouped under 2 category pills
- Each flow plays in 2-3 multi-turn exchanges, advanced via follow-up chips
- Research flows terminate with Pin-to-Board → auto-create board on first pin
- Segment flows terminate with `action_card_segment` → confirm → navigate to `/segments/:id`
- Chat surface evolves into a contextual right-rail anchored on detail pages
- Rail has page-context chip auto-resolved from URL (Segments · Name, Feature · Name, Board · Name)
- Free-text mid-flow → soft hint message, fallthrough to existing intent matcher
- Hybrid backend — Feature Store lookups call real `catalog-api /api/v1/features/:name`; chart data + counts canned

**Non-functional:**
- Multi-turn click-to-render <200ms per turn (canned data)
- FeatureChip survives catalog-api 5xx via hardcoded fallback (recurring HTTP 500 history)
- Rail width 400px on detail pages; closes/opens via toggle
- Rail hidden on `/chat`, `/chat/:id`, `/` (full-page chat is already the chat)

## Decisions locked (skip in plan re-debate)

| # | Decision | Rationale |
|---|---|---|
| 1 | Hybrid backend (real catalog-api features, canned analytics) | Realistic feel + demo control |
| 2 | Multi-turn 2-3 exchanges, guided via follow-up chips | "Interactivity to arrive at artifact" — user said so |
| 3 | Replace 5 generic prompts with 4 categorized prompts | Use-cases legible on first paint |
| 4 | Anchors: PT (gem-burn) + CFM (year-end tier ROI) for research; CFM (loss streak) + PT (at-risk whales) for segment | "Focus on PTG and CFM"; keep loss-streak full flow |
| 5 | Auto-create Board on first pin | Less friction; user said so |
| 6 | FeatureChip / artifact click → navigate to feature/segment/campaign in same tab | Context follows the user; rail page-chip auto-updates |
| 7 | Free-text mid-flow → soft hint banner | "Try one of the follow-ups above" — gentle guidance |
| 8 | Chat surface = contextual right-rail anchored on detail pages | Actioneer pattern; user-provided screenshot reference |
| 9 | Right-rail replaces existing AskHermesFab + AskHermesPanel | Single chat surface; FAB becomes rail toggle icon |
| 10 | Full-page `/chat/:id` remains for deep-dive review | Rail is contextual; full-page is comprehensive |
| 11 | Rail auto-update page-context chip after artifact navigation | Seamless context-follow |

## Approaches evaluated (rejected)

| Approach | Why rejected |
|---|---|
| Full backend via query-svc for everything | Flaky (recurring HTTP 500); risks demo |
| One-shot rich responses (no multi-turn) | User explicitly chose multi-turn |
| New `/chat/templates` page | Lower discoverability than empty-state pills |
| Generic D7/ARPDAU anchors | Less tied to LiveOps calendar; less specific |
| Branched one-shot (preview options, pick path) | Hybrid feel without true conversation; user picked true multi-turn |
| Append 4 prompts to existing 5 (total 9) | Crowded landing; doesn't make use-cases legible |

## Architecture

### Three-phase delivery

```
P1 · Contextual right-rail shell        (~6h)  — structural
P2 · Multi-turn registry + 4 flows      (~6h)  — content + interaction
P3 · Empty-state recent threads + pills (~2h)  — polish
```

Each phase independently shippable.

### Right-rail anatomy

```
┌─ Chat                   + New · [×] ┐
│            ┌─ HERMES ─┐               │  empty state:
│            │   logo   │               │  brand mark + tagline
│         Hermes                        │
│  Ask about this page or your data     │
│                                       │
│  ── RECENT THREADS ──                 │  pulls from recent-items store
│  💬 thread title 1                    │
│  💬 thread title 2                    │
│                                       │
│  ── TRY ONE OF THESE ──               │  4 categorized prompts
│  [Deep research → Board]              │
│   ▸ Compare PT-6 vs PT-10 gem-burn    │
│   ▸ CFM-11 year-end tier ROI          │
│  [Find features → segment]            │
│   ▸ Consecutive losses intervention   │
│   ▸ At-risk PT whales recall          │
│                                       │
│  ┌─ What do you want to know? ─────┐ │
│  │ • Segments / Organic Power Users│ │  page-context chip (removable)
│  └─────────────────────────────────┘ │
│                                  [→]  │
└───────────────────────────────────────┘
```

**Behavior:**

| Route | Rail default | Page context chip |
|---|---|---|
| `/feature-store/:name` | open | `Feature · {name}` |
| `/segments/:id`, `/segments/:id/{tab}` | open | `Segments · {segment.name}` |
| `/canvas/:id` | open | `Board · {board.name}` |
| `/campaigns/:id` | open | `Campaigns · {campaign.name}` |
| Library pages (`/feature-store`, `/segments`, `/canvas`, `/campaigns`) | closed | (none — workspace-wide) |
| `/chat`, `/chat/:id`, `/` | hidden | (full-page chat) |

- Width 400px; sidebar 260 + content + 400 fits 1440px+ comfortably
- Toggle button = repurposed `<AskHermesFab>` (icon flips on rail state)
- "+ New" → fresh thread in rail
- Click thread title in rail header → opens `/chat/:threadId` full-page

### Compact rendering inside rail vs full-page

| Element | Full-page | Rail |
|---|---|---|
| Chart width | 640px | 320px |
| Table | as-is | horizontal scroll if >3 cols |
| FeatureChip cards | 3-up grid | vertical stack |
| Action card (segment / pin-board) | full width | full rail width |

### Multi-turn flow shape (every prompt)

```
T1: USER prompt → ASST [narrative + 1-2 charts + insights + 2-3 follow-up chips]
T2: USER clicks chip → ASST [drill chart OR live FeatureChips + chips]
T3: USER clicks final chip → ASST [terminal artifact: pin-to-board OR action_card_segment]
```

Free-text mid-flow → soft hint inline + fallthrough to intent matcher.

### Multi-turn registry

```ts
// data/chat/multi-turn-registry.ts
type ThreadStep = { triggerText: string; threadId: string; assistantMsg: AssistantMessage };
const REGISTRY: Map<string, ThreadStep[]> = new Map([
  ['thread-005', [step1, step2, step3]],
  // ...
]);

// chat-respond.ts: when user clicks a follow-up chip,
// look up next step in active thread's step list and append to conversation.
```

### Hybrid Feature Store integration

`<FeatureChip name="...">`:
- On mount: `fetch('/api/v1/features/' + name)` via existing client
- Loading: 80x32 skeleton
- Success: render mini feature card (domain · type · latency badge · description)
- 5xx fallback: hardcoded card from `data/catalog/features/index.ts` (already exists in repo)
- Click → `navigate('/feature-store/' + name)` (rail page-context chip auto-updates)

## Four scripted flows (script outlines)

### R1 · PT-6 vs PT-10 gem-burn (research → Board)

| Turn | User | Assistant |
|---|---|---|
| 1 | "Compare PT-6 vs PT-10 gem-burn — did the hoarder branch drain stockpiles?" | Clustered bar "Avg gem-balance Δ before/after by VIP segment" + insight "Hoarder dropped 47% in PT-6 vs 23% in PT-10" + chips: *Drill into hoarder · Compare F2P vs hoarder · Show drop-table parity* |
| 2 | "Drill into hoarder segment" | Line "Hoarder gem-balance trajectory · 30d bracketing PT-6" + insight "Drop began Day-2 ramp" + chip: *Pin to PT Liveops Board* |
| 3 | "Pin to PT Liveops Board" | `pin_to_board` section → auto-create board → "Saved to PT Liveops Board" with link `/canvas/{id}` |

### R2 · CFM-11 year-end tier ROI (research → Board)

| Turn | User | Assistant |
|---|---|---|
| 1 | "How are CFM-11 year-end tiers performing on reward-cost vs retention?" | Stacked bar "Reward cost · ARPDAU · D14 retention by tier" + insight "Whale tier = 18% reward budget, 41% retained ARPDAU" + chips: *Compare to last year · Tier population shift · Drill NRU tier* |
| 2 | "Compare to last year" | Line "YoY tier × retention · Dec 2025 vs Dec 2026" + insight "NRU pop +22% YoY but D14 fell 11%→6%" + chip: *Pin to CFM Liveops Board* |
| 3 | "Pin to CFM Liveops Board" | `pin_to_board` section → auto-create → link out |

### S1 · CFM consecutive-loss intervention (features → Segment)

Supersedes thread-003-loss-streak.

| Turn | User | Assistant |
|---|---|---|
| 1 | "Players hitting consecutive ranked losses — how to intervene?" | Bar "Streak distribution last 14d" + insight "52,600 sitting at 5+" + chips: *Show me the features · Filter by non-paying tenure ≥ 7d · Past A/B results* |
| 2 | "Show me the features" | 3 inline FeatureChip cards (live catalog-api): `consecutive_ranked_losses_streak`, `is_paying_user_lifetime`, `iam_received_count_24h` + composing narrative + chip: *Build segment from these features* |
| 3 | "Build segment from these features" | `action_card_segment` "CFM · 5+ Loss Streak · Non-paying · 24h cooldown" · ~52,600 UIDs · Confirm → `/segments/{id}` |

### S2 · PT at-risk whales recall (features → Segment)

| Turn | User | Assistant |
|---|---|---|
| 1 | "Find at-risk PT whales who haven't logged in this week" | Bar "Whale-tier login distribution last 30d" + insight "1,840 whales in 7-14d band" + chips: *Show me the features · Tighten cohort · Compare to active whales* |
| 2 | "Show me the features" | 3 FeatureChip (live): `spend_tier_lifetime`, `last_login_days_ago`, `lifetime_revenue_local` + narrative + chip: *Build at-risk whale segment* |
| 3 | "Build at-risk whale segment" | `action_card_segment` "PT · At-risk Whales · last login 7-14d" · ~1,840 UIDs · Confirm → `/segments/{id}` |

## Files affected (~14 in `apps/web` only · no backend)

**P1 — Right-rail (6 files):**
- NEW `components/chat-rail/chat-rail.tsx`
- NEW `components/chat-rail/page-context-chip.tsx`
- NEW `utils/chat-rail-store.ts` (open/closed persistence)
- MOD `App.tsx` — render `<ChatRail>` in `<main>` right gutter, route-conditional
- MOD `components/fab/ask-hermes-fab.tsx` — repurpose as rail toggle (or replace)
- MOD `components/fab/ask-hermes-panel.tsx` — deprecate; rail supersedes

**P2 — Multi-turn registry + flows (8 files):**
- NEW `data/chat/threads/thread-005-pt6-gem-burn-research.ts`
- NEW `data/chat/threads/thread-006-cfm-tier-roi-research.ts`
- NEW `data/chat/threads/thread-007-cfm-loss-streak-multi.ts` (supersedes thread-003)
- NEW `data/chat/threads/thread-008-pt-whale-recall.ts`
- NEW `data/chat/multi-turn-registry.ts`
- NEW `components/chat/widgets/feature-chip.tsx` (real catalog-api + fallback)
- NEW `components/chat/sections/pin-to-board-section.tsx`
- NEW `components/chat/sections/soft-hint.tsx`
- MOD `data/chat/suggested-prompts.ts` (5→4 + `category` field)
- MOD `data/chat/response-types.ts` (add `feature_chip`, `pin_to_board`, `soft_hint` section types)
- MOD `utils/chat-respond.ts` (route via multi-turn registry; soft-hint on miss)
- MOD `components/chat/assistant-response.tsx` (render new section types)
- MOD `data/chat/intents.ts` (extend matcher)

**P3 — Empty-state polish (2 files):**
- MOD `components/chat-rail/chat-rail.tsx` (recent threads + scripted prompts in empty state)
- MOD `components/chat/suggested-prompt-list.tsx` (compact mode for rail vs landing)

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| catalog-api flakes (recurring HTTP 500) | FeatureChip skeleton → hardcoded fallback from `data/catalog/features/index.ts` |
| Multi-turn fixture maintenance churn | 4 threads × 3 turns = 12 baked messages. Acceptable for v1 demo; widget shapes stable |
| User free-text mid-flow | Soft-hint inline message + fallthrough to intent matcher (existing path works today) |
| Pin-to-Board needs new wiring from chat section | Existing `pin-to-board-popover` already exists for cards; thin wrapper to emit snapshot from a thread widget. ~30 lines |
| Right-rail at 400px compresses content too much | Toggle button always visible; user collapses on demand. Width tunable via `chat-rail-store` |
| AskHermesFab repurpose breaks existing flows | The FAB-triggered AskHermesPanel is deprecated wholesale; rail supersedes. No partial migration |
| Rail open/close state cross-route | localStorage `hermes:chat-rail:open` per workspace, default per-route table above |
| Sidebar 260 + main + rail 400 cramps narrow viewports | Hermes is desktop-only (1440px+ assumed); below that, rail auto-collapses |
| 4 scripted prompts conflict with existing intent matcher entries | Each prompt gets a stable `id` and intent matcher prefers exact-match before fuzzy |
| Action_card_segment Confirm fails (segments-store error) | Existing path is proven (thread-004 works today); no new failure mode |

## Success metrics

- 4 prompts visible on rail empty state under 2 categorized pills
- Each scripted flow reaches its terminal artifact in 3 turns (no dead-ends)
- Both research flows produce a chart pinned to a Board, viewable at `/canvas/{id}`
- Both segment flows produce an `action_card_segment` confirmable to `/segments/{id}`
- Each segment flow shows ≥3 real catalog-api FeatureChips on T2 (proves hybrid plumbing)
- Multi-turn click-to-render <200ms per turn
- Rail opens by default on detail pages; closed on library pages; hidden on chat routes
- Page-context chip auto-resolves on every detail page; click `×` clears to workspace-wide
- catalog-api 5xx → FeatureChip falls back to hardcoded card; demo never breaks
- `pnpm typecheck` passes for `apps/web`
- No regression on `/feature-store/:name`, `/segments/:id`, `/canvas/:id`, `/campaigns/:id`

## Out of scope (do NOT plan)

- Real LLM calls / streaming SSE
- Backend changes (no contracts, no DB, no migration)
- Workspace switcher functionality
- Mobile responsive (desktop-only app)
- Agent inbox `/agents` (covered by `PRD_Hermes_Agentic.md`, future phase)
- Replacing chat full-page (`/chat/:id`) — remains for deep-dive
- Replacing landing `/` chat — remains for first-time visitors
- Replacing `<AskHermesFab>` icon design — keep current; just toggle behavior
- New chart widget types beyond existing line/bar/scatter/table

## Open questions (non-blocking)

1. **Rail width tuning:** 400px assumed; if 1280px viewport in QA, may need 360px. **Default:** 400px, tune during P1 verification.
2. **Multi-turn registry naming:** map by `triggerText` exact match or by `threadId + stepIndex`? **Default:** map by `(threadId, lastUserMessage.text)` — simpler, no step-index bookkeeping.
3. **Cross-thread context bleed:** if user opens a 2nd thread from rail, does page-context chip carry over? **Default:** yes, rail context = current page, not thread.

## Next steps

1. `/ck:plan` — create implementation plan with 3 phases (right-rail / scripted flows / polish)
2. `/ck:cook` — execute phases sequentially or in parallel (P1 must precede P2 testing)
3. `/ck:journal` — log brainstorm + plan decisions

## References

- `design-reference/Hermes/uploads/PRD_Hermes_Agentic.md` — agentic layer PRD (Opportunity card, agent attribution, action approval contract)
- `design-reference/Hermes/uploads/Hermes_Demo_Data.md` — 67 features + 47 events catalog
- `design-reference/Hermes/uploads/liveops_2026_campaign_requirements.md` — 47 campaigns mapped (PT-6, COS-1, CFM-11, CFM-13 archetypes used)
- `C:/Users/CPU12830-local/Downloads/actioneer/prd-master.md` — chat-rail pattern reference + journey 1/2 (research → board, segment → activate)
- `apps/web/src/data/chat/threads/thread-001-cpi-ltv.ts` — existing one-shot thread pattern (stays)
- `apps/web/src/data/chat/threads/thread-003-loss-streak.ts` — superseded by thread-007-cfm-loss-streak-multi
- `apps/web/src/components/boards/pin-to-board-popover.tsx` — existing pin mechanism (reused)
- `apps/web/src/components/chat/deep-research-toggle.tsx` — existing toggle (kept as-is)

---

*Brainstorm closed. Design locked. 11 decisions binding. 3 non-blocking open questions.*
