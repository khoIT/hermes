# Hermes — Agentic Layer · Design PRD

**For:** Claude Code · prototype extension on top of the existing Hermes zip
**Phase:** Design + working prototype · same hardcoded-data discipline as v1
**Owner:** Khoi · VNG Games GDS · LiveOps Data Platform PM
**Companion to:** `PRD_Hermes_Design.md` (the parent — 18 screens across 4 modules · do not contradict)
**Status:** Working draft

---

## 1. Overview

The parent PRD ships a self-service authoring tool. Studios compose Segments and Campaigns over a Feature Store; the platform mints SegmentIDs and TriggerIDs against two substrates. The interaction model is *human authors, AI assists in the right rail.*

This PRD adds the inverse — *agents draft, humans approve.* It introduces a fifth module, `05 Agents`, plus minimal cross-cutting modifications to modules 03 and 04 so that agent-authored artifacts are recognizable wherever they appear.

The premise is the *Atomic Opportunities* framing: there are far more time-sensitive opportunities in any LiveOps surface than humans can hand-author against. Most go unaddressed because the window closes before anyone notices. Agents that watch continuously, draft proposals, and route them for human approval expand the addressable surface by orders of magnitude — provided the human-in-the-loop contract is tight, transparent, and reversible.

This is design + working prototype. Same discipline as v1: hardcoded data, no real LLM calls, no functional persistence. The screens must read as *agents are real and useful*, not as a chatbot bolted on.

## 2. Three agents in v1

| | What it watches | What it drafts | Where it surfaces |
|---|---|---|---|
| **Insight Agent** | Feature Store drift · segment population shifts · campaign uplift anomalies · untargeted patterns in the event stream | *Opportunities* — concrete proposals citing evidence and a draft artifact | Module 05 inbox · monitoring panels in modules 03 / 04 |
| **Authoring Agent** | Approved opportunities · PM intent statements typed into the canvas | Draft Segments and Campaigns end-to-end (predicate, audience size, journey skeleton, holdout, copy, channel) | Module 05 drafts queue · `agent-drafted` rows in libraries 03 / 04 |
| **Experiment Agent** | Active campaign holdout vs treatment · variant divergence · forecast vs actual | Recommendations: scale to 100% · extend runtime · drop variant · extract derived segment · kill campaign | Campaign monitoring (`16_cmp_monitoring`) · module 05 inbox |

The three agents map cleanly onto the article's *analysis · LiveOps engagement · A/B testing* triplet without re-naming. Each agent has a single, recognizable job; the humans approving them never need to learn a multi-agent coordination model.

A `Studio Agent` slot is reserved for Phase 2 (Studios deploying their own agents with custom briefs). Module 05's settings page shows the slot with a *"Coming in Phase 2"* state — visible commitment, no design effort.

## 3. The approval contract

**Every agent action is a proposal until a human approves.** This is the load-bearing principle and the entire reason a PM trusts the system.

Three resolution paths, exposed on every Opportunity card and every draft artifact:

1. **Approve as-is.** Artifact materializes in the appropriate library (`Segments` or `Campaign`). Named owner = the approving PM. Agent-authored badge persists on the row for audit.
2. **Approve with edits.** Opens the existing canvas (`04_seg_canvas` or `10_cmp_canvas_realtime`) pre-populated with the agent's draft. PM modifies; on save the badge changes to *"Agent-drafted · edited by [PM]."*
3. **Reject.** Modal asks for one of four reasons: *Already covered · Tried before, didn't work · Wrong target · Other.* Reason text becomes part of the agent's audit trail. PM can dismiss without a reason via *"Dismiss without feedback"* — fast path for noisy proposals.

No agent action ever lands as a fait accompli. No batch-approve. No auto-promote-to-active. Approval is per-artifact and explicit.

## 4. Atomic Opportunity card — the load-bearing component

The Opportunity card is to module 05 what the Predicate Composer is to module 03 — if it doesn't read right, nothing else lands. Spec it carefully.

```
┌─ OPPORTUNITY · ag-op-1042 ───────────────────────────── 2h ago ──┐
│                                                                    │
│  "Players in CFM ranked who lose 5+ but never paid are            │  ← serif italic
│   growing 18% week-over-week — no campaign serves them."          │     intent style
│                                                                    │
│  [Window: this week · act by Friday]   [Confidence 0.78]          │  ← amber pill + mono
│                                                                    │
│  ── Evidence ────────────────────────────────────────────────────  │
│  ▸ consecutive_ranked_losses_streak ≥ 5 — population +18% (7d)    │
│    [sparkline]                                                     │
│  ▸ is_paying_user_lifetime = false in this cohort — 91%           │
│  ▸ No active campaign references this combination                  │
│  [open in Explore →]  [open feature →]                            │
│                                                                    │
│  ── Proposed artifact ───────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  NEW SEGMENT  ·  Loss Streak · non-paying · ranked           │ │
│  │  consecutive_ranked_losses_streak ≥ 5 [<1h · B]              │ │
│  │  AND is_paying_user_lifetime = false  [<1h · B]              │ │
│  │  ≈ 23,890 UIDs                                                │ │
│  │                                                                │ │
│  │  NEW CAMPAIGN  ·  Pass Stuck Rescue (variant)                 │ │
│  │  Real-time · event_match_end · 24h cooldown                   │ │
│  │  Action: IAM grant 200 CF Coin + retry banner                 │ │
│  │  Holdout: 90 / 10 · forecast lift +7% D1 retention            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ── Why now ─────────────────────────────────────────────────────  │
│  ▾ Three prior campaigns of similar shape averaged +6.4% D1        │  ← collapsible
│    retention (CFM-407, CFM-409, NTH-202). The cohort grew 18%      │
│    in 7 days, projected to grow another ~12% next week. Acting     │
│    now captures ~31% more impressions than acting on Friday.       │
│                                                                    │
│  Surfaced by Insight Agent · thread #ag-1042                      │
│                                                                    │
│  [ Approve & draft ]  [ Edit before drafting ]  [ Dismiss ]       │
└────────────────────────────────────────────────────────────────────┘
```

**Specifics:**

- *Intent statement* in serif italic, sized like an `04_seg_canvas` intent bar.
- *Window pill* uses amber (`var(--anomaly)`) — pulls from the existing token. Opportunities without time-sensitivity show no pill.
- *Confidence* is mono (`var(--mono)`), shown to two decimals — *0.78*, not 78%. The numeric register signals it's a model output, not marketing copy.
- *Evidence rows* use the same chips and sparklines as Feature Store cards. Reuse components from `feature-store.jsx`.
- *Proposed artifact* renders with the same styling as the library row card it would become — recognizable as a Segment + Campaign pair before the PM clicks anything.
- *Why now* is collapsible and **collapsed by default**. Reduces the card to scan-height. The hidden paragraph cites prior campaigns and projects the actionable window — this is what makes the agent feel competent.
- Three CTAs in the order *Approve · Edit · Dismiss.* Approve is the primary action — deep red (`#f05a22`). Edit is secondary. Dismiss is ghost.

The card is a recurring component used in three places: the inbox (one per row), the opportunity detail screen (one expanded), and embedded in monitoring panels (one inline within `16_cmp_monitoring` when the Experiment Agent has a recommendation tied to a campaign).

## 5. Module 05 — Agents

### 5.1 Nav

```
01 Feature Store · 02 Explore · 03 Segments · 04 Campaign · 05 Agents
   inventory       investigate   compose       activate     supervise
```

`05 Agents` lands rightmost. Same module-tab styling as the existing four. Active-route highlighting unchanged. Module label uses *supervise* — emphasizes the human-over-agent posture.

### 5.2 Inbox (`18_ag_inbox`) — module landing

The default landing screen for module 05. Nine seed opportunities + three drafts + two experiment recommendations make the inbox feel populated.

**Header stat strip:** *"9 opportunities · 3 drafts pending review · 2 experiment recommendations · 31 actions this week."* Stat strip styling matches existing module landings.

**Tabs (top-of-page):**
1. *Opportunities* (default · n=9) — Insight Agent surfaced
2. *Drafts* (n=3) — Authoring Agent drafts awaiting approval
3. *Recommendations* (n=2) — Experiment Agent recommendations on active campaigns
4. *Activity* — chronological agent action log

**Filter rail (left, on Opportunities tab):**
- Agent (Insight · Authoring · Experiment)
- 4R goal (Retain · Revenue · Reactivate · Recruit)
- Game (CFM · NTH · TF · COS · PT)
- Window (today · this week · this month · no time pressure)
- Confidence (≥0.8 · ≥0.6 · all)

**Body:** vertical list of Opportunity cards (§4). Sort: by window urgency, then by confidence. Each row is a full Opportunity card — list and detail use the same component, just rendered at different widths.

**Empty state for Drafts and Recommendations tabs** — short, friendly: *"No drafts pending. The Authoring Agent waits for an approved opportunity or a typed intent."*

### 5.3 Opportunity detail (`19_ag_opportunity_detail`)

Same Opportunity card at full width with two additions:

- *Evidence panel expanded* — full-width charts (audience size over 30d, predicted vs actual for the cited prior campaigns), event-stream samples, link-out chips to Explore and Feature Store.
- *Agent thread* — a chronological log of the agent's reasoning steps, expressed as terse mono lines:
  ```
  06:14:02  scan       feature-drift cycle started
  06:14:18  detect     consecutive_ranked_losses_streak.population_p90 +18% (7d)
  06:14:22  cross-ref  no active campaign references this feature ≥ 5 + non-paying combo
  06:14:31  match      3 prior campaigns of similar shape — avg lift +6.4%
  06:14:39  draft      proposed segment + campaign artifact
  06:14:42  surface    opportunity ag-op-1042
  ```
  This is the *transparency artifact* — what the agent looked at, in what order, to reach the recommendation. PMs do not need to read it for every approval, but they need to be able to.

### 5.4 Drafts queue (`20_ag_drafts`)

List view of agent-authored Segments and Campaigns awaiting review. Each row shows:
- Artifact type chip (Segment · Campaign)
- Mono ID + serif italic display name
- *Drafted from opportunity ag-op-NNNN* link
- *Drafted by Authoring Agent · 4h ago*
- Estimated impact (audience size or forecast lift)
- Quick actions: *Open · Approve · Reject*

Clicking *Open* navigates to the existing canvas (`04_seg_canvas` or `10_cmp_canvas_realtime`) in *agent-draft review mode* — same canvas, same predicate composer, same Build/Activate buttons, with a banner across the top:

```
  ▸ Reviewing agent draft. Edit freely. Approving without edits keeps the
    "Agent-drafted" badge; saving with edits adds your name as co-author.
```

This banner replaces the intent ribbon while in review mode. Once the PM saves, banner disappears.

### 5.5 Activity log (`21_ag_activity`)

Chronological feed of every agent action across the workspace. Filterable by agent, action type (proposed · drafted · recommended · auto-archived), outcome (approved · approved-with-edits · rejected · dismissed · expired). One row per action. Used for governance and post-hoc audit; not load-bearing for the demo.

### 5.6 Settings (`22_ag_settings`)

Per-agent enable/disable toggle. Frequency picker (continuous · hourly · daily · weekly scan). Scope picker (which games, which 4R goals). One section per agent. The Studio Agent slot is shown with `Coming in Phase 2 ·` empty state.

No training UI. No model picker. No prompt editor. Agents are configured behavior, not configurable behavior — this is by design.

## 6. Cross-cutting modifications to existing modules

### 6.1 Library rows (modules 03 and 04)

Add an *Author* column to library row cards (§8.2 and §9.3 in the parent PRD). Three values:
- *Hand-built* (default — matches existing rows; shows nothing or a person avatar)
- *Agent-drafted* (mono pill `agent` in deep red, with agent name on hover)
- *Agent-edited* (mono pill `agent · ed` indicating PM edited an agent draft)

Add an *Author* filter to the left rail filter list. Filter values match the chips above.

### 6.2 Right-rail attribution (modules 03 and 04 canvases)

The existing right rail's *Suggested next* AI block (§8.3 region 4 of the parent PRD) gets an attribution footer:

```
Suggested by Insight Agent · open thread →
```

Click-through opens the agent's reasoning in a slide-in panel (same chrome as the Feature Store slide-out). This makes existing AI assist legible as agent-authored without changing where it surfaces.

### 6.3 Experiment Agent panel on monitoring (`16_cmp_monitoring`)

The parent PRD's §9.10 already includes *"Suggested follow-ups — AI-generated."* Formalize that block as the **Experiment Agent panel.**

```
┌─ EXPERIMENT AGENT · 2 recommendations ──────────────────────────┐
│                                                                   │
│  ▸ Scale to 100%                                                 │
│    Holdout vs treatment shows +8.2% D1 retention, p=0.02.       │
│    Forecast at 100% rollout: +11k uplifted players / week.       │
│    [Approve & scale]  [Edit before scaling]  [Dismiss]           │
│                                                                   │
│  ▸ Extract derived segment                                        │
│    Variant A is showing +15% D7 spend than holdout.              │
│    Recommend extracting "variant_A_responders" as derived         │
│    segment for whale-track recruitment.                           │
│    [Approve & extract]  [Edit before extracting]  [Dismiss]       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

Renders below the holdout-vs-treatment chart, above the operational health section. Same Approve / Edit / Dismiss contract as Opportunity cards.

### 6.4 Handoff modals — agent attribution line

The Segment and Campaign handoff modals (`06_seg_handoff`, `15_cmp_handoff`) get a conditional attribution line when the artifact was agent-drafted:

```
  Drafted by Authoring Agent · approved by Khoi · thread #ag-1042
```

Renders below the SegmentID/CampaignID block, above the *What happens next* section. Hidden for hand-built artifacts (no behavior change).

## 7. Demo content

Extend `data.js` with the following hardcoded fixtures:

### 7.1 Nine opportunities (Insight Agent)

Each opportunity is one object with: `id`, `agent: 'insight'`, `surfaced_at`, `confidence`, `window`, `intent` (serif italic copy), `evidence` (array of 2-4 rows), `proposed` (Segment + Campaign or just Segment), `why_now` (paragraph), `game`, `goal_4r`, `status` (`open` / `approved` / `dismissed`).

Five seed opportunities tied to existing demo campaigns:

1. **CFM Loss Streak non-paying growth** (open · high confidence · this week) — proposes the canonical Pass Stuck Rescue variant from §4. Anchors the demo flow.
2. **NTH Whale-at-risk drift** (open · medium · this week) — `last_login_days` p90 shifted +2.1d for spend-tier=whale; proposes Whale Comeback Campaign.
3. **TF-1 Football Hub returning coaches** (open · high · today) — 14-day per-user clock pattern not yet drafted; proposes new Real-time campaign with `event_session_start` trigger and tenure predicate.
4. **COS-3 step-up tier-1 → tier-4** (open · medium · no time pressure) — within-session purchase pattern detected; proposes mid-session step-up Trigger.
5. **CFM Pass Stuck cooldown experiment** (open · low · this month) — current 24h cooldown may be too generous; proposes A/B with 12h cooldown variant.

Plus four lower-priority seed opportunities (one per remaining game, plus one cross-game) to populate the inbox at scan-density.

### 7.2 Three Authoring Agent drafts

1. **Pass Stuck Rescue · variant B** (drafted from opportunity #1, status `pending review`)
2. **NTH Whale Comeback Campaign** (drafted from opportunity #2, status `pending review`)
3. **TF-1 Football Hub Real-time campaign** (drafted from opportunity #3, status `pending review · edits applied by Khoi`)

### 7.3 Two Experiment Agent recommendations

1. **CFM-407 Pass Stuck · scale to 100%** — tied to monitoring screen (§6.3 layout)
2. **NTH-202 Whale Comeback · extend runtime** — current p=0.34, agent recommends 4 more days

### 7.4 Three rejected opportunities (for activity log)

1. *"Lapsed players in PT — propose 30-day recall push"* — rejected: *Already covered* (PT-7 active)
2. *"COS Casual Player segment — propose ad export to Meta"* — dismissed without feedback
3. *"CFM gem-balance threshold drop"* — rejected: *Tried before, didn't work*

This populates the *Activity* tab without designing it deeply.

## 8. Files to add / modify

```
NEW:
  src/agents.jsx               — module 05 (inbox, opportunity detail, drafts, activity, settings)

MODIFIED:
  src/app.jsx                  — add 5th nav tab and route handling
  src/segments.jsx             — author column in library, attribution in right rail, agent-draft banner
  src/campaigns.jsx            — author column in library, Experiment Agent panel on monitoring,
                                 agent-attribution line in handoff modal
  src/data.js                  — add OPPORTUNITIES, AGENT_DRAFTS, AGENT_RECOMMENDATIONS, AGENT_ACTIVITY arrays
                                 — add author field to existing SEGMENTS and CAMPAIGNS rows (≥1 of each as
                                   "agent-drafted")
  src/shared.jsx               — new components: <OpportunityCard>, <AgentBadge>, <AgentAttribution>,
                                 <AgentReasoningPanel>, <ApproveEditDismiss>

UNCHANGED:
  src/feature-store.jsx        — agentic layer reads from Feature Store but does not modify it
  Hermes.html                  — no shell changes; new module is a new tab, not a new page
```

## 9. Visual language — additions

Match the parent PRD's existing palette and tokens. Three additions:

- **Agent badge color.** Reuse the existing deep red `#f05a22` for the `agent` mono pill (signals first-class status). The `agent · ed` pill uses `#f05a22` outline only (signals human-edited).
- **Atomic Opportunity window pill.** Amber `var(--anomaly)` for time-sensitive windows; no pill for evergreen opportunities. Reuses the existing anomaly token — no new color.
- **Agent thread mono block.** Same mono register as the handoff modals. Distinguishes agent reasoning from product copy at a glance.

No new fonts. No new accent color. No emoji. No avatars for agents — they are systems, not people.

## 10. Demo flow for the prototype

A 4-minute walkthrough Khoi runs after the parent PRD's 10-minute demo, to show the agentic layer in motion. Adds these steps:

| # | Action | Screen | Earns |
|---|---|---|---|
| 10 | Click `05 Agents` nav tab | `18_ag_inbox` | Module 05 lands populated |
| 11 | Open the CFM Loss Streak opportunity | `19_ag_opportunity_detail` | Atomic Opportunity card recognizable; evidence + agent thread make it real |
| 12 | Click *Approve & draft* | → `20_ag_drafts` (briefly) → `04_seg_canvas` in agent-draft review mode | Approval contract is one click; canvas reuse is visible |
| 13 | Click *Build segment* on the agent-drafted predicate | `06_seg_handoff` | Handoff modal shows *"Drafted by Authoring Agent"* attribution |
| 14 | Open `16_cmp_monitoring` for CFM-407 | `16_cmp_monitoring` | Experiment Agent panel surfaces *Scale to 100%* recommendation inline |

If cut for time, drop step 14. Steps 11 and 12 are the load-bearing ones — they answer *"what does an agentic LiveOps tool actually look like?"*

## 11. What NOT to design

- Real LLM calls or any backend. Agents are hardcoded data, full stop.
- Agent training, fine-tuning, prompt-editing, or model-picker UI.
- Agent-to-agent coordination flows. Each agent acts independently.
- Multi-modal data ingestion (Discord, support tickets, creative). Phase 2.
- Studio Agent custom layer. Slot in `22_ag_settings` shows *Coming in Phase 2.*
- Agent chat / conversational UI. The interaction model is *proposal review*, not chat.
- Auto-approve / batch-approve. Every approval is per-artifact.
- Activity-log analytics dashboards. The log exists; analytics on top of it are out of scope.

## 12. Acceptance criteria

The agentic prototype is complete when:

1. The 5th module tab `05 Agents` lands in nav with active-route highlighting matching the existing four.
2. `18_ag_inbox` renders nine populated Opportunity cards, three drafts, and two recommendations across the four tabs.
3. The Opportunity card (§4) renders all six regions: intent · window/confidence · evidence · proposed artifact · why-now (collapsed by default) · approve/edit/dismiss.
4. Approving an opportunity (step 12 of the demo flow) routes to `04_seg_canvas` in agent-draft review mode with the predicate pre-populated.
5. Library rows in `03_seg_library` and `09_cmp_library` show the *Author* column with at least one *agent-drafted* row visible without scrolling.
6. The Experiment Agent panel (§6.3) renders on `16_cmp_monitoring` with two recommendations and Approve/Edit/Dismiss CTAs.
7. The agent attribution line (§6.4) renders on at least one handoff modal in the demo flow.
8. Visual language matches the parent prototype — no new palette, no new fonts, no avatars-for-agents.
9. All copy uses serif italic for intent statements, mono for IDs and agent threads, Inter for body.
10. Hardcoded data only. No fetch calls. No simulated delays meant to feel like LLM latency. Snappy navigation.

## 13. Open questions (do not block prototype)

1. **Confidence calibration.** Hardcoded confidence values today; in production, how is this computed? Likely from the Authoring Agent's pattern-match score against prior campaigns. Resolved when the real agent ships.
2. **Window urgency math.** *"Act by Friday"* is hand-written today; in production, derived from window-of-actionability × cohort growth rate × historical-lift-decay. Out of scope for this PRD.
3. **Reject reasons learning.** The four reject categories are designed to be reused as agent training signal. Whether they feed back into the Insight Agent's surfacing logic, the Authoring Agent's drafting logic, or both — open question. UI does not commit.
4. **Studio Agent contract.** When Phase 2 ships, what's the API a Studio uses to deploy a custom agent? Out of scope for v1 prototype — slot is reserved, contract is not designed.
5. **Multi-modal ingestion.** Reddit / Discord / CS tickets / internal meeting notes — the article's pillar 2. Not in v1; the substrate question (do these become first-class features in the Feature Store, or a parallel ingestion path?) needs its own PRD.

## 14. References

- `PRD_Hermes_Design.md` — parent PRD, the substrate this layer extends. Do not contradict.
- `Hermes_Demo_Data.md` — feature catalog and event catalog the agents reference. All evidence chips on Opportunity cards must cite features that exist there.
- *From ThinkingData to ThinkingAI* (Chase Shi · May 2026) — the Atomic Opportunities frame and the three-agent decomposition are derived from Chris Han's articulated thesis.
- Decision Intelligence Platform PRD — the four model families (Value · Risk · Responsiveness · Intent) the agents will eventually operate over. v1 prototype does not depend on this; v2 does.

---
