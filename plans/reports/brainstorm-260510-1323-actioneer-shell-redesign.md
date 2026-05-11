# Brainstorm — Actioneer Shell Redesign for Hermes

**Date:** 2026-05-10
**Branch:** `actioneer`
**Reference:** `C:\Users\CPU12830-local\Downloads\actioneer\` (PRDs + screenshots — Actioneer demo on Presto workspace)
**Scope:** App shell (sidebar + topbar) + tighten Feature Store / Segments library pages
**Out of scope:** Detail-page redesigns (LM/DA/DE tabs, Threshold playground, Analyst panels, Engineer panels — all kept intact)

---

## Problem Statement

Current Hermes shell has the right IA bones (260px sticky sidebar, 9 module sections, expandable child rows, ⌘K modal) but lacks three structural moves Actioneer uses to feel seamless:

1. **No fixed top bar** — context (breadcrumb) and search are not surfaced; ⌘K only reachable via keyboard.
2. **No collapsed sidebar** — content area is always 260px short, no escape valve for dense pages.
3. **No tree-line connector** under expanded sections — child rows feel orphaned vs. their parent.

Library pages (`/feature-store`, `/segments`) duplicate context that the new breadcrumb owns and are heavier in vertical chrome than they need to be.

---

## Approved Decisions (from clarifying round)

| # | Decision | Choice |
|---|---|---|
| 1 | Visual fidelity | **Actioneer skeleton + Hermes polish** — adopt structural moves (topbar, tree-line, collapse, breadcrumb), keep Hermes colors / Tiempos display / 3px brand-bar active state on top-level. |
| 2 | Topbar search | **Open existing ⌘K modal on click** — single search source-of-truth. |
| 3 | Collapse mode | **60px icon-only rail** — labels hidden, no children, hover tooltips, persisted state. |
| 4 | Page redesign depth | **Shell-wrap + tighten library list pages** — detail pages untouched. |
| 5 | Collapsed default | Expanded. |
| 6 | Topbar avatar | Full menu (Settings, Account, Sign out). |
| 7 | Detail breadcrumb | Domain Group included → `Feature Store / Numeric / account_age_days`. |
| 8 | Segments sub-tabs | Keep today's separate routes (`/segments/:id/monitoring`, `/canvas`, `/threshold-deep`, `/handoff-modal`); add a sub-tab strip that links to those routes. |
| 9 | Brand subtitle | Add tagline under HERMES wordmark — `Thinking Data → Actionable Data`. |

---

## Move 1 — Shell Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Sidebar (260px)         │  Topbar (56px, sticky top:0, blur backdrop)  │
│  fixed, sticky, scroll-y │  breadcrumb ─── search (⌘K) ─── avatar      │
│                          ├──────────────────────────────────────────────┤
│  WorkspacePill           │                                              │
│  (HERMES                 │  Page content (scrolls under topbar)         │
│   Thinking → Actionable) │                                              │
│  ─────────────────       │                                              │
│  + New chat              │                                              │
│  ⏱ All Chats        ▾    │                                              │
│  │  recent threads…      │                                              │
│  ▦ Feature Store    ▾    │                                              │
│  ▤ Boards           ▾    │                                              │
│  …                       │                                              │
│  ─────────────           │                                              │
│  Data | Settings | Acct  │                                              │
│  [‹ collapse]            │                                              │
└──────────────────────────┴──────────────────────────────────────────────┘
```

**`<Topbar>`** — new component, sticky `top: 0; z-index: 20`, lives inside `<main>` (NOT spanning the sidebar). 56px tall, padding `0 24px`, `border-bottom: 1px solid rgba(0,0,0,0.06)`, `background: rgba(249,246,242,0.92)`, `backdrop-filter: blur(8px)`.

**`<AskHermesFab>`** — re-anchor bottom-right of `<main>` (not viewport) so it doesn't fight the sidebar.

---

## Move 2 — Tree-Line Connector ("blur line")

```
▾ Segments
│   Spent Over $50 In The Last 30 …
│   Spent Over $50 In The Last 30 …
│   Organic Power Users           ← active row (box highlight)
│   Recent High-Quality Android…
│   See all… (12)
```

**Spec:**
- In `SidebarSection`: when `expanded && children`, wrap in `<div style={{ position:'relative', paddingLeft:24 }}>` with a guide line at `left:23px; top:4px; bottom:4px; width:1px; background:rgba(0,0,0,0.08)`.
- Indent change: `'5px 12px 5px 36px'` → `'5px 12px 5px 28px'` so leading aligns with guide.
- Active sub-row: replace 3px brand left-bar with **box highlight** (`background: rgba(0,0,0,0.05)` + 1px outset border), so the bar doesn't overlay the guide line. Top-level rows still use the 3px brand bar.

---

## Move 3 — Collapsible Sidebar (icon rail)

```
Expanded (260px)            Collapsed (60px)
┌───────────────┐           ┌────┐
│ HERMES   ⌄    │           │ VG │
│ Thinking →    │           │    │
│ Actionable    │           │    │
│ + New chat    │           │ +  │
│ ⏱ All Chats ▾ │           │ ⏱  │
│ ▦ Feat Store  │           │ ▦  │
│ ▤ Boards      │           │ ▤  │
│ …             │           │ …  │
│ Data Set Acct │           │ ⚙  │
│ ‹ collapse    │           │ ›  │
└───────────────┘           └────┘
```

**Behavior:**
- State persisted: `localStorage` key `hermes:sidebar:collapsed` (default `false`).
- Collapsed: icons centered in 60px column, labels hidden, **no children rendered**. Hover → floating tooltip (right of icon) with section label. Click → navigates to `to` route.
- Recent items unreachable in collapsed mode — by design; ⌘K is the search escape valve.
- Width transition: `transition: width .16s ease`.
- Toggle button: pinned bottom of sidebar next to BottomRow, `[‹]` / `[›]` chevron, tooltip "Collapse sidebar" / "Expand sidebar".

---

## Move 4 — Topbar (breadcrumb + search + avatar)

```
Feature Store / Numeric / account_age_days   [🔍 Search        ⌘+K]   [Avatar]
```

**Breadcrumb (left):**
- Auto-resolved from current route. Resolver maps:
  - `/segments` → `['Segments']`
  - `/segments/:id` → `['Segments', segment.name]`
  - `/feature-store` → `['Feature Store']`
  - `/feature-store/:name` → `['Feature Store', feature.domainGroup, feature.name]`  ← per decision #7
- Crumbs separated by `/` (n400 color). Last crumb bold (n950). Preceding crumbs are NavLinks (n600 → n800 hover).
- For unknown routes, fall back to first path segment titlecased.

**Search (center-right):**
- 360-440px responsive width. Styled as input but is a `<button>` that calls `setCmdKOpen(true)`. Trailing `<kbd>⌘+K</kbd>` chip aligned right. Click anywhere on the row opens the existing `<CmdKModal>`. **Zero new search code.**

**Avatar (far right):**
- 32px circle with user initials. Click → menu: `Account`, `Settings`, `Data sources`, divider, `Sign out`. Reuses the bottom-row destinations; same routes.

---

## Move 5 — Workspace Pill subtitle

```
┌──────────────────────────┐
│  ▣  HERMES         ⌄    │
│     Thinking Data →      │
│     Actionable Data      │
└──────────────────────────┘
```

**Spec:**
- Existing wordmark stays (Tiempos display, 18px, uppercase, 0.04em tracking).
- Add subtitle below: `font-family: T.fSans; font-size: 11px; font-weight: 400; color: T.n500; line-height: 1.3; letter-spacing: 0.01em`.
- Copy: `Thinking Data → Actionable Data` (em-arrow `→`, NOT em-dash). Conveys the platform's promise: chat → analyze → activate.
- Pill height grows from ~44px to ~58px. Account for in sidebar layout.
- Hidden in collapsed mode.

---

## Move 6 — Feature Store Library tightening

**Current vertical stack (estimated):** H1 + entry-points strip + StatStrip + sort/group/filter rail + rows. ~280px chrome before first row.

**Tightened (target ~160px chrome):**
1. **Drop in-page H1** — breadcrumb owns "Feature Store" context.
2. **Compress entry-points** — 4 chip buttons (28px tall) inline above the StatStrip, not full strip. `Browse by domain · Register a new feature · Recently added (N) · Drift detected (N)`.
3. **StatStrip** — single hairline card (1px border, no shadow), denser numerics. Match Actioneer's `3,974 users · last synced just now` rhythm.
4. **FilterRail** stays 240px left; sections unchanged.
5. **Feature rows** unchanged.

---

## Move 7 — Segments Library tightening

Same moves as Feature Store +:
- **`+ New segment` CTA** moves to topbar trailing slot (right of search input, before avatar) **only when route matches `/segments`**. Reuse existing handler.

---

## Move 8 — Segments detail sub-tab strip

**Decision #8:** keep today's separate routes — DON'T introduce `?tab=` query params.

```
[Topbar: Segments / Organic Power Users                      🔍   Avatar]
─────────────────────────────────────────────────────────────────────────
  Overview   Composition   Users   Campaigns   Monitoring   Threshold
  ───────                                                              
                                                                      
  (current page content)                                              
```

**Spec:**
- New `<SegmentDetailTabs>` component rendered inside the segment detail layout, NOT in topbar.
- Tabs are NavLinks to existing routes: `/segments/:id` (Overview), `/segments/:id/composition`, `/segments/:id/users`, `/segments/:id/campaigns`, `/segments/:id/monitoring`, `/segments/:id/threshold-deep`, `/segments/:id/canvas`, `/segments/:id/handoff-modal` etc.
- Active tab: 2px brand-bottom bar + bold label. Inactive: n600.
- 40px tall, sticky just under topbar (`top: 56px`).

**Note:** if some destination routes don't exist yet (Composition / Users), stub them as empty pages rendering the breadcrumb + a "Coming soon" message — better than dead links.

---

## Files Affected

**New (~5):**
- `apps/web/src/components/topbar/topbar.tsx`
- `apps/web/src/components/topbar/breadcrumb.tsx`
- `apps/web/src/components/topbar/search-trigger.tsx`
- `apps/web/src/components/topbar/avatar-menu.tsx`
- `apps/web/src/components/sidebar/collapse-toggle.tsx`
- `apps/web/src/utils/sidebar-collapsed-store.ts`
- `apps/web/src/utils/breadcrumb-resolver.ts`
- `apps/web/src/modules/segments/_components/detail-tabs.tsx`

**Modified (~7):**
- `apps/web/src/App.tsx` — render `<Topbar>` inside `<main>`; pass cmdK toggle.
- `apps/web/src/components/sidebar/sidebar.tsx` — collapsed mode (width branch), guide-line wrapper.
- `apps/web/src/components/sidebar/sidebar-section.tsx` — render guide line under expanded children.
- `apps/web/src/components/sidebar/sidebar-item.tsx` — collapsed-mode rendering (icon-only + tooltip), drop active-bar for sub-rows in favor of box highlight.
- `apps/web/src/components/sidebar/workspace-pill.tsx` — add subtitle.
- `apps/web/src/components/sidebar/bottom-row.tsx` — add collapse toggle.
- `apps/web/src/modules/feature-store/library.tsx` — tighten header strip.
- `apps/web/src/modules/segments/library.tsx` — tighten header strip.

**Risk surface:** ~13 files, all in `apps/web`. No backend, no contracts, no migrations. Reversible.

---

## Final Recommended Solution

Ship in **3 sequential phases** to keep each PR reviewable:

| Phase | Scope | Files | Verifies |
|---|---|---|---|
| **P1** | Topbar + breadcrumb + search-trigger + avatar | App.tsx, topbar/* | Search/⌘K still works, avatar menu navigates, breadcrumb renders correctly across all routes |
| **P2** | Sidebar polish — tree-line, subtitle, collapse mode + toggle | sidebar/*, workspace-pill | Sidebar collapse persists, child rows align with guide, mobile/narrow viewport graceful |
| **P3** | Library tightening (Feature Store + Segments) + segment detail tabs | library.tsx × 2, detail-tabs.tsx | Header chrome reduced, no layout regression on existing detail panels |

Each phase is independently shippable and visually coherent on its own.

---

## Implementation Considerations

- **Breadcrumb resolver** is the only piece that touches every route. Build it as a pure function `resolveBreadcrumb(pathname, getters): Crumb[]` keyed by route prefix. Add a small registry of route → resolver pairs; default fallback titlecases the path segment. Keep it in `utils/breadcrumb-resolver.ts` and unit-test the resolution.
- **Topbar z-stack** — must sit above page content but below the ⌘K modal portal and the AskHermes panel. Use `z-index: 20`; ⌘K modal stays at `z: 100+`.
- **Backdrop blur** — verify Safari + Firefox fallback (`background-color: rgba(...)` if `backdrop-filter` unsupported).
- **Avatar menu** — outside-click handler + Escape to close. Reuse any existing dropdown primitive if available; otherwise add a tiny inline implementation (no new dependency).
- **Subtitle copy** — confirm with brand: `Thinking Data → Actionable Data` is the working line. If brand prefers a punctuation variant (`Thinking · Actionable`, `From thought to action`), swap the constant; trivial.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Breadcrumb mis-renders on dynamic `/segments/:id` if data not yet loaded | Render skeleton crumb (`Segments / …`) until segment fetch resolves; don't block render. |
| Collapsed sidebar leaves recent items unreachable | Acceptable — ⌘K modal is the search/jump-to escape valve. Document in the avatar menu help. |
| Tree-line guide visually clashes with active sub-row highlight | Switch sub-row active state to box highlight (no left bar). Top-level rows keep the brand bar. |
| Library tightening breaks the existing FilterRail layout | Phase 3 explicitly scoped to header chrome — FilterRail's column position unchanged. |
| Topbar height (56px) clashes with sub-tab strip on segments detail (40px) | Sub-tabs sticky with `top: 56px`; total sticky chrome is 96px on detail pages — verified against existing detail content top padding. |

## Success Metrics

- **Vertical chrome on `/feature-store`** drops from ~280px to ≤160px before first row.
- **Sidebar collapse** persists across reloads; collapsed-mode click navigates correctly for all 9 sections.
- **Breadcrumb** resolves correctly for: `/`, `/chat`, `/chat/:id`, `/feature-store`, `/feature-store/:name`, `/segments`, `/segments/:id`, `/segments/:id/monitoring`, `/canvas`, `/canvas/:id`, `/campaigns`, `/campaigns/:id`.
- **⌘K** unchanged — both keyboard and topbar click open it.
- **No regression** in Feature Store detail page (LM/DA/DE tabs), Segments composer, Boards, Campaigns canvas.

## Validation

- **Visual:** open every existing route, confirm topbar + breadcrumb + sidebar render correctly; toggle collapse on each.
- **Keyboard:** ⌘K still opens modal; tab order through topbar → sidebar → main is sensible.
- **Persistence:** collapse state survives reload; recent items in expanded sidebar still update.
- **No layout regression:** screenshot diff key routes (`/`, `/feature-store`, `/feature-store/account_age_days`, `/segments`, `/segments/:id`).

## Next Steps

1. Hand off to `/ck:plan` for phased implementation plan (3 phases per recommendation).
2. After plan approved, `/ck:cook` Phase 1 (topbar) first — establishes the new chrome before sidebar polish.
3. Demo each phase end-to-end before merging the next.

---

## Unresolved Questions

1. **Workspace switcher** — pill has decorative chevron today. Out of scope, or do we wire it up to a workspace list in v1? (Recommend: keep decorative.)
2. **Avatar source of truth** — initials from where? Hardcoded `K` (Khoi) for the demo, or pull from `dev-login` user payload? (Recommend: hardcoded; auth payload doesn't carry name yet.)
3. **Sub-tab strip on `/feature-store/:name` detail** — same treatment as Segments (LM / DA / DE / Lineage / Used by tabs become a strip), or leave existing in-page tab UI alone? Decision #4 says shell-wrap + library only; detail pages untouched, so default = leave alone. Confirm if you want LM/DA/DE strip relocated.
