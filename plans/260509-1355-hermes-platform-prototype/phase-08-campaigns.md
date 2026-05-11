---
phase: 8
title: "Campaigns Module"
status: pending
priority: P2
effort: "8h"
dependencies: [7]
---

# Phase 08: Campaigns Module (Screens 09-17)

## Context Links
- PRD_Hermes_Design.md §9 (Campaign module — full spec), §10 (cross-cutting)
- Hermes_Demo_Data.md Part 3 (5 representative campaigns)
- Catalog: `apps/web/src/data/catalog/campaigns.ts`, `events/`, `intervention-archetypes.ts`
- Crawled: `event-volumes.json`, `audience-counts.json`

## Overview
Build 9 screens covering campaign authoring, journey, prelaunch, handoff, monitoring, patterns. Reuses predicate composer from P-7 for trigger predicates. Handoff modal (15) is the second meeting-earner — shows BOTH SegmentID (Substrate B) AND TriggerID (Substrate A) for hybrid campaigns.

## Key Insights
- **Trigger types are a segmented control** at canvas top — One-time / Scheduled / Real-time. Selection toggles which canvas blocks render.
- Real-time canvas (10) is the centerpiece variant. It shows event source + trigger predicate (reusing P-7 composer) + cooldown + frequency cap + audience eligibility (optional segment).
- Hybrid campaign (TF-1) shows BOTH segment audience block AND event trigger block populated — adjacent blocks per brainstorm Q4 recommendation.
- Handoff modal mints SegmentID and/or TriggerID with both substrate blocks rendered conditionally.
- Experiment Agent panel embeds in monitoring (16) with 2 hardcoded recommendations per Agentic §6.3.

## Requirements
**Functional**
- 09 library:
  - Header stat strip: "23 active · 8 in draft · 12 monitoring · 4 ended this month"
  - Default group-by: 4R goal
  - Row card with trigger-type chip + Author column (per Agentic §6.1)
  - Author filter
  - Entry-points strip: Goal · Hypothesis · Archetype · Existing Segment · Continue draft · Build journey
- 10 canvas (real-time) — centerpiece variant:
  - Top: trigger-type segmented control + 4R goal chips + Intent
  - Audience block (optional for real-time): "Pick existing segment" / "Define inline"
  - Schedule block (active date range + frequency cap)
  - Event trigger block (real-time only):
    - Event source picker (Browse/Search/AI assist) → renders selected as banner row
    - Trigger predicate composer (reuses P-7 components)
    - Mixed-latency banner if predicate references batch features
    - Trigger policies (cooldown, frequency cap, anti-fatigue)
    - Real-time audience preview: "Estimated fires per day" + "Estimated unique players per week"
  - Action block (variant toggle, channel selector, copy, reward)
  - Holdout block (slider with "powered to detect ≥X% lift" copy)
  - Forecast + goal alignment block
  - Right rail materials shelf
  - Bottom bar: Save · Backtest · Test on 100 · Pre-launch monitoring · Activate · 5% rollout + substrate copy "Compiles to: Substrate A (Apollo TEE) + Substrate B (Hatchet)"
- 11 canvas (scheduled): cadence picker + start/end + audience required
- 12 canvas (one-time): send-when-ready / on-date radio + audience required
- 13 journey: Multi-step orchestration. Trigger/Segment seed → Step nodes (Condition/Wait/Split/Action) → Goal/Exit. Each Split branch shows "Export this branch as a segment →" CTA.
- 14 prelaunch: simulation against last 7 days, sanity checks, holdout summary, sample fires walkthrough, forecast.
- 15 handoff modal — second meeting-earner — verbatim Substrate A copy per PRD §9.9:
  ```
  1.  Predicate compiled to expr-lang                       · done
  2.  Trigger config written to JourneyDB                   · done
  3.  Apollo TEE picks up on next reload                    · ~30 sec
  4.  TEE evaluates against event_match_end events          · live
  Substrate A · Apollo TEE + Temporal
  ```
  Hybrid: shows both Substrate A + B blocks. Conditional agent-attribution line.
- 16 monitoring:
  - Header with active-for-N-days + total fires + cross-link badges to SegmentID/TriggerID
  - Health snapshot row
  - Uplift measurement (holdout vs treatment chart, headline +8.2% / p=0.02)
  - **Experiment Agent panel** (per Agentic §6.3) with 2 recommendations + Approve/Edit/Dismiss CTAs
  - Operational health (sanity checks, sample fires, derived segments)
  - Suggested follow-ups
- 17 patterns: 7 intervention archetypes per PRD §9.11.

**Non-functional**
- Canvas state per-trigger-type — switching trigger type resets blocks to defaults.
- Event source picker reads `events/index.ts` + `event-volumes.json` for daily volume cards.
- Journey canvas v1: read-only render with positioned nodes (no drag-drop). Branch export CTA opens panel only (no actual export logic).

## Architecture
```
modules/campaigns/
├── library.tsx                     09
├── canvas/
│   ├── index.tsx                   trigger-type dispatch
│   ├── realtime.tsx                10
│   ├── scheduled.tsx               11
│   ├── onetime.tsx                 12
│   └── _blocks/
│       ├── trigger-type-control.tsx
│       ├── goal-4r.tsx
│       ├── intent-block.tsx
│       ├── audience-block.tsx
│       ├── schedule-block.tsx
│       ├── event-trigger-block.tsx
│       ├── event-source-picker.tsx
│       ├── action-block.tsx
│       ├── holdout-block.tsx
│       ├── forecast-block.tsx
│       └── materials-shelf.tsx     (extends shared)
├── journey.tsx                     13
├── prelaunch.tsx                   14
├── handoff-modal.tsx               15
├── monitoring.tsx                  16
├── patterns.tsx                    17
└── _components/
    ├── experiment-agent-panel.tsx  Agentic §6.3
    ├── uplift-chart.tsx
    ├── sample-fires-table.tsx
    └── archetype-card.tsx
```

## Related Code Files
**Create** — all files in `modules/campaigns/`.

**Read**
- `data/catalog/campaigns.ts`, `events/`, `segments.ts`, `intervention-archetypes.ts`
- `data/catalog/agents/recommendations.ts` (for Experiment Agent panel)
- `data/crawled/event-volumes.json`, `audience-counts.json`

**Modify**
- `apps/web/src/components/handoff-modal.tsx` — extend with conditional dual-substrate render

## Implementation Steps
1. `library.tsx` — stat strip, filter rail, row cards with trigger-type chips + Author column, entry points.
2. `_blocks/trigger-type-control.tsx` — segmented control toggling canvas variant.
3. `_blocks/goal-4r.tsx` — 4 chips Retain/Revenue/Reactivate/Recruit.
4. `_blocks/intent-block.tsx` — serif italic intent statement editor.
5. `_blocks/audience-block.tsx` — empty state with two CTAs (pick segment / define inline). Inline mini-Segment-build is a slide-in reusing P-7 composer.
6. `_blocks/schedule-block.tsx` — variants per trigger type.
7. `_blocks/event-source-picker.tsx`:
   - Browse / Search / AI-assist tabs
   - Event card: name, daily volume (from event-volumes.json), peak rate, latency class, schema status, sparkline
   - Default suggestion: `event_match_end`
8. `_blocks/event-trigger-block.tsx`:
   - Event source banner row (after picker selection)
   - Trigger predicate composer (reuses `modules/segments/_composer/predicate-composer.tsx`)
   - Mixed-latency warning banner (if predicate has both `<1s` and `<1h`/`<1d` features)
   - Trigger policies (cooldown picker, frequency cap, anti-fatigue clauses)
   - Audience preview band variant: "Estimated fires/day · Estimated unique players/week"
9. `_blocks/action-block.tsx` — variant toggle, channel selector, copy/reward inputs.
10. `_blocks/holdout-block.tsx` — slider 0-50%, "powered to detect" copy.
11. `_blocks/forecast-block.tsx` — reach/cost/lift sparkline + goal-alignment dial.
12. `canvas/realtime.tsx` — composes all blocks for real-time variant.
13. `canvas/scheduled.tsx` — hides event-trigger-block + adjusts schedule.
14. `canvas/onetime.tsx` — minimal: audience + schedule + action.
15. `canvas/index.tsx` — dispatches based on trigger type from URL.
16. `journey.tsx` — read-only journey graph (positioned nodes + edges). Use simple SVG layout. Each Split branch has "Export →" CTA opening side panel.
17. `prelaunch.tsx` — simulation summary, sanity checks (mostly hardcoded green), sample fires walkthrough.
18. `handoff-modal.tsx` — extends shared HandoffModal:
   - Conditional Substrate A block (if TriggerID present)
   - Conditional Substrate B block (if SegmentID present)
   - For hybrid campaigns (TF-1), both blocks render
   - Verbatim PRD §9.9 mono copy
19. `_components/experiment-agent-panel.tsx`:
   - 2 recommendations from `agents/recommendations.ts`
   - Each with reason text + Approve/Edit/Dismiss CTAs
   - Renders below holdout chart in monitoring (per Agentic §6.3)
20. `monitoring.tsx`:
   - Header with cross-link badges to SegmentID/TriggerID
   - Health snapshot row
   - Uplift chart with confidence band
   - Experiment Agent panel embedded
   - Operational health sections
   - Suggested follow-ups
21. `patterns.tsx` — 7 archetype cards.
22. Wire URL routing — `/campaigns/new/realtime?seedSegment=:id` flow from segment library "Use in campaign" CTA.
23. Wire activate → handoff modal → CampaignID + TriggerID/SegmentID minting.
24. Smoke test demo flow steps 6-9 (use segment in campaign → real-time canvas → activate → handoff → 2-week-later monitoring).
25. Commit: `feat(campaigns): library + 3 canvas variants + journey + prelaunch + handoff + monitoring + patterns`.

## Todo List
- [ ] Build library with trigger-type chips + Author column
- [ ] Build trigger-type-control + goal-4r + intent blocks
- [ ] Build audience-block with inline segment build slide-in
- [ ] Build schedule-block variants
- [ ] Build event-source-picker reading event-volumes.json
- [ ] Build event-trigger-block reusing P-7 composer
- [ ] Build action / holdout / forecast blocks
- [ ] Compose canvas/realtime, canvas/scheduled, canvas/onetime
- [ ] Build journey (read-only render)
- [ ] Build prelaunch
- [ ] Build handoff-modal with dual-substrate conditional render
- [ ] Build monitoring with Experiment Agent panel
- [ ] Build patterns (7 archetypes)
- [ ] Wire activate → handoff → mint IDs
- [ ] Smoke test demo steps 6-9

## Success Criteria
- [ ] All 9 campaign screens routable
- [ ] PRD acceptance #8 met (≥2 of 3 trigger-type variants designed — real-time + one of scheduled/onetime)
- [ ] PRD acceptance #9 met (real-time canvas shows trigger predicate + event source + cooldown + freq cap)
- [ ] Hybrid campaign canvas (10) shows both audience block and event trigger block populated for TF-1
- [ ] Handoff modal (15) verbatim per PRD §9.9 — both substrates conditionally rendered
- [ ] Hybrid handoff shows both SegmentID + TriggerID
- [ ] Experiment Agent panel renders on monitoring with 2 recommendations + 3 CTAs (Agentic §12.6)
- [ ] Library Author column shows ≥1 agent-drafted row (Agentic §12.5)
- [ ] Demo steps 6-9 walk without dead ends

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Reusing P-7 composer leaks segment-specific UI into trigger context | Composer accepts `mode: 'segment' | 'trigger'` prop; trigger mode hides "Use in campaign" CTAs |
| Journey read-only render misses PRD §9.7 detail | Acceptable for v1; PRD §13 says no full editor; static graph good enough |
| Hybrid campaign layout cramped if both blocks expanded | Canvas vertical scroll; both blocks collapsible after first edit |
| Handoff modal substrate-conditional logic tangles | Keep render in pure presentational component with explicit props; consumer assembles substrate blocks |
| 7 archetypes in patterns.tsx is shallow | Acceptable per PRD acceptance #6 — display only |

## Security Considerations
- No real campaign creation — all "activate" actions render modal only.
- Channel preview opens hardcoded mock images; no upload surface.

## Next Steps
- P-9 cross-cutting: Author column on `09_cmp_library` already added in this phase; verify alignment in P-9.
- P-10 validates demo steps 6-9.
