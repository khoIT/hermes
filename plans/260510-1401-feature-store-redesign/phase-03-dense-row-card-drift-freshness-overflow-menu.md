---
phase: 3
title: "Dense row card + drift + freshness + overflow menu"
status: completed
priority: P1
effort: "0.5d"
dependencies: [1]
---

# Phase 3: Dense row card + drift + freshness + overflow menu

## Overview

Rewrite `FeatureRowCard` from ~48px multi-line table-row to ~32px single-line dense row. Drop the displayName italic subtitle, replace the synthesized sparkline with a real **drift indicator** (— / ◷ / ⚠), replace freshness % with relative time (`5m`, `2h`, `today`, `—`), add hover-only **overflow menu** with Pin (★) / View / Used by, plus a hover-only **pin button** that's redundant with the menu's pin item but offers one-click pinning.

Depends on Phase 1 (pin store API).

## Requirements

- **Functional:**
  - Row height ≤ 36px (today: ~48px). At least 18 rows visible on a 1080p viewport without scroll
  - Single line per row — no displayName subtitle
  - Drift indicator column (replaces sparkline): `—` (gray) when score < 0.2, `◷` (amber) when 0.2 ≤ score < 0.4, `⚠` (red) when ≥ 0.4
  - Freshness column shows relative time: `<5m` for very recent, `Nm` / `Nh` / `today` / `Nd` / `—` for null
  - Hover row reveals: ★ Pin button (toggles pin via Phase 1 API) + ⋯ overflow menu trigger
  - Overflow menu items: ★ Pin/Unpin · 👁 View detail · 🔗 Used by (segments + campaigns count) · ➕ Add to draft segment (only enabled if a draft segment exists in chat store)
  - Status (`beta` / `deprecated`) inlined as `(β)` / `(deprecated)` suffix on the name
  - Click row body still navigates to detail; pin button + overflow menu must `stopPropagation`
- **Non-functional:**
  - Hover state must not cause layout shift (reserve trailing space; don't conditionally insert nodes that re-measure the grid)
  - Pin button click round-trips through `togglePin()` → sidebar updates within one render tick (verify with manual test)
  - Tooltip on hover (native `title` attribute is acceptable) shows `displayName` to recover scan-readability lost from removed subtitle

## Architecture

```
apps/web/src/modules/feature-store/_components/feature-row-card.tsx (rewrite)
  Grid template (9 columns):
    minmax(0, 1fr)  72px   180px   140px   24px   72px   60px   24px   60px
    name+source     type   latency games   drift  used   fresh  pin    overflow

  Trailing two columns (pin ★, overflow ⋯) reserved as fixed widths so hover
  state doesn't reflow. Visibility toggled via opacity on hover.

apps/web/src/modules/feature-store/_components/drift-indicator.tsx
  <DriftIndicator score={number} />
    score < 0.2 → '—' gray T.n400
    0.2 ≤ score < 0.4 → '◷' amber T.amber500 (clock glyph)
    score ≥ 0.4 → '⚠' red T.red600

apps/web/src/utils/format-freshness.ts
  formatFreshness(iso: string | null | undefined): string
    null → '—'
    < 60s → '<1m'
    < 60m → 'Nm'
    < 24h → 'Nh'
    same calendar day → 'today'
    < 7d → 'Nd'
    else → 'Nw' (weeks) or absolute YYYY-MM-DD

apps/web/src/modules/feature-store/_components/feature-row-overflow-menu.tsx
  Anchored popover, items as small buttons:
    ★ Pin / Unpin (calls togglePin)
    👁 View detail (navigate)
    🔗 Used by (N seg · M cmp) — disabled if 0/0
    ➕ Add to draft segment — disabled when no draft
  Click outside closes; Esc closes
```

## Related Code Files

- **Create:**
  - `apps/web/src/modules/feature-store/_components/drift-indicator.tsx`
  - `apps/web/src/modules/feature-store/_components/feature-row-overflow-menu.tsx`
  - `apps/web/src/utils/format-freshness.ts`
- **Modify (full rewrite):**
  - `apps/web/src/modules/feature-store/_components/feature-row-card.tsx`
- **Reuse:**
  - `apps/web/src/utils/pinned-features-store.ts` (Phase 1)
  - `apps/web/src/components/latency-badge.tsx`, `games-chip-cluster.tsx`, `platform-propensity-chip.tsx` (existing)

## Implementation Steps

1. Build `format-freshness.ts`:
   - Pure function, no React. Pass current time as optional second arg for testability (default `new Date()`)
   - Cover the buckets in Architecture
   - Unit-test mentally with sample dates: `now - 30s` → `<1m`, `now - 5m` → `5m`, etc.
2. Build `drift-indicator.tsx`:
   - Props: `score: number`
   - 12px square inline-block, font-mono, color + glyph per threshold
   - `title` attribute: `"Drift score: 0.36 — watch"` etc. for hover detail
3. Build `feature-row-overflow-menu.tsx`:
   - Props: `feature`, `usage`, `isPinned`, `onTogglePin`, `onNavigate`
   - Trigger: `⋯` button (visible only on parent row hover)
   - Popover: anchored top-right of trigger (above row to avoid clipping by row's bottom-border)
   - 4 menu items as button rows; disabled state for 0/0 usage and missing draft segment
   - "Add to draft segment" can read draft from `chatStore` if available; if no chat module wired up yet, render disabled with tooltip "No draft in progress"
   - Esc + click-outside close
4. Rewrite `feature-row-card.tsx`:
   - Remove `BarSparkline` and `SourceDot` (move source dot into name cell prefix as small color dot, kept as visual)
   - Update `GRID_TEMPLATE` to new 9-column layout (see Architecture)
   - Reduce padding `11px 18px` → `5px 18px`; row min-height 32px
   - Replace name cell: single-line `mono name + source-dot prefix` + status suffix `(β)` / `(deprecated)` if non-active
   - Replace usage cell: `8s · 3c` (abbreviated)
   - Replace freshness cell: call `formatFreshness(feature.analytics.lastBackfillAt)`
   - Replace status/chevron column: `<span>` placeholder reserving width; on hover show `<OverflowMenuTrigger>`
   - Add pin column: `<PinButton>` with star icon; opacity 0 by default, opacity 1 on row hover or when pinned (always visible if pinned to show state)
   - Keep `onClick={() => navigate(...)}` on row root; ensure pin + overflow handlers `e.stopPropagation()`
   - Add native `title={feature.displayName}` on the name cell for tooltip-recovered scan info
   - On click row, also push to recent-viewed (existing pattern via `pushRecent('features', ...)` if not already in `detail.tsx` mount)
5. Verify pinning round-trip:
   - Hover row → ★ visible → click → row's star fills + sidebar PINNED section updates within one render
   - Click again to unpin → sidebar removes
6. Run `pnpm --filter @hermes/web typecheck` → must pass

## Success Criteria

- [ ] `feature-row-card.tsx` rewritten — new grid, no subtitle, drift + relative freshness + pin + overflow
- [ ] `drift-indicator.tsx`, `feature-row-overflow-menu.tsx`, `format-freshness.ts` created
- [ ] Row height observed at ~32px in Chrome DevTools (computed style)
- [ ] ≥ 18 rows fit on a 1080p viewport without scroll (manual smoke test)
- [ ] Pin button + overflow menu hover-revealed; row click still navigates
- [ ] Pinning a feature updates sidebar PINNED section instantly (no full reload)
- [ ] Native tooltip on name cell shows displayName
- [ ] `pnpm --filter @hermes/web typecheck` clean

## Risk Assessment

- **Risk:** Hover-revealed pin/overflow buttons cause layout shift if implemented via conditional render.
  - Mitigation: always render the cells (reserved width), toggle visibility via opacity 0 → 1 on row hover.
- **Risk:** Removing displayName subtitle hurts new-user scannability.
  - Mitigation: native `title` tooltip on name; documented as known trade-off in brainstorm §6.
- **Risk:** `feature.analytics.lastBackfillAt` not always populated for synth features.
  - Mitigation: `formatFreshness` returns `—` for null. Keep behavior.
- **Risk:** Drift threshold mismatch with existing entry-point chip (`drift detected` count).
  - Mitigation: constant `DRIFT_THRESHOLD = 0.4` shared between drift-indicator and library.tsx entry-point computation. Refactor to import in Phase 4.
- **Risk:** Click event propagation on pin/overflow accidentally navigates row.
  - Mitigation: explicit `e.stopPropagation()` on both trigger buttons + the popover root.
- **Risk:** Overflow menu's "Add to draft segment" depends on chat store which may not exist yet (was in completed plan 260510-0151 Phase 4).
  - Mitigation: dynamic import / safe optional chain — render item disabled if chat store import fails. Don't block this phase on chat-store wiring.
