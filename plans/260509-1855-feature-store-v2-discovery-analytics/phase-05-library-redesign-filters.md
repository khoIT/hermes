---
phase: 5
title: "Library Redesign + Filters"
status: complete
priority: P1
effort: "5h"
dependencies: [1, 2]
---

# Phase 5: Library Redesign + Filters

## Context Links

- Parent plan: [../plan.md](../plan.md)
- PRD baseline: `design-reference/Hermes/uploads/PRD_Hermes_Design (1).md` §6.2 ("Library")
- Current implementation: `apps/web/src/modules/feature-store/library.tsx` (200 lines)
- Phase 1 schema: games + platform + propensityModel
- Phase 2 labels: Realtime / Batch warm / Batch cold

## Overview

Library is the landing surface — the first thing PMs see when they open Feature Store. V1 was already solid (group-by + filter rail + entry strip). V2 changes are scoped: replace owner with games attribution on row cards, add Games and Propensity filters, restructure stat strip + group-by to consume the new schema, and wire the registration CTA to the Phase 4 page. No layout overhaul.

## Key Insights

- The feature-row card is dense — adding games chip cluster + platform badge means trimming. Drop the owner avatar (replaced); compress the latency badge to single chip with the Phase 2 tone palette.
- Default group-by stays "Domain" (PRD §6.2 default). New option "Game" jumps to the top of the dropdown; Owner removed.
- Filter rail gets a Games multi-select (multi-checkbox) and a Platform-only toggle. Type and Latency filters preserved.
- Stat strip: `127 features · 38 Realtime · 56 Batch warm · 33 Batch cold · 12 added this month` becomes `127 features · 6 platform · 38 Realtime · 56 Batch warm · 33 Batch cold · 12 added this month`. Platform count shown distinctly because it's a different mental model.
- Drift detected entry-point gets a real number from Phase 1 analytics: count features with `analytics.driftScore ≥ 0.4`.

## Requirements

**Functional**
- **Stat strip:** total · platform count · 3 latency tier counts · added-this-month
- **Entry points strip:** Browse by domain (default) · **Register a new feature** (CTA → `/feature-store/new` per Phase 4) · Recently added · Drift detected (with live count badge)
- **Group-by control:** Domain (default) · **Game** (new) · **Latency** · **Status** · **Platform vs game** · None. Owner option removed.
- **Filter rail:**
  - Type (preserved): Counter / Streak / Score / Tag / Boolean / Tuple / Array
  - Latency (relabel from Phase 2): Realtime / Batch warm / Batch cold
  - **Games** (new, multi-select): CFM / PT / NTH / TF / COS / PG
  - **Platform-only toggle** (new): boolean
  - Status (preserved): Active / Beta / Deprecated
  - Owner filter removed
- **Feature row card content** (revised):
  - Mono name + serif italic display name (preserve)
  - Type chip (preserve)
  - Latency badge (single chip, Phase 2 labels)
  - **Games chip cluster** (replaces owner) — compact 3-inline + overflow
  - **Platform · Propensity chip** (when applicable, deep-red, family micro-text)
  - 7-day distribution sparkline (preserve)
  - "Used by N segments · M campaigns" (preserve)
  - Freshness gauge (preserve, rendered from Phase 1 `analytics.freshnessSlaMet`)
- **Sort options** (new lightweight selector next to result count): "Default · A-Z" / "Most used (campaigns)" / "Most drifted" / "Recently added"

**Non-functional**
- Filter rail collapsible; group-by + sort always visible
- Performance: with 76 features and active filters, render ≤16ms
- Existing `filter.ts` + `group.ts` logic extended, not rewritten

## Architecture

### Group-by additions

```ts
// _logic/group.ts
export type GroupByStrategy =
  | 'domain'
  | 'game'              // NEW
  | 'latency'
  | 'status'
  | 'platform'          // NEW: groups into "Platform" vs "Game-specific"
  | 'none';

// Removed: 'owner'

export function groupFeatures(
  features: HermesFeature[],
  strategy: GroupByStrategy,
): Group[] {
  if (strategy === 'game') {
    // A feature with games=[cfm,pt] appears in BOTH groups (multi-pin allowed)
    const groups = new Map<HermesGame | 'platform', HermesFeature[]>();
    for (const f of features) {
      if (f.platform) {
        getOrInit(groups, 'platform').push(f);
      } else {
        for (const g of f.games) getOrInit(groups, g).push(f);
      }
    }
    // ... return as array sorted: platform first, then game order CFM/PT/NTH/TF/COS/PG
  }
  if (strategy === 'platform') {
    return [
      { groupName: 'Platform · cross-game', features: features.filter(f => f.platform) },
      { groupName: 'Game-specific', features: features.filter(f => !f.platform) },
    ];
  }
  // ... existing strategies
}
```

### Filter additions

```ts
// _logic/filter.ts
export interface FilterState {
  types: HermesFeatureType[];
  latencies: HermesLatencyTier[];
  statuses: HermesFeatureStatus[];
  games: HermesGame[];          // NEW (empty = all)
  platformOnly: boolean;        // NEW
  // Removed: owners
}

export function applyFilter(features: HermesFeature[], state: FilterState): HermesFeature[] {
  return features.filter(f => {
    if (state.platformOnly && !f.platform) return false;
    if (state.games.length > 0 && !state.games.some(g => f.games.includes(g))) return false;
    // ... existing checks
  });
}
```

### Sort additions

```ts
// _logic/sort.ts (new)
export type SortStrategy = 'default' | 'most-used' | 'most-drifted' | 'recently-added';

export function sortFeatures(features: HermesFeature[], sort: SortStrategy, usageMap: Map<string, FeatureUsage>): HermesFeature[] {
  const arr = [...features];
  switch (sort) {
    case 'most-used':
      arr.sort((a, b) => (usageMap.get(b.name)?.campaignCount ?? 0) - (usageMap.get(a.name)?.campaignCount ?? 0));
      break;
    case 'most-drifted':
      arr.sort((a, b) => (b.analytics.driftScore - a.analytics.driftScore));
      break;
    case 'recently-added':
      arr.sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''));
      break;
    default:
      arr.sort((a, b) => a.name.localeCompare(b.name));
  }
  return arr;
}
```

### Row card layout (revised)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  consecutive_ranked_losses_streak              [Counter · int] [Realtime]│
│  Consecutive Ranked Losses                                              │
│                                                                          │
│  [CFM]                                                                   │
│                                                                          │
│  ▁▂▄▆█▇▅▃▂                                       3 segs · 2 cmpgns      │
│  Sparkline 7d                                    Fresh 99.1%             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  pltv_30d_score                          [Score · numeric] [Batch cold] │
│  Predicted 30-Day LTV                                                    │
│                                                                          │
│  [PLATFORM · pLTV]   [CFM] [PT] [NTH] [TF] [+2]                         │
│                                                                          │
│  ▂▃▃▄▅▆▆▇                                       12 segs · 18 cmpgns    │
│  Sparkline 7d                                    Fresh 98.7%             │
└─────────────────────────────────────────────────────────────────────────┘
```

Platform features lead with the Platform · Propensity chip; game chips secondary. Single-game features show one game chip; cross-game (non-platform) shows up to 3 + overflow.

### Stat strip layout

```
┌─ STAT STRIP ───────────────────────────────────────────────────────────┐
│  127 features  ·  6 platform  ·  38 Realtime  ·  56 Batch warm         │
│                ·  33 Batch cold  ·  12 added this month                 │
└─────────────────────────────────────────────────────────────────────────┘
```

`6 platform` rendered with the deep-red brand color to anchor the new concept.

### Drift detected entry-point

Real count from analytics:

```ts
const driftedCount = allFeatures.filter(f => f.analytics.driftScore >= 0.4).length;
// Render badge: driftedCount or hidden if 0
```

Click → applies a soft filter (sort by most-drifted + show only `driftScore ≥ 0.4`).

## Related Code Files

**Modify**
- `apps/web/src/modules/feature-store/library.tsx` — entry-point wiring, sort state, drift count
- `apps/web/src/modules/feature-store/_components/stat-strip.tsx` — new copy + platform count
- `apps/web/src/modules/feature-store/_components/filter-rail.tsx` — Games + Platform sections, drop Owner
- `apps/web/src/modules/feature-store/_components/group-by-control.tsx` — new options + remove owner
- `apps/web/src/modules/feature-store/_components/feature-row-card.tsx` — replace owner avatar with GamesChipCluster + Platform chip
- `apps/web/src/modules/feature-store/_logic/filter.ts` — Games + platformOnly
- `apps/web/src/modules/feature-store/_logic/group.ts` — game + platform strategies, remove owner
- `apps/web/src/modules/feature-store/_logic/usage-count.ts` — already extended in Phase 1 if needed

**Create**
- `apps/web/src/modules/feature-store/_logic/sort.ts` — sort strategies
- `apps/web/src/modules/feature-store/_components/sort-control.tsx` — sort dropdown

**No deletes** (no orphan files since GamesChipCluster + PlatformPropensityChip created in Phase 3 are reused here).

## Implementation Steps

1. **Subscribe to live catalog.** Use `useSyncExternalStore(subscribeFeatures, getAllFeatures)` so newly-registered features (Phase 4) appear without remount.
2. **Update FilterState shape.** Drop `owners`, add `games`, `platformOnly`. Update `EMPTY_FILTER`. Update FilterRail UI.
3. **Update GroupByStrategy.** Drop `owner`, add `game` and `platform`. Update group dropdown.
4. **Refactor row card.** Replace owner avatar block with `<GamesChipCluster games={f.games} compact />` and `<PlatformPropensityChip>` (when applicable). Compact prop: smaller chips for the row context.
5. **Wire sort state.** Add `sort: SortStrategy` to library state. Sort applies after filter, before group.
6. **Stat strip rebuild.** Compute platform count + drift count + per-tier counts. Color the Platform stat in brand red.
7. **Drift detected entry-point.** Replace hardcoded `2` badge with computed count. Click handler applies filter+sort.
8. **Wire Register CTA.** "Register a new feature" → `navigate('/feature-store/new')`.
9. **Smoke + visual test.** With all filters cleared: 76 cards. Apply Games=CFM filter: only CFM-tagged features. Apply Platform-only: 6 features. Group by Game: groups order Platform → CFM → PT → NTH → TF → COS → PG. Sort by most-drifted: features with `driftScore ≥ 0.4` first.

## Todo List

- [ ] Subscribe library to live catalog
- [ ] Update FilterState (add games + platformOnly, drop owners)
- [ ] Refactor FilterRail UI sections
- [ ] Update GroupByStrategy (add game, platform; drop owner)
- [ ] Refactor row card to use GamesChipCluster + PlatformPropensityChip
- [ ] Build sort.ts + sort-control.tsx
- [ ] Update stat strip with platform + drift counts
- [ ] Wire drift detected entry-point with live count + filter action
- [ ] Wire Register CTA to /feature-store/new
- [ ] Smoke test all filter / group / sort combinations
- [ ] `pnpm typecheck` clean
- [ ] `pnpm build` clean

## Success Criteria

- [ ] Stat strip shows 6 stats including Platform count
- [ ] Filter rail has Games multi-select and Platform-only toggle; no Owner section
- [ ] Group-by includes Game and Platform; excludes Owner
- [ ] Row cards show games chip cluster instead of owner avatar
- [ ] Platform features show Platform · Propensity chip on row card
- [ ] Sort dropdown offers 4 strategies; works for each
- [ ] Drift detected entry-point shows real count and applies filter on click
- [ ] Register a new feature CTA navigates to /feature-store/new
- [ ] Newly-registered features (from Phase 4) appear in library without page reload
- [ ] Demo flow step 2 (browse → click feature) still works

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Group-by Game with multi-pin (a feature in both CFM + PT groups) creates visual duplication | This is intended — PMs filtering by their game expect to see all relevant features. Document the multi-pin behavior in group helper header. Add subtle "(also used by PT)" caption on duplicate cards. |
| Row card gets too tall with chips + sparkline + freshness | Hard cap row card height at 76px. Compact mode for chips: smaller padding + hide game chip text below 32px width (icon-only). |
| Filter rail too long with new sections | Filter rail already supports collapsible sections. Default collapsed: Type, Status. Default expanded: Latency, Games, Platform. |
| Sort by drift requires `analytics` field — works for migrated features but errors for newly-registered ones with empty analytics | Empty analytics has `driftScore: 0`, so sort gracefully ranks them last. Tested in Phase 4 smoke. |

## Security Considerations

None — read-only library view consuming static catalog.

## Next Steps

Phase 6 (Segment wiring) reuses `GamesChipCluster` and `PlatformPropensityChip` on the picker cards, swap popover, right rail, and predicate row. Library changes here are the visual reference for those.
