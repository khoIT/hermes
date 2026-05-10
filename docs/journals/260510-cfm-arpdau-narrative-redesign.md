# CFM ARPDAU Narrative Redesign – Thread-Demo-LiveOps-2026 Refactor

**Date**: 2026-05-10 22:06  
**Severity**: Low  
**Component**: Chat demo content  
**Status**: Completed  

## What Happened

Rewrote the canonical demo thread (`thread-demo-livops-2026`) used for the May 12 stakeholder walkthrough. The refactor shifts from **telling the audience the answer** to **walking them through how an analyst discovers the answer**. Old T1 opened with a raw 7% ARPDAU drop and immediately named loss-streak as one of three causes. New T1 structures the story as a three-beat deduction where loss-streak emerges from the data itself.

## Technical Changes

**T1 (Tier 1) narrative reframe:**
- Beat 1: ARPDAU decomposition — Paying-DAU% sliding 12.1→10.4% vs. ARPPU flat at $24.10 → conversion problem, not spend problem
- Beat 2: D7 retention by four cohorts — leak concentrated in mid-skill ranked players
- Beat 3: Retention cliff indexed by `consecutive_ranked_losses_streak` — 5+ losses shows retention drop 73→41% AND population grew 3.2× since April matchmaking change

**T2 filter set replacement:**
- Old: Defensive IAM-cooldown filter that didn't justify its inclusion
- New: Three-filter set (severity + engagement quality + monetization fit):
  - `consecutive_ranked_losses_streak ≥ 5` (severe loss streak)
  - `session_count_7d ≥ 3` (engagement quality signal)
  - `last_purchase_days_ago ≥ 30` (monetization fit — lapsed buyers)
- Each filter backed by a distinct January 2026 A/B test chart showing D7 retention lift

**Quantitative anchors:**
- ARPDAU components verified from catalog (no backend work)
- Retention cohort slice intervals unchanged
- Loss-streak thresholds from existing operational data
- A/B test results (session count D7 lift, purchase recency D7 lift) sourced as historical charts

**Supporting changes:**
- T1 alternative narratives (q1Compare, competitorBench) refreshed for ARPPU-flat / retention-cliff framing
- T2/T3 alternatives unchanged
- Cache version bumped v8 → v9 in `chat-bootstrap.ts` to clear cached fixture

**Files modified:**
- `apps/web/src/data/chat/threads/thread-demo-livops-2026.ts` (~600 lines rewritten)
- `apps/web/src/utils/chat-bootstrap.ts` (version bump)

## Why This Matters

The demo is the centerpiece of the May 12 stakeholder walkthrough. The new structure transforms a **lecture** into a **collaborative discovery**. The audience experiences the analyst's reasoning — data decomposition → segment isolation → root cause identification — rather than being told the conclusion upfront. Loss-streak now feels like an earned insight, not a pre-announced talking point.

T2 filter set gains credibility: each filter has past A/B validation, so it withstands scrutiny from game operations teams who will ask "why this filter?" instead of "why not that filter?"

## Implementation Notes

- All metrics sourced from catalog-real (no new backend endpoints, contracts, or component types)
- Surface parity verified: `/chat/thread-demo-livops-2026` and chat-rail demo entry both consume the same fixture and multi-turn registry
- Zero structural changes to chat architecture or registry — pure content refactor
- Brainstorm report saved locally (`plans/reports/brainstorm-260510-2137-cfm-arpdau-narrative-redesign.md`)

## Next Steps

- Dry-run the new narrative in isolated session to verify T1 → T2 flow pacing
- Share updated demo URL with demo-ops lead for stakeholder prep session
- Validate retention cohort slices align with current game-ops terminology (mid-skill ranked, etc.)
