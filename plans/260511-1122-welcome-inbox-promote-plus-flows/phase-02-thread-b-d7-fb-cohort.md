---
phase: 2
title: Thread B - D7 FB Cohort
status: completed
priority: P2
effort: 3h
dependencies: []
parallel_eligible: true
parallel_with:
  - 3
file_ownership:
  - apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts
---

# Phase 2: Thread B — D7 FB Cohort Agent-First Arc

## Overview

Author a new sibling agent-first chat thread (`thread-demo-agent-d7-fb-cohort-2026`) covering D7 retention drop on the FB-acquired May cohort. Same 4-turn structure as canonical `thread-demo-agent-livops-2026`: T1 diagnose → T2 build segment → T3 launch campaign → T4 2-week retrospective. Tool-call shapes rotated to avoid déjà vu with arc A.

**Parallel-eligible with phase 3.** File ownership strictly limited to the new thread file — no shared file edits.

## Context links

- Brainstorm: `plans/reports/brainstorm-260511-1122-welcome-inbox-promote-plus-flows.md`
- Template to mirror: `apps/web/src/data/chat/threads/thread-demo-agent-livops-2026.ts`
- Canonical D7 analyst arc (subject parallel): `apps/web/src/data/chat/threads/thread-002-d7-facebook.ts`
- Response section types: `apps/web/src/data/chat/response-types.ts`
- Conversation type: `apps/web/src/utils/chat-store.ts`

## Requirements

**Functional**
- New file at exact path `apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts`
- Exports `threadDemoAgentD7FbCohort2026: Conversation` and `threadDemoAgentD7FbCohort2026Turns` with named keys: `t1`, `segment`, `campaign`, `retrospective`
- Conversation `id` = `'thread-demo-agent-d7-fb-cohort-2026'` matching phase-1 card B `threadId`
- Slim seed: only the initial user message; T1 auto-plays on entry (parity with template line 460-466)
- Define `TARGET_SEGMENT_ID = 'seg-cfm-d7-fb-cohort-engaged-2026-0510-b4e2'` (new, no collision with canonical analyst threads)

**Non-functional**
- File length ≤ 520 lines (template baseline ~480)
- Pure data export — no runtime imports beyond `Conversation` and `ChatMessage` types
- All chart values plausible (no obviously fake numbers); follow indexed-100 or absolute % patterns from template

## Narrative + tool-call spec

### T1 — Diagnose (`id: 'm-agent-b1'`)

**Tool-call chain (3 chips, rotated shape vs arc A)**:
1. `query_trino` — `cfm_vn` · table `acquisition_attribution` · window `'2026-04-15 → 2026-05-09'` → result `'1,847,302 rows · cached:false'` · ~1340ms
2. `cohort_split` — `dim=acquisition_channel` · `cohorts=['facebook','google','organic','referral']` · `measure=d7_retention` → result `'4 cohorts · FB outlier'` · ~410ms
3. `compare_funnels` — `cohort=facebook_may_2026` · `stages=['D1','D3','D7']` · `baseline=blended_q1_2026` → result `'D1=92% D3=64% D7=18.2% (blended D7=22.4%)'` · ~620ms

**Narrative**:
> D7 retention for FB-acquired May cohort is **18.2% vs blended baseline 22.4% — a 4.2pp gap**. Decomposed: D1 holds parity (92% vs 91%), D3 holds parity (64% vs 65%), but **D7 drops 4.2pp on the FB cohort specifically**. The damage happens between D3 and D7. Drilling into the funnel, the gap concentrates in users who saw the **legacy onboarding tutorial** (rolled back to all FB cohorts during the May 2 A/B mishap).

**Charts**:
- `h2: 'D7 retention by acquisition channel (May 2026)'`
- `widget: bar` — FB=18.2 (red), Google=22.6, Organic=23.1, Referral=22.0 (gray)
- `provenance: 'Source: cfm_vn.acquisition_attribution · window 2026-04-15 → 2026-05-09 · n=1.84M attributable installs'`
- `h2: 'Funnel parity until D7 — gap opens between D3 and D7'`
- `widget: line` — series=`['FB May cohort','Blended Q1 baseline']` over `['D1','D3','D7','D14','D30']` with values that converge until D3 then diverge sharply at D7

**Insights** (3-4 bullets) + **soft_hint** + **followUps**: `['Build a rescue segment']`

### T2 — Build rescue segment (`id: 'm-agent-b2'`)

**Tool-call chain**:
1. `query_features` — `features=['onboarding_variant','session_count_3d','tutorial_completion_pct']` · `audience=fb_may_2026_d3_active` → result `'4 features · 218k UIDs'` · ~340ms
2. `bucket_lift` — `metric=d7_retention` · `splits=['legacy_tutorial','new_tutorial']` → result `'legacy=15.8% · new=22.1% · gap=6.3pp'` · ~520ms
3. `estimate_cohort_size` — `predicate=fb AND legacy_tutorial AND tutorial_completion<60%` → result `'~38,200 UIDs · 17.5% of FB cohort'` · ~190ms

**Narrative** locking the 3-filter segment:
> Filter A — acquisition_channel = `facebook` (the cohort with the gap).
> Filter B — onboarding_variant = `legacy_v1` (the regression source).
> Filter C — tutorial_completion_pct < 60% (the in-cohort sub-segment where lift will land — fully-completed legacy users have D7 parity already).
>
> Stacked: ~38,200 UIDs, projected +6pp D7 lift.

**Charts per filter** (3 × `bar widget + provenance`):
- Filter A bar: `D7 retention by channel` (FB the dip)
- Filter B bar: `D7 retention by onboarding variant` (legacy=15.8 vs new=22.1)
- Filter C bar: `D7 retention by tutorial completion %` (rising staircase 0-25%, 25-60%, 60-90%, 90%+)

**Insights** + `action_card_segment` with `targetSegmentId=TARGET_SEGMENT_ID` + **followUps**: `['Launch the rescue campaign']`

### T3 — Launch campaign (`id: 'm-agent-b3'`)

**Tool-call chain**:
1. `estimate_cost` — `audience=38200` · `iam_cpm_usd=0.81` · `touches=2` → result `'$619 · 76,400 impressions'` · ~210ms
2. `split_holdout` — `cohort=38200` · `percent=20` → result `'30,560 treatment · 7,640 holdout'` · ~130ms
3. `forecast_lift` — `mechanic=tutorial_retrigger_plus_d3_bonus` · `historical_baseline=cfm_d7_lift_v3_2025` → result `'projected +6.0pp ± 1.4pp'` · ~280ms

**Narrative**: tutorial re-trigger (D2 push) + first-week bonus (rank-token grant on D3 login). 20% holdout. Auto-pause guardrail wired: rollback if D7 lift < +2pp at 7-day check.

**`action_card_campaign`** + **soft_hint** + **followUps**: `['Show me the 2-week retrospective']`

### T4 — 2-week retrospective (`id: 'm-agent-b4'`, variant B: forecast exceeded + new insight)

**Tool-call chain**:
1. `load_experiment` — `id=cfm_fb_d7_rescue_v1` · `window='2026-05-11 → 2026-05-25'` → `n=30,540 (treat) + 7,632 (hold) · p<0.001` · ~470ms
2. `cross_metric_check` — `metric=d14_retention` · `target=experiment_cohort` → result `'d14_lift=+5.2pp (carryover)'` · ~890ms
3. `shapley_attribution` — `filters=[A:channel,B:variant,C:completion]` · `target=d7_retention_lift` → result `'B=58% · A=24% · C=18%'` · ~1090ms

**Narrative**:
> Two weeks in. Rescue delivered **+8.1pp D7 retention lift** — beating the +6pp forecast by 2pt. **Surprise:** the lift carried into **D14 (+5.2pp) and D21 (+3.4pp)**. The intervention didn't just rescue D7 — it repaired the retention curve through the first month. Re-running attribution, **Filter B (onboarding_variant=legacy) explained 58% of the lift** — confirms the tutorial regression was the root cause.

**Charts**:
- D7 + D14 + D21 lift bar chart (`Treatment` vs `Holdout`)
- Retention curve line chart (treatment vs holdout over 21 days)
- Shapley attribution bar (B=58, A=24, C=18)

**Insights** (4 bullets including the D14 carryover surprise) + **soft_hint** + **followUps**: `[]` (terminal)

## Related code files

**Create**
- `apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts`

**Do NOT modify** (plumbing lands in phase 4 — keeps phase 2 conflict-free with phase 3):
- ~~`apps/web/src/utils/chat-bootstrap.ts`~~
- ~~`apps/web/src/data/chat/multi-turn-registry.ts`~~
- ~~`apps/web/src/modules/chat/thread-page.tsx`~~
- ~~`apps/web/src/components/chat-rail/chat-rail.tsx`~~
- ~~`apps/web/src/components/chat-rail/restart-demo-chip.tsx`~~

## Implementation steps

1. **Copy template structure** — start by inspecting `thread-demo-agent-livops-2026.ts` end-to-end as the canonical shape
2. **Define `TARGET_SEGMENT_ID`** = `'seg-cfm-d7-fb-cohort-engaged-2026-0510-b4e2'`
3. **Author T1** per spec above (~110 lines: 3 tool-calls + narrative + 2 charts with provenance + insights + soft_hint + followUps)
4. **Author T2** per spec (~140 lines: 3 tool-calls + narrative + 3 filter charts with provenance + insights + action_card_segment + followUps)
5. **Author T3** per spec (~70 lines: 3 tool-calls + narrative + action_card_campaign + soft_hint + followUps)
6. **Author T4** per spec (~130 lines: 3 tool-calls + narrative + retention chart + Shapley chart + insights + soft_hint + empty followUps)
7. **Slim conversation seed** with only `m-agent-b-u1` user message text = `'Show me what you found.'` (parity with template)
8. **Export `threadDemoAgentD7FbCohort2026Turns`** named-turn object: `{ t1, segment, campaign, retrospective }`
9. **Typecheck** the new file in isolation: `pnpm --filter @hermes/web typecheck`

## Todo list

- [ ] File created at exact path
- [ ] `TARGET_SEGMENT_ID` constant defined
- [ ] T1 authored with 3 rotated tool-call functions (`query_trino`, `cohort_split`, `compare_funnels`)
- [ ] T2 authored with 3-filter segment + action_card_segment
- [ ] T3 authored with action_card_campaign
- [ ] T4 authored with forecast-exceeded narrative + D14 carryover surprise + Shapley attribution
- [ ] Conversation export `threadDemoAgentD7FbCohort2026: Conversation` with slim seed
- [ ] Named-turn export `threadDemoAgentD7FbCohort2026Turns` matches template shape
- [ ] `pnpm typecheck` passes for this file

## Success criteria

- [x] File compiles standalone (no missing types, no unresolved imports) *(verified: `pnpm --filter @hermes/web typecheck` clean)*
- [x] All 4 turns have distinct `id`s in form `'m-agent-b<N>'` *(verified: m-agent-b1, m-agent-b2, m-agent-b3, m-agent-b4)*
- [x] Chart data is internally consistent (D7 numbers in T1 match the baseline cited in T2/T3) *(verified: code-review section "Numerical anchors hold within each thread")*
- [x] Tool-call functions differ from arc A and arc C (no `compute_decomp` / `bucket_by` / `spend_distribution` reused) *(verified: code-review confirms tool-call rotation, 12 unique fns across arc B)*
- [x] Phase 4 plumbing can register the export without modification *(verified: export `threadDemoAgentD7FbCohort2026Turns` matches template shape)*
- [ ] Demo dry-run: T1 auto-plays → follow-up arcs T2/T3/T4 complete *(deferred to user)*

## Risk assessment

| Risk | Mitigation |
|---|---|
| Numerical inconsistency (e.g., T1 says D7=18.2%, T4 says baseline=20%) | Pin baseline = 22.4% blended / 18.2% FB across all turns; calculate forecast/lift from those anchors |
| Tool-call function name collision with arc A/C | Lock function names upfront: `query_trino`, `cohort_split`, `compare_funnels`, `query_features`, `bucket_lift`, `estimate_cohort_size`, `estimate_cost`, `split_holdout`, `forecast_lift`, `load_experiment`, `cross_metric_check`, `shapley_attribution` |
| Vietnamese narrative inside chart titles/tooltips | Out of scope per dictionary.ts header comment — chart strings stay English |
| Action card `targetSegmentId` collides with seeded canonical segment | New ID with unique hash suffix (`b4e2`); grep for collisions before commit |
