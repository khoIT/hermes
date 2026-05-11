---
phase: 3
title: "Composition Tab"
status: completed
priority: P0
effort: "0.75d"
dependencies: [1]
---

# Phase 3: Composition Tab

## Overview

Implements the Composition page that answers "who is in this segment?" via a 2×2 card grid: Lifecycle stage breakdown (existing field), Spend tier breakdown (existing field), Country top 10 (NEW fixture), Device platform split (NEW fixture). Replaces the `ComingSoon` stub. Extends `synth-segment-detail-data.ts` with country + device generators.

## Requirements

**Functional:**
- `/segments/:id/composition` renders 4 cards in a 2×2 grid (responsive: 1×4 below 900px viewport).
- **Lifecycle Card:** stacked horizontal bar with 4 stages (New / Active / At-risk / Churned). Pulls from `seg.lifecycleBreakdown` if present, else synth fallback. Each segment colored, percent labels.
- **Spend Tier Card:** stacked horizontal bar with 4 tiers (Whale / Dolphin / Minnow / F2P). Pulls from `seg.spendTierBreakdown` if present, else synth fallback.
- **Country Card:** vertical bar list, top 10 ISO country codes, sorted descending. Bar widths normalized to top value. Country name + count + percent.
- **Device Card:** donut chart with 3 slices (iOS / Android / Web) + legend. Inner label: "{device count}".
- All synth data deterministic per segment id; same `mulberry32` seed source as Phase 2.

**Non-functional:**
- `composition.tsx` ≤120 LoC (mostly grid layout).
- Each card component ≤200 LoC.
- Country/Device fixture generators added to `synth-segment-detail-data.ts` (≤80 LoC additional).

## Architecture

```
composition.tsx
  grid-template-columns: 1fr 1fr (collapse to 1fr below 900px)
  ├─ <LifecycleCard segment/>     uses seg.lifecycleBreakdown ?? synth
  ├─ <SpendTierCard segment/>     uses seg.spendTierBreakdown ?? synth
  ├─ <CountryCard segmentId/>     synth top-10
  └─ <DeviceCard segmentId/>      synth ios/android/web

synth-segment-detail-data.ts (extended)
  exports new:
    - getCountryBreakdown(segmentId): { code, name, count, pct }[10]
    - getDeviceBreakdown(segmentId): { platform: 'ios'|'android'|'web', count, pct }[3]
    - synthLifecycleBreakdown(segmentId): LifecycleBreakdown   (fallback only)
    - synthSpendTierBreakdown(segmentId): SpendTierBreakdown   (fallback only)
```

Country fixture base list (deterministic top-25 pool): VN, US, ID, BR, JP, KR, IN, DE, GB, FR, RU, CN, MX, ES, IT, TR, PH, TH, MY, SG, AU, CA, NL, PL, AR. Pick top-10 deterministically from the segment-id seed and assign weights.

## Related Code Files

**Create:**
- `apps/web/src/modules/segments/composition.tsx`
- `apps/web/src/modules/segments/_components/composition-cards/lifecycle-card.tsx`
- `apps/web/src/modules/segments/_components/composition-cards/spend-tier-card.tsx`
- `apps/web/src/modules/segments/_components/composition-cards/country-card.tsx`
- `apps/web/src/modules/segments/_components/composition-cards/device-card.tsx`

**Modify:**
- `apps/web/src/modules/segments/_utils/synth-segment-detail-data.ts` — add country + device generators, lifecycle + spend-tier fallbacks.
- `apps/web/src/routes.tsx` — replace `composition` ComingSoon stub with `<Composition/>`.

**Delete:** none.

## Implementation Steps

1. **Synth data extensions** (1.5h)
   - In `synth-segment-detail-data.ts`:
     - Add `COUNTRY_POOL` const (25 codes + display names).
     - `getCountryBreakdown(id)`: shuffle pool deterministically, take 10, assign descending weights summing to 100%, multiply by `seg.audienceSize` for counts.
     - `getDeviceBreakdown(id)`: deterministic split favoring mobile (ios+android ≥80% combined), small web slice. Returns 3 entries.
     - `synthLifecycleBreakdown(id)`, `synthSpendTierBreakdown(id)`: produce contract-shape objects when segment fixtures lack the field.

2. **`<LifecycleCard>`** (45 min)
   - Card with title "Lifecycle stage" + small "?" tooltip.
   - Body: horizontal stacked bar 320×24px with 4 segments.
   - Below bar: legend row with color dots + label + percent.
   - Color map: New=#3f8dff, Active=#10b981, At-risk=#f59e0b, Churned=#ef4444.

3. **`<SpendTierCard>`** (45 min)
   - Same pattern as Lifecycle. Title "Spend tier".
   - Color map: Whale=#7c3aed, Dolphin=#3f8dff, Minnow=#10b981, F2P=T.n400.
   - Footer: small mono line "Avg LTV: $X.XX" (synth from spend tier weights × tier base values).

4. **`<CountryCard>`** (1h)
   - Title "Top countries" + small "10 / 200+ shown" caption.
   - Body: 10 rows.
     - Each row: flag emoji (lookup from code) · country name · spacer · count (mono) · percentage bar (max width = top country's pct).
   - Click row: no-op for now (reserved for future "filter to country").

5. **`<DeviceCard>`** (45 min)
   - Title "Device platform".
   - Body: SVG donut, 200×200, 3 slices with platform colors (iOS=#000, Android=#3ddc84, Web=T.n500).
   - Center label: total count.
   - Right side: legend with percent.

6. **`composition.tsx` composition** (30 min)
   - Padding `28px 32px`, max-width 1200.
   - 2×2 grid, gap 16, responsive 1-col below 900px.
   - Pull `seg` from `allSegments`.
   - Defensive: if seg missing, render error state.

7. **Route wire-up** (10 min)
   - Edit `routes.tsx`: replace the existing ComingSoon for `composition` with `<Composition/>`.

8. **Verification:**
   - Load `/segments/seg-cfm-loss-streak-non-paying-2026-0508-a3f9/composition` → all 4 cards render.
   - Refresh — same data shape (deterministic).
   - Resize below 900px — grid collapses to 1 column without horizontal scroll.
   - `pnpm typecheck` clean.

## Success Criteria

- [ ] `/segments/:id/composition` renders 4 cards in 2×2 grid.
- [ ] Lifecycle + Spend tier cards use existing fields when present, fall back to synth otherwise.
- [ ] Country card shows top 10 with bar viz; data is deterministic.
- [ ] Device donut renders 3 slices; percentages match legend.
- [ ] Responsive collapse below 900px viewport.
- [ ] Synth data stable across reloads.
- [ ] `pnpm typecheck` clean.

## Risk Assessment

- **Risk:** Donut SVG math is finicky (arc paths).
  - **Mitigation:** Use polar-to-cartesian helper; test with 3 fixed slices first; total = 360°.
- **Risk:** Country flag emojis don't render on Windows fonts.
  - **Mitigation:** Use small color dot fallback if flag glyph width is 0; or skip flags entirely and rely on country name.
- **Risk:** Lifecycle/Spend contract shape mismatch when synth fallback fires.
  - **Mitigation:** Synth fallbacks return objects validated against zod schemas in `@hermes/contracts` before returning.
- **Risk:** Grid breaks visual rhythm vs Overview's full-width chart.
  - **Mitigation:** Same outer padding + max-width as Overview to keep header alignment consistent.
