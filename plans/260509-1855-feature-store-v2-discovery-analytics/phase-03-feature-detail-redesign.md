---
phase: 3
title: "Feature Detail Redesign"
status: complete
priority: P1
effort: "8h"
dependencies: [1, 2]
---

# Phase 3: Feature Detail Redesign

## Context Links

- Parent plan: [../plan.md](../plan.md)
- PRD baseline: `design-reference/Hermes/uploads/PRD_Hermes_Design (1).md` §6.3 ("Detail")
- Companion: `Hermes_Demo_Data.md` for showcase feature `consecutive_ranked_losses_streak`
- Current implementation: `apps/web/src/modules/feature-store/detail.tsx` (390 lines)
- Reference inspirations: Tecton feature view, Feast registry, Hopsworks feature store, dbt model docs

## Overview

The detail page is the discovery + analytics centerpiece of v2. Three jobs in one screen (per PRD §6.1):
1. **Studio shopping** — "is this the right feature for my campaign?"
2. **GDS analytics monitoring** — "is this feature healthy? drifting? cheap to serve?"
3. **Engineer verification** — "does the registry match the architecture?"

V1 detail was a static dump (definition · histogram · recent values · materialization status). V2 is a **3-tab analytics dashboard** with games attribution as the primary axis, propensity-model card for platform features, and concise health metrics that earn their pixel cost.

## Key Insights

- Replace `Owner` row with `Games used by` chip cluster. For platform features, lead with `Platform · Propensity model` chip and the model card.
- "State-of-the-art feature dashboard" = 6 metrics that matter, not 20 that don't. The cut: drift score, freshness vs SLA, value-distribution-over-time (small multiples), null rate, top-3 consuming campaigns, online request rate. These are the metrics Tecton/Feast surface; we don't need to invent.
- Static histogram → time-series small multiples. Distribution at 4 fixed snapshots over 180 days (today / 30d / 90d / 180d). Drift visible at a glance.
- "Used by" tab gets weighted: campaigns/segments grouped by game, ordered by fire count.
- Edit Definition stays a no-op CTA per parent PRD §13. New CTA "Register similar feature" links to Phase 4 page with this feature's domain/games prefilled.

## Requirements

**Functional**
- Header strip:
  - Mono name + serif italic display name (preserve)
  - Type chip + Latency badge stack (Realtime / Batch warm / Batch cold from Phase 2)
  - **Games chip cluster** (replaces owner avatar) — first 4 inline, "+N" overflow chip; clicking opens a popover listing all games + counts of campaigns this feature appears in per game
  - Status badge
  - Domain chip
  - Platform features: prominent **`Platform · Propensity`** chip in deep-red brand color, with model family micro-text (`pLTV`, `Churn`, `Reactivation`)
  - Right side: `Edit definition` (no-op) + `Register similar feature` (CTA, primary)
- Three tabs: **Overview · Analytics · Lineage · Used By** (Analytics is new; existing tabs revised)
- Right rail: same set of CTAs (`Use in segment`, `Investigate in Explore`) + Related features + new **Health snapshot card** (drift score, freshness gauge, null rate)

### Tab content

#### Overview tab
- **Definition side-by-side** (preserve, retitle pane labels via Phase 2 helper)
- **Storage row** (preserve copy: "Counter, integer, served from Redis online tier and Iceberg offline tier")
- **Propensity model card** (platform features only) — see below
- **Description block** (new) — 1-2 short paragraphs, sourced from feature metadata or fallback to display name. Plain English, no SQL.

#### Analytics tab (new — the dashboard)
Six panels, 2-col grid on desktop:

```
┌─ Health snapshot ────────────┐ ┌─ Freshness vs SLA ───────────┐
│ Drift score: 0.18 (stable)   │ │ 99.4% of buckets met SLA     │
│ Trend: ↘ improving 30d       │ │ Last miss: 2026-04-12 (06:30)│
│ Last drift event: 2026-03-22 │ │ Median lag: 14 min (SLA 60m) │
└──────────────────────────────┘ └──────────────────────────────┘

┌─ Value distribution over time ──────────────────────────────┐
│ [4 small multiples: today / 30d / 90d / 180d]               │
│ p50 / p90 / p99 markers per snapshot                        │
│ Drift events overlaid as vertical amber lines               │
└──────────────────────────────────────────────────────────────┘

┌─ Top consuming campaigns ────┐ ┌─ Online request rate (180d) ─┐
│ 1. CFM-13 Pass Stuck · 1.2M  │ │ Sparkline · daily req count  │
│ 2. PT-6 Hành trình · 0.8M    │ │ Peak: 4.7M reqs (2026-03-15) │
│ 3. NTH-9 Hồng Nhan · 0.4M    │ │ p99 lookup latency: 38ms     │
└──────────────────────────────┘ └──────────────────────────────┘

┌─ Data quality ───────────────────────────────────────────────┐
│ Null rate: 0.4%                                              │
│ Distinct values (p50 daily): 1,247                           │
│ Coverage: 12.4M of 15.0M MAU (83%)                          │
│ Last backfill: 2026-05-08 06:00 ICT — successful            │
└──────────────────────────────────────────────────────────────┘
```

Concise. Each panel reads in 2-3 seconds. No vanity metrics.

#### Lineage tab (revise)
- Toolbar uses Realtime/Batch warm/Batch cold (Phase 2)
- Engineer-detail row preserves Substrate A/B verbatim
- Add **upstream events** + **downstream consumers** sections (already exists per current `lineage-tab.tsx`)

#### Used By tab (revise)
- Group by game (default), then by type (segment / campaign)
- Sort by fire count descending
- Header summary: "Used by 4 segments and 7 campaigns across CFM, NTH, PT"
- Each row links to the relevant module

### Propensity model card (new component)

Renders only when `feature.propensityModel` is set:

```
┌─ Propensity Model — Predicted 30-Day LTV ──────────────────────┐
│  Family       pLTV (lifetime value)                            │
│  Target       30-day revenue per user                          │
│  Training     90-day rolling window · refreshed daily          │
│  AUC band     0.78 – 0.82 (model v3.2)                         │
│  Owner        gds-ml-platform                                  │
│                                                                 │
│  Note · this feature is served from offline cache. Real-time    │
│  evaluation reads the last refreshed value (≤24h staleness).   │
└─────────────────────────────────────────────────────────────────┘
```

Mono for technical fields, Inter for prose, deep-red accent stripe on left edge.

### Right rail · Health snapshot card (new)

Compact summary that mirrors the Analytics tab — useful when PM is on Overview/Used-By tab and wants the health number without tab-switching:

```
┌─ HEALTH ─────────────────────┐
│ Drift     0.18 · stable      │
│ Fresh     99.4% SLA           │
│ Null      0.4%                │
│ [Open Analytics →]           │
└───────────────────────────────┘
```

## Architecture

### Component tree

```
detail.tsx
├── DetailHeader (refactor)
│   ├── BreadcrumbStrip
│   ├── NameStack (mono + serif)
│   ├── MetaRow
│   │   ├── TypeChip
│   │   ├── LatencyBadgeStack         ← Phase 2
│   │   ├── GamesChipCluster   (new)  ← consumes feature.games
│   │   ├── StatusBadge
│   │   ├── DomainChip
│   │   └── PlatformPropensityChip (new) ← only when feature.platform
│   └── CTAs (Edit definition · Register similar)
├── TabBar (4 tabs)
└── TabBody
    ├── OverviewTab (revise)
    │   ├── DefinitionSideBySide
    │   ├── StorageRow
    │   ├── PropensityModelCard (new, conditional)
    │   └── DescriptionBlock (new)
    ├── AnalyticsTab (new)
    │   ├── HealthSnapshotPanel
    │   ├── FreshnessVsSlaPanel
    │   ├── ValueDistributionOverTimePanel
    │   ├── TopConsumingCampaignsPanel
    │   ├── OnlineRequestRatePanel
    │   └── DataQualityPanel
    ├── LineageTab (revise)
    └── UsedByTab (revise — group by game)

RightRail
├── PrimaryCTA (Use in segment)
├── SecondaryCTA (Investigate in Explore)
├── HealthSnapshotCard (new)
├── RelatedFeaturesList
└── UsageQuickStats
```

### State

`detail.tsx` keeps `tab` state local. Tab default = `overview`. Add `?tab=analytics` query param so deep links open straight to dashboard (used by Phase 5 library cards' "view analytics" action).

### Data dependencies (from Phase 1)

- `feature.games: HermesGame[]` → GamesChipCluster
- `feature.platform: boolean` → PlatformPropensityChip render gate
- `feature.propensityModel: PropensityModelMeta` → PropensityModelCard
- `feature.analytics: FeatureAnalytics180d` → all six Analytics panels

## Related Code Files

**Modify**
- `apps/web/src/modules/feature-store/detail.tsx` — restructure header + add tab + right rail card
- `apps/web/src/modules/feature-store/_components/used-by-tab.tsx` — group by game
- `apps/web/src/modules/feature-store/_components/lineage-tab.tsx` — toolbar copy update (Phase 2 already touched)

**Create** (in `apps/web/src/modules/feature-store/_components/`)
- `games-chip-cluster.tsx` — chips + overflow popover
- `platform-propensity-chip.tsx` — deep-red badge with model family
- `propensity-model-card.tsx` — accent-stripe card
- `description-block.tsx` — text rendering helper
- `health-snapshot-card.tsx` — right-rail compact card
- `analytics-tab.tsx` — orchestrator
- `_analytics/health-snapshot-panel.tsx`
- `_analytics/freshness-vs-sla-panel.tsx`
- `_analytics/value-distribution-over-time-panel.tsx` — small multiples
- `_analytics/top-consuming-campaigns-panel.tsx`
- `_analytics/online-request-rate-panel.tsx` — sparkline
- `_analytics/data-quality-panel.tsx`
- `_analytics/_logic/format-drift-score.ts`
- `_analytics/_logic/format-freshness.ts`

**No deletes.**

## Implementation Steps

1. **Header rebuild.** Restructure `detail.tsx` header into `DetailHeader` sub-component. Replace owner avatar block with `<GamesChipCluster games={feature.games} />`. Render `<PlatformPropensityChip propensity={feature.propensityModel} />` when `feature.platform`. Add `Register similar feature` CTA next to existing `Edit definition`.
2. **GamesChipCluster.** Reuse the avatar-stack pattern. Each chip = 2-letter game code (CFM, PT, NTH, TF, COS, PG) with brand-tinted background. First 4 inline, +N overflow opens popover with full list + per-game campaign count (sourced from `usage` aggregation extended in Phase 1).
3. **PlatformPropensityChip.** Deep-red filled chip, mono uppercase "PLATFORM", separator, family in serif italic ("pLTV" / "Churn" / "Reactivation"). Tooltip explains "Cross-game GDS-owned propensity model".
4. **PropensityModelCard.** Render in Overview tab below storage row, gated on `feature.platform`. Accent stripe `#f05a22`, 6 mono key-value rows, italic disclaimer at bottom.
5. **AnalyticsTab orchestrator.** Wire the 6 panels in 2-col grid (12-col responsive grid; small multiples panel spans 12, others 6). Each panel reads from `feature.analytics`.
6. **HealthSnapshotPanel.** Drift score (numeric + plain-English: <0.2 stable, 0.2-0.4 mild, ≥0.4 severe), 30-day trend arrow, last drift event date.
7. **FreshnessVsSlaPanel.** % of buckets meeting SLA, last miss timestamp, median lag vs SLA.
8. **ValueDistributionOverTimePanel.** 4 small histograms in a row — today, 30d ago, 90d ago, 180d ago. Reuse the existing `<Histogram>` component at smaller width. Vertical amber lines on x-axis at drift event dates.
9. **TopConsumingCampaignsPanel.** Top 3 from `analytics.topConsumingCampaigns`. Each row: rank, campaign ID (mono, link to monitoring), game chip, fire count formatted (1.2M / 800K).
10. **OnlineRequestRatePanel.** Sparkline of `analytics.requestRateSparkline` (180 daily buckets). Peak day callout. p99 lookup latency stat.
11. **DataQualityPanel.** 4 stats: null rate, distinct values, coverage %, last backfill. Same flat horizontal layout as existing materialization-status block.
12. **HealthSnapshotCard (right rail).** Compact 3-row mini-card. Click opens Analytics tab.
13. **UsedByTab regroup.** Group rows by game first, then split into segments / campaigns. Header summary line.
14. **Tab default + deep link.** Read `?tab=` query, default to overview. Update tab click handlers to push query param (don't break browser back).
15. **Smoke + visual.** Open `/feature-store/consecutive_ranked_losses_streak`, `/feature-store/pltv_30d_score`, `/feature-store/account_age_days` — verify all three render correctly (single-game / platform / multi-game shapes).

## Todo List

- [ ] Restructure detail.tsx header
- [ ] Build `GamesChipCluster`
- [ ] Build `PlatformPropensityChip`
- [ ] Build `PropensityModelCard`
- [ ] Build `DescriptionBlock`
- [ ] Build `HealthSnapshotCard` (right rail)
- [ ] Build `AnalyticsTab` orchestrator
- [ ] Build 6 analytics panels
- [ ] Regroup `UsedByTab` by game
- [ ] Wire tab default + `?tab=` deep link
- [ ] Smoke test 3 representative features
- [ ] `pnpm typecheck` clean
- [ ] `pnpm build` clean

## Success Criteria

- [ ] Owner avatar/text removed from header — replaced by GamesChipCluster
- [ ] Platform features show `Platform · Propensity` chip + PropensityModelCard
- [ ] Analytics tab renders 6 panels for any feature
- [ ] Health snapshot card visible on right rail across all tabs
- [ ] Used By tab groups by game
- [ ] Latency badges use Realtime / Batch warm / Batch cold (Phase 2 inheritance)
- [ ] Edit definition CTA still no-op; Register similar CTA links to /feature-store/new with prefill
- [ ] `?tab=analytics` deep link works
- [ ] No regressions on demo flow step 2 (browse FS → click feature → "Use in segment")

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Analytics tab feels cluttered with 6 panels | Strict 2-col grid, fixed panel heights, mono numbers + small labels. Test on the 3 representative features and trim if needed. |
| Small-multiples histograms unreadable at width | Each small histogram ≥ 140px wide; 28 bins → 5px/bin. If still tight, drop to 16 bins for the small versions. |
| `feature.analytics` missing for newly-registered features (Phase 4) | Phase 4 generator stubs analytics with "no data yet · 7-day warm-up" empty state in panels. AnalyticsTab handles `analytics === undefined` gracefully. |
| Games chip overflow looks broken with many games | Cap inline at 4, "+N" pill opens popover. Test on `pltv_30d_score` (6 games). |

## Security Considerations

- No PII in panels. Top consuming campaigns shows campaign IDs (already public), not player UIDs.
- Drift event dates are operational metadata, safe to render.

## Next Steps

Phase 4 (Register page) consumes the same components — `GamesChipCluster`, `PlatformPropensityChip` reused on the form preview. Phase 5 (Library) reuses `GamesChipCluster` on row cards. Phase 6 (Segment) reuses both on picker cards and the right rail.
