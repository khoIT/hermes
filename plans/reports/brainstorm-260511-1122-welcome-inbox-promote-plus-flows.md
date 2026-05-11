---
type: brainstorm
date: 2026-05-11 11:22 (Asia/Saigon)
branch: agent_demo
status: approved
related:
  - apps/web/src/modules/welcome/page.tsx
  - apps/web/src/modules/welcome/hermes-noticed-panel.tsx
  - apps/web/src/data/chat/threads/thread-demo-agent-livops-2026.ts
  - apps/web/src/data/chat/multi-turn-registry.ts
prior:
  - plans/reports/brainstorm-260510-1233-welcome-page-cockpit.md (welcome cockpit layout history, if present)
---

# Brainstorm — Promote Hermes Inbox + 2 New Agent Self-Detection Flows

## 1. Problem statement

The agent-first demo path (Path B) hinges on a single `HermesNoticedPanel` card in the right rail of `/welcome`. The card visually competes with `StartSomethingPanel` and `RecentThreadsPanel` for a thin column. Stakeholders may miss the agent-first entry. The "agent runs continuously and surfaces anomalies" claim is unsupported when only 1 card is shown.

**Two intents bundled:**
1. Promote inbox to main columns above `Active Campaigns` (visual prominence).
2. Add 2 more self-detection cards/flows to substantiate continuous-monitoring claim.

**Constraint:** v1 prototype, scripted fixtures only, May-12 stakeholder demo.

## 2. Mechanism understanding (confirmed)

"Agent self-detection flow" = agent surfaces an anomaly card on `/welcome` → click routes user to a sibling chat thread → T1 auto-plays scripted investigation with `tool_call` chips + `provenance` footers → 3 follow-up prompts unfold T2/T3/T4 (build segment → launch campaign → 2-week retrospective). Existing canonical example: `thread-demo-agent-livops-2026` (CFM ARPDAU −7% drift).

Interpretation correct — proceeding with this model.

## 3. Approaches considered

### Layout position (chose A1)
- **A1 · Full-width above Active Campaigns** — strongest agent-first signal · eats vertical space · chosen
- A2 · Left column, stacked above Active Campaigns — less disruption · weaker hierarchy
- A3 · Sticky pinned — too aggressive for analyst cockpit

### Flow shape (chose B1)
- **B1 · Same 4-turn diagnose→segment→campaign→retro** — predictable cadence · chosen
- B2 · Vary by intent (diagnostic / opportunity / forecast) — richer · 2× content cost
- B3 · One full + two T1-only previews — KISS · undercuts "fully walked live" goal

### Subjects (chose C1)
- **C1 · D7 retention drop + Whale recall** — PM-relevant · parallels existing canonical threads · chosen
- C2 · Cross-game pattern + cohort drift — newer narratives · no fixture leverage
- C3 · User-supplied — deferred

### Density (chose D1)
- **D1 · Stacked vertical rows** — keeps current row style · scannable · chosen
- D2 · 3-column tile grid — marketing-flashy
- D3 · Featured + 2 condensed — implies priority that doesn't exist

### Depth (chose E1)
- **E1 · All 3 production-grade** — sustains "real agent" impression · highest cost · chosen
- E2 · A hero + B/C lighter — honest about prioritization · weaker for stakeholder inspection
- E3 · All fully walked live (same as E1 spec) — same outcome

### Detection cadence (chose F1)
- **F1 · Staggered today / yesterday / 2d-ago** — implies 24/7 monitoring · chosen
- F2 · All today — reads as one batch job
- F3 · Severity badges — departs from existing pattern

## 4. Final design

### Layout (page.tsx)
```
HeroStrip
KpiStrip
HermesNoticedPanel        ← full-width · 3 stacked rows · promoted
2-col grid:
  ActiveCampaignsPanel  |  StartSomethingPanel
                        |  RecentThreadsPanel
```

### Card content
| # | Detected | Headline | Routes to |
|---|---|---|---|
| A | 06:14 today | CFM ARPDAU −7% drift (existing) | `thread-demo-agent-livops-2026` |
| B | yesterday 14:20 | D7 retention dropped 4pp · FB-acquired cohort | `thread-demo-agent-d7-fb-cohort-2026` (new) |
| C | 2d ago, ongoing | Top-tier whale recall rate at 38% | `thread-demo-agent-whale-recall-2026` (new) |

### Tool-call shapes rotated (avoid déjà vu)
- A: `query_trino` → `compute_decomp` → `bucket_by`
- B: `query_trino` → `cohort_split(channel)` → `compare_funnels(D1/D3/D7)`
- C: `query_trino` → `spend_distribution(p99)` → `dormancy_signal(top1pct,14d)`

### Thread arcs (each ~480 lines, mirroring existing template)
**Thread B (D7 FB cohort)**
- T1: cohort comparison, drop concentrated in users who saw legacy onboarding
- T2: segment of low-D7 FB users
- T3: rescue campaign (tutorial re-trigger + first-week bonus)
- T4 retro: +3.1pp D7 lift, surprise = lift carried into D14 (forecast exceeded)

**Thread C (whale recall)**
- T1: top-1% spend dormancy traced to 4 named whales post Apr-21 season reset
- T2: high-value-dormant whale segment
- T3: whale concierge campaign (manual outreach + appreciation drop)
- T4 retro: 2 of 4 returned full-spend; partial confirmation + new insight (1 returned pre-outreach → season-reset cyclicality)

## 5. Files affected

**Modify (9)**
- `apps/web/src/modules/welcome/page.tsx` — restructure grid
- `apps/web/src/modules/welcome/hermes-noticed-panel.tsx` — extend `CARDS[]` 1→3 · staggered timestamps · full-width sizing
- `apps/web/src/i18n/dictionary.ts` — 6 new keys (headline+body+cta × 2 cards)
- `apps/web/src/i18n/entity-names.ts` — 2 thread title locales (en+vi)
- `apps/web/src/utils/chat-bootstrap.ts` — seed 2 new threads
- `apps/web/src/data/chat/multi-turn-registry.ts` — register 6 follow-up entries
- `apps/web/src/modules/chat/thread-page.tsx` — 2 auto-play registrations
- `apps/web/src/components/chat-rail/chat-rail.tsx` — 2 T1 map entries
- `apps/web/src/components/chat-rail/restart-demo-chip.tsx` — 2 restart entries

**Create (2)**
- `apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts`
- `apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts`

## 6. Risks + mitigations (frank)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | 3 full arcs = ~18 min demo segment | HIGH | Demo script walks A fully · B/C are clicked only to T1 ("here are two more from overnight"). Depth exists for inspection, not live walk-through. |
| R2 | Same-shape déjà vu across 3 arcs | MEDIUM | Tool-call shapes rotated per arc (Section 4) |
| R3 | Inbox grows ~140→280px · pushes Active Campaigns below fold on 13" laptops | LOW | Row height tightened 80→64-72px |
| R4 | i18n parity for new cards/threads | LOW | 6 dict keys + 2 entity-name entries; standard pattern |
| R5 | Fixture coupling — TARGET_SEGMENT_ID etc. | LOW | New threads define their own segment IDs; do not reuse `seg-cfm-loss-streak-…` |

## 7. Out of scope (explicit, do not creep)
- No sidebar "Inbox" entry
- No backend wiring (catalog-api stays out)
- No unread badge / notification counter
- No real anomaly detection logic (scripted only, consistent with v1)
- No filter/preference UI on the inbox panel

## 8. Success criteria
- `/welcome` renders 3-row inbox above Active Campaigns; no layout regression on other panels
- Each card click → respective thread, T1 auto-plays via existing chat-rail + thread-page mechanism
- T2/T3/T4 plays on scripted follow-up prompts, parity with thread-demo-agent-livops-2026
- Vietnamese toggle shows localized titles + headlines on all 3 cards + 2 new threads
- `pnpm typecheck && pnpm build` passes

## 9. Implementation plan suggestion

Likely 4 phases for `/ck:plan`:
1. **Layout promote + inbox extension** (page.tsx, hermes-noticed-panel.tsx, dictionary)
2. **Thread B authoring** (thread-demo-agent-d7-fb-cohort-2026.ts + plumbing wires)
3. **Thread C authoring** (thread-demo-agent-whale-recall-2026.ts + plumbing wires)
4. **i18n parity + typecheck + visual smoke**

Phases 2 and 3 are independent — candidate for parallel execution.

## 10. Unresolved questions
- None at brainstorm time. Demo script (which cards walked vs parked) deferred to /ck:plan or post-implementation rehearsal.

---

**Status:** approved · ready for `/ck:plan`
