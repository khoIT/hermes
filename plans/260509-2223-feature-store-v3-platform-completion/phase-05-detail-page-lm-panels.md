---
phase: 5
title: "Detail page · LM panels"
status: pending
priority: P1
effort: "7h"
dependencies: [1, 4]
---

# Phase 05: Feature Detail Page · LiveOps Manager Panels

## Overview

5 new panels (or panel upgrades) for the LM persona. The biggest is the **threshold playground** — a live audience-count slider hitting Phase 01's `/audience-count` endpoint.

## Panels

1. **SourceProvenanceCard** — large badge showing REAL / HYBRID / SYNTH, the derivation file path, last-backfill timestamp, "Why?" tooltip explaining what each source means.
2. **HealthVerdictCard** — single GREEN / YELLOW / RED chip aggregating: drift score (≥0.4 amber, ≥0.7 red) · freshness SLA (<0.95 amber) · null rate (>0.1 amber) · coverage MAU (<0.5 amber). Show the worst signal as the headline + drilldown to all 4.
3. **ThresholdPlaygroundPanel** — slider/input bound to feature value range. As user adjusts:
   - debounce 200ms,
   - call `/features/:name/audience-count?op=gt&value=...`,
   - render `count` + `fraction` (`23.4% of MAU`) + a small histogram with the threshold line overlaid.
   - Categorical features show pick-list of labels with COUNT each.
   - "Use in segment" CTA — pre-fills the segment composer with this predicate.
4. **TopSegmentsUsingPanel** — horizontal cards: 5 segments referencing this feature, each with audience size + game chip + "open segment" link.
5. **CoveragePerGamePanel** — for multi-game features (Phase 02 wired): horizontal bar split by game, with uid count + % of game MAU.

## Implementation Steps

1. Add new tab "LiveOps" as the FIRST tab (before Overview) in `detail.tsx`. Make it the default — it's the most demo-relevant view.
2. Author 5 panel components in `_components/_lm/`.
3. Threshold playground: slider component reuses recharts `Brush` or a simple `<input type=range>`. Numeric range from `feature_distributions_daily.buckets[0].binStart` and last bucket's `binEnd`.
4. Health verdict aggregation logic: pure function `computeVerdict(analytics) → { color, headline, signals }` in `_lm/health-verdict.ts`.
5. Source provenance card replaces the small "source" text — make it visually loud since LMs care most.
6. CoveragePerGamePanel: depends on Phase 02 having `game_id` populated. Pre-Phase-02 fallback: single bar showing "All games (CFM only — Phase 02 pending)".

## Success Criteria

- [ ] Threshold slider on `account_age_days` returns audience size in <300ms p95.
- [ ] Categorical playground on `vip_status` lets user pick `vip2 OR vip3` and see combined audience.
- [ ] "Use in segment" CTA navigates to segment composer with the predicate pre-filled.
- [ ] Health verdict shows GREEN for healthy real features, YELLOW for synth.
- [ ] CoveragePerGamePanel shows real PTG/NTH/TF/COS slices when Phase 02 has run.

## Risk

- Threshold playground UX is the highest-value piece — slider must feel snappy. Mitigation: debounce + spinner only for >300ms responses.
- "Use in segment" requires segment-composer URL contract — confirm with existing composer route before wiring.
- Categorical OR support requires multi-value endpoint extension. Mitigation: client splits into multiple GETs and sums.
