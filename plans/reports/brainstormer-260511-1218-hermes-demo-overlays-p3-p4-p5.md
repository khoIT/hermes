# Hermes Demo Overlays · P3 / P4 / P5

**Date:** 2026-05-11 12:18
**Author:** Khoi (GDS PM) — brainstormed with Claude
**Purpose:** Overlays on existing Hermes surfaces to demo Pre-Read Part 3's five principles in the GDS+Apollo alignment meeting (week of May 12, 2026). No new pages. Live demo, not slides.

---

## Context

- Pre-read: `Dynamic_Segmentation_for_LiveOps_Master_PreRead.html` (in user Downloads).
- Hermes is the prototype that will be the live demo. Branch `agent_demo`.
- Pre-read's Part 3 principles: (1) Intention before mechanism · (2) Generate, don't pick · (3) Show the math · (4) Learn from the portfolio · (5) Curate, don't author.
- Khoi: P1 + P2 already covered by existing Hermes flow. P5 also "quite OK". Reinforcement needed on **P3 (most), P4, P5**.
- Demo spine: multiple threads chained, agents-rail (inbox) is the hub.
- Fidelity: styled fixtures, labelled "illustrative".
- Build appetite: 1–2 days.
- Bonus framing decision from earlier discussion: in Hermes, **Campaign is the product noun** (not "Live TriggerID"). Triggers/Segments are activation modes of a Campaign. This is consistent with current Hermes modules (`campaigns/*`).

---

## Final Bundle

### Phase 1 · P3 Show the math (foundation)
Persistent strip of 4–5 numbers that travels with every Campaign/Segment proposal across chat, segment detail, campaign canvas/prelaunch/monitoring. Same numbers, same labels, three surfaces. Single source of truth in a fixtures file.

| Item | Description | Touches |
|---|---|---|
| 3a | Math strip on segment detail header | `_components/detail-header.tsx`, `match-bar.tsx` |
| 3b | Same strip on campaign canvas + prelaunch + monitoring | `canvas/*`, `prelaunch.tsx`, `monitoring.tsx` |
| 3c | Compact strip in chat `action-card-campaign/segment` header (above content) | `chat/action-cards/*` |
| 3d | "Why this number?" hover/popover (reuse `agent-reasoning-panel.tsx`) on Audience + Lift | `chat/action-cards/*`, segment + campaign headers |
| 3e | Sparkline next to Audience (last 14d) — reuse `sparkline.tsx` | wherever strip renders |
| 3g | "Illustrative" pill in strip when reading from fixtures | new tiny chip in strip |
| F  | Fixture file: one source per Campaign/Segment ID; strip reads from it everywhere | new `data/catalog/campaign-numbers.ts` (or similar) |

Strip metric set (4 chips on narrow surfaces, 5–6 on full pages):
`Audience` (+sparkline) · `Fire rate` · `Cost/day` · `Expected lift (CI)` · `Goal: <4R>` · `Illustrative`

**Visual acceptance:** strip identical in look + numbers across chat card → segment detail → campaign canvas → monitoring. Hover any chip → explanation popover. Skipped: 3f (goal-alignment score) — vibes number, risk of audit-failure under questioning.

### Phase 2 · P4 Learn from the portfolio
Make the cross-game compounding *passive* — surfaced where Studios already look, not on a separate page.

| Item | Description | Touches |
|---|---|---|
| 4a | "Similar in portfolio" rail under every assistant draft (2–3 mini pattern-cards) | `chat/assistant-response.tsx` (after action card) |
| 4b | Portfolio chip in match-bar ("matches a known pattern: CFM Rank Protection") | `segments/_components/match-bar.tsx` |
| 4d | "Forked from <pattern>" attribution line on archetype-card / campaign canvas | `campaigns/_components/archetype-card.tsx` |
| 4e | "Lift across 5 games" mini-bar on `pattern-card` hover | `segments/_components/pattern-card.tsx` |

**Visual acceptance:** assistant draft proposal shows portfolio rail beneath it; clicking "Fork" lands on campaign canvas with "Forked from …" line; hovering a pattern card shows 5-game mini-bar.

### Phase 3 · P5 Curate, don't author (reinforcements)
Small additions to make the curate-not-author posture unmissable in the first 30 seconds of the demo.

| Item | Description | Touches |
|---|---|---|
| 5a | Timestamp + Apollo avatar on every action card ("Proposed by Apollo · 14m ago") | `chat/action-cards/action-card-shell.tsx` + reuse `agent-attribution.tsx` |
| 5b | Inbox count badge in chat-rail header ("3 proposals · 1 drift · 2 awaiting review") | `chat-rail/chat-rail-header.tsx` |
| 5c | Drift chip on one Live campaign in monitoring + scripted drift turn in `thread-demo-agent-livops-2026` | `campaigns/monitoring.tsx` + `drift-badge.tsx` + thread fixture |

**Visual acceptance:** opening the demo lands on chat-rail with the inbox badge visible. Clicking the drift item opens the livops thread to a scripted drift-flag turn. Action cards show "Proposed by Apollo · Xm ago".

### Choreography
1. Chat-rail with inbox badge (5b).
2. Click drift item → livops thread, scripted drift turn (5c).
3. Apollo proposes a fix as action-card-campaign with math strip in header (3c).
4. Hover Audience → "Why this number?" popover (3d).
5. Scroll → "Similar in portfolio" rail; click Fork (4a).
6. Land on campaign canvas with math strip (3b) + "Forked from CFM" line (4d).
7. Jump to second thread (`thread-demo-agent-whale-recall-2026`) — show breadth.
8. End on monitoring view: math strip + 7-day uplift sparkline.

Total demo ≈ 5 minutes, ~7 beats at 20–30s each.

---

## Out of Scope (explicitly)

- New pages or modules.
- Renaming TriggerID → Campaign at the platform / contract layer (that's a meeting ask, not a code change).
- Goal-alignment score chip (3f).
- Real backend wiring; everything is fixtures.

## Risks

| Risk | Mitigation |
|---|---|
| Number inconsistency across surfaces destroys credibility | Single fixture file per Campaign/Segment ID; all surfaces import from it. Enforced by code review. |
| "Illustrative" badge missed by a senior engineer | Strip badge always visible at the right edge; cannot dismiss. |
| Demo runs long if hovers don't trigger reliably | Practice run + fallback "click" affordance behind hovers. |
| Drift script feels staged | Lean into it — pre-read explicitly calls out drift detection; staging is expected. |

## Success Metrics (for the meeting, not the codebase)

- Audience verbalizes "Campaign" not "Trigger" by end of demo.
- At least one verbal nod on D6 (Khoi co-owns Product Layer).
- No more than 1 audience question challenging number credibility ("are those real?").

## Open Questions

- None remaining — all four scoping questions answered (3d in, strip above, 4e in, fixtures prepped).

---

## Next Step

Invoke `/ck:plan` with this report as context. Three-phase plan, each phase visually verifiable and shippable independently.
