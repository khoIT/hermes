---
type: brainstorm
date: 2026-05-10
slug: welcome-page-cockpit
related-plan: 260510-0151-chat-first-sidebar-ia (Phase 10 successor)
---

# Welcome page redesign — LiveOps cockpit

## Problem

Current `/welcome` (post-Phase-10) is a sparse 5-card module grid + brand hero. Users who don't want to start with chat have nothing actionable: just nav links the sidebar already exposes. A LiveOps PM landing here should see *what's running, what's working, what needs attention* and have one click to start the next thing.

## Goal

Replace the sparse module grid with a dense ops dashboard styled after the reference image: KPI strip + active-campaigns panel + Start-something CTAs + Recent threads. Keep a slim brand strip at the top so chat is still cross-sold.

## Locked decisions

| # | Decision |
|---|---|
| 1 | Hybrid layout: 1-row brand strip + 4-tile KPI row + 2-column body |
| 2 | KPI tiles (4): Audience reached · Active Segments · Lift this week · Drift signals |
| 3 | Tile clicks route to module library (`/segments`, `/campaigns?sort=lift`, `/segments?filter=drift`) — no chat triggers |
| 4 | Center: Active campaigns table from real `campaigns.ts` catalog (filtered to non-ended) |
| 5 | Right-top: "Start something" — 3 CTA rows: Build a segment · Explore data via chat · Launch a campaign |
| 6 | Right-bottom: Recent threads (from `chat-store.ts`) — replaces Anomalies |
| 7 | Drop the existing 5 numbered module cards (sidebar covers discovery) |

## Layout (12-col grid)

```
┌──────────────────────────────────────────────────────────────────────┐
│ HERO STRIP (compact, ~64px)                                          │
│ Hermes · LiveOps Platform           [Platform online][α]    [Ask ✦] │
├──────────────────────────────────────────────────────────────────────┤
│ ┌── KPI 1 ──┐ ┌── KPI 2 ──┐ ┌── KPI 3 ──┐ ┌── KPI 4 ──┐              │
│ │ Audience  │ │ Active    │ │ Lift this │ │ Drift     │              │
│ │ reached   │ │ Segments  │ │ week      │ │ signals   │              │
│ │ 342k      │ │ 8         │ │ +6.8%     │ │ 1         │              │
│ │ across 5  │ │ 1 drifting│ │ avg of 5  │ │ CFM EoY…  │              │
│ │ campaigns │ │ this week │ │ campaigns │ │ +18% drift│              │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘              │
├────────────────────────────────────────┬─────────────────────────────┤
│ ACTIVE CAMPAIGNS                       │ START SOMETHING             │
│ ─────────────────────────  View all → │ ▢ Build a segment      →   │
│ ╭─ row 1 ────────────────────────────╮│   Compose audience…         │
│ │ Pass Stuck Rescue       [Retain]   ││ ▢ Explore data via chat →   │
│ │ cmp-cfm-407 · Real-time ▎▎▎▎▎▎▎▎+8.2%                              │
│ ╰────────────────────────────────────╯│   Ask Hermes a question…    │
│ ╭─ row 2 ────────────────────────────╮│ ✈ Launch a campaign    →   │
│ │ Lễ Hội Cuối Năm        [Reactiv]   ││   Activate over a segment…  │
│ │ cmp-cfm-411 · Scheduled ▎▎▎▎▎ +3.1%├─────────────────────────────┤
│ ╰────────────────────────────────────╯│ RECENT THREADS              │
│ ╭─ row 3 ────────────────────────────╮│ ─────────────────────────── │
│ │ Low CF Coin             [Revenue]  ││ ▤ CPI vs LTV by channel     │
│ │ cmp-cfm-418 · Real-time ▎▎▎▎▎▎+12.4%│   Today · 09:14            │
│ ╰────────────────────────────────────╯│ ▤ D7 retention drop · FB    │
│ ╭─ row 4 ────────────────────────────╮│   Yesterday                 │
│ │ Football Hub            [Reactiv]  ││ ▤ Loss-streak rescue draft  │
│ │ cmp-tf-101 · Real-time ▎▎  measuring│  3 days ago                 │
│ ╰────────────────────────────────────╯│                             │
│ ╭─ row 5 ────────────────────────────╮│                             │
│ │ Couples weekly minigame [Retain]   ││                             │
│ │ cmp-nth-052 · Scheduled ▎▎▎▎ +4.8% ││                             │
│ ╰────────────────────────────────────╯│                             │
└────────────────────────────────────────┴─────────────────────────────┘
```

**Grid maths:** outer max-width 1200px · 8/4 column split for body · 24px gutter.

## Visual language

- Page background: cream `#F9F6F2` (matches sidebar bg)
- Cards: white, `1px solid T.n200`, 10px radius, no shadow at rest
- KPI tile typography:
  - Eyebrow: 11px uppercase 0.08em letter-spacing, color `T.n500`. **First tile uses `T.brand` for the eyebrow per reference** (visual anchor)
  - Headline number: 36px sans, weight 600, color `T.n950`
  - Caption: 12px, color `T.n500`, max 2 lines
- Active campaign row:
  - Name: 14px Spectral italic (display font, matches reference) `T.n950`
  - ID + trigger: 11px JetBrains Mono `T.n500`, dot-separated
  - 4R chip: `Badge` component, soft variant, color per goal:
    - retain → blue (`T.blue50` bg, `T.blue700` text)
    - reactivate → yellow soft
    - revenue → brand-soft (red)
    - recruit → green soft
  - Bar sparkline: 8 vertical bars, varying heights, `T.brand` when has lift, `T.n300` when "measuring" / no data
  - Lift %: 13px sans-serif weight 500, `T.green600` for positive, `T.red600` for negative, `T.n500` for "measuring"
- Start-something rows: icon (lucide) + bold label + 1-line description + chevron right. Icon in `T.brandSoft` circle. Hover: row bg `T.n50`.
- Recent thread rows: small message-bubble icon + thread title (1-line truncate) + relative time. Hover: bg `T.n50`.

## Data sources (honest about what's real)

| Field | Source | Synthesis required? |
|---|---|---|
| Audience reached | Sum of `audienceSize` across active campaign segments | Compute at render |
| Active Segments | Count `segments.ts` where `status !== 'archived'` (or all 8 demo segments) | Read-only |
| Lift this week | Avg of synthetic per-campaign `weekLift` field | Add fixture map |
| Drift signals | Count of segments with `drift: true` flag | Add 1 drift to `seg-cfm-rfm-tier-1-2026` |
| Active campaigns rows | `campaigns.ts` filtered to `status ∈ {real-time, scheduled}` | 5 rows from existing 7 |
| Per-row sparkline + lift | Synthetic, attached via `_welcome-fixtures.ts` | Map by campaign ID |
| Recent threads | `chat-store.ts` `listThreads()` → top 3-5 by `updatedAt` | Read-only, real |

**Synthesis lives in one file** (`apps/web/src/data/catalog/_welcome-fixtures.ts`) so all numbers stay deterministic and aren't scattered. Each campaign ID maps to `{ weekLift: number, sparkBars: number[] }`.

## Routing map

| Element | Click destination |
|---|---|
| KPI: Audience reached | `/segments` |
| KPI: Active Segments | `/segments` |
| KPI: Lift this week | `/campaigns?sort=lift` (param ignored if not implemented; safe) |
| KPI: Drift signals | `/segments?filter=drift` |
| Active campaign row | `/campaigns/:id` |
| Active campaigns header `View all →` | `/campaigns` |
| Start something: Build a segment | `/segments/new` |
| Start something: Explore data via chat | `/` (chat landing) |
| Start something: Launch a campaign | `/campaigns` |
| Recent thread row | `/chat/:id` |
| Hero `Ask Hermes ✦` CTA | `/` (chat landing) |

## Component breakdown (each ≤200 LOC)

```
modules/welcome/
  page.tsx                           — orchestrator, layout grid (~120 LOC)
  hero-strip.tsx                     — 1-line brand + status + Ask CTA
  kpi-strip.tsx                      — 4-tile row container
  kpi-tile.tsx                       — single tile (eyebrow, number, caption)
  active-campaigns-panel.tsx         — header + rows
  active-campaign-row.tsx            — single row (name, ID, chip, bars, lift)
  start-something-panel.tsx          — 3 CTA rows
  recent-threads-panel.tsx           — list of last 3-5 threads
  bar-sparkline.tsx                  — small vertical-bar viz (~30 LOC)
data/catalog/
  _welcome-fixtures.ts               — synthetic per-campaign metrics map
```

## Files to modify / delete

- **Modify:** `apps/web/src/modules/welcome/page.tsx` (full rewrite, was the homepage)
- **Add:** all components listed above + `_welcome-fixtures.ts`
- **Reuse:** `theme.tsx` `T`, `Badge`, `Icon`, `chat-store.ts` `listThreads`, `campaigns.ts`, `segments.ts`
- **Reuse:** existing 4R color logic if present in theme; otherwise inline a `goal4rChip(goal)` helper
- **No deletions** (current welcome is just being rewritten)

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Synthetic lift / sparkline numbers drift from any real data shown elsewhere | Single fixtures file; if other pages later show campaign performance, they import from same source |
| `BarSparkline` reinvents the wheel | Quick check: existing `Sparkline` is a line chart. Vertical-bar style needs ~30 LOC inline SVG; not worth abstracting further |
| Empty states: no recent threads on first load | Bootstrap (`bootstrapChatThreads`) seeds 4 fixtures on first boot — never truly empty in demo |
| Empty states: 0 drift signals | Tile shows `0 · all clear` in `T.green600` — graceful, still informative |
| Hero strip clutters cockpit | Cap hero at 64px height; uppercase 11px eyebrow, brand wordmark in display font (small, not 56px), CTA right-aligned |
| Reference uses Spectral italic for campaign names — already in theme? | `T.fDisp` is Spectral; italic is a font-style, not a separate file. Cheap. |
| Filter query params (`?sort=lift`, `?filter=drift`) not honored by destination pages | OK for v1 — destination ignores unknown params, lands on default view. Tracked as follow-up. |

## What's explicitly out of scope

- Real `?sort=` / `?filter=` query handling on `/campaigns` and `/segments` (welcome links pass them; pages ignore for now)
- Personalization ("Welcome back, Khoi") — current role-switcher exists but no display name plumbing; skip
- Live anomaly detection — rejected in favor of Recent threads
- Module discovery cards — sidebar wins; dropping the 01-05 grid
- Theme toggle / mobile responsiveness — out of scope per global plan §6, §9

## Success criteria

1. `/welcome` renders 4 KPI tiles with non-zero values, all clickable to module pages
2. Active campaigns panel shows ≥4 rows from real `campaigns.ts`, each with lift % and sparkline
3. Start something panel: 3 CTAs all navigate correctly
4. Recent threads shows last 3-5 chat threads with relative time, click → `/chat/:id`
5. Hero CTA `Ask Hermes ✦` routes to `/`
6. Total page ≤900 lines across all components, each file ≤200 LOC
7. Zero TS errors, build passes
8. Visual parity with reference image at first impression (KPI strip + 2-col body)

## Open questions

- *None at this point — all 7 decisions locked above. Plan can proceed.*
