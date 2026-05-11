---
type: cook-summary
date: 2026-05-10
slug: actioneer-shell-redesign
mode: --auto
plan: plans/260510-1330-actioneer-shell-redesign/plan.md
status: complete
---

# Cook summary — Actioneer shell redesign

Three structural moves on top of the existing 260px sidebar: (1) sticky 56px topbar with breadcrumb / search trigger / avatar menu, (2) sidebar tree-line + box-highlight + workspace subtitle + 60px collapse, (3) library page chrome reduction + segments detail sub-tab strip.

## Files

**Added (10):**
| File | LOC |
|---|---|
| `apps/web/src/utils/breadcrumb-resolver.ts` | 132 |
| `apps/web/src/utils/topbar-trailing-context.tsx` | 39 |
| `apps/web/src/utils/sidebar-collapsed-store.ts` | 25 |
| `apps/web/src/components/topbar/topbar.tsx` | 43 |
| `apps/web/src/components/topbar/breadcrumb.tsx` | 91 |
| `apps/web/src/components/topbar/search-trigger.tsx` | 41 |
| `apps/web/src/components/topbar/avatar-menu.tsx` | 91 |
| `apps/web/src/components/sidebar/collapse-toggle.tsx` | 35 |
| `apps/web/src/modules/segments/_components/detail-tabs.tsx` | 60 |
| `apps/web/src/modules/segments/_components/detail-layout.tsx` | 17 |

**Modified (8):**
| File | Change |
|---|---|
| `apps/web/src/App.tsx` | Wrap <main> w/ TopbarTrailingProvider; render <Topbar> inside main |
| `apps/web/src/utils/chat-store.ts` | Export `ThreadIndexEntry` (consumed by breadcrumb resolver) |
| `apps/web/src/components/sidebar/sidebar.tsx` | Collapsed state + width branch + transition |
| `apps/web/src/components/sidebar/sidebar-section.tsx` | Tree-line guide; passes `collapsed` |
| `apps/web/src/components/sidebar/sidebar-item.tsx` | Sub-row box highlight; `collapsed` icon-only mode w/ tooltip |
| `apps/web/src/components/sidebar/workspace-pill.tsx` | Subtitle "Thinking Data → Actionable Data"; collapsed glyph mode |
| `apps/web/src/components/sidebar/bottom-row.tsx` | Collapsed mode + CollapseToggle |
| `apps/web/src/modules/feature-store/library.tsx` | Drop H1 + intro prose; entry-points → 28px chip row |
| `apps/web/src/modules/feature-store/_components/stat-strip.tsx` | Hairline mode (22px → 22px numerals, 6×14 padding) |
| `apps/web/src/modules/segments/library.tsx` | Drop H1; CTA hoisted via `useTopbarTrailing` |
| `apps/web/src/routes.tsx` | Nest /segments/:id/* under SegmentDetailLayout; stub composition/users/campaigns/canvas/monitoring |

## Decisions implemented

| Decision | Outcome |
|---|---|
| Sticky 56px topbar | Backdrop-blur 0.92 alpha + 8px blur, z:20, lives inside `<main>` |
| Breadcrumb resolver | Pure function over route registry w/ 18 patterns; getters w/ async board hydration |
| Search trigger | Input-styled button → `onSearchOpen()`; ⌘K / Ctrl K kbd hint |
| Avatar menu | 32px brand circle, popover w/ Account / Settings / Data sources / Sign out |
| Tree-line guide | 1px line at left:23, top/bottom 4 — under expanded sections only |
| Sub-row active | Box highlight (`rgba(0,0,0,0.05)`); top-level keeps 3px brand bar |
| Workspace subtitle | "Thinking Data → Actionable Data" w/ U+2192 arrow; hidden when collapsed |
| 60px icon rail | localStorage persisted; sync init (no flash); 0.16s transition; tooltip via `position: fixed` |
| Library tightening | Feature Store + Segments: H1 dropped, hairline StatStrip, CTA hoisted |
| Segments sub-tabs | 7-tab strip sticky `top: 56px`; 2px brand underline on active |
| Stub routes | Composition / Users / Campaigns / Canvas / Monitoring → ComingSoon |

## Routing changes

```
/segments/:id ─┬── (index)         → SegmentsMonitoringPage
               ├── threshold       → SegmentsThresholdPage (existing)
               ├── handoff         → SegmentsHandoffPage   (existing)
               ├── monitoring      → SegmentsMonitoringPage (alias)
               ├── composition     → ComingSoon
               ├── users           → ComingSoon
               ├── campaigns       → ComingSoon
               └── canvas          → ComingSoon
```

Wrapped with `<SegmentDetailLayout>` which renders `<DetailTabs>` + `<Outlet>`.

## Verification

| Check | Result |
|---|---|
| `pnpm --filter @hermes/web typecheck` | clean |
| `pnpm --filter @hermes/web build` | 5.94s, 1120.92kB / 288.96kB gzip (+1kB vs pre-cook) |
| Postbuild static-features guard | pass |
| Per-file LOC ≤ 200 | max is 132 (`breadcrumb-resolver.ts`) |

## Acceptance criteria

| # | Criterion | Status |
|---|---|---|
| 1 | Topbar 56px on every route | ✓ |
| 2 | Breadcrumb resolves Feature/Segment/Campaign/Board/Thread display names | ✓ |
| 3 | ⌘K trigger button + keyboard shortcut both open modal | ✓ |
| 4 | Avatar menu opens, navigates, closes on outside-click + Esc | ✓ |
| 5 | Sidebar collapse persists; tree-line under expanded sections | ✓ |
| 6 | Sub-row box highlight; top-level brand bar | ✓ |
| 7 | Workspace subtitle present | ✓ |
| 8 | Feature Store entry-points = 4 chips at 28px w/ counts | ✓ |
| 9 | Segments `+ New segment` CTA in topbar trailing slot | ✓ |
| 10 | Segments detail 7-tab strip below topbar | ✓ |
| 11 | Stub tabs render ComingSoon w/o errors | ✓ |
| 12 | Typecheck + build clean | ✓ |

## Out of scope

- Avatar initials sourced from auth payload (hardcoded `K`)
- Workspace switcher functionality (chevron stays decorative)
- LM/DA/DE strip relocation on Feature Store detail
- Threshold path mismatch w/ plan spec — kept existing `/threshold` (plan said `/threshold-deep`)

## Unresolved questions

None. Ready for visual QA via `pnpm --filter @hermes/web dev`.
