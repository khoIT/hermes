# Brainstorm — CFM ARPDAU Demo Narrative Redesign

**Date:** 2026-05-10 21:37 (Asia/Bangkok)
**Scope:** Content rewrite of `thread-demo-livops-2026` T1 + T2 (canonical) and T1 alt-branches. Surface parity (main chat + chat-rail) preserved automatically via shared fixture/registry.

---

## Problem

Current T1 + T2 of the canonical demo arc don't read like real game-analytics deduction:

1. **T1 hook is a WoW line of ARPDAU** — shows the slide but doesn't decompose or explain it. The narrative announces the answer ("loss-streak, lapsed mid-tier, F2P churners drove the drop") *before* any chart proves it. Reader is told, not shown.
2. **T1 doesn't make loss-streak stand out naturally** — it's listed as one of three causes in the opening sentence, then the chart shows none of them.
3. **T2 has 3 charts that all say the same thing** — cohort shrinks, precision climbs. The IAM-cooldown filter (`iam_received_count_24h < 1`) is a defensive ops rule, not a behavioral signal — doesn't earn its chart.
4. **Surface parity verified**: both `/chat/:id` (`thread-page.tsx`) and chat-rail (`compact-thread-view.tsx`) consume the same `threadDemoLivops2026Turns` export and `multi-turn-registry`. Fixture swap propagates to both with zero structural work.

---

## Approach Selected (Recommended)

Reframe T1 as **analyst-led deduction** (decompose → localize → reveal). Reframe T2 so **each filter earns its chart** via past-A/B data, not via redundant cohort math.

All metrics referenced exist in the live catalog (`apps/web/src/data/catalog/features/`):
- `consecutive_ranked_losses_streak` (stateful-streaks.ts)
- `session_count_7d` (engagement.ts)
- `last_purchase_days_ago` (monetization.ts)
- `mmr_drift_7d`, `ranked_win_rate_7d`, `mmr_current` (gameplay-cfm.ts)
- `is_paying_user_lifetime` (monetization.ts) — narrative reference only

No new catalog work, no new contracts, no new section types, no new components.

---

## T1 Redesign — Three-Beat Deduction

### Beat 1 — Decompose the metric

**Narrative:** ARPDAU −7% over 4 weeks. Decomposing: ARPPU is **flat at $24.10**, but Paying-DAU% slipped from **12.1% → 10.4%**. Conversion problem, not spend problem — fewer players reaching the funnel.

**Chart 1 — `demo-arpdau-decomp` (line, dual-series, 12-week)**
- Series A: `Paying-DAU %` (orange, falling 12.1 → 10.4)
- Series B: `ARPPU $` (gray, flat ~$24.10) — normalized to share y-axis OR dual-axis
- Visually proves leak is at conversion stage

### Beat 2 — Localize the leak

**Narrative:** Conversion follows retention. D7 retention dropped 8 points (47% → 39%). Drop is concentrated in **mid-skill ranked** players — new users and whales are flat. The leak is in the middle of the funnel.

**Chart 2 — `demo-d7-retention-by-cohort` (line, 4 series, 12-week)**
- All players (gray, flat ~45%)
- New users ≤7d tenure (blue, flat ~58%)
- Mid-skill ranked (orange, drops 47 → 39)
- Paying users (green, flat ~71%)
- Mid-skill ranked is the obvious outlier

### Beat 3 — The cliff (loss-streak emerges naturally)

**Narrative:** What changed for mid-skill ranked? Q2 ranked season (April reset) widened matchmaking ranges — `mmr_drift_7d` distribution shifted. Bucketing 7d retention by `consecutive_ranked_losses_streak` reveals the cliff: at **5+ losses, retention drops 73% → 41%**, and that bucket grew **3.2× since April**.

**Chart 3 — `demo-streak-retention-cliff` (bar, with QoQ growth annotation)**
- x: streak length (1–2, 3–4, 5–6, 7–8, 9+)
- y: 7d retention % (descending: 73, 67, 41, 28, 19)
- Color gradient: green → amber → red at the 5+ cliff
- Annotation/secondary metric: bucket size growth QoQ (+3.2× at 5+)
- Loss-streak is not announced — it's the one bucket where retention craters AND the population grew

### T1 insights

- ARPPU flat ($24.10) — not a depth problem
- D7 retention −8pt, concentrated in mid-skill ranked
- Loss-streak ≥ 5: retention cliff (73 → 41%) + 3.2× QoQ population growth
- One operationally-actionable lever

### T1 pinning

All 3 charts pin to **LiveOps 2026** board separately (`pin_to_board` × 3 sections). Board becomes the diagnostic snapshot.

### T1 follow-ups (unchanged)

- "Who's most at risk right now?" → T2 (canonical)
- "Compare to Q1 2026" → T1_q1Compare (refreshed, see below)
- "Show competitor benchmarks" → T1_competitorBench (refreshed, see below)

---

## T2 Redesign — Three Filters, Three Different Earnings

Each filter earns its chart via behavioral reasoning + Jan 2026 rescue A/B data, not via redundant cohort-shrink math.

| # | Filter | Behavioral Reasoning | Chart |
|---|--------|---------------------|-------|
| **A** | `consecutive_ranked_losses_streak ≥ 5` | **Severity** — the cliff (already established in T1) | Streak distribution + retention overlay (recolored for predicate frame) |
| **B** | `session_count_7d ≥ 3` | **Engagement quality** — past A/B shows D7 lift collapses below 3 sessions/wk; player too disengaged for grant to convert | D7 lift % from Jan A/B, bucketed by `session_count_7d` (1, 2, 3, 4–5, 6+) — clear elbow at 3 |
| **C** | `last_purchase_days_ago ≥ 30` | **Monetization fit** — recent payers self-rescue via shop; grants to them deliver ~0 D7 lift in past A/B (cannibalized IAP) | D7 retention lift from grant, by purchase recency band (0–7, 8–30, 30+, never paid) |

### T2 narrative arc

> "Cohort is 5,200 UIDs at streak ≥ 5. Three filters tighten this to ~2,950 UIDs of high-leverage targets. Each filter earns its place against past A/B data."

Then 3 sub-sections, each with H2 → narrative → chart, in order A → B → C. Closing insights summarize stacked precision/lift.

### T2 final cohort numbers

- **2,950 UIDs/week**
- **53% projected 7d churn (4.4× baseline)**
- **+24pt expected D7 lift** based on Jan 2026 A/B effect size

### T2 action card

```
name: 'CFM · Loss Streak · Engaged · Lapsed-Payer'
description: 'consecutive_ranked_losses_streak ≥ 5 AND session_count_7d ≥ 3 AND last_purchase_days_ago ≥ 30'
features: ['consecutive_ranked_losses_streak', 'session_count_7d', 'last_purchase_days_ago']
targetSegmentId: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9'  # reuse existing target
```

### T2 follow-ups

- "Build a rescue intervention" → T3 (unchanged)
- "Tighten to non-paying only" → T2_tightenNonPaying (unchanged — still relevant)
- "Show 7d retention impact" → T2_show7dRetention (unchanged — still relevant)

---

## T1 Alt-Branches Refresh

Both alts must align tonally with the new ARPPU-flat / retention-cliff framing.

### `T1_q1Compare` (refreshed)

> Q1 2026 averaged ARPPU $24.30, Paying-DAU% **12.4%**. Today: ARPPU $24.10, Paying-DAU% **10.4%**. Q1 dip in Feb recovered in 14d via natural matchmaking re-balancing — current dip is 28d and accelerating because **Q2 season widened MMR matching**, which Q1 didn't have.

- Bar chart: Paying-DAU % by period (Q1 Jan, Feb, Mar, Q2 Apr, May) — May the obvious outlier.
- Soft hint: "loss-streak is the new variable" → "Who's most at risk right now?"

### `T1_competitorBench` (refreshed)

> Sensor Tower peer-set: median ARPPU $22.40 (CFM at $24.10 — still above). Median Paying-DAU% **9.8%** (CFM at 10.4% — close to median). **The conversion gap is closing**, and 2 peers (A, B) recovered similar mid-quarter slides via streak-rescue mechanics.

- Bar chart: Paying-DAU% by peer (CFM highlighted, median dashed line)
- Soft hint: "peers prove the rescue play works" → "Who's most at risk right now?"

---

## T2 Alt-Branches (no change required)

- `T2_tightenNonPaying` — paying vs non-paying churn split. Still applies; the new filter C uses `last_purchase_days_ago` which is broader than `is_paying_user_lifetime = false`, so this alt naturally argues "tighten further to never-paid only."
- `T2_show7dRetention` — Jan A/B retention curve. Still applies; reinforces the +24pt lift number cited in canonical T2.

T3 (campaign) + T3 alts: no change.

---

## Surface Parity (verified)

Both surfaces consume the same fixture and registry:

```
thread-demo-livops-2026.ts (fixture)
  ├─ messages[] (slim)              ← initial hard-reset state
  └─ threadDemoLivops2026Turns      ← named exports

apps/web/src/data/chat/multi-turn-registry.ts
  └─ uses threadDemoLivops2026Turns

apps/web/src/components/chat-rail/chat-rail.tsx
  ├─ delayedAppend(t1Rest)          ← auto-play T1 on rail entry
  └─ CompactThreadView              ← renders messages

apps/web/src/modules/chat/thread-page.tsx
  ├─ useLayoutEffect → hard-reset to slim on entry
  ├─ delayedAppend(t1Rest)          ← auto-play T1 on full-page entry
  └─ AssistantResponse              ← renders messages
```

A fixture swap propagates identically to both. Zero structural work.

---

## Bootstrap Version Bump

`apps/web/src/utils/chat-bootstrap.ts:32` — `BOOTSTRAP_VERSION` must increment so cached old fixture is wiped on first reload after deploy.

`v7-260510-2104` → `v8-260510-2137` (or similar)

---

## Out of Scope

- New section types (none needed — `narrative`, `widget`, `insights`, `h2`, `pin_to_board`, `action_card_segment`, `soft_hint` all exist)
- New widget types (existing line/bar handles all 6 new charts)
- New catalog features (all referenced features exist)
- Backend changes
- T3 / T3-alts (unchanged)
- T2 alt-branches content (only T1 alt-branches are refreshed)

---

## Risks

- **Bootstrap stale-cache**: bootstrap version bump is mandatory or users see old content with new alt branches → tonal mismatch
- **Chart number consistency**: T1 chart 1 (Paying-DAU% 12.1 → 10.4) must match T1_q1Compare bar chart numbers exactly
- **Action card target segment ID**: keeping existing `seg-cfm-loss-streak-non-paying-2026-0508-a3f9` so segment detail page still resolves; segment description text in segment fixture should also update to match new predicate (small follow-on if exists)

---

## Validation Criteria

- T1 Beat 3 (streak cliff chart) is the only place loss-streak appears as a distinct bucket — reader spots it as the standout
- ARPPU flat number ($24.10) appears in both T1 chart 1 and T1_q1Compare narrative (consistent)
- T2 action card features array contains exactly `[consecutive_ranked_losses_streak, session_count_7d, last_purchase_days_ago]` — these become FeatureChip widgets that fetch from live catalog-api
- Both `/chat/thread-demo-livops-2026` and chat-rail demo entry play identical T1 content
- Bootstrap version incremented; cache cleared on next page load

---

## Implementation Effort

~1.5h. Single fixture rewrite + bootstrap version bump + tonally aligned alt-branches. No tests required (visual demo content). Single commit.

---

## Recommended Next Step

`/ck:cook --fast` directly on this brainstorm. Skip planning step — scope is one file rewrite + one constant bump. No architectural decisions left.
