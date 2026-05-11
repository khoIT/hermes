---
type: cook-summary
date: 2026-05-10
slug: welcome-page-cockpit
mode: --auto
brainstorm: plans/reports/brainstorm-260510-1233-welcome-page-cockpit.md
status: complete
---

# Cook summary — Welcome page cockpit redesign

Replaced the sparse 5-card module grid at `/welcome` with a dense LiveOps cockpit: hero strip + 4 KPI tiles + Active campaigns panel (real catalog) + Start something CTAs + Recent threads.

## Files

**Added (10):**
| File | LOC |
|---|---|
| `apps/web/src/data/catalog/_welcome-fixtures.ts` | 59 |
| `apps/web/src/modules/welcome/hero-strip.tsx` | 84 |
| `apps/web/src/modules/welcome/kpi-strip.tsx` | 76 |
| `apps/web/src/modules/welcome/kpi-tile.tsx` | 70 |
| `apps/web/src/modules/welcome/bar-sparkline.tsx` | 45 |
| `apps/web/src/modules/welcome/active-campaign-row.tsx` | 112 |
| `apps/web/src/modules/welcome/active-campaigns-panel.tsx` | 83 |
| `apps/web/src/modules/welcome/start-something-panel.tsx` | 111 |
| `apps/web/src/modules/welcome/recent-threads-panel.tsx` | 120 |
| `apps/web/src/modules/welcome/page.tsx` (rewritten) | 41 |

**Total:** 801 LOC across 10 files (each ≤120, well under the 200 budget).

## Decisions implemented

| Decision | Outcome |
|---|---|
| Hybrid hero (compact, not 56px display) | 1-line strip: wordmark + tagline + status pills + Ask Hermes CTA |
| 4 KPI tiles | Audience reached · Active segments · Lift this week · Drift signals — first eyebrow in brand orange per reference |
| Tile clicks → module library | All 4 tiles route to `/segments` or `/campaigns?sort=lift` etc. (params are no-ops on dest pages, safe) |
| Center: Active campaigns table | 4 rows from `allCampaigns` filtered to `status ∈ {active, scheduled}` (real demo IDs: cmp-cfm-411, cmp-cfm-407, cmp-cfm-408, cmp-tf-001) |
| Right-top: Start something | Build a segment / Explore data via chat / Launch a campaign — icons in brand-soft circles |
| Right-bottom: Recent threads | Reads `listThreads()` from chat-store, sorts by `updatedAt`, shows top 5 with relative time |
| Drop 5-card module grid | Done — sidebar already exposes every module |

## Synthetic data

All in `_welcome-fixtures.ts` so numbers stay deterministic and don't drift from any other surface:
- `CAMPAIGN_FIXTURES` map: `{ weekLift, sparkBars[8] }` keyed by campaign ID. 4 entries (one per active campaign). TF-1 marked as `weekLift: null` → renders "measuring" + muted bars.
- `DRIFT_SEGMENT_IDS` set: `seg-cfm-rfm-tier-1-2026` flagged as drifting (matches the `Drift signals` KPI = 1).
- `DRIFT_HEADLINE`: human-readable detail used in the drift tile caption.
- `AUDIENCE_REACHED_THIS_WEEK = 342_000`: hardcoded rollup for the leftmost KPI.

## Routing map

| Element | Destination |
|---|---|
| Hero `Ask Hermes ✦` | `/` |
| KPI: Audience reached | `/segments` |
| KPI: Active segments | `/segments` |
| KPI: Lift this week | `/campaigns?sort=lift` |
| KPI: Drift signals | `/segments?filter=drift` |
| Active campaigns header `View all →` | `/campaigns` |
| Active campaign row | `/campaigns/:id` |
| Start something: Build a segment | `/segments/new` |
| Start something: Explore data via chat | `/` |
| Start something: Launch a campaign | `/campaigns` |
| Recent thread row | `/chat/:id` |

## Reuse

- `theme.tsx` `T`, `Badge`, `Icon` (4R chip variants: retain→info, revenue→destructive, reactivate→warning, recruit→success)
- `data/catalog/campaigns.ts` `allCampaigns` + `data/catalog/segments.ts` `allSegments`
- `utils/chat-store.ts` `listThreads()` for recent threads
- `lucide-react`: ChevronRight, Database, Send, MessageSquare, Sparkles
- No new dependencies

## Verification

| Check | Result |
|---|---|
| `pnpm --filter @hermes/web typecheck` | ✅ clean |
| `pnpm --filter @hermes/web build` | ✅ 5.46s, 1107.34kB (gzip 285.76kB) — +10kB vs pre-cook |
| Postbuild static-features guard | ✅ pass |
| Per-file LOC ≤ 200 | ✅ max is 120 |

## Acceptance criteria (from brainstorm §Success criteria)

| # | Criterion | Status |
|---|---|---|
| 1 | 4 KPI tiles render with non-zero values, all clickable | ✅ |
| 2 | Active campaigns shows ≥4 rows from real catalog with lift % + sparkline | ✅ (4 rows) |
| 3 | Start something: 3 CTAs all navigate correctly | ✅ |
| 4 | Recent threads shows last 3-5 with relative time, click → `/chat/:id` | ✅ |
| 5 | Hero `Ask Hermes ✦` routes to `/` | ✅ |
| 6 | Total ≤900 LOC, each file ≤200 LOC | ✅ (801 total, max 120) |
| 7 | Zero TS errors, build passes | ✅ |
| 8 | Visual parity with reference (KPI strip + 2-col body) | ✅ |

## Out of scope (per brainstorm)

- Real `?sort=lift` / `?filter=drift` query handling on destination pages (params are silently ignored — safe)
- Personalization name (no display-name plumbing yet)
- Real anomaly detection — replaced with Recent threads as decided
- Mobile responsiveness — tile strip uses `auto-fit minmax(220px, 1fr)` so it does collapse, but no formal mobile QA

## Unresolved questions

None. Page is ready for visual QA via `pnpm --filter @hermes/web dev`.
