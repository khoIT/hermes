---
phase: 1
title: "Header + Tab Restructure"
status: completed
priority: P0
effort: "0.75d"
dependencies: []
---

# Phase 1: Header + Tab Restructure

## Overview

Replaces the 7-tab strip with 5 tabs (Overview · Composition · Users · Predicate · Campaigns) and mounts a new hero header above tabs containing the segment name, count, status pills, drift indicator, reverse-chat pill, and the right-side action bar (Pin to board · SQL · Send campaign · ⟲ Rebuild · ⋯). Foundation for Phases 2–6.

## Requirements

**Functional:**
- `DetailTabs` shows exactly 5 tabs in order: Overview · Composition · Users · Predicate · Campaigns.
- `SegmentDetailHeader` renders above tabs with: breadcrumb row · hero name · description · count + last-build status · drift pill · `SourceThreadPill` (existing) · action bar.
- Action bar buttons: 📌 Pin to board · `</> SQL` · 📣 Send campaign · ⟲ Rebuild · ⋯ overflow (Duplicate, Archive, Export).
- **Pin to board and SQL ship as DISABLED buttons** with tooltip "Coming soon" — placeholder pin payloads + JSON-stringified-AST modal are worse than nothing on a demo machine. Visual slot preserved; functionality deferred to a later polish phase.
- Send campaign → `navigate('/campaigns/new/realtime?seedSegmentId={id}')`.
- Rebuild → toast "Rebuild scheduled" (real `rebuildSegment()` wiring lands in Phase 5 alongside `updateSegment()`).
- Overflow Duplicate/Archive/Export ship disabled with tooltip too — same rationale.
- Route redirects: `/canvas` → `/predicate`, `/monitoring` → `/` (overview), `/threshold` → `/predicate`. Keep `/handoff`.

**Non-functional:**
- Header ≤180 LoC, action bar split into a sub-component if it grows.
- Tab strip remains sticky (existing behavior preserved).
- Reverse-chat pill (`SourceThreadPill`) from May-12 Phase 2 continues to render — do not regress.

## Architecture

```
SegmentDetailLayout (modify)
  ├─ <SegmentDetailHeader segment={seg}/>     <-- NEW
  │    ├─ breadcrumb (Segments / {name})
  │    ├─ hero (name, description)
  │    ├─ status row (count · last build · drift pill · SourceThreadPill)
  │    └─ <ActionBar segmentId={id}/>          <-- inline
  ├─ <DetailTabs segmentId={id}/>              (modify: 5 tabs)
  ├─ <Outlet/>
  └─ <ContinueInChatPill threadId={…}/>        (existing)
```

Action bar handlers:
- Pin to board → opens existing `<PinToBoardPopover>` with placeholder widget
- SQL → opens read-only modal showing the predicate as SQL (synth via `predicate-to-sql.ts` helper if exists, else compact textual rendering)
- Send campaign → `navigate(/campaigns/new/realtime?seedSegmentId={id})`
- Rebuild → call `segments-client.rebuild(id)` if exported, else toast "Rebuild scheduled"
- Overflow: Duplicate (POST clone via segments-client), Archive (PATCH status=archived), Export (CSV via Phase 4's `csv-export.ts` once available — stub OK for Phase 1)

## Related Code Files

**Create:**
- `apps/web/src/modules/segments/_components/detail-header.tsx`

**Modify:**
- `apps/web/src/modules/segments/_components/detail-tabs.tsx` (replace 7 tabs with 5)
- `apps/web/src/modules/segments/_components/detail-layout.tsx` (mount detail-header; remove top-padding pill wrapper since header includes it)
- `apps/web/src/routes.tsx` (add `/predicate` route stub, redirect `/canvas`, `/monitoring`, `/threshold`)

**Delete:** none in this phase.

## Implementation Steps

1. **Tab strip update** (10 min)
   - Edit `detail-tabs.tsx`: replace `SEGMENT_TABS` with 5 entries — Overview (`''`, end), Composition, Users, Predicate, Campaigns. Remove Monitoring, Threshold, Canvas.
   - Verify NavLink active states still work for the new `/predicate` route.

2. **Detail header component** (3h)
   - File: `detail-header.tsx` (~150 LoC).
   - Props: `segment: HermesSegment`.
   - Layout: 3 stacked rows + right-aligned action bar.
     - Row 1: breadcrumb `Segments / {name}` (small caps + accent name)
     - Row 2: hero name (display font, 32px) + small description below (sans, T.n600)
     - Row 3: count + status flex row — `{count.toLocaleString()} users` (large numeral) · separator · `Last build {ts}` or `Not synced yet` · drift pill (T.amberSoft) if `seg.drift` · `SourceThreadPill` (mount existing component if `seg.sourceThreadId`)
     - Right side: `ActionBar` (inline definition or sub-component below 200 LoC threshold)
   - Action bar: 5 buttons + overflow menu (lucide-react MoreHorizontal).
   - Style: surface card on light hairline; sticky header NOT yet (test scroll behavior; sticky may stay on tab strip only).

3. **Detail layout integration** (30 min)
   - **Pre-edit verification:** `git status` and `git diff HEAD~5 detail-layout.tsx` to inspect the post-May-12 state. The blocking May-12 plan's Phase 2 mounts `SourceThreadPill` here; only delete the inline block that *currently* exists post-merge. Do not delete anything else.
   - Edit `detail-layout.tsx`: above `<DetailTabs>`, mount `<SegmentDetailHeader segment={seg}/>` when `seg` resolved.
   - Remove the inline `padding: '6px 24px 0'` `SourceThreadPill` block — header now owns this single mount point.
   - Ensure `ContinueInChatPill` still mounts at end (unchanged).
   - **Manual verification (mandatory):** load both a segment WITH `sourceThreadId` and one WITHOUT. Both must render correctly with **exactly one** `SourceThreadPill` (or zero, in the without case). No double-render.

4. **Route updates** (20 min)
   - Edit `routes.tsx`:
     - Add `<Route path="predicate" element={<ComingSoon title="Predicate" body="Read+edit view of the segment predicate. Implemented in Phase 5." />} />` as Phase 1 stub.
     - Add redirects via small wrapper component that **preserves query string + hash** (React Router v6 `<Navigate>` does NOT preserve `?search` automatically):
       ```tsx
       function RedirectWithSearch({ to }: { to: string }) {
         const { search, hash } = useLocation();
         return <Navigate to={`${to}${search}${hash}`} replace />;
       }
       ```
       Then: `<Route path="canvas" element={<RedirectWithSearch to="../predicate" />} />`, same for `monitoring` → `..`, and `threshold` → `../predicate`. This keeps deep links like `/segments/{id}/canvas?focus=row3` working.
     - Remove the existing nested `composition`, `users`, `campaigns` ComingSoon stubs only if Phase 2/3/4/6 will replace them — for Phase 1, leave the stubs in place; later phases swap them.
   - Verify `/segments/new` and standalone canvas page (`SegmentsCanvasPage` mounted at `/segments/new`) untouched.

5. **Action bar wiring (Phase-1 acceptable scope)** (30 min)
   - Pin to board: **DISABLED** with tooltip "Coming soon".
   - SQL: **DISABLED** with tooltip "Coming soon".
   - Send campaign: `navigate('/campaigns/new/realtime?seedSegmentId=' + id)`.
   - Rebuild: toast "Rebuild scheduled" — real `rebuildSegment()` wires up in Phase 5.
   - Overflow Duplicate/Archive/Export: **DISABLED** with tooltip "Coming soon".

6. **Verification:**
   - `pnpm --filter @hermes/web typecheck` clean.
   - Manual: load `/segments/seg-cfm-loss-streak-non-paying-2026-0508-a3f9` → header + 5 tabs render → click each tab → Predicate shows ComingSoon stub.
   - Bookmarked legacy URL `/segments/{id}/canvas` redirects to `/segments/{id}/predicate`.
   - Reverse-chat pill (May-12 Phase 2) still renders for segments with `sourceThreadId`.

## Success Criteria

- [ ] Tab strip shows exactly 5 tabs in correct order.
- [ ] Header renders hero + status row + action bar with all 5 buttons.
- [ ] Drift pill appears when `seg.drift === true`.
- [ ] `SourceThreadPill` continues to render (no regression).
- [ ] Three legacy routes redirect cleanly.
- [ ] `/predicate` stub renders without crash.
- [ ] Send campaign button navigates to seeded campaign route.
- [ ] `pnpm typecheck` clean.

## Risk Assessment

- **Risk:** Removing inline `SourceThreadPill` from `detail-layout.tsx` accidentally drops it for action-card-created segments without a sourceThreadId.
  - **Mitigation:** Keep guard `seg.sourceThreadId && <SourceThreadPill .../>` inside header — same conditional as before.
- **Risk:** Action bar pushes layout below 1280px viewport.
  - **Mitigation:** Use `flex-wrap: wrap` on header; overflow menu condenses 3 secondary actions; primary 2 actions always visible.
- **Risk:** May-12 plan's Phase 2 hasn't merged when this phase starts.
  - **Mitigation:** Plan is `blockedBy: [260510-1640-chat-artifact-connectivity]` — Cook will refuse to start Phase 1 until the dependency completes.
- **Risk:** Pin-to-board popover requires a primary widget but header has none.
  - **Mitigation:** Phase 1 ships with a placeholder "Saved segment" card data; widget pre-selection refined in a later polish pass.
