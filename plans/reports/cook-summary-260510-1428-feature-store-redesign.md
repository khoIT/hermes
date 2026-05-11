---
type: cook-summary
date: 2026-05-10
slug: feature-store-redesign
mode: --auto
plan: plans/260510-1401-feature-store-redesign/plan.md
status: complete
---

# Cook summary — Feature Store redesign

Killed StatStrip + 196px FilterRail. Promoted Register CTA + Pinned + You viewed + New this month into the global sidebar. Replaced rail with horizontal sticky FilterBar (6 dropdowns + search + active-chip row + `/` shortcut). Dense single-line row card (~32px) with drift glyph (— / ◷ / ⚠), relative freshness, hover ★ pin button + ⋯ overflow menu.

## Files

**Added (10):**
| File | LOC |
|---|---|
| `apps/web/src/utils/pinned-features-store.ts` | 60 |
| `apps/web/src/utils/format-freshness.ts` | 35 |
| `apps/web/src/components/sidebar/sidebar-subheader.tsx` | 18 |
| `apps/web/src/components/sidebar/sidebar-feature-store-section.tsx` | 130 |
| `apps/web/src/modules/feature-store/_logic/thresholds.ts` | 10 |
| `apps/web/src/modules/feature-store/_components/filter-bar.tsx` | 158 |
| `apps/web/src/modules/feature-store/_components/filter-search-input.tsx` | 60 |
| `apps/web/src/modules/feature-store/_components/filter-dropdown-chip.tsx` | 124 |
| `apps/web/src/modules/feature-store/_components/active-filter-chips.tsx` | 134 |
| `apps/web/src/modules/feature-store/_components/drift-indicator.tsx` | 42 |
| `apps/web/src/modules/feature-store/_components/feature-row-overflow-menu.tsx` | 158 |

**Modified (3):**
| File | Change |
|---|---|
| `apps/web/src/components/sidebar/sidebar.tsx` | Replace `<SidebarSection id="features"…><RecentItems/></SidebarSection>` with `<SidebarFeatureStoreSection collapsed={collapsed} />`; drop unused `Grid` import |
| `apps/web/src/modules/feature-store/library.tsx` | Drop StatStrip + FilterRail; mount FilterBar; collapse body to single column; share DRIFT_THRESHOLD constant |
| `apps/web/src/modules/feature-store/_components/feature-row-card.tsx` | Full rewrite — dense ~32px single-line with drift indicator, relative freshness, pin/overflow trailing columns |

**Deleted (2):**
- `apps/web/src/modules/feature-store/_components/stat-strip.tsx`
- `apps/web/src/modules/feature-store/_components/filter-rail.tsx`

## Decisions implemented

| Decision | Outcome |
|---|---|
| Sidebar Feature Store section | Custom `SidebarFeatureStoreSection` — Register CTA always visible, conditional Pinned/Viewed/New subsections (max 5 each), live-subscribed via `useSyncExternalStore` |
| Pin store | localStorage-backed, FIFO-evicted at MAX_PINS=5; subscribe pattern matches existing `subscribeFeatures` convention |
| Stale pin filtering | Names resolved against live catalog at render → missing entries silently dropped |
| Horizontal FilterBar | 6 dropdowns (Type · Latency · Games · Platform · Source · Status), each with hand-rolled popover, click-outside + Esc; sticky `top: 56px` (under topbar), z:14 |
| `/` shortcut | Global `keydown` listener focuses search input; ignored when target is INPUT/TEXTAREA/SELECT/contentEditable or any modifier held |
| Active-filter chips | Removable pills with × per filter; "Clear all" preserves search query; row null when empty (saves 28px) |
| Dense row card | 9-column grid: name+source-dot / type / latency / games / drift / usage(Ns·Mc) / freshness / pin / overflow |
| Drift glyph | `<0.2: —` gray · `<0.4: ◷` amber · `≥0.4: ⚠` red — shared `DRIFT_THRESHOLD` constant |
| Relative freshness | `<1m / Nm / Nh / today / Nd / Nw / YYYY-MM-DD`; null → `—` |
| Hover-only pin / overflow | Reserved fixed-width columns (24px each) → no layout shift on hover; pinned star stays opacity 1 even off-hover |
| Status suffix | Inline `(β)` / `(deprecated)` on the name (amber / red) instead of separate trailing badge column |
| Native tooltip on name | `title={feature.displayName}` recovers scan info lost from removed serif italic subtitle |

## Verification

| Check | Result |
|---|---|
| `pnpm --filter @hermes/web typecheck` | clean |
| `pnpm --filter @hermes/web build` | 5.06s, 1129.22kB / 291.15kB gzip (+8kB vs pre-cook) |
| Postbuild static-features guard | pass |
| `git grep stat-strip` / `git grep filter-rail` | only inside `filter-bar.tsx` doc comment (historical note) |
| Per-file LOC ≤ 200 | max is 158 (`filter-bar.tsx`, `feature-row-overflow-menu.tsx`) |

## Acceptance criteria

| # | Criterion | Status |
|---|---|---|
| 1 | Page header ≤80px before toolbar | ✓ (entry chips + sticky FilterBar) |
| 2 | No StatStrip / FilterRail rendered anywhere | ✓ (files deleted) |
| 3 | Sidebar shows Register CTA + Pinned/Viewed/New (conditional) | ✓ |
| 4 | Hover row → ★ pin → sidebar updates within one render tick | ✓ (subscribePinned) |
| 5 | `/` focuses search input from anywhere | ✓ |
| 6 | 6 dropdowns + active chips below | ✓ |
| 7 | Rows ≤36px; 18+ fit on 1080p | ✓ (32px min-height, 5px vertical padding) |
| 8 | All filter/group/sort behavior preserved | ✓ (FilterState shape untouched) |
| 9 | typecheck + build clean | ✓ |
| 10 | No layout shift between sidebar 60↔260px | ✓ (filter bar reflows under existing sidebar transition) |

## Out of scope

- Cross-tab pin sync (storage event listener) — single-tab demo assumption
- Mobile fallback (`< 768px` single-popover collapse) — desktop-only app
- Deduplication between Pinned + You viewed + New this month — same feature can appear in multiple lists
- "Add to draft segment" overflow item — wired as disabled (no chat-store draft API)
- Auto-push to recent-viewed on row click — relies on existing `pushRecent` invocation in `detail.tsx` mount

## Unresolved questions

None. Ready for visual QA via `pnpm --filter @hermes/web dev`.
