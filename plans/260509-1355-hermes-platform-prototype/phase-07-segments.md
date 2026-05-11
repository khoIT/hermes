---
phase: 7
title: "Segments Module (centerpiece)"
status: pending
priority: P1
effort: "8h"
dependencies: [3, 4, 5]
---

# Phase 07: Segments Module (Screens 03-08)

## Context Links
- PRD_Hermes_Design.md §8 (Segments module — full spec)
- Hermes_Demo_Data.md Part 3 (5 demo predicates), Part 6 (mockup mapping)
- Catalog: `apps/web/src/data/catalog/segments.ts`, `audience-patterns.ts`
- Crawled: `audience-counts.json`, `distributions.json`, `segment-demographics.json`

## Overview
The load-bearing module. Build the segment authoring canvas (04) — the centerpiece of the demo. PRD §14 acceptance #3 demands the canvas reads as a *data tool*, not a brief. Plus library (03), threshold-deep (05), handoff modal (06), monitoring (07), patterns (08).

## Key Insights
- **Canvas region order is non-negotiable** per PRD §8.3: Intent (collapsed) → Audience preview (sticky) → Predicate composer → Right rail → Bottom action bar.
- **AND-of-OR-groups model** — list of match groups AND'd; each group OR's internally; exclusions AND NOT'd to whole predicate. PRD §14 acceptance #4: visible on screen.
- **Inline threshold playground** — slider mid-drag with audience number visibly updating is PRD acceptance #5 and the demo's centerpiece moment.
- **Audience preview band MUST always be visible** while editing — sticky, pulses on count change.
- 4R goal grouping is segment library default. 4R lives at campaign level too but library is grouped by it for Studio mental model.
- Handoff modal (06) is one of two meeting-earners (the other is 15). Substrate copy must match architecture verbatim.

## Requirements
**Functional**
- 03 library:
  - Header stat strip: "31 segments · 23 active · 8 in draft · 6 derived from journey branches · 12 with drift this week"
  - Default group-by: 4R goal
  - Filter rail: goal, owner, status, has-open-campaigns, last build
  - Row card per PRD §8.2 with **Author column** (per Agentic §6.1) showing hand-built / agent-drafted / agent-edited
  - Filter for Author column
  - Entry-points strip: Start from goal · Start from pattern · Start from feature · Continue draft
- 04 canvas (CENTERPIECE):
  - Region 1: Collapsible intent ribbon (hidden by default if predicate non-empty)
  - Region 2: Sticky audience preview band — UID count + % MAU + % subpop + breakdown expansion
  - Region 3: Predicate composer with AND-of-OR-groups, inline feature swap, inline threshold playground
  - Region 4: Right rail (Features in use · Pattern reference · Hypothesis reference · Suggested next AI block with attribution per Agentic §6.2)
  - Region 5: Sticky bottom bar — Save draft · Backtest · Preview UID list · Build segment + substrate copy "Compiles to Substrate B · Hatchet · BuildSegmentWorkflow"
  - **Agent draft review mode** banner (per Agentic §5.4) when arriving from drafts queue
- 05 threshold-deep:
  - Standalone full-page threshold playground for direct-from-FS entry
  - Same playground component as inline; just full-screen layout
- 06 handoff modal — the meeting-earner:
  - Verbatim substrate B mono blocks per PRD §8.7:
    ```
    1.  Hatchet starts BuildSegmentWorkflow                 · queued
    2.  Predicate compiled to Trino SQL over Iceberg        · ~2 min
    3.  UID list materialised to state_user_segments        · ~3 min
    4.  Activation API exposes list to Apollo channels      · ready
    Substrate B · Hatchet + Trino + Iceberg
    Apollo consumes via: GET /segments/{id}/uids
    ```
  - Conditional agent-attribution line above "What happens next" (per Agentic §6.4)
  - 3 CTAs: Open in monitoring · Use in campaign · Done
- 07 monitoring: 3 tabs (Overview · Monitoring · Used by). Audience size over time chart with rebuild markers + campaign fire windows + expected envelope. Schedule rebuild toggle.
- 08 patterns: 5 cards per PRD §8.9 (Loss Streak, Whale at Risk, Lapsed Mid-Spender, NRU D2 Drop-off, Shop Window Shopper).

**Non-functional**
- Canvas state local (React useReducer) — no persistence in v1.
- Threshold playground updates audience count on slider drag at 60fps.
- Audience-counts lookup keyed by `predicateHash(predicate)` against `crawled/audience-counts.json`. If predicate doesn't match a precomputed entry, interpolate or fall back to ~estimate logic.

## Architecture
```
modules/segments/
├── library.tsx                     03
├── canvas.tsx                      04 — composes regions
├── threshold-deep.tsx              05
├── handoff-modal.tsx               06 (renders via shared HandoffModal)
├── monitoring.tsx                  07
├── patterns.tsx                    08
├── _composer/
│   ├── predicate-composer.tsx      AND-of-OR groups orchestrator
│   ├── group-block.tsx             one match group
│   ├── predicate-row.tsx           one row inside a group
│   ├── inline-swap-popover.tsx     feature swap UX
│   ├── inline-threshold-playground.tsx
│   ├── condition-picker.tsx        slide-in
│   ├── exclusion-picker.tsx        slide-in (with templates strip)
│   └── or-row-picker.tsx           slide-in
├── _components/
│   ├── intent-ribbon.tsx
│   ├── suggested-next.tsx          AI block (hardcoded; Agentic §6.2 attribution)
│   ├── features-in-use.tsx
│   ├── monitoring-chart.tsx
│   └── pattern-card.tsx
└── _state/
    ├── canvas-reducer.ts           predicate AST + intent + ui state
    ├── predicate-types.ts          AST type defs
    └── audience-lookup.ts          predicate → count from crawled JSON
```

## Related Code Files
**Create** — all files in `modules/segments/` per architecture.

**Read**
- `data/catalog/segments.ts`, `audience-patterns.ts`, `features/index.ts`
- `data/crawled/audience-counts.json`, `distributions.json`, `segment-demographics.json`

**Modify**
- `apps/web/src/components/feature-pill.tsx` — wire `inline-swap-popover.tsx` from this phase
- `apps/web/src/components/handoff-modal.tsx` — add segment-flavoured props (substrate=B, workflow=Hatchet)

## Implementation Steps
1. Define `_state/predicate-types.ts`:
   ```ts
   type Predicate = { groups: MatchGroup[]; exclusions: Row[] }
   type MatchGroup = { id; rows: Row[] }   // OR'd internally
   type Row = { id; feature: string; operator; value }
   ```
2. Implement `_state/audience-lookup.ts` — given predicate AST, hash to a key, look up in `audience-counts.json`. If miss, interpolate from nearest threshold OR show estimate from individual feature counts (cardinality min).
3. Implement `_state/canvas-reducer.ts` — actions: ADD_GROUP, ADD_ROW, REMOVE_ROW, SET_THRESHOLD, ADD_EXCLUSION, SET_INTENT, etc.
4. Build `predicate-row.tsx` — feature pill (clickable for swap) + operator + value (clickable for threshold playground) + 3-dot menu.
5. Build `inline-swap-popover.tsx` — current feature card + 3-5 AI-ranked alternatives + "Browse Feature Store" link.
6. Build `inline-threshold-playground.tsx`:
   - Mini histogram (~32px tall, full row width) reading distributions.json
   - Slider thumb over histogram
   - Numeric input synced
   - Matched-region color sweep on drag
   - Sensitivity hint text
   - Apply / Cancel
   - On drag, dispatch SET_THRESHOLD; canvas reducer recomputes audience via audience-lookup
7. Build `group-block.tsx` — wraps N rows OR'd, "+ Add OR row", "+ Add condition".
8. Build `predicate-composer.tsx` — orchestrates groups, exclusions, "+ Add group AND", "+ Add exclusion AND NOT".
9. Build pickers (`condition-picker`, `exclusion-picker`, `or-row-picker`) — slide-in from right; cards with feature name + type + latency + mini histogram + distribution stats + owner. Smart suggestions panel.
10. Build `intent-ribbon.tsx` — collapsible note at top.
11. Build `audience-band.tsx` — already from P-5; verify works in canvas context.
12. Build `suggested-next.tsx` — AI block with Agentic §6.2 attribution footer linking to reasoning panel.
13. Build `features-in-use.tsx` — list of features in current predicate; click → FS slide-out.
14. Compose canvas page (`canvas.tsx`) regions 1-5.
15. Build library page (`library.tsx`) with stat strip, filter rail, group-by, row cards, Author column.
16. Build threshold-deep (`threshold-deep.tsx`) — full-page version of playground.
17. Build handoff modal (`handoff-modal.tsx`) — invokes shared HandoffModal with segment-specific substrate copy.
18. Build monitoring (`monitoring.tsx`) — 3 tabs, charts, rebuild toggle.
19. Build patterns (`patterns.tsx`) — 5 cards.
20. Wire bottom action bar: Build segment → modal opens → mints SegmentID (deterministic from canvas state hash + timestamp) → routes to handoff.
21. Wire agent draft review mode — when route includes `?from=draft-id`, banner replaces intent ribbon per Agentic §5.4.
22. Wire URL: clicking "Use in segment" from Feature Store seeds canvas with that feature in row 1.
23. Smoke test demo flow steps 3-5: route to canvas with seed feature → drag threshold slider → audience updates → save → handoff modal renders.
24. Commit: `feat(segments): library + canvas (centerpiece) + handoff + monitoring + patterns`.

## Todo List
- [ ] Define predicate AST types
- [ ] Implement audience-lookup against audience-counts.json
- [ ] Implement canvas reducer with all actions
- [ ] Build predicate-row + group-block + composer orchestrator
- [ ] Build inline-swap-popover
- [ ] Build inline-threshold-playground (slider + histogram + matched-region sweep)
- [ ] Build 3 pickers (condition, exclusion, or-row) as slide-ins
- [ ] Build right rail components (suggested-next w/ attribution, features-in-use, pattern reference)
- [ ] Compose canvas.tsx 5 regions
- [ ] Build library.tsx with Author column + filter
- [ ] Build threshold-deep page
- [ ] Build handoff modal with PRD §8.7 verbatim substrate copy
- [ ] Build monitoring page (3 tabs)
- [ ] Build patterns page (5 cards)
- [ ] Wire build → handoff modal → SegmentID minting
- [ ] Wire agent draft review mode banner
- [ ] Wire seed-from-feature-store flow
- [ ] Smoke test demo steps 3-5

## Success Criteria
- [ ] Canvas renders with 5 regions per PRD §8.3 ASCII layout
- [ ] AND-of-OR-groups visible: ≥1 screen capture has 2+ groups + OR rows + AND NOT exclusion (PRD acceptance #4)
- [ ] Inline threshold playground: slider mid-drag visibly updates audience number (acceptance #5)
- [ ] Audience preview band sticky during scroll
- [ ] Substrate B copy verbatim in handoff modal (acceptance #6)
- [ ] Agent attribution line shows on handoff when arriving from draft (Agentic §6.4)
- [ ] Library Author column shows ≥1 agent-drafted row (Agentic §12.5)
- [ ] PRD acceptance #3 met — canvas reads as data tool not brief
- [ ] Demo steps 3-5 walk without dead ends

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Predicate AST shape surprises P-3 catalog data shape | Iterate together; types in @hermes/contracts source of truth |
| Audience-counts.json miss for arbitrary predicate combos | Interpolate via min-cardinality fallback; document in code |
| Slider drag perf with histogram repaint | rAF throttle; histogram is SVG (cheap); audience number debounced 50ms |
| Pickers slide-in interferes with sticky audience band | Pickers are overlay layer; audience band stays beneath |
| Canvas state lost on route change to slide-out | State in URL search params for major switches; rest in component state — acceptable for v1 |

## Security Considerations
- Predicate hash uses stable canonicalisation (sorted keys, normalised values) — no security implications.
- "Build segment" doesn't actually execute any backend call — modal is frontend-only.

## Next Steps
- P-8 reuses predicate-composer + inline-threshold-playground for campaign trigger predicate.
- P-9 routes agent drafts into canvas in review mode.
- P-10 validates demo steps 3-5.
