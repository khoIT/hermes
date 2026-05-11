---
title: "Actioneer Shell Redesign — Topbar + Sidebar Polish + Library Tightening"
description: "Adopt Actioneer's structural shell moves (fixed topbar with breadcrumb+search, tree-line under expanded sidebar children, 60px icon-rail collapse, workspace pill subtitle) on top of existing Hermes 260px sidebar. Tighten Feature Store + Segments library pages and add Segments detail sub-tab strip. Frontend-only, ~13 files in apps/web. No backend, no migrations."
status: completed
priority: P2
branch: "actioneer"
tags: [ui, shell, sidebar, topbar, frontend]
blockedBy: []
blocks: []
created: "2026-05-10T06:32:32.740Z"
createdBy: "ck:plan"
source: skill
brainstorm_ref: "plans/reports/brainstorm-260510-1323-actioneer-shell-redesign.md"
---

# Actioneer Shell Redesign — Topbar + Sidebar Polish + Library Tightening

## Overview

Adds three structural moves on top of the existing 260px Hermes sidebar (delivered by `260510-0151-chat-first-sidebar-ia`):

1. **Fixed topbar** (56px sticky) inside `<main>` — breadcrumb left, ⌘K-trigger search center, avatar menu right.
2. **Sidebar polish** — tree-line guide under expanded children, sub-row box highlight (top-level still uses 3px brand bar), workspace pill subtitle `Thinking Data → Actionable Data`, 60px icon-rail collapse mode (persisted, default expanded).
3. **Library tightening** — Feature Store + Segments library landing pages drop in-page H1, compress entry-points to 28px chip row, hairline StatStrip; Segments detail gets a sub-tab strip linking existing routes (no `?tab=` rewrite).

Single search source-of-truth (existing `<CmdKModal>`). All decisions from brainstorm locked. Detail pages (LM/DA/DE tabs, Threshold playground, Analyst panels, Engineer panels, Segments composer/canvas) untouched.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Topbar Shell](./phase-01-topbar-shell.md) | Completed |
| 2 | [Sidebar Polish](./phase-02-sidebar-polish.md) | Completed |
| 3 | [Library Tightening + Segments Detail Tabs](./phase-03-library-tightening-segments-detail-tabs.md) | Completed |

Each phase is independently shippable and visually coherent. Recommended order: P1 → P2 → P3 (topbar first establishes new chrome before sidebar polish lands).

## Dependencies

- **Predecessor (completed):** `260510-0151-chat-first-sidebar-ia` — delivered the 260px sidebar this plan polishes.
- **No active blockers.**

## Success Metrics

- Vertical chrome on `/feature-store` drops from ~280px to ≤160px before first row.
- Sidebar collapse persists across reloads; collapsed-mode click navigates correctly for all 9 sections.
- Breadcrumb resolves correctly for all 12+ key routes (see Phase 1).
- ⌘K behavior unchanged — both keyboard and topbar click open the modal.
- No regression on Feature Store detail (LM/DA/DE), Segments composer, Boards, Campaigns canvas.

## Open Questions (carried from brainstorm)

1. Avatar initials source — hardcoded `K` (Khoi) for demo, or pull from `/api/v1/auth/dev-login` payload? **Default: hardcoded** until auth payload carries name.
2. Workspace switcher wiring — pill chevron stays decorative? **Default: yes, decorative.**
3. LM/DA/DE strip on Feature Store detail — relocate to topbar-adjacent? **Default: leave alone** (out of scope per brainstorm decision #4).
