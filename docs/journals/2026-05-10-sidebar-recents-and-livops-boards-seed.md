# Sidebar Recent-Tracking Wiring + LivOps Boards Boot Seed

**Date**: 2026-05-10 PM
**Severity**: Low
**Component**: Sidebar recent-items subsection, segment detail navigation, boards seeding
**Status**: Resolved

## What Happened

Three independent fixes on the `actioneer` branch wove together into one coherent afternoon session:

1. **Recent-tracking (view log) was firing on only 2 of 4 detail-page types.** Sidebar's "You viewed" / "Recently viewed" subsection always showed empty because `pushRecent()` was only called from chat thread creation and board creation flows. Feature detail, segment detail, board detail, and campaign detail pages never logged a visit. Fixed by adding `useEffect`-on-resolve calls in four places: `feature-store/detail.tsx`, `canvas/detail-page.tsx`, `segments/detail-layout.tsx` (wraps all `/segments/:id/*` sub-tabs), and `campaigns/monitoring.tsx`.

2. **Segment row click navigated to the composer, not the detail page.** Library row container had `onClick={onEdit}` which hit `/segments/new?from=draft-X`. The eye-icon button correctly hit `onView` (detail page), but users naturally click the row body, not a 16px icon. Swapped row's default handler to `onView`. Edit remains accessible via the pencil icon. This was frustrating to diagnose because the symptom (empty recents) had two independent causes — #1 was half the problem, but even after fixing that, segments still looked broken because navigation went to the wrong place.

3. **Sidebar information architecture reorganized.** Reordered main sections: {Chats, Feature Store, Segments, Boards, Campaigns} are now primary; {Playbooks, Funnels, Retentions, Knowledge} moved into a collapsible "Advanced Features" group. When expanded, the "Advanced Features" label itself hides — only the four sub-items remain visible (icon and caret stay so collapse is still clickable). New `hideLabelWhenExpanded` prop on `SidebarSection`. New optional `subheader` prop on `RecentItems` (added, then removed for segments after feedback — kept the prop definition because Feature Store uses the same primitive via a bespoke section component).

4. **Sidebar collapse toggle repositioned.** Moved from a chevron at the bottom-right inside `BottomRow` to a round 28px white button positioned absolutely at the aside's right edge, hidden by default. Button fades in when the user hovers an invisible 16px strip straddling the seam (the right edge of the sidebar). Required setting `<aside>` `overflow: visible` (was hidden); inner `<nav>` already manages its own scroll so nothing broke. Hover state on the strip and button are OR'd together so the user's cursor can move from strip to button without losing the visual feedback ring.

5. **Two sample boards seeded at application boot.** Created `seedSampleBoards()` in `apps/catalog-api/src/seed/seed-boards.ts` and a NestJS `@Injectable() OnApplicationBootstrap` service `boards-seeder.service.ts`. The boards (`bd-livops-loss-streak-rescue`, `bd-livops-whale-at-risk-yend`) reference real catalog IDs (`seg-cfm-loss-streak-non-paying-2026-0508-a3f9`, `cmp-cfm-407`, `seg-cfm-whale-at-risk`) and contain realistic widget JSON (line, bar, funnel, and table charts). **Why boot hook, not `pnpm db:seed`?** The standard seed script crashes inside `seedDemoMetricPipelines` on the first missing Trino raw table (`raw_cfm_etl_recharge` doesn't exist in local dev) and never reaches the boards step. Boot-hook is idempotent (board ID `ON CONFLICT DO NOTHING`, card-count guard for cards), survives DB resets, and works with the user's existing `pnpm dev` workflow without a manual seed step. Wrapped the seed call in try/catch so a transient DB hiccup never crashes NestJS boot.

## The Brutal Truth

The segment navigation bug was maddening because the symptom pointed in the wrong direction. "No recent segments" looked like a missing tracking call (#1), and after adding that, segments *still* weren't appearing in the sidebar. Took 20 minutes of staring at the useEffect to realize the whole detail page wasn't being visited because clicks were routing to the composer instead. Two unrelated layers, same symptom — classic depth-in-stack diagnosis trap.

The boot-seeding decision (#5) is a pragmatic punt. The real problem (missing fallback for synthetic metric pipelines) is legitimate technical debt, but fixing it right means understanding why the fallback is incomplete and either completing it or replacing it. That's a 2–3 hour rabbit hole. Seeding at boot solves the immediate need (demo board visibility on fresh checkout) and keeps the user unblocked without dragging in orphaned test-data issues.

## Technical Details

### Recent-Tracking Additions
- `apps/web/modules/feature-store/detail.tsx`: `useEffect` calls `pushRecent(featureId)` after loading resolves
- `apps/web/modules/canvas/detail-page.tsx`: `useEffect` calls `pushRecent(boardId)` after board data settles
- `apps/web/modules/segments/detail-layout.tsx`: `useEffect` calls `pushRecent(segmentId)` on layout mount (covers all sub-tabs: SQL, data, usage, etc.)
- `apps/web/modules/campaigns/monitoring.tsx`: `useEffect` calls `pushRecent(campaignId)` after load

### Segment Navigation Flip
- `apps/web/modules/segments/library-row.tsx`: Changed row's `onClick` from `onEdit` to `onView`
- Pencil icon remains wired to `onEdit` (visual affordance for editing)
- Eye icon already wired to `onView` (no change)

### Sidebar IA + Collapse UI
- `apps/web/src/components/sidebar.tsx`: Reordered `SidebarSection` calls; added `Advanced Features` expandable group
- `apps/web/src/components/sidebar-section.tsx`: New `hideLabelWhenExpanded` prop; when true, label hides on expand, only items show
- `apps/web/src/components/recent-items.tsx`: New optional `subheader` prop (unused for now; kept for consistency)
- Collapse toggle: Removed from `BottomRow`, created new `CollapseTrigger` button component
  - Positioned absolutely `right: -28px` (outside aside boundary)
  - 16px hover-strip spans the seam
  - Uses CSS `:has()` pseudo-class to merge strip + button hover states

### Sample Boards Seed
- `apps/catalog-api/src/seed/seed-boards.ts`: `seedSampleBoards()` function; inserts two boards with realistic widget JSON
- `apps/catalog-api/src/services/boards-seeder.service.ts`: Implements `OnApplicationBootstrap`, calls `seedSampleBoards()` in `onApplicationBootstrap()` hook
- Board references:
  - `bd-livops-loss-streak-rescue`: loss-streak segment + funnel charts
  - `bd-livops-whale-at-risk-yend`: whale-at-risk segment + retention line chart
- Idempotency: `INSERT ... ON CONFLICT (id) DO NOTHING` (board) + card count guard (cards)
- Error handling: `try/catch` around entire seed call logs but doesn't throw

## What We Tried

- Initially assumed the empty recents were a single tracking-call bug (#1 alone). After fixing that, segments still didn't appear, leading to the navigation hypothesis (#2).
- Considered renaming "Advanced Features" to "More" (simpler label), but "Advanced" better signals that those modules are specialized/optional.
- Explored whether to use `db:seed` for boards. Ran into the `seedDemoMetricPipelines` crash immediately; pivot to boot-hook was pragmatic.

## Root Cause Analysis

**Recent tracking gap:** Four detail pages were plumbing `pushRecent()` directly during page load (chats, boards on creation), but four others had no instrumentation. When users visited feature/segment/campaign/board detail views, the sidebar never recorded the visit. Fix was straightforward once identified.

**Segment navigation:** Row's `onClick` was bound to `onEdit` by default (intuitive for inline form-based modules like Audiences), but segments use a full detail page, so the row should navigate to detail. Eye icon was a secondary affordance; users expect the row click itself to open detail. Pencil icon explicitly signals "edit this" and stays wired correctly.

**Boot-seeding over `db:seed`:** The standard seed pipeline has an unresolved gap in `seedDemoMetricPipelines` (synthetic fallback doesn't cover all pipeline types). Fixing it requires understanding why the fallback exists and either completing it or replacing it — out of scope. Boot-hook avoids that entirely: idempotent, uses real IDs, works with `pnpm dev` cold start, and is fast enough not to block server readiness.

## Lessons Learned

- **Symptom depth:** When a "missing data" issue persists after the obvious fix, check one level deeper in the call stack. Two independent bugs (no push call + wrong navigation target) masked each other.
- **Navigation affordances:** Row click should match the page's primary action (detail or edit). Secondary actions (pencil, eye) should be visually distinct and supplementary. Segments violated this; pencil-only edit was too subtle.
- **Seed strategy:** When the canonical seed path is broken, opt for boot-hooks (idempotent, survives resets) over trying to fix the pipeline. Document the reason and schedule the root-cause fix as a separate tech-debt item.
- **Sidebar collapse UX:** Absolute positioning at the seam with hover-strip merge is smooth but fragile to layout changes. If you refactor the sidebar container, re-test the collapse trigger's visibility and hit-box.

## Next Steps

- [ ] Verify recent-tracking on board list-page click (creation fires; list-click coverage may have gap — `detail-page.tsx` push should cover most cases)
- [ ] Test segment detail sub-tabs (usage, SQL, data) — all should share same recent visit via `detail-layout.tsx`
- [ ] Schedule tech-debt fix for `seedDemoMetricPipelines` synthetic fallback (likely 3–4 hours; low priority unless you want `db:seed` to work end-to-end)
- [ ] Monitor boot-seed service for any transient DB connection failures during dev; if frequent, add exponential backoff retry

**Files modified (grep keys):**
- `apps/web/modules/feature-store/detail.tsx`
- `apps/web/modules/canvas/detail-page.tsx`
- `apps/web/modules/segments/detail-layout.tsx`, `library-row.tsx`
- `apps/web/modules/campaigns/monitoring.tsx`
- `apps/web/src/components/sidebar.tsx`, `sidebar-section.tsx`, `recent-items.tsx`, `collapse-trigger.tsx` (new)
- `apps/catalog-api/src/seed/seed-boards.ts` (new)
- `apps/catalog-api/src/services/boards-seeder.service.ts` (new)

---

## Unresolved

- **`seedDemoMetricPipelines` crash:** Missing Trino raw tables (`raw_cfm_etl_recharge`, others) cause the standard `pnpm db:seed` to fail before boards are seeded. Synthetic fallback in that pipeline has gaps. Root cause: incomplete fallback path design. Deferred to future tech-debt pass.
- **Board list-page recent tracking:** Board creation (new board flow) pushes a recent via `onBoardCreated`. Board list clicks haven't been instrumented yet (only detail-page push via `detail-page.tsx`). Partially covered; verify user testing doesn't reveal gaps.
