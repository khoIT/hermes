---
phase: 6
title: "Segment Wiring (Full Touch-up)"
status: complete
priority: P2
effort: "6h"
dependencies: [1, 2, 3]
---

# Phase 6: Segment Wiring (Full Touch-up)

## Context Links

- Parent plan: [../plan.md](../plan.md)
- PRD baseline: `design-reference/Hermes/uploads/PRD_Hermes_Design (1).md` §8 (Segments module), §8.4 (inline swap), §8.6 (pickers)
- Segment composer: `apps/web/src/modules/segments/_composer/*`
- Segment components: `apps/web/src/modules/segments/_components/*`
- Reusable from Phase 3: `GamesChipCluster`, `PlatformPropensityChip`, `LatencyBadge`

## Overview

Wire the new feature attribution + propensity model into every Segment surface where a feature appears. Five surfaces:

1. **Condition / Exclusion / OR-row pickers** — picker cards show games + propensity chip
2. **Inline feature-swap popover** — same chips; "Swap for similar" filtered by current feature's game context
3. **Right rail "Features in use"** — replace owner with games chips
4. **Predicate row pill** — first game chip + "+N" overflow replaces owner avatar
5. **Segment library group-by** — add "Game of consumed features" option

Per user direction: "Full Segment touch-up" — every place a feature surfaces stays consistent with the v2 detail page.

## Key Insights

- Reuse Phase 3 components verbatim (`GamesChipCluster`, `PlatformPropensityChip`). Add a `compact` and an `xs` size variant for the constrained predicate row context.
- Picker cards already had owner per PRD §8.6; swap to games chip cluster + platform tag, plus a small **drift badge** when `analytics.driftScore ≥ 0.4` (warns PMs they're picking a drifting feature).
- Swap popover's "Swap for similar" gets a subtle improvement: rank candidates that share at least one game with the current feature higher than ones that don't. Within ties, prefer same-domain.
- Predicate row pill is the most space-constrained surface. Replace owner avatar with a single 2-letter game chip (the first in `feature.games`); badge shows "+N" if more games. For platform features, use a single deep-red `P` chip.
- Segment library currently groups by Goal / Owner / Used-in-campaign / Type. Add a new option: "Game (from features used)" — groups segments by the games of the features they reference. A segment touching CFM-only features groups under CFM; cross-game segments group under "Cross-game".

## Requirements

**Functional**

### 6.1 Picker cards (Condition / Exclusion / OR-row)
- Replace owner row with `<GamesChipCluster games={f.games} size="sm" />` + `<PlatformPropensityChip>` when applicable
- Drift warning: small amber `! drift` chip when `f.analytics.driftScore >= 0.4`
- Latency badge uses Phase 2 labels
- Smart-suggestions panel reorders candidates by game-overlap with currently authoring segment's existing features

### 6.2 Inline feature-swap popover
- Card layout same as picker cards (games chips, platform chip, drift warning)
- Sort algorithm: candidates sharing ≥1 game with the current feature first, then by domain match, then by usage count
- 3-5 candidates; "Browse Feature Store" link unchanged

### 6.3 Right rail "Features in use"
- Each item line: feature name (mono, click → slide-out detail) + 1-2 micro-chips (first game + platform if applicable)
- Owner avatar removed
- Hover state shows freshness % from `analytics.freshnessSlaMet`

### 6.4 Predicate row pill
- Owner avatar (currently 16px circle to the right of the operator) replaced by:
  - **Single feature with one game:** 2-letter game chip (e.g. `CFM`) tinted by game color
  - **Multi-game feature (non-platform):** first game chip + tiny "+N" overflow
  - **Platform feature:** single deep-red `P` chip with tooltip "Platform propensity"
- On hover: full GamesChipCluster popover

### 6.5 Segment library
- New group-by option: "Game (from features used)"
- Segments derive their game set from their predicate features:
  - All-CFM features → group "CFM"
  - All-PT features → group "PT"
  - Mixed → group "Cross-game"
  - Uses ≥1 platform feature → also pinned under "Uses platform features"
- Filter rail gains a "Games" multi-select (parallels FS library)

**Non-functional**
- No regression on Segment authoring flow (demo step 4: predicate composing, inline swap, threshold playground)
- No regression on Segment handoff modal (demo step 5: SegmentID + Substrate B copy verbatim)
- Reuse Phase 3/5 components — do not duplicate chip implementations

## Architecture

### Component reuse

```
Phase 3 components (reused with size variants)
  ├── <GamesChipCluster size="md" />       ← detail page (already)
  ├── <GamesChipCluster size="sm" />       ← picker, swap popover, library
  ├── <GamesChipCluster size="xs" />       ← predicate row (single chip + overflow)
  ├── <PlatformPropensityChip size="md" /> ← detail (already)
  ├── <PlatformPropensityChip size="sm" /> ← picker, swap, library
  └── <PlatformPropensityChip size="xs" /> ← predicate row (icon-only "P")
```

### Game color tokens (new)

For predicate row chip tinting and library group headers:

```ts
// apps/web/src/components/_logic/game-colors.ts
export const GAME_TINT: Record<HermesGame, { bg: string; fg: string; label: string }> = {
  cfm: { bg: '#fee2e2', fg: '#991b1b', label: 'CFM' },     // red — canonical demo game
  pt:  { bg: '#dbeafe', fg: '#1e40af', label: 'PT'  },     // blue
  nth: { bg: '#dcfce7', fg: '#166534', label: 'NTH' },     // green
  tf:  { bg: '#fef3c7', fg: '#92400e', label: 'TF'  },     // amber
  cos: { bg: '#fce7f3', fg: '#9d174d', label: 'COS' },     // pink
  ptg: { bg: '#e0e7ff', fg: '#3730a3', label: 'PG'  },     // indigo (PlayTogether-G)
};

export const PLATFORM_TINT = { bg: '#f05a22', fg: '#fff', label: 'P' };
```

### Drift badge

```tsx
// apps/web/src/components/drift-badge.tsx (new)
export function DriftBadge({ score }: { score: number }) {
  if (score < 0.4) return null;
  return (
    <span style={{
      fontFamily: T.fMono, fontSize: 10, fontWeight: 700,
      padding: '1px 5px', borderRadius: 4,
      background: T.amber50, color: T.amber700,
    }} title={`Drift score ${score.toFixed(2)}`}>
      ! drift
    </span>
  );
}
```

### Smart suggestion ranking (picker + swap)

```ts
// apps/web/src/modules/segments/_composer/_logic/rank-candidates.ts
export function rankByGameOverlap(
  candidates: HermesFeature[],
  context: { games: HermesGame[]; domain?: HermesFeatureDomain },
): HermesFeature[] {
  return [...candidates].sort((a, b) => {
    const aOverlap = a.games.filter(g => context.games.includes(g)).length;
    const bOverlap = b.games.filter(g => context.games.includes(g)).length;
    if (aOverlap !== bOverlap) return bOverlap - aOverlap;
    if (context.domain) {
      if (a.domain === context.domain && b.domain !== context.domain) return -1;
      if (b.domain === context.domain && a.domain !== context.domain) return 1;
    }
    return (b.analytics.usageCount180d ?? 0) - (a.analytics.usageCount180d ?? 0);
  });
}
```

### Library grouping by game

```ts
// apps/web/src/modules/segments/_logic/group-segments.ts
export function deriveSegmentGames(segment: Segment, allFeatures: Map<string, HermesFeature>): {
  games: HermesGame[];
  usesPlatform: boolean;
} {
  const games = new Set<HermesGame>();
  let usesPlatform = false;
  for (const featureName of segment.featuresReferenced) {
    const f = allFeatures.get(featureName);
    if (!f) continue;
    if (f.platform) usesPlatform = true;
    f.games.forEach(g => games.add(g));
  }
  return { games: Array.from(games), usesPlatform };
}
```

## Related Code Files

**Modify**
- `apps/web/src/modules/segments/_composer/condition-picker.tsx` — picker card layout
- `apps/web/src/modules/segments/_composer/exclusion-picker.tsx` — same
- `apps/web/src/modules/segments/_composer/or-row-picker.tsx` — same
- `apps/web/src/modules/segments/_composer/inline-swap-popover.tsx` — chips + ranking
- `apps/web/src/modules/segments/_composer/predicate-row.tsx` — replace owner avatar with game chip
- `apps/web/src/modules/segments/_components/features-in-use.tsx` — micro-chips
- `apps/web/src/modules/segments/library.tsx` — new group-by option, games filter
- `apps/web/src/modules/feature-store/_components/games-chip-cluster.tsx` (Phase 3) — add `size` prop variants
- `apps/web/src/modules/feature-store/_components/platform-propensity-chip.tsx` (Phase 3) — add `size` prop variants

**Create**
- `apps/web/src/components/_logic/game-colors.ts` — game tint tokens
- `apps/web/src/components/drift-badge.tsx`
- `apps/web/src/modules/segments/_composer/_logic/rank-candidates.ts`
- `apps/web/src/modules/segments/_logic/group-segments.ts`

**No deletes.**

## Implementation Steps

1. **Add size variants to Phase 3 chips.** `GamesChipCluster` and `PlatformPropensityChip` accept `size: 'xs' | 'sm' | 'md'`. xs = single 2-letter chip + overflow; sm = compact 3 chips + overflow; md = inline 4 + overflow (current default).
2. **Game colors.** Create `game-colors.ts` with the 6-game tint table.
3. **DriftBadge component.** Tiny amber chip; renders only when `score >= 0.4`.
4. **Refactor pickers (3 files).** Replace owner block in card with chip cluster + propensity chip + drift badge. Keep card density as-is.
5. **Refactor inline-swap popover.** Same card layout as pickers. Wire `rankByGameOverlap` to compute candidate order.
6. **Refactor features-in-use rail.** Each row: name + first-game chip + optional platform chip; freshness on hover.
7. **Refactor predicate row.** Replace owner avatar with single game chip (xs variant). Hover popover shows full game cluster.
8. **Segment library group-by.** Add `byGameOfFeatures` strategy and `usesPlatform` pin. Update group control dropdown.
9. **Segment library filter.** Add Games multi-select to filter rail (mirror FS library filter shape from Phase 5).
10. **Smoke + demo flow.** Run demo steps 3-5: feature → segment canvas → predicate composing (verify game chips on rows) → inline swap (verify ranking by overlap) → save → handoff modal (verify Substrate B copy unchanged).

## Todo List

- [ ] Add `size` variants to GamesChipCluster + PlatformPropensityChip
- [ ] Create `game-colors.ts` token table
- [ ] Build `DriftBadge` component
- [ ] Refactor 3 picker cards (condition, exclusion, or-row)
- [ ] Refactor inline-swap popover with rank-by-overlap
- [ ] Refactor features-in-use right rail
- [ ] Refactor predicate row pill (replace owner avatar)
- [ ] Add segment library group-by `byGameOfFeatures` + filter
- [ ] Smoke test demo flow steps 3-5 + new ranking behavior
- [ ] `pnpm typecheck` clean
- [ ] `pnpm build` clean

## Success Criteria

- [ ] Picker cards (3 surfaces) show games chips + platform chip + drift badge
- [ ] Inline swap popover ranks candidates by game-overlap with current feature
- [ ] Features-in-use right rail shows micro-chips, no owner
- [ ] Predicate row pill shows single game chip; multi-game features show overflow; platform features show deep-red P
- [ ] Segment library has `byGameOfFeatures` group-by + Games filter
- [ ] No owner avatars remain on Segment surfaces
- [ ] Demo flow steps 3-5 walk end-to-end without regression
- [ ] Handoff modal Substrate B copy unchanged

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Predicate row gets visually busy with chips replacing avatar | xs variant is single 2-letter chip with overflow — same width as the avatar circle. Visually equivalent density. |
| Game tint colors clash with Phase 2 latency tones (Realtime green vs NTH green) | Latency tones use 100-shade backgrounds; game tints use 100-shade backgrounds with darker foregrounds. Pair them: latency on left, game on right. Visual review with showcase feature. |
| Ranking by game overlap surprises users (a CFM-author sees PT features pushed down) | This is the desired behavior. The "Browse Feature Store" link in swap popover offers escape hatch to all features unranked. |
| Library group-by `byGameOfFeatures` is expensive to compute on every render | Memoize derivation per (segments + features) dep tuple. ≤30 segments × ≤10 features each = trivial. |

## Security Considerations

None — purely UI changes consuming existing schema fields.

## Next Steps

Phase 7 validates the whole redesign end-to-end (demo flow, typecheck, build) and writes the addendum PRD documenting the v2 contract.
