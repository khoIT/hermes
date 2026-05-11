# Brainstorm — Segment Detail View Redesign

**Date:** 2026-05-10
**Author:** Hermes / brainstorm session
**Timing:** Post-May-12 demo (separate plan)
**Reference mockup:** "Organic Power Users" segment detail (Image 7)

---

## Problem Statement

Current `/segments/:id` surface diverges from intended LiveOps PM workflow:
- 7 tabs (Overview · Composition · Users · Campaigns · Monitoring · Threshold · Canvas) — crowded, redundant.
- Overview = monitoring chart only; no comparison to baseline, no overlap, no trend table.
- Composition / Users / Campaigns are `ComingSoon` stubs.
- Edit flow lives at `/segments/:id/canvas` — separate URL, separate mental model from "viewing the segment."
- No top-right action bar (Pin to board / SQL / Send campaign / Rebuild) — primary LiveOps actions buried.
- Chart not configurable (date range, chart type fixed).

Mockup defines a tighter, more analyst-friendly layout: 4 tabs, hero header with action bar, Overview built around comparison + overlap, all surface-level cards directly answering PM questions.

---

## Requirements

### Functional
- 5-tab nav: **Overview · Composition · Users · Predicate · Campaigns**
- Header: name + description + count + lifecycle status + drift pill + reverse-chat pill + action bar (Pin to board / SQL / Send campaign / ⟲ Rebuild / ⋯)
- Overview: Segment Size Over Time chart (configurable date range + chart type) · vs All Users table · Trend Over Time table · Segment Overlap table · drift banner.
- Composition: 4 cards in 2×2 — Lifecycle / Spend tier / Country top 10 / Device split.
- Users: paginated 50-row sample table + CSV export (UID · Last seen · Lifecycle · Spend tier · Country · Device).
- Predicate: read-mode default with big visible Edit button + `e` shortcut + `?edit=1` deeplink. Save/Discard ribbon during edit. Threshold tool inline per condition.
- Campaigns: list of campaigns referencing this segment + empty-state CTA.
- Redirects: `/canvas` → `/predicate`, `/monitoring` → `/`, `/threshold` → `/predicate`.

### Non-functional
- LoC budget: each tab page ≤200 lines; helpers ≤200 lines; total ~1500 LoC across ~14 files.
- Synthetic fixtures deterministic per segment id (stable screenshots).
- Existing routes for `/segments/new` + handoff modal preserved.
- Reverse-chat pill (Phase 2 of May-12 plan) still mounts on header.

---

## Evaluated Approaches

### Approach A — Match mockup exactly (4 tabs)
Tabs: Overview · Composition · Users · Campaigns. Edit flow stays at `/segments/:id/canvas` separate page.

**Pros:** Pixel-faithful to design.
**Cons:** Edit flow disconnected from detail view; users keep bouncing to a separate URL to refine. Doesn't address user request to "merge edit page to this detailed view."

### Approach B — 5 tabs, Predicate as separate read+edit module ✅ SELECTED
Tabs: Overview · Composition · Users · **Predicate** · Campaigns. Predicate tab combines static-read view + interactive edit toggle. `/canvas` redirects to `/predicate`.

**Pros:** Edit lives inside detail view (per user request). Tabs stay nouns. Read-mode is fast for review; Edit unlocks composer. DRY — single URL per concept. Discoverable via prominent Edit button.
**Cons:** Read-mode renderer is new code (~80 LoC). 5 tabs is one more than mockup.

### Approach C — Always-editable Predicate (no read mode)
Tabs same as B, but Predicate is always interactive. No read mode.

**Pros:** Power-user friendly; one less click.
**Cons:** Noisy first impression. PMs landing here from a chat action card see editor chrome before they've read what the segment IS. Doesn't match the analyst-friendly tone of the mockup.

### Approach D — Promote Edit to its own top-level tab
Tabs: Overview · Composition · Users · Predicate · **Edit** · Campaigns.

**Pros:** Maximum discoverability of edit flow.
**Cons:** Tabs as verbs (anti-pattern). 6 tabs crowded. Duplicates Predicate content. `/edit` and `/new` both exist — confusing.

---

## Recommended Solution — Approach B

### Header (above tabs)
```
Segments / {name}                  [📌 Pin to board] [</> SQL] [📣 Send campaign] [⟲ Rebuild] [⋯]
{name}
{description}
{count} users · ✓ Last build {ts}    [drift pill]    [💬 source pill]
```

Action overflow: Duplicate · Archive · Export.

### Tab structure (5 tabs)
Overview · Composition · Users · **Predicate** · Campaigns.

### Overview tab
1. **Segment Size Over Time** card (full width)
   - Toolbar: date-range chip (7d / 30d / 90d / Custom) + chart-type toggle (Line / Bar / Area) + Data dropdown (Users / DAU / WAU)
   - Footer: "Explore Events →" right-aligned
2. Two-column row:
   - **vs All Users** table — Metric / Segment / All / Diff
   - **Trend Over Time** table — Metric / Now / 30d / 60d / 90d
3. **Segment Overlap** table — Segment / Shared Users / % of This Segment / Overlap bar (top 5–10 sibling segments)
4. Drift banner if `seg.drift === true`

### Composition tab (2×2 grid)
- Lifecycle stage stacked bar — `lifecycleBreakdown` (existing)
- Spend tier stacked bar — `spendTierBreakdown` (existing)
- Country / region top 10 vertical bar — NEW fixture
- Device / platform donut — NEW fixture

### Users tab
- Toolbar: "{N} users · Last build {ts}" + `[Export CSV]`
- 50-row paginated sample: UID · Last seen · Lifecycle · Spend tier · Country · Device
- No row drill-in.

### Predicate tab (merged edit)
- **Read mode (default):** static cascade render of `PredicateAST` group blocks with feature pills + plain-English subtitles.
- **Big visible `[✏ Edit]` button** top-right (not hidden behind shortcut).
- **`e` keyboard shortcut** flips to edit mode.
- **`?edit=1` deeplink** for bookmarks / chat action card "Refine" CTAs.
- Edit mode wraps existing `canvas-reducer` interactive composer with sticky Save/Discard ribbon.
- **Threshold tool inline:** per condition row → "Tune threshold" affordance opens existing `threshold-deep` tool in popover scoped to that row.
- `/segments/new` standalone route unchanged.

### Campaigns tab
- List of campaigns referencing this segment — status pill, type, last send, observed lift.
- Empty state: "Not used yet — Create campaign →" linking to `/campaigns/new/realtime?seedSegmentId={id}`.

### Route changes
| Route | Action |
|---|---|
| `/segments/:id` | New `<Overview>` (was Monitoring) |
| `/segments/:id/composition` | New `<Composition>` (was stub) |
| `/segments/:id/users` | New `<Users>` (was stub) |
| `/segments/:id/predicate` | NEW — `<Predicate>` (read+edit) |
| `/segments/:id/campaigns` | New `<Campaigns>` (was stub) |
| `/segments/:id/canvas` | 301 → `/predicate` |
| `/segments/:id/monitoring` | 301 → `/` |
| `/segments/:id/threshold` | 301 → `/predicate` |
| `/segments/:id/handoff` | unchanged |

### Files

**Create (~14):**
- `modules/segments/overview.tsx`
- `modules/segments/composition.tsx`
- `modules/segments/users.tsx`
- `modules/segments/predicate.tsx` (read+edit toggle)
- `modules/segments/campaigns-tab.tsx`
- `modules/segments/_components/detail-header.tsx`
- `modules/segments/_components/segment-size-chart.tsx` (configurable line/bar/area)
- `modules/segments/_components/vs-all-users-table.tsx`
- `modules/segments/_components/trend-over-time-table.tsx`
- `modules/segments/_components/segment-overlap-table.tsx`
- `modules/segments/_components/composition-cards/{lifecycle,spend-tier,country,device}-card.tsx`
- `modules/segments/_components/users-table.tsx`
- `modules/segments/_components/predicate-read-view.tsx`
- `modules/segments/_utils/csv-export.ts`
- `modules/segments/_utils/synth-segment-detail-data.ts` (country, device, overlap, sample users, vs-all, trend fixtures)

**Modify (3):**
- `modules/segments/_components/detail-tabs.tsx` (5 tabs)
- `modules/segments/_components/detail-layout.tsx` (mount detail-header)
- `routes.tsx` (new routes + 3 redirects)

**Delete (1):**
- `modules/segments/monitoring.tsx` (lifted into Overview's chart card)

---

## Implementation Considerations

### Effort (honest)
- Header + action bar: 0.5d
- Overview (chart configurable + 3 tables + drift): 1d
- Composition (4 cards + 2 new fixtures): 0.75d
- Users (table + CSV): 0.5d
- Predicate read-mode + edit toggle + threshold popover: 0.75d
- Campaigns list: 0.25d
- Routes + redirects + cleanup: 0.25d
- **Total: ~4d** (with buffer: 4.5–5d)

### Risks + mitigations
- **Predicate read-mode renderer:** existing composer is interactive-only. Mitigation: `<PredicateReadView>` ~80 LoC walks `PredicateAST` and renders read-only group blocks. Reuses feature pill component.
- **Action card hardcoded `/canvas` URLs:** verified `action-card-segment.tsx` navigates to `/segments/${id}` (base). Redirect is belt-and-suspenders.
- **Synthetic fixture realism:** generate deterministic-from-segment-id pseudo-random data (`mulberry32(segmentId.length)`), stable across reloads.
- **Overlap data accuracy:** for fixture-only segments, overlap is synthesized from sibling-segment names. Real query-svc backend can replace later.
- **Tight coupling with May-12 plan:** plan executes post-demo. No conflict — Phase 2's `sourceThreadId` pill already lives on `detail-layout.tsx` and continues to render above tabs.
- **5 tabs vs mockup's 4:** Predicate is the cost of "merge edit into detail view." Acceptable tradeoff.

---

## Success Metrics

- All 5 tabs render real content (no `ComingSoon` stubs remaining on segment detail).
- Chart type toggle + date-range toggle change rendering within 100ms.
- vs-All / Trend / Overlap tables populate from synth fixtures or backend.
- Predicate read-mode renders any seeded `PredicateAST` shape without crash.
- `e` shortcut + `[Edit]` button + `?edit=1` deeplink all flip to edit mode.
- Save in edit mode persists predicate via existing `segments-client.update()`.
- CSV export downloads a 50-row file from Users tab.
- All 3 legacy routes redirect (no 404 on bookmarked `/canvas`, `/monitoring`, `/threshold`).
- `pnpm typecheck` clean.

---

## Validation Criteria

- LiveOps PM walkthrough: open Organic Power Users → see size chart + comparison + overlap on Overview → switch to Composition → understand who's in segment → tap Predicate → read existing rules → click Edit → tweak a threshold → Save → see updated audience count.
- All flows above complete in ≤90s without consulting docs.

---

## Next Steps + Dependencies

- **Run `/ck:plan`** to create implementation plan at `plans/260510-1847-segment-detail-redesign/`.
- **Dependency:** Phase 2 (sourceThreadId reverse pill) of May-12 plan is non-blocking but improves header. Plan can land independently.
- **No predecessor required.** Composer (`canvas.tsx`) already exists and is reusable.
- **Post-demo timing.** Does not interfere with May-12 critical path.

---

## Unresolved Questions

- **Default chart type:** Area (per mockup) — confirmed.
- **Overlap source:** synth fixtures for now; backend query-svc endpoint TBD post-demo.
- **Sample size for Users tab:** 50 rows fixed; pagination future enhancement.
- **Bulk actions on Users table:** none in v1; flag for v1.1 if PMs ask.
