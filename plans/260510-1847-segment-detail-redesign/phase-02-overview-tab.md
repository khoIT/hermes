---
phase: 2
title: "Overview Tab"
status: completed
priority: P0
effort: "1d"
dependencies: [1]
---

# Phase 2: Overview Tab

## Overview

Builds the Overview surface that answers "is this segment healthy?" — full-width Segment Size Over Time chart (configurable date range + chart type + data dropdown), two-column row of vs-All-Users + Trend Over Time tables, full-width Segment Overlap table, and drift banner. Replaces the current monitoring page as the index route. Uses deterministic synthetic data per segment id so screenshots are stable.

## Requirements

**Functional:**
- `/segments/:id` (index) renders `<Overview>` instead of monitoring page.
- **Segment Size Over Time** card:
  - Toolbar: date-range chip dropdown (Last 7 / 30 / 90 days / Custom), chart-type toggle (Line / Bar / Area — default Area), Data dropdown (Users / Daily Active / Weekly Active).
  - Chart body: 320px height, x-axis date labels at start/middle/end, y-axis count.
  - Footer: "Explore Events →" right-aligned button (stub navigation OK).
- **vs All Users table** (left column): Metric / Segment / All / Diff columns. ≥3 rows (Users, Avg sessions/wk, ARPDAU or similar).
- **Trend Over Time table** (right column): Metric / Now / 30d / 60d / 90d. ≥2 rows (WAU in segment, Avg session length).
- **Segment Overlap table** (full-width below): Segment / Shared Users / % of This Segment / Overlap-bar. Top 5 sibling segments by overlap %, sorted descending.
- **Drift banner**: shown when `seg.drift === true`. Copy: "⚠ Drift detected — composition shifted >15% from baseline. Consider rebuilding."
- All synth data deterministic via `mulberry32(hashSegmentId)`.

**Non-functional:**
- `overview.tsx` ≤200 LoC.
- `segment-size-chart.tsx` ≤200 LoC (SVG-based, no heavy chart lib).
- Each table component ≤150 LoC.
- `synth-segment-detail-data.ts` ≤200 LoC (Phase 2 portion); will be extended by Phases 3 + 4.
- Chart-type/range toggles update render within 100ms.

## Architecture

```
overview.tsx (route element at /segments/:id index)
  ├─ <SegmentSizeChart segmentId/>           full-width card
  │    ├─ toolbar: date-range chip · chart-type toggle · Data dropdown
  │    ├─ <ChartCanvas type="line|bar|area" data={…} height={320}/>
  │    └─ footer: "Explore Events →"
  ├─ <DriftBanner show={seg.drift}/>          conditional
  └─ flex row (gap 16):
       ├─ <VsAllUsersTable segmentId/>        ~50% width
       └─ <TrendOverTimeTable segmentId/>     ~50% width
       <SegmentOverlapTable segmentId/>       full width below row

synth-segment-detail-data.ts
  exports:
    - getSizeTimeSeries(segmentId, days, dataKey): { date, count }[]
    - getVsAllStats(segmentId): { metric, segment, all, diff }[]
    - getTrendOverTime(segmentId): { metric, now, d30, d60, d90 }[]
    - getSegmentOverlap(segmentId): { segmentId, name, sharedUsers, pct }[]
  internal:
    - mulberry32(seed) PRNG
    - hashSegmentId(id): number
```

Date-range chip + chart-type + data-key are local component state (`useState`) — no global store needed.

## Related Code Files

**Create:**
- `apps/web/src/modules/segments/overview.tsx`
- `apps/web/src/modules/segments/_components/segment-size-chart.tsx`
- `apps/web/src/modules/segments/_components/vs-all-users-table.tsx`
- `apps/web/src/modules/segments/_components/trend-over-time-table.tsx`
- `apps/web/src/modules/segments/_components/segment-overlap-table.tsx`
- `apps/web/src/modules/segments/_utils/synth-segment-detail-data.ts`

**Modify:**
- `apps/web/src/routes.tsx` — point index route at `<Overview>` instead of `<SegmentsMonitoringPage>`.

**Delete:**
- `apps/web/src/modules/segments/monitoring.tsx` — content lifted into `<SegmentSizeChart>`. Existing `MonitoringChart` component under `_components/monitoring-chart.tsx` may be reused or replaced.

## Implementation Steps

1. **Synth data utility** (1.5h)
   - Create `synth-segment-detail-data.ts`.
   - Implement `mulberry32(seed)`, `hashSegmentId(id)` (sum char codes mod 2^32).
   - **CRITICAL — PRNG isolation:** every exported generator must instantiate a **fresh** `mulberry32(hashSegmentId(id))` instance internally and consume it locally. NEVER share a module-level PRNG across generators — PRNGs are stateful and call-order-dependent, so shared state would cause Phase 3's lifecycle distribution to disagree with Phase 4's user sample on reload. Add a sanity test: call `getCountryBreakdown('foo')` twice and assert deep-equal output.
   - `getSizeTimeSeries(id, days, key)`: returns `days+1` points; base count = `seg.audienceSize` for Users, scaled (~0.6) for DAU, (~0.85) for WAU. Add deterministic jitter ±8%.
   - `getVsAllStats(id)`: 3 rows — Users, Avg sessions/wk, ARPDAU. Segment values pull from `seg.audienceSize` etc.; All values are scaled multiples (~7.5× users etc.); diff is segment/all percent.
   - `getTrendOverTime(id)`: 2 rows — "Weekly Active Users in Segment", "Avg session length (s)". 4 columns Now/30d/60d/90d with deterministic decay.
   - `getSegmentOverlap(id)`: walk `allSegments`, exclude self, return top-5 by deterministic shared-user count + pct. Sibling names from contract.

2. **`<SegmentSizeChart>`** (3h)
   - Toolbar: 3 controls in flex row.
     - Date-range chip: button → small dropdown panel (Last 7 / 30 / 90 / Custom). Custom opens a date-pair input (placeholder OK for Phase 2).
     - Chart-type toggle: 3-pill segmented control (Line / Bar / Area).
     - Data dropdown: button → dropdown (Users / Daily Active / Weekly Active).
   - Chart body: lightweight SVG renderer.
     - Path generation for line + area; rect array for bar.
     - Single accent color (T.brand) for area+line; bar uses T.brand-soft.
     - X-axis labels at start/mid/end; y-axis 3 grid lines.
   - Footer: "Explore Events →" button (right-aligned).
   - Reuse existing `MonitoringChart` shape if it cleanly accepts a `type` prop; otherwise inline a 3-mode renderer.

3. **`<VsAllUsersTable>`** (45 min)
   - 4 columns × 3+ rows (Metric, Segment, All, Diff).
   - Header row in T.n100 background; rows separated by hairline.
   - Diff cell colored T.green for positive, T.amber for negative.
   - **Synthetic-data tag:** card header includes a small subtle pill "Demo data" (T.n100 bg, T.n500 text) since these numerals are PRNG-derived sitting next to the segment's *real* `audienceSize`. Same applies to Trend + Overlap cards. One-time visual cost, prevents demo-day "where did 14.2% come from?" footgun.

4. **`<TrendOverTimeTable>`** (45 min)
   - 5 columns × 2+ rows (Metric, Now, 30d, 60d, 90d).
   - Right-align numerics; mono font for numerals.

5. **`<SegmentOverlapTable>`** (1h)
   - 4 columns × 5 rows (Segment, Shared Users, % of This Segment, Overlap bar).
   - Last column: horizontal bar viz `<div style={{width: pct+'%'}}/>` inside a track.
   - Click segment name → `navigate('/segments/{otherId}')`.

6. **`overview.tsx` composition** (45 min)
   - Pull `seg` from `allSegments.find(s => s.id === id)`.
   - Render chart card → drift banner (if applicable) → 2-col row → overlap table.
   - Padding `28px 32px`, max-width 1200.

7. **Route swap + monitoring deletion** (15 min)
   - Edit `routes.tsx`: index route element changes from `<SegmentsMonitoringPage/>` to `<Overview/>`.
   - Delete `apps/web/src/modules/segments/monitoring.tsx`.
   - Verify `/segments/:id/monitoring` redirect (added in Phase 1) still resolves to index.

8. **Verification:**
   - Load `/segments/seg-cfm-loss-streak-non-paying-2026-0508-a3f9`.
   - All 4 cards render; chart toggles between Line/Bar/Area; date-range chip changes data points; Data dropdown switches series.
   - Click sibling segment in overlap table → navigates correctly.
   - Drift banner shows for segments with `drift: true` in fixtures.
   - `pnpm typecheck` clean.

## Success Criteria

- [ ] `/segments/:id` index renders Overview with all 4 panels (chart, drift banner conditional, 2-col tables, overlap).
- [ ] Chart-type toggle switches Line/Bar/Area without flicker.
- [ ] Date-range chip changes the chart's data points (7/30/90).
- [ ] Data dropdown switches between Users/DAU/WAU series.
- [ ] vs-All / Trend / Overlap tables populate from synth data.
- [ ] Synth data is deterministic across reloads for the same segment id.
- [ ] `monitoring.tsx` deleted; legacy `/monitoring` route still redirects to index.
- [ ] `pnpm typecheck` clean.

## Risk Assessment

- **Risk:** SVG chart renderer drifts from existing `MonitoringChart` style.
  - **Mitigation:** Reuse `monitoring-chart.tsx` if it accepts `type` prop cleanly; otherwise extract shared color/grid helpers into `_components/chart-helpers.ts`.
- **Risk:** Synth data flickers between renders.
  - **Mitigation:** `useMemo(() => getSizeTimeSeries(id, days, key), [id, days, key])`; PRNG seed derives from id only, not Date.now.
- **Risk:** Overlap table click breaks layout when neighbor segment id is invalid.
  - **Mitigation:** Filter overlap output to ids present in `allSegments` only; defensive `if (!found) return null` in click handler.
- **Risk:** Custom date range UX is non-trivial.
  - **Mitigation:** Phase 2 ships with the 3 preset ranges only; Custom shows a placeholder ("Custom range coming soon") + 30d default. Real custom-range picker is a follow-up polish item.
