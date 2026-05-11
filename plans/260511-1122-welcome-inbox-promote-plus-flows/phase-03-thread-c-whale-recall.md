---
phase: 3
title: Thread C - Whale Recall
status: completed
priority: P2
effort: 3h
dependencies: []
parallel_eligible: true
parallel_with:
  - 2
file_ownership:
  - apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts
---

# Phase 3: Thread C — Whale Recall Agent-First Arc

## Overview

Author a new sibling agent-first chat thread (`thread-demo-agent-whale-recall-2026`) covering top-1% spender recall decline. Same 4-turn structure as canonical `thread-demo-agent-livops-2026`. Tool-call shapes rotated to avoid déjà vu with arcs A and B.

**Parallel-eligible with phase 2.** File ownership strictly limited to the new thread file — no shared file edits.

## Context links

- Brainstorm: `plans/reports/brainstorm-260511-1122-welcome-inbox-promote-plus-flows.md`
- Template to mirror: `apps/web/src/data/chat/threads/thread-demo-agent-livops-2026.ts`
- Canonical whale analyst arc (subject parallel): `apps/web/src/data/chat/threads/thread-008-pt-whale-recall.ts`
- Response section types: `apps/web/src/data/chat/response-types.ts`

## Requirements

**Functional**
- New file at exact path `apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts`
- Exports `threadDemoAgentWhaleRecall2026: Conversation` and `threadDemoAgentWhaleRecall2026Turns` with keys `t1`, `segment`, `campaign`, `retrospective`
- Conversation `id` = `'thread-demo-agent-whale-recall-2026'` matching phase-1 card C `threadId`
- Slim seed: one user message; T1 auto-plays on entry
- `TARGET_SEGMENT_ID = 'seg-cfm-whale-dormant-postseason-2026-0509-c7a1'` (new, unique)

**Non-functional**
- File length ≤ 520 lines
- Pure data export — types-only imports
- All numerical values internally consistent across T1→T4

## Narrative + tool-call spec

### T1 — Diagnose (`id: 'm-agent-c1'`)

**Tool-call chain (3 chips, rotated shape vs arcs A and B)**:
1. `query_trino` — `cfm_vn` · table `monetization_events` · window `'2026-03-21 → 2026-05-09'` → result `'1,243,890 rows · cached:false'` · ~1280ms
2. `spend_distribution` — `percentile=99` · `dim=spend_per_user_30d` · `n_top_users=1240` → result `'p99 cutoff = $187/30d · 1,240 users'` · ~480ms
3. `dormancy_signal` — `cohort=top_1pct_spenders` · `window_days=14` · `metric=session_count` → result `'472/1240 dormant (38% recall, was 52%)'` · ~640ms

**Narrative**:
> Top-1% spender 30-day recall rate fell from **52% → 38%** over the last 4 weeks — a **14pp drop**. The cohort definition holds: 1,240 users above $187/30d spend (p99). Of those, **472 went dormant** (no session in 14 days). Drilling in by spend-tier, the dormancy is **bimodal** — heavy on the very top ($500+/30d, the "named whales") and concentrated to the post-Apr-21 window when the **ranked season reset** dropped them out of the leaderboard top brackets. **4 named whales account for $14k of the $38k MRR at risk.**

**Charts**:
- `h2: 'Top-1% spender recall · 12-week trend'`
- `widget: line` — recall % from 50→52→51→52→52→51→52 (stable Q1) then 47→43→40→38 (post-reset slide)
- `provenance: 'Source: cfm_vn.monetization_events · spend p99 cohort · session-defined recall · 14-day rolling'`
- `h2: 'Dormancy by spend tier — bimodal'`
- `widget: bar` — tiers `$100-200`, `$200-300`, `$300-500`, `$500+` with dormancy rates `28%, 35%, 39%, 61%` (the bimodal shape with $500+ as the spike)
- `provenance: 'Source: cfm_vn.monetization_events × player_session_summary · 4-week window'`

**Insights** (3-4 bullets emphasizing the post-reset timing + named-whale concentration) + **soft_hint** + **followUps**: `['Build a rescue segment']`

### T2 — Build segment (`id: 'm-agent-c2'`)

**Tool-call chain**:
1. `query_features` — `features=['lifetime_value_usd','last_purchase_days_ago','ranked_tier_change_30d','consecutive_no_session_days']` · `audience=top_1pct_spenders` → result `'4 features · 1,240 UIDs'` · ~380ms
2. `cohort_intersect` — `set_a=top_1pct_spend` · `set_b=ranked_tier_dropped_postreset` · `set_c=consecutive_no_session_days>=10` → result `'intersection=89 UIDs · est. MRR risk=$38k'` · ~720ms
3. `lookalike_scope` — `seed=4_named_whales` · `feature_proximity=['spend_pattern','session_cadence','rank_history']` → result `'85 similar players · cosine ≥ 0.82'` · ~1140ms

**Narrative** locking the 3-filter segment:
> Filter A — lifetime_value_usd ≥ $1,800 (the top-tier spend floor).
> Filter B — ranked_tier_dropped_postreset = `true` (the seasonal trigger).
> Filter C — consecutive_no_session_days ≥ 10 (the dormancy threshold).
>
> Stacked: 89 UIDs · $38k 30d MRR at risk · includes the 4 named whales + 85 lookalikes.

**Charts per filter** (3 × `bar widget + provenance`):
- Filter A bar: `Spender LTV distribution` with cutoff at $1,800
- Filter B bar: `Recall % by ranked tier change` (dropped 1 tier=44%, dropped 2+=29%, unchanged=58%, climbed=63%)
- Filter C bar: `Recall % by consecutive no-session days` (0-3=92%, 4-9=71%, 10-14=42%, 15+=18%)

**Insights** + `action_card_segment` (with named-whale risk highlight in description) + **followUps**: `['Launch the rescue campaign']`

### T3 — Launch campaign (`id: 'm-agent-c3'`)

**Tool-call chain**:
1. `manual_outreach_capacity` — `team=cfm_concierge` · `slots_available=50_per_week` → result `'50/89 covered week 1 · 39 week 2'` · ~150ms
2. `select_appreciation_drop` — `tier=top_1pct` · `inventory=['skin_rare','currency_bundle','ranked_protect_3day']` → result `'3-item drop · cost $18 retail-equiv'` · ~210ms
3. `forecast_recovery` — `mechanic=concierge_plus_appreciation` · `historical=whale_recovery_v2_2025` → result `'projected 55-70% recovery rate'` · ~330ms

**Narrative**: Hybrid mechanic — **manual concierge outreach** for the 4 named whales + the 50 highest-LTV lookalikes (week 1), then 39 remaining lookalikes (week 2). Each receives a **3-item appreciation drop** (rare skin + currency + 3-day ranked-protect). No holdout (sample too small for stat-sig A/B); track recovery vs the pre-rescue dormancy baseline. **Estimated cost ~$1,602** in inventory + ~8 concierge-hours/week.

**`action_card_campaign`** (campaign type = `'manual'` if supported, else `'realtime'` with note) + **soft_hint** + **followUps**: `['Show me the 2-week retrospective']`

### T4 — 2-week retrospective (`id: 'm-agent-c4'`, variant B: partial confirmation + new insight)

**Tool-call chain**:
1. `load_campaign_log` — `id=cfm_whale_concierge_v1` · `window='2026-05-11 → 2026-05-25'` → result `'89 outreaches · 71 acknowledged · 58 returned to session'` · ~390ms
2. `causal_attribution` — `cohort=89_UIDs` · `compare=matched_synthetic_holdout` · `n_matches=89` → result `'lift_vs_synth=+38pp recall · CI [29-46]'` · ~870ms
3. `pre_outreach_recovery_check` — `cohort=89_UIDs` · `pre_outreach_returns=12` → result `'12/58 returned BEFORE outreach contact'` · ~210ms

**Narrative**:
> Two weeks in. Recall recovered to **76% on the cohort vs 38% projected without intervention** — a **+38pp lift**. The 4 named whales: **2 fully recovered, 1 partial (resumed sessions but spend at 60% of baseline), 1 still dormant.**
>
> **Surprise:** 12 of the 58 returners came back **before any concierge outreach landed**. Cross-checking session timestamps against ranked-tier balance updates, those 12 returned the day after a **mid-season ranked-tier rebalance patch** went live (May 17). Implication: **part of the recall recovery is endogenous — seasonal cyclicality, not just the intervention.** The honest lift attributable to outreach is closer to **+30pp**, still strong but less than the headline +38pp suggests.

**Charts**:
- `h2: 'Recall recovery curve · cohort vs synthetic holdout'`
- `widget: line` — cohort climbs 38→52→64→71→76; synth holdout drifts 38→39→40→38→38 over 14 days
- `provenance: 'Source: matched_synthetic_holdout (propensity-weighted) · cfm_vn.player_session_summary'`
- `h2: 'Recovery composition · intervention vs endogenous'`
- `widget: bar` — `'Outreach-attributed (matched-pair)' = 30pp` vs `'Endogenous (mid-season patch)' = 8pp` (stacked = 38pp total)
- `provenance: 'Source: matched-pair causal attribution + session timestamp cross-check against patch logs'`

**Insights** (4 bullets including the endogenous-recovery surprise + honest revised attribution) + **soft_hint** + **followUps**: `[]` (terminal)

## Related code files

**Create**
- `apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts`

**Do NOT modify** (plumbing lands in phase 4 — keeps phase 3 conflict-free with phase 2):
- ~~`apps/web/src/utils/chat-bootstrap.ts`~~
- ~~`apps/web/src/data/chat/multi-turn-registry.ts`~~
- ~~`apps/web/src/modules/chat/thread-page.tsx`~~
- ~~`apps/web/src/components/chat-rail/chat-rail.tsx`~~
- ~~`apps/web/src/components/chat-rail/restart-demo-chip.tsx`~~

## Implementation steps

1. **Mirror template structure** from `thread-demo-agent-livops-2026.ts`
2. **Define `TARGET_SEGMENT_ID`** = `'seg-cfm-whale-dormant-postseason-2026-0509-c7a1'`
3. **Author T1** per spec (~115 lines: 3 tool-calls + narrative + 2 charts with provenance + insights + soft_hint + followUps)
4. **Author T2** per spec (~145 lines: 3 tool-calls + narrative + 3 filter charts with provenance + insights + action_card_segment + followUps)
5. **Author T3** per spec (~75 lines: 3 tool-calls + narrative + action_card_campaign + soft_hint + followUps). Verify `action_card_campaign.type` enum accepts `'manual'` — if not, fall back to `'realtime'` and put `'manual concierge'` in the description.
6. **Author T4** per spec (~135 lines: 3 tool-calls + narrative + recovery curve + stacked attribution bar + insights + soft_hint + empty followUps)
7. **Slim seed** with `m-agent-c-u1` user message text = `'Show me what you found.'`
8. **Export `threadDemoAgentWhaleRecall2026Turns`** = `{ t1, segment, campaign, retrospective }`
9. **Typecheck** standalone

## Todo list

- [ ] File created at exact path
- [ ] `TARGET_SEGMENT_ID` constant defined
- [ ] T1 authored with 3 rotated tool-call functions (`query_trino`, `spend_distribution`, `dormancy_signal`)
- [ ] T2 authored with 3-filter segment + action_card_segment, includes named-whale risk
- [ ] T3 authored — verify `action_card_campaign.type` enum compatibility
- [ ] T4 authored with partial-confirmation narrative + endogenous-recovery surprise + honest revised attribution
- [ ] Conversation export `threadDemoAgentWhaleRecall2026: Conversation` with slim seed
- [ ] Named-turn export `threadDemoAgentWhaleRecall2026Turns` matches template shape
- [ ] `pnpm typecheck` passes

## Success criteria

- [x] File compiles standalone *(verified: `pnpm --filter @hermes/web typecheck` clean)*
- [x] All 4 turns have distinct `id`s in form `'m-agent-c<N>'` *(verified: m-agent-c1, m-agent-c2, m-agent-c3, m-agent-c4)*
- [x] Numerical anchors consistent: 1,240 top-1% users · 89 segment · 38%→76% recall lift · $38k MRR at risk · 4 named whales *(verified: code-review section "Numerical anchors hold within each thread")*
- [x] Tool-call functions differ from arcs A and B (no name collisions across all 12 tool-call functions across the 3 arcs) *(verified: code-review tool-call rotation, 12 unique fns, distinct from A's set)*
- [x] Phase 4 plumbing can register the export without modification *(verified: export `threadDemoAgentWhaleRecall2026Turns` matches template shape)*
- [ ] Demo dry-run: T1 auto-plays → follow-up arcs T2/T3/T4 complete *(deferred to user)*

## Risk assessment

| Risk | Mitigation |
|---|---|
| `action_card_campaign.type` may not accept `'manual'` | Pre-verify response-types.ts before authoring T3; fallback to `'realtime'` with description noting manual mechanic |
| Endogenous-recovery surprise (12/58 pre-outreach returners) reads as undermining the agent | Frame as **maturity** signal — the agent doing honest attribution. Brainstorm explicitly chose partial-confirmation variant B. |
| Small cohort (n=89) makes statistical claims fragile | Use matched-pair synthetic holdout language; cite CI [29-46]. Avoid p-values for small-n. |
| Tool-call name collision with phase 2 author working in parallel | Lock function-name registry in this plan: phase 2 owns `query_trino, cohort_split, compare_funnels, query_features, bucket_lift, estimate_cohort_size, estimate_cost, split_holdout, forecast_lift, load_experiment, cross_metric_check, shapley_attribution`. Phase 3 owns `query_trino, spend_distribution, dormancy_signal, cohort_intersect, lookalike_scope, manual_outreach_capacity, select_appreciation_drop, forecast_recovery, load_campaign_log, causal_attribution, pre_outreach_recovery_check`. Only `query_trino` overlaps (intentional — generic primitive). |
