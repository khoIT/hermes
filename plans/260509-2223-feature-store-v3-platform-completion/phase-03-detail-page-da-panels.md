---
phase: 3
title: "Detail page · DA panels"
status: pending
priority: P1
effort: "7h"
dependencies: [1]
---

# Phase 03: Feature Detail Page · Data Analyst Panels

## Overview

5 new panels on the Feature Store detail page targeting analysts. All consume Phase 01 endpoints. Lazy-imported per route to keep bundle size reasonable.

## Panels

1. **QuantileStripPanel** — bars at p10/p25/p50/p75/p90/p99 today; ghost bars for 30d ago. Reuses theme T tokens; height ~140px.
2. **CoverageSegmentationPanel** — 3 horizontal stacked bars (lifecycle / region / vip). Each segment shows pct of MAU + raw count tooltip.
3. **SampleValueCardsPanel** — 5 cards in a row, each shows uid (anonymized last-4), value, lifecycle, region, totalRev. Numeric-only features; categorical shows label distribution instead.
4. **CorrelatedFeaturesPanel** — top-5 list, each row: feature name, Pearson value bar (-1..+1), sample size. Click → navigate to that feature.
5. **OutlierExamplesPanel** — top-5 most extreme uids by zScore, with chip badges for severity (>3σ red, 2-3σ amber).

## Implementation Steps

1. Add new tab "Analyst" between Overview and Analytics in `detail.tsx`.
2. Author 5 panel components in `apps/web/src/modules/feature-store/_components/_da/`.
3. Each panel uses a small `useFeatureFetch(name, endpoint)` hook returning `{ status, data }` to keep call signatures uniform.
4. Empty-state per panel when feature is `source='synth'` (no real data).
5. Lazy-import via `React.lazy` so panels only ship to users on the Analyst tab.

## Success Criteria

- [ ] All 5 panels render for `account_age_days` with real data.
- [ ] Synth feature (`weapon_count_owned`) shows "synthetic data — analyst panels disabled" empty state.
- [ ] Bundle delta: <40kb gzipped.
- [ ] Click on correlated feature navigates correctly.

## Risk

- Panel-empty-state UX needs to be obvious; otherwise users think the API is broken. Mitigation: visible "synthetic" badge.
- Sample value cards show personal-ish data (uids). Mitigation: anonymize to last-4 chars only.
