---
title: "Segment Detail View Redesign"
description: "Restructure /segments/:id from 7 redundant tabs to 5 LiveOps-PM-aligned tabs (Overview · Composition · Users · Predicate · Campaigns). Adds hero header with action bar, configurable Segment Size chart, vs-All-Users + Trend + Overlap tables, lifecycle/spend/country/device cards, sample-user CSV export, and read-mode-default Predicate tab with merged edit flow. Drops Monitoring tab (folds into Overview), drops Threshold tab (folds inline into Predicate), renames Canvas → Predicate."
status: completed
priority: P2
branch: "actioneer"
tags: [frontend, segments, redesign, post-demo]
blockedBy: [260510-1640-chat-artifact-connectivity]
blocks: []
predecessors: [260510-1640-chat-artifact-connectivity]
created: "2026-05-10T11:52:39.767Z"
createdBy: "ck:plan"
source: skill
brainstorm_ref: "plans/reports/brainstorm-260510-1847-segment-detail-redesign.md"
demo_target: "post-May-12"
estimate_days: 5.25
---

# Segment Detail View Redesign

## Overview

`/segments/:id` today has 7 tabs (Overview · Composition · Users · Campaigns · Monitoring · Threshold · Canvas) where 4 are stubs or redundant and the edit flow lives at a separate `/canvas` URL. This plan restructures the surface around a LiveOps PM workflow: 5 tabs ordered by mental model (health → who → real users → rules → who's targeting), a mockup-aligned hero header with action bar (Pin to board · SQL · Send campaign · Rebuild · ⋯), and a merged Predicate tab that combines static read view + interactive edit toggle.

**Key UX decisions (locked in brainstorm):**
- 5 tabs only: Overview · Composition · Users · Predicate · Campaigns
- Drop Monitoring tab (chart folds into Overview), drop Threshold tab (inline tool inside Predicate), rename Canvas → Predicate
- Predicate is read-mode default + visible `[Edit]` button + `e` shortcut + `?edit=1` deeplink
- Header: hero name + count + status pills + action bar (matches Image 7 mockup + ⟲ Rebuild)
- Overview answers "is it healthy" via Segment Size chart (configurable line/bar/area + date range) + vs-All-Users + Trend Over Time + Segment Overlap tables
- Composition answers "who" with 4 cards: Lifecycle / Spend tier / Country top 10 / Device split
- Users = 50-row sample table + CSV export
- Synthetic fixtures deterministic per segment id (mulberry32 seed) for stable demos

## Phases

| Phase | Name | Priority | Effort | Status |
|-------|------|----------|--------|--------|
| 1 | [Header + Tab Restructure](./phase-01-header-tab-restructure.md) | P0 | 0.75d | Completed |
| 2 | [Overview Tab](./phase-02-overview-tab.md) | P0 | 1d | Completed |
| 3 | [Composition Tab](./phase-03-composition-tab.md) | P0 | 0.75d | Completed |
| 4 | [Users Tab](./phase-04-users-tab.md) | P0 | 0.5d | Completed |
| 5 | [Predicate Tab + Edit Toggle](./phase-05-predicate-tab-edit-toggle.md) | P0 | 1.5d | Completed |
| 6 | [Campaigns Tab](./phase-06-campaigns-tab.md) | P1 | 0.25d | Completed |
| 7 | [Chat-Flow Integration + Canonical Creation Path](./phase-07-chat-flow-integration-verification.md) | P0 | 0.5d | Completed |

**Total: ~5.25d (with buffer 5.5–6d)** — Phase 5 rebudgeted from 0.75d after red-team flagged backend verification + segments-client.update wire-up + immutable-catalog state strategy as understated. Phase 7 added to verify every chat-side segment-creation entry point lands cleanly on the new detail surface and to canonicalize the "edit existing" path through the merged Predicate tab.

## Dependencies

- **Blocked by:** `260510-1640-chat-artifact-connectivity` (Phase 2 mounts `SourceThreadPill` on `detail-layout.tsx` — this plan also modifies `detail-layout.tsx`. Must land after May-12 plan to avoid merge conflict.)
- **Internal:** Phase 1 blocks Phases 2–6 (header + tab strip foundation). Phases 2–5 are parallel-friendly after Phase 1. Phase 6 is independent.

## Locked decisions (from brainstorm)

1. **Tab structure (5 tabs):** Overview · Composition · Users · Predicate · Campaigns. Drop Monitoring + Threshold + Canvas as top-level tabs.
2. **Predicate UX:** Read-mode default → visible `[✏ Edit]` button + `e` keyboard shortcut + `?edit=1` deeplink. Sticky Save/Discard ribbon during edit. Threshold tool inline per condition row via popover.
3. **Header action bar:** Pin to board · `</>` SQL · 📣 Send campaign · ⟲ Rebuild · ⋯ overflow (Duplicate, Archive, Export).
4. **Overview chart:** Configurable date range (7d / 30d / 90d / Custom) + chart type (Line / Bar / Area) + Data dropdown (Users / DAU / WAU). Default Area (matches mockup).
5. **Composition cards:** All 4 — Lifecycle stage (existing data), Spend tier (existing data), Country top 10 (NEW fixture), Device platform (NEW fixture).
6. **Users tab:** 50-row paginated sample + CSV export. No row drill-in.
7. **Route redirects:** `/canvas` → `/predicate`, `/monitoring` → `/`, `/threshold` → `/predicate`. Keep `/handoff`. `/segments/new` standalone unchanged.
8. **Synth fixtures deterministic per segment id** via `mulberry32(seedFromId)` so screenshots are stable.

## Files (~14 new, 3 modify, 1 delete)

**Create:**
- `apps/web/src/modules/segments/overview.tsx`
- `apps/web/src/modules/segments/composition.tsx`
- `apps/web/src/modules/segments/users.tsx`
- `apps/web/src/modules/segments/predicate.tsx`
- `apps/web/src/modules/segments/campaigns-tab.tsx`
- `apps/web/src/modules/segments/_components/detail-header.tsx`
- `apps/web/src/modules/segments/_components/segment-size-chart.tsx`
- `apps/web/src/modules/segments/_components/vs-all-users-table.tsx`
- `apps/web/src/modules/segments/_components/trend-over-time-table.tsx`
- `apps/web/src/modules/segments/_components/segment-overlap-table.tsx`
- `apps/web/src/modules/segments/_components/composition-cards/{lifecycle,spend-tier,country,device}-card.tsx`
- `apps/web/src/modules/segments/_components/users-table.tsx`
- `apps/web/src/modules/segments/_components/predicate-read-view.tsx`
- `apps/web/src/modules/segments/_utils/csv-export.ts`
- `apps/web/src/modules/segments/_utils/synth-segment-detail-data.ts`

**Modify:**
- `apps/web/src/modules/segments/_components/detail-tabs.tsx` (5 tabs)
- `apps/web/src/modules/segments/_components/detail-layout.tsx` (mount header above tabs)
- `apps/web/src/routes.tsx` (new routes + 3 redirects)

**Delete:**
- `apps/web/src/modules/segments/monitoring.tsx` (content lifted into Overview)

## Constraints

- Each tab page ≤200 LoC; helpers ≤200 LoC; total ~1500 LoC across ~14 files.
- Reverse-chat pill (Phase 2 of May-12 plan) continues rendering on `detail-layout.tsx` — do not break.
- Action card flows preserved (`action-card-segment.tsx` still navigates to `/segments/${id}` base).
- `/segments/new` standalone creation route unchanged.
- All routes typecheck; `pnpm --filter @hermes/web typecheck` clean.

## Success Criteria

- [ ] `/segments/:id` shows 5 tabs in correct order (Overview · Composition · Users · Predicate · Campaigns).
- [ ] Header renders hero name + count + drift pill + reverse-chat pill + action bar with all 5 buttons.
- [ ] Overview renders Size-Over-Time chart + 3 tables; chart-type toggle and date-range chip both update render within 100ms.
- [ ] Composition renders all 4 cards with deterministic synth data per segment id.
- [ ] Users tab: 50-row sample renders; CSV export downloads.
- [ ] Predicate read-mode renders any seeded `PredicateAST`; `[Edit]` button + `e` shortcut + `?edit=1` all flip to edit mode; Save persists via `segments-client.update()`.
- [ ] Campaigns tab lists referencing campaigns or shows empty CTA.
- [ ] Legacy redirects work: `/canvas` → `/predicate`, `/monitoring` → `/`, `/threshold` → `/predicate`.
- [ ] No regression on chat action card → segment detail navigation.
- [ ] `pnpm typecheck` clean.

## Risks + mitigations

- **Predicate read-mode renderer is new:** ~80 LoC component walks AST and renders read-only group blocks; reuses feature-pill component from composer.
- **Action-card hardcoded `/canvas`:** verified existing `action-card-segment.tsx` navigates to `/segments/${id}` base — redirect is safety net.
- **Synth fixture realism:** `mulberry32(segmentId)` for deterministic-per-segment data; same screenshots reproduce.
- **Cross-plan conflict on `detail-layout.tsx`:** explicit `blockedBy` on May-12 plan ensures sequencing; integration step in Phase 1 keeps reverse-pill mount intact.
- **5 tabs vs mockup's 4:** Predicate is the cost of merging edit into detail. Acceptable.

## Red-team mitigations applied

Red-team review (`plans/reports/red-team-260510-1847-segment-detail-redesign.md`) flagged 8 issues. All mitigations folded into phase files:

1. **Phase 6 field name:** filter on `audienceRef` (verified contract field), NOT `segmentId` (which doesn't exist on `HermesCampaign`).
2. **Phase 5 backend verification:** added Step 0 (BLOCKING) — verify `PATCH /api/v1/segments/:id`, add `updateSegment` + `rebuildSegment` to `segments-client.ts`, decide override-map state strategy for static `allSegments`.
3. **Phase 1 redirect query string:** `<RedirectWithSearch>` wrapper preserves `?search` + `#hash` (vanilla `<Navigate>` does not).
4. **Phase 5 effort:** rebudgeted 0.75d → 1.5d.
5. **Phase 2 PRNG isolation:** every generator instantiates fresh `mulberry32` per call; never share module-level PRNG state.
6. **Phase 1 detail-layout integration:** mandatory `git diff` before edit + manual two-segment verification (with/without `sourceThreadId`).
7. **Phase 5 keyboard shortcut:** guard expanded to skip combobox/listbox/menu/dialog/textbox roles + modifier keys.
8. **Phase 1 Pin/SQL/Overflow descope:** ship as DISABLED with "Coming soon" tooltips — placeholder behavior would be worse than absent.
9. **Phase 2 + 6 demo-data labeling:** synthetic numerals get a small "Demo data" pill on cards; `lift` column shows "—" instead of synth values.

## Cook handoff

```
/ck:cook plans/260510-1847-segment-detail-redesign/plan.md --interactive
```
