---
title: Feature Store redesign — sidebar-merged actions + dense rows
date: 2026-05-10
type: brainstorm
related:
  - plans/reports/brainstorm-260510-0151-chat-first-sidebar-ia.md (sidebar IA established Phase 1)
  - apps/web/src/modules/feature-store/library.tsx (current page)
  - apps/web/src/components/sidebar/sidebar.tsx (global sidebar — Feature Store section host)
status: agreed
demo_target: 2026-05-12
---

# Feature Store Redesign — Sidebar-merged actions + dense rows

## 1. Problem

Feature Store library page today carries three competing surfaces:

1. **StatStrip** at top — 7 KPI pills (total / platform / realtime / warm / cold / added / drift). Scans nicely once, then becomes 80px of vertical noise on every visit.
2. **EntryPoint chip strip** below — 4 actions with badges (Browse / Register / Recent / Drift). Already does most of what the StatStrip does, in fewer pixels.
3. **Page-level FilterRail** (196px left column) — search + 6 filter chip groups. Filter-only; never invites action.

Meanwhile the global sidebar's Feature Store section just lists `RecentItems`, with no register affordance. So user lands on the page, scans 7 pills they ignore, then jumps to a 196px column that can't register or pin or surface anything they care about right now.

**LiveOps reality**: a power user comes here to register a new feature, jump back to one they were editing yesterday, or sanity-check drift. Rarely to read 7 KPI pills. The page should reward that user, not interrupt them.

## 2. Decisions Locked

| Question | Decision |
|---|---|
| Which left rail to redesign? | **Both — merge.** Kill page rail entirely; promote actions + recents into global sidebar Feature Store section. |
| Primary user job? | **Action AND discovery, equal weight.** Both must be one-glance. |
| KPI strip fate? | **Kill entirely.** Counts already live as badges on entry-point chips. |
| Recents source? | **Two stacked lists**: "You viewed" (per-user, localStorage) + "New this month" (catalog-derived). |
| Filter UX after rail death? | **Inline horizontal dropdown bar** above toolbar. 6 dropdowns; active selections render as removable chips below. |
| Pin to top? | **Yes, sidebar-resident.** New "Pinned" section above "You viewed". Max 5. |
| Row card change? | **Full redesign — single-line dense rows.** Drop displayName subtitle, tighten padding, ~3× more rows on screen. |

## 3. Final Layout

```
┌─ Global Sidebar (260px) ──────────┐  ┌─ Main canvas (no left rail) ─────────────────────────────┐
│ + New chat                         │  │ Feature Store                                              │
│ All Chats ▾                        │  │ ─── Entry-point chip strip ───────────────────────────────│
│ ─────                              │  │ Browse · + Register · Recently added (12) · Drift (3)    │
│ Feature Store ▾                    │  │                                                            │
│   ⊕ Register feature      ⟶ /new   │  │ ─── Search + horizontal filter bar ───────────────────────│
│                                    │  │ 🔍 Search by name, owner, domain…                         │
│   PINNED         ★                 │  │ Type ▾  Latency ▾  Games ▾  Platform ▾  Source ▾  Status ▾│
│   • cpi_7d_v2                      │  │ [Realtime ×] [CFM ×] [Active ×]   Clear all               │
│   • ltv_per_cohort                 │  │                                                            │
│   • churn_score_v3                 │  │ ─── Toolbar ───────────────────────────────────────────────│
│                                    │  │ Group by: Domain ▾   Sort: Default ▾   73 features        │
│   YOU VIEWED                       │  │                                                            │
│   • d7_retention_per_cohort        │  │ ─── Grouped feature rows (dense) ─────────────────────────│
│   • install_to_first_purchase_h    │  │ Acquisition (12) ▾                                         │
│   • session_streak_7d              │  │ ┌──────────────────────────────────────────────────────┐  │
│   • whale_signal_v2                │  │ │ ● cpi_7d_v2          Score  Realtime  CFM PT  —  8s/3c  2h     │
│   • organic_dau_share              │  │ │ ○ install_to_d7      Bool   Realtime  ALL     —  3s/0c  5m     │
│                                    │  │ │ ○ ltv_per_cohort     Score  Batch     CFM     ⚠  12s/2c today  │
│   NEW THIS MONTH                   │  │ │ ○ churn_score_v3 (β) Score  Batch     NTH     —  0s/0c  —      │
│   • churn_score_v3                 │  │ └──────────────────────────────────────────────────────┘  │
│   • d1_login_streak                │  │                                                            │
│   • whale_signal_v2                │  │ Engagement (18) ▾                                          │
│   • organic_dau_share              │  │ …                                                          │
│   • live_event_rsvp                │  │                                                            │
│ ─────                              │  │                                                            │
│ Boards · Playbooks · …             │  │                                                            │
└────────────────────────────────────┘  └────────────────────────────────────────────────────────────┘
```

## 4. Component Specs

### 4.1 Global sidebar — Feature Store section (modified)

File: `apps/web/src/components/sidebar/sidebar.tsx` + `recent-items.tsx` enhancements + new `sidebar-feature-store-section.tsx`

Section becomes a custom layout (not generic `RecentItems`). Order top-to-bottom:

1. **Section header** — "Feature Store" + chevron (existing). Click navigates to `/feature-store`.
2. **+ Register feature** — primary CTA row, indented one level, persistent. Click navigates `/feature-store/new`. Icon: `Plus`.
3. **PINNED** subheader (only if pins > 0). Render up to 5 pinned features as `SidebarItem indent`. Empty state: section hidden.
4. **YOU VIEWED** subheader. Render up to 5 from `getRecent('features')`. Empty state: hide subheader entirely (don't show "No recent items"); user hasn't done work yet.
5. **NEW THIS MONTH** subheader. Render up to 5 features filtered by `addedAt within current month`, sorted desc by `addedAt`. Read directly from feature catalog — no separate localStorage. Empty state: hide.

Pinned/Viewed/New each get tiny mono uppercase 9.5px subheader (matches existing FilterRail section style).

**Pinning implementation:**
- localStorage key `hermes.feature-store.pinned` → `string[]` of feature names (max 5, FIFO eviction)
- New util `apps/web/src/utils/pinned-features-store.ts` exporting `getPinned`, `togglePin`, `subscribePinned`
- Sidebar subscribes via `React.useSyncExternalStore` (same pattern as features catalog)
- Pin button on row card hover (see §4.4)

### 4.2 Page header — kill StatStrip + reposition entry-point chips

File: `apps/web/src/modules/feature-store/library.tsx`

Delete `<StatStrip />` import + render. Header collapses to:

```jsx
<div className="page-header">
  {/* Entry-point chips (existing, unchanged behavior) */}
  <EntryPointChipStrip ... />
</div>
```

EntryPoint chips keep their badges (`Drift (3)`, `Recently added (12)`, etc.) — they already carry the at-a-glance counts that StatStrip was redundantly displaying.

`stat-strip.tsx` file → delete (not imported elsewhere; verified via grep).

### 4.3 Search + horizontal filter bar (new component)

File: `apps/web/src/modules/feature-store/_components/filter-bar.tsx` (new)
Replaces: `filter-rail.tsx` (delete after migration).

Layout:
```
[🔍 wide search input ...........................................]
[Type ▾] [Latency ▾] [Games ▾] [Platform ▾] [Source ▾] [Status ▾]
[Active chips (only when filters set)]   [Clear all]
```

Each `▾` is a small `<DropdownChip>` button that opens an anchored popover containing the same chip group from today's FilterRail. Reuse the existing `Chip` component for items inside the popover.

Active filters render as a row of removable chips below the dropdown row: `[Realtime ×] [CFM ×] [Active ×] Clear all`. Clicking × removes that filter; clicking dropdown re-opens to add more.

When all filters empty: don't render the active-chips row at all (saves 28px).

State source unchanged: `FilterState` from `_logic/filter.ts`. No backend changes. Sticky positioning at top of canvas while scrolling (z-index just below the sidebar).

### 4.4 Dense feature row (full redesign)

File: `apps/web/src/modules/feature-store/_components/feature-row-card.tsx` (modified)

**Today's row** (≈48px tall): 8 grid columns including `displayName` italic subtitle, sparkline, usage, freshness %, status. Padded to feel airy.

**New row** (≈32px tall): 9 grid columns, single line, no subtitle.

```
status-dot │ name                       │ type    │ latency  │ games   │ drift │ used-by  │ freshness │ overflow
●          │ cpi_7d_v2                  │ Score   │ Realtime │ CFM PT  │ —     │ 8s · 3c  │ 2h        │ ⋯
○          │ install_to_d7_streak       │ Bool    │ Realtime │ ALL     │ —     │ 3s · 0c  │ 5m        │ ⋯
○          │ ltv_per_cohort             │ Score   │ Batch    │ CFM     │ ⚠     │ 12s · 2c │ today     │ ⋯
○          │ churn_score_v3 (β)         │ Score   │ Batch    │ NTH     │ —     │ 0s · 0c  │ —         │ ⋯
```

Column changes vs today:

| # | Today | New | Why |
|---|-------|-----|-----|
| 1 | source dot + name + italic displayName | source dot + name only (status as `(β)` suffix when non-active) | displayName rarely scanned; recover line height |
| 2 | type chip | type chip (smaller padding `2px 6px`, font 9.5px) | tighten |
| 3 | latency badge | latency badge | unchanged |
| 4 | games cluster + platform chip | games cluster + platform chip | unchanged |
| 5 | bar sparkline (synthesized) | **drift indicator** (— ◷ ⚠) | sparkline is fake data; drift is real LiveOps signal |
| 6 | usage counts (`8 seg · 3 cmp`) | usage counts (`8s · 3c`) | abbreviate |
| 7 | freshness % | **relative freshness** (`2h`, `today`, `5m`, `—`) | game data analytics expects time-since, not SLA % |
| 8 | status badge or chevron | overflow `⋯` (only on hover); no chevron | chevron is visual noise on every row |
| 9 | — | hover-only Pin button (★) | new pinning affordance |

Padding: `5px 18px` (down from 11px). Border-bottom thinner (`#f4f4f4`). Hover background unchanged.

**Drift indicator logic** (replaces sparkline column):
- `analytics.driftScore < 0.2` → `—` (gray)
- `0.2 ≤ score < 0.4` → `◷` (amber clock — watch)
- `score ≥ 0.4` → `⚠` (red — drifted)

**Relative freshness** util (new): `apps/web/src/utils/format-freshness.ts`
- Read `analytics.lastBackfillAt` or equivalent
- Format: `<5m` / `Nm` / `Nh` / `today` / `Nd` / `—` if null

**Hover overflow menu** (new component): `feature-row-overflow-menu.tsx`
- Items: ★ Pin / unpin · 👁 View detail · 🔗 Used by (segments+campaigns) · ➕ Add to draft segment (if one exists)
- Anchored popover, click anywhere else dismisses

### 4.5 Toolbar (minor)

`Group by: Domain ▾   Sort: Default ▾   73 features` — unchanged structurally. Reduce vertical margin from 16 → 10.

## 5. File Inventory

**New:**
- `apps/web/src/components/sidebar/sidebar-feature-store-section.tsx` — custom Feature Store sidebar layout (Register CTA + Pinned + Viewed + New)
- `apps/web/src/utils/pinned-features-store.ts` — pin store (localStorage + subscribe pattern)
- `apps/web/src/utils/format-freshness.ts` — relative time formatter
- `apps/web/src/modules/feature-store/_components/filter-bar.tsx` — horizontal dropdown filter bar
- `apps/web/src/modules/feature-store/_components/filter-dropdown-chip.tsx` — single dropdown trigger + popover wrapper
- `apps/web/src/modules/feature-store/_components/active-filter-chips.tsx` — removable active chips row
- `apps/web/src/modules/feature-store/_components/feature-row-overflow-menu.tsx` — hover ⋯ menu
- `apps/web/src/modules/feature-store/_components/drift-indicator.tsx` — — / ◷ / ⚠ glyph

**Modified:**
- `apps/web/src/modules/feature-store/library.tsx` — delete StatStrip render, delete FilterRail layout, swap in FilterBar at top, narrow padding
- `apps/web/src/components/sidebar/sidebar.tsx` — replace `RecentItems` Feature Store section with `<SidebarFeatureStoreSection />`
- `apps/web/src/modules/feature-store/_components/feature-row-card.tsx` — full row redesign per §4.4

**Deleted:**
- `apps/web/src/modules/feature-store/_components/stat-strip.tsx` — KPI strip
- `apps/web/src/modules/feature-store/_components/filter-rail.tsx` — page-level rail (logic preserved in filter-bar)

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Sidebar Feature Store section grows tall** (5 pinned + 5 viewed + 5 new = 15 rows + 3 subheaders + Register CTA = ~17 rows). Pushes Boards/Playbooks/etc. below the fold. | (a) Cap each list at 5; show `See all… (N)` link only when needed. (b) Each subheader collapsible (chevron) with state in localStorage. (c) When user collapses Feature Store section header itself, all subsections hide as today. |
| **Inline filter dropdowns overflow on narrow viewports** (~6 dropdowns × 90px each ≈ 540px min). | Below 768px, switch to single "Filters (N)" popover button (the option we considered but didn't pick for desktop). Implement at component level — desktop = inline, mobile = popover. May 12 demo is desktop-only, so mobile fallback can be Phase 2. |
| **Removing displayName subtitle reduces scan-readability for unfamiliar feature names**. | Mitigation: hover row reveals tooltip with displayName + description first sentence. Power users learn names; newcomers hover. |
| **Drift indicator replaces sparkline — losing the only visual differentiator.** | Drift indicator IS more LiveOps-relevant than synthesized sparkline. If users miss the visual, restore sparkline as a 32×12 inline glyph in column 5 with drift dot color-coded on top. Keep this in back pocket. |
| **Pin storage growth + stale references** (user pins feature, feature gets renamed/deleted). | On every render, filter pinned IDs against current catalog. Drop stale silently. No UX for "this pin is gone" — too noisy. |
| **localStorage shared across user roles** (CFM PM, NTH PM, etc.). Switching role doesn't clear pins. | Acceptable for May-12 demo (single-user). Post-demo: namespace key by `currentRole`. |
| **Existing module imports of StatStrip / FilterRail** | `git grep stat-strip filter-rail` shows usage only in `library.tsx`. Safe delete after migration. |
| **Empty state when no features loaded** | `<FeaturesUnavailable />` already handles this earlier in render — unchanged. |

## 7. Success Criteria

- [ ] Feature Store page top renders ≤ 80px vertical (entry-point chips + filter bar) before the toolbar
- [ ] No `<StatStrip />` or `<FilterRail />` rendered anywhere
- [ ] Global sidebar Feature Store section shows: Register CTA + Pinned (when set) + You viewed (when any) + New this month (when any)
- [ ] Hover any row → ★ pin button visible; click toggles pin → sidebar updates within one render tick
- [ ] Search input is keyboard-focusable from anywhere via `/`
- [ ] Inline filter dropdowns render 6 categories; active filters appear as removable chips below
- [ ] Feature rows are ≤ 36px tall (down from ~48); ≥ 18 rows fit on a 1080p viewport without scroll
- [ ] All existing filter/group/sort/navigation behavior unchanged — no functional regressions
- [ ] `pnpm typecheck && pnpm --filter @hermes/web build` clean
- [ ] No layout shift between sidebar collapsed (60px) and expanded (260px) states

## 8. Out of Scope (Explicitly)

- Backend changes — none required. All state is client-side (existing FilterState + new localStorage pin store).
- Detail page (`detail.tsx`) — untouched.
- Register page (`register.tsx`) — untouched (just gets a new entry point in sidebar).
- Mobile responsive design — desktop-only for May 12.
- Pin sync across devices / multi-user — local-only.
- Saved filter views — could be a future addition (Datadog-style "Saved Searches"); not now.

## 9. Effort Estimate

~1.5 dev-days end-to-end:
- Sidebar Feature Store section + pin store: 0.4d
- FilterBar + dropdown chip + active chips: 0.4d
- Row redesign + drift indicator + overflow menu + freshness util: 0.5d
- Library page integration + StatStrip/FilterRail deletion: 0.1d
- Polish + smoke test: 0.1d

## 10. Open Questions

- Should pinning persist across game-tenant switches (CFM PM → NTH PM), or be role-scoped? Decided: shared for May 12, namespace later.
- Should "New this month" use `addedAt` or a separate "new feature flag" the catalog could carry? Decided: `addedAt` calendar-month math; no schema change.
- Drift threshold for ⚠ (currently `≥ 0.4`) — keep aligned with existing entry-point chip count? Yes — same constant.
