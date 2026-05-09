# Hermes — Player Engagement Platform · Design PRD

**For:** Claude Design · visual mockup creation
**Phase:** Design-only · no functionality, no real data
**Owner:** Khoi · VNG Games GDS · LiveOps Data Platform PM
**Companion to:** *Dynamic Segmentation for LiveOps · Master Pre-Read* (Hawkins, May 2026)
**Companion data:** `Hermes_Demo_Data.md` — feature catalog, event catalog, 5 representative campaigns
**Status:** Working draft · alignment meeting May 12

---

## 1. Overview

Hermes is the Studio-facing product layer for VNG Games' LiveOps platform. It serves five game studios (PTG pilot in June, then CFM, NTH, TF, COS) and replaces the current ticket-driven, engineering-mediated workflow with self-service authoring.

The mockup must do three jobs in the same screens:

- **Show LiveOps PMs an experience they want.** Plain-language intent, AI-drafted predicates, threshold playgrounds with live audience math, no SQL, no dropdowns over a 100-feature registry.
- **Make the architectural commitments tangible to engineering reviewers.** Two substrates (Apollo TEE + Temporal for real-time; GDS Hatchet + Trino + Iceberg for batch) bridged by a shared Feature Store with a Semantic Management Layer. Two interface contracts: SegmentID and TriggerID.
- **Anchor the May 12 alignment meeting.** Khoi (GDS PM) and an Apollo Eng Lead co-own the build of this product layer. The mockup is what the meeting reacts to.

## 2. The two technical contracts

The architectural fact that anchors the platform — but **not** the UX framing:

| | Segment | Live Trigger |
|---|---|---|
| Output ID | `SegmentID` (e.g. `seg-cfm-ss1-weapon-owners-2026`) | `TriggerID` (e.g. `trg-cfm-pass-stuck`) |
| Output payload | Frozen UID list in `state_user_segments` | Registered evaluator config in `JourneyDB` |
| Substrate | B · Hatchet + Trino + Iceberg | A · Apollo TEE + Temporal |
| Evaluation | One-shot at as-of timestamp, or scheduled rebuild driven by a campaign | Per Kafka event arrival |
| Latency | Minutes to hours | Sub-second to seconds |
| Apollo consumes via | Activation API for channel delivery | TEE evaluation set + Temporal workflow spawn |

**These are technical contracts between GDS and Apollo, not top-level Studio objects.** SegmentID is a first-class Studio concept because UID lists have life beyond any one campaign (ad export, ML training, scheduled push). TriggerID is *minted as a side effect* of authoring a real-time campaign — it's the platform's handoff to Apollo, surfaced in the campaign launch confirmation, but a Studio never authors a "Trigger" as a standalone object.

This collapse is deliberate. Treating Trigger as a peer of Segment in the UX would force every PM to learn a Segment-vs-Trigger-vs-Campaign mental model before they could ship anything. Mature LiveOps tools (Braze, Iterable, Apollo's own existing Journey concept) all model the entry condition as a property of the campaign, not a separate object. Hermes follows that pattern. The architectural commitments are still visible — at campaign launch, the handoff confirmation modal shows whichever IDs (SegmentID, TriggerID, or both) got minted, with the substrates named explicitly.

## 3. Audience

**Primary:** GS LiveOps PMs at PTG, CFM, NTH, TF, COS. Non-technical authors of campaigns. Think in player outcomes, not predicates.

**Secondary:** Hawkins, GDS leadership, Apollo Eng leadership, LOE initiative team. Engineering reviewers who need to recognize their architecture in the screens.

The mockup must speak to both audiences in the same screens. Studios should see *"I get it, I can use this."* Engineers should see *"yes, that is what my team is building — the IDs, the substrates, the consumer paths are all right."*

## 4. Visual language

Hawkins-derived. Serif italic for intent statements and headings. Mono for technical surfaces — feature names, predicate language, IDs, substrate copy. Inter for body. Amber for anomalies and drift warnings; deep red `#f05a22` for active campaigns and accent. The current Hermes prototype's tokens, components, and shell are the canonical visual reference — match it.

The Segment authoring canvas leans into the **data-tool register**, not the marketing-brief register. References: Mode, Looker, Hex, Mixpanel — query-composer feel where the audience number is the primary feedback signal and the predicate is the composition surface. The Campaign authoring canvas leans into a different register — it's where intent, hypothesis, action design, and goal selection live, so it's allowed to feel more like a brief.

---

## 5. Information architecture

### 5.1 Nav

```
01 Feature Store · 02 Explore · 03 Segments · 04 Campaign
   inventory       investigate   compose         activate
```

### 5.2 Mental model

- **Feature Store** is the inventory and the bridge between substrates. Atomic primitives both substrates share.
- **Explore** is the perpendicular discovery surface. Drives hypothesis generation. (Deferred to nav-only for May 12; not load-bearing for the alignment decisions.)
- **Segments** is the population filter module. Pure predicate composition over Feature Store assets. Output: SegmentID.
- **Campaign** is the activation module. Picks an audience (Segment or real-time event entry), wraps it with action / payload / journey / channel / holdout / goal. Output: TriggerID minted at launch if real-time.

### 5.3 Cross-module routing

| From | To | Trigger |
|---|---|---|
| Feature Store detail | Explore | "Investigate this metric" |
| Feature Store detail | Segments | "Use in segment" |
| Explore cohort view | Segments | "Save as audience" |
| Segments library | Campaign | "Use in campaign" CTA on row |
| Segments library | Campaign | "Push this segment now" → Campaign with One-time push pre-set |
| Campaign monitoring | Segments | "Open underlying segment" link |
| Campaign journey branch | Segments | "Export branch as derived segment" (manual) |
| Campaign monitoring | Explore | "Investigate fire-rate drop" → Explore with time window pre-set |

---

## 6. Module 01 — Feature Store

### 6.1 Purpose

The inventory of features available to both substrates and the configuration surface for the Semantic Management Layer. Serves three audiences simultaneously: Studios browsing what's available, GDS analytics owners managing definitions, engineering reviewers verifying that the registry is real and self-service.

Content for these screens is specified in `Hermes_Demo_Data.md` Part 1 — 67 features across 9 domains.

### 6.2 Library (`01_fs_library`)

**Header stat strip:** *"127 features · 38 hot tier · 56 warm · 33 cold · 12 added this month."* The tier counts make the two-substrate commitment ambient on the landing screen.

**Group-by control:** by domain (Engagement · Monetization · Identity · Predictive · Lifecycle · Gameplay · Inventory · Social · External) · by tier (hot / warm / cold) · by owner · by used-in-prod · none.

**Filter rail (left):**
- Type (Counter · Streak · Score · Tag · Boolean · Tuple · Array)
- Latency class (`<1s` hot · `<1h` warm · `<1d` cold)
- Status (Active · Beta · Deprecated)
- Owner

**Feature row card content:**
- Mono name (`consecutive_ranked_losses_streak`) and serif italic display name
- Type chip
- Latency badge with substrate icon — `[<1s · A]` or `[<1h · B]` or `[<1d · B]`. Dual-tier features show both badges.
- Owner avatar
- 7-day distribution sparkline
- "Used by N segments · M campaigns" backlink count
- Freshness gauge (last successful materialization)

**Entry points strip (above list):** Browse by domain (default) · Register a new feature (CTA only — no form for design phase) · Recently added · Drift detected.

### 6.3 Detail (`02_fs_detail`)

**Header:** feature name in both registers, owner, type chip, latency badge, status, *"Edit definition"* affordance.

**Three tabs:** Overview · Lineage · Used By.

**Overview tab — the Semantic Layer made literal:**
- Definition block — feature definition shown side-by-side as expr-lang (Substrate A target) and dbt / Trino SQL (Substrate B target). Mono. **One definition compiles to both substrates** — this is the Semantic Management Layer's whole pitch.
- Type and storage row: *"Counter, integer, served from Redis online tier (hot) and Iceberg offline tier"*
- Distribution: full-width 28-bin histogram with p50 / p90 / p99 markers
- Recent values: sample player UIDs and current values
- Materialization status: last refresh, freshness SLA, recent runs

**Lineage tab:** upstream tables / events / Kafka topics → computation pipeline → downstream segments and campaigns.

**Used-by tab:** tables of segments and campaigns referencing this feature (transitively for campaigns via their segments / triggers).

**Right rail (sticky):** *Use in segment* · *Investigate in Explore* · related features in domain.

**Showcase feature for the demo:** `consecutive_ranked_losses_streak`. It has dual-tier latency (`<1s · A` and `<1h · B`), is referenced by the canonical demo campaign (CFM-13 Pass Stuck Rescue), and visually demonstrates the Semantic Layer's "one definition, two materializations" commitment.

---

## 7. Module 02 — Explore (deferred for May 12)

Investigation surface — anomaly landing, event browser, funnel and retention analytics, per-user timeline, hypothesis save / library. Nav-only for the alignment meeting; not load-bearing for the decisions on the table.

The cross-module CTA *"Save as audience"* on cohort views routes to module 03 with the predicate pre-populated.

---

## 8. Module 03 — Segments

### 8.1 Purpose

Segments is where Studios compose populations using features from the Feature Store. The fundamental object is a **Segment** — a named UID list with a predicate, an as-of timestamp, an owner, and a history.

A Segment is just a predicate definition. When the Studio clicks Build, the platform mints a SegmentID at that moment — a frozen UID list materialised in `state_user_segments`. Re-evaluation later happens either through manual rebuilds (PM clicks Build again), through scheduled campaigns that consume this segment (the campaign drives the rebuild cadence), or through a "schedule rebuild" toggle on the segment's monitoring page (for RFM-dashboard-style standalone monitoring).

This is the SQL view / materialised view distinction. The definition is one thing; the materialization cadence is a separate decision made later, by whoever's consuming. The authoring canvas focuses on the definition.

### 8.2 Library (`03_seg_library`)

**Header stat strip:** *"31 segments · 23 active · 8 in draft · 6 derived from journey branches · 12 with drift this week."*

**Default group-by:** by 4R goal (Retain / Revenue / Reactivate / Recruit / unset).

**Group-by control:** Goal (default) · Owner · Used-in-campaign (yes / no) · Type (Hand-built · Derived from journey · Derived from Explore) · None.

**Filter rail (left):**
- Goal (4R)
- Owner
- Status (Active · Stale · Drift detected)
- Has open campaigns? (yes / no / any)
- Last build (today / this week / this month / older)

**Row card content:**
- Name in two registers — serif italic display, mono technical
- Goal badge (4R)
- Type chip (Hand-built · Derived from journey · Derived from Explore)
- Last as-of timestamp · audience size at that snapshot
- 7-day audience-size sparkline (if rebuild scheduling on)
- Owner + last edit
- "Used by N campaigns" backlink

**Entry points strip:** Start from a goal · Start from an audience pattern (Audience Pattern Library) · Start from a feature (Feature Store) · Continue a draft.

### 8.3 Authoring canvas (`04_seg_canvas`)

The canvas is the load-bearing screen of the entire prototype. Five regions, top to bottom:

```
┌─ INTENT (collapsible note, hidden by default) ────────────────────────┐
│  ▸ Intent: "Players in CFM ranked..."                  [edit] [hide]  │
└─────────────────────────────────────────────────────────────────────────┘

┌─ AUDIENCE PREVIEW (sticky, live) ──────────────────────────────────────┐
│  23,890 UIDs    ≈ 1.9% of MAU · ≈ 8.2% of CFM ranked active           │
│  [Show breakdown ▾]                                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─ PREDICATE COMPOSER ───────────────────────────────────────────────────┐
│  [Group 1 · match ANY of these]                                        │
│    consecutive_ranked_losses_streak  [<1h · B]  ≥  5                  │
│    OR  mmr_drift_7d  [<1d · B]  <  −30                                │
│    [+ Add OR row]                                                      │
│                                                                         │
│  AND                                                                   │
│                                                                         │
│  [Group 2 · match ALL of these]                                        │
│    is_paying_user_lifetime  [<1h · B]  =  false                       │
│    account_age_days  [<1d · B]  ≥  30                                 │
│    [+ Add condition]                                                   │
│                                                                         │
│  AND NOT                                                               │
│    is_test_account  [<1d · B]  =  true                                │
│                                                                         │
│  [+ Add new group · AND]    [+ Add exclusion · AND NOT]               │
└─────────────────────────────────────────────────────────────────────────┘

┌─ RIGHT RAIL ──────────────────┐
│  FEATURES IN USE · 4          │
│  PATTERN REFERENCE            │
│  HYPOTHESIS REFERENCE         │
│  SUGGESTED NEXT (AI)          │
└────────────────────────────────┘

[Bottom action bar]
```

**Region 1 — Intent note (collapsible, hidden by default).** A small ribbon at the top showing the intent statement that seeded this segment. Click to expand into an editor; click again to collapse. Hidden by default once the segment has a draft predicate — the canvas is for composing, not for staring at intent. AI assist surfaces in the bottom bar of this collapsed strip when the intent is editable.

**Region 2 — Audience preview band (sticky, live).** Always visible. Shows current matched UID count + percentage of MAU + percentage of relevant active sub-population. Pulses subtly when the number changes. Click "Show breakdown" → expands in place to lifecycle / country / spend-tier breakdown bars. Stays expanded across edits if the PM left it open.

This is the centerpiece of the data-tool feel. The PM steers predicates against this number. It must always be visible while editing.

**Region 3 — Predicate composer.** AND-of-OR-groups model:
- A predicate is a list of *match groups*, AND'd to each other
- Each group contains one or more rows, OR'd internally (single-row groups behave as plain AND conditions)
- Exclusions are AND NOT'd to the whole predicate, never inside a group

Each predicate row carries:
- Feature name (mono pill, clickable for swap — see 8.4)
- Latency badge (`<1s · A`, `<1h · B`, `<1d · B`) inherited from the feature's tier
- Operator (smart defaults by feature type)
- Value (clickable to open inline threshold playground — see 8.5)
- Three-dot menu: *Why was this picked?* · *Pin · Replace · Remove*

**Region 4 — Right rail.** Collapsible. Four sections:
- *Features in use* — list of features currently referenced; each clickable to Feature Store slide-out detail
- *Pattern reference* — if the segment was seeded from an Audience Pattern, the source pattern with link back
- *Hypothesis reference* — if seeded from an Explore investigation, the source hypothesis with link
- *Suggested next* — AI-driven, refreshing as the predicate changes: *"Segments like yours often add: `tenure_days_total`, `gem_balance_log10`, `mmr_drift_3d`."* One-click add. This makes the canvas feel like a discovery surface rather than a form.

**Region 5 — Bottom action bar (sticky):**

```
Save draft · Backtest · Preview UID list                Build segment →
                            Compiles to Substrate B · Hatchet · BuildSegmentWorkflow
```

The mono substrate copy near the Build button keeps the architectural commitment ambient at every save.

### 8.4 Inline feature swap

Click any feature pill in a predicate row → mini popover opens in place. Contents:

- Current feature card (name, latency, owner, mini histogram)
- *"Swap for similar"* — 3-5 AI-ranked alternatives (similar shape, same domain, frequently co-used)
- *"Browse Feature Store"* link — opens Feature Store catalog as slide-out without leaving the canvas

One click in the swap list replaces the feature in the row, rebuilds the operator/value defaults appropriately, and updates the audience preview.

### 8.5 Inline threshold playground

Click any value in a predicate row (e.g. the `5` in `≥ 5`) → the value cell expands inline into a threshold playground:

- Mini histogram for the chosen feature (full row width, ~32px tall)
- Slider thumb directly over the histogram
- Numeric input synced to the slider
- Matched-region color sweeps across the histogram as the slider moves
- Audience preview band at the top updates live
- Sensitivity hint below the slider: *"At ≥3: 47k. At ≥5: 24k. At ≥7: 8.4k. Steep drop between 5 and 7 — choose carefully."*
- Apply / Cancel buttons

The point is to convey liveness — the slider mid-drag, the audience number mid-update, the matched-region color animating. This screen state must be in the design as a separate file.

A standalone, deeper Threshold Playground page (`05_seg_threshold_deep`) exists for the case where the PM lands here directly from a Feature Store metric ("Use in segment" with no segment open yet) — it's the same playground but in a full-page version with an empty canvas waiting for the threshold choice. Used rarely; the inline path is what 95% of authoring uses.

### 8.6 Pickers

Three pickers are reachable from the *"Add condition / exclusion / new group"* affordances:

- **Condition Picker** — three modes (Browse by category / Search / AI assist). Cards show feature name, type, latency, mandatory mini histogram, distribution stats, owner. Smart suggestions panel: *"Segments like this also include: …"*
- **Exclusion Picker** — same as Condition plus a Templates strip: *Exclude paying users · test accounts · opt-outs · churned · active in another campaign.*
- **OR-row Picker** — appears when "+ Add OR row" is clicked inside a group. Same as Condition Picker but the suggestions panel narrows to "features that pair well with the existing rows in this group."

All three open as slide-ins from the right; do not navigate away from the canvas.

### 8.7 Handoff confirmation modal (`06_seg_handoff`)

When the Studio clicks Build segment, a confirmation modal appears (not a toast — modal that cannot be skipped). This screen is one of the load-bearing artifacts for the May 12 alignment meeting.

```
  ✓  Segment registered

     SegmentID  seg-cfm-loss-streak-non-paying-2026-0508-a3f9    [copy]

     ──── What happens next ────

     1.  Hatchet starts BuildSegmentWorkflow                 · queued
     2.  Predicate compiled to Trino SQL over Iceberg        · ~2 min
     3.  UID list materialised to state_user_segments        · ~3 min
     4.  Activation API exposes list to Apollo channels      · ready

     Substrate B · Hatchet + Trino + Iceberg
     Apollo consumes via: GET /segments/{id}/uids

     [Open in monitoring]   [Use in campaign]   [Done]
```

The mono copy naming the substrate, workflow names, and consumer-side path is load-bearing. Validate verbatim with ThangLV2 before design ships.

### 8.8 Monitoring (`07_seg_monitoring`)

Three tabs: Overview · Monitoring · Used by.

**Overview tab** — segment metadata, predicate as plain-English paragraph and as mono predicate stack, current snapshot, materials shelf read-only.

**Monitoring tab** — answers *"what does this audience look like over time?"*
- Top stat strip: Current size · 7d delta · 30d delta · Drift status · Last build
- Audience size over time chart (configurable window 7d / 30d / 90d / all). Annotated with rebuild markers and campaign fire windows. Shaded "expected envelope"; red marker for any day outside it.
- *Schedule rebuild* toggle (default off) — when on, the segment rebuilds on a chosen cadence (hourly / 6h / daily / weekly). For RFM-dashboard-style standalone monitoring without needing a campaign.
- Below: 2×2 panel grid:
  - Member churn-in / churn-out per day (bar chart)
  - Attribute drift (sparkline per predicate feature)
  - Campaigns consuming this segment (table with link to campaign monitoring)
  - Derived sub-segments (table with link)

**Used-by tab** — campaigns currently consuming, campaigns that historically consumed, derived sub-segments.

### 8.9 Audience Pattern Library (`08_seg_patterns`)

Audience archetypes only (intervention archetypes live under Campaign):

- Loss Streak Audience
- Whale at Risk
- Lapsed Mid-Spender
- New Player D2 Drop-off
- Shop Window Shopper

Each card: predicate template, typical audience size at default thresholds, lift profile of campaigns that have used it, *"Use this pattern"* CTA → opens build canvas pre-populated.

---

## 9. Module 04 — Campaign

### 9.1 Purpose

Campaign wraps an audience with an action, holdout, and goal. The trigger machinery — event source, real-time predicate, cooldown, frequency cap — lives here, inside campaign authoring, as the entry-condition section of a real-time campaign.

The fundamental object is a **Campaign** with a 4R goal, an audience definition, a trigger type, an action, optional journey, optional holdout, and (post-launch) a stream of measured outcomes. Campaigns mint TriggerIDs (for real-time campaigns) and reference SegmentIDs (for segment-backed campaigns) — both surface in the launch handoff modal.

### 9.2 Trigger types — three

The Campaign canvas opens with a segmented control selecting one of three trigger types:

1. **One-time** — single fire on a Segment. Used for one-shot mailings, surveys, alerts. Wizard: Audience → Schedule (send when ready / on specific date) → Action → Activate.
2. **Scheduled** — recurring fire at cadence on a Segment. Used for weekly newsletters, daily nudges. Wizard: Audience → Schedule (cadence) → Action → Holdout → Activate.
3. **Real-time event-triggered** — fires per-player at event arrival, with predicate over Feature Store assets. Used for IAM popups, mid-session offers, the CFM-13 through CFM-18 archetypes. Wizard: Audience (eligibility pool, optional) → Schedule (date range) → Event trigger predicate → Action → Holdout → Activate.

The trigger type configures which canvas regions are visible — One-time hides the Event Trigger block; Real-time shows it.

### 9.3 Library (`09_cmp_library`)

**Header stat strip:** *"23 active · 8 in draft · 12 monitoring · 4 ended this month."*

**Default group-by:** by 4R goal.

**Group-by control:** Goal (default) · Trigger type · Status · Owner · None.

**Row card:** campaign name (serif italic) + technical id (`cmp-cfm-407`) · 4R goal badge · trigger-type chip (Real-time / Scheduled / One-time) · status · target audience name (clickable) · reach with sparkline · lift if measured · author + last edit · quick actions menu.

**Entry points:** Start from a goal · Start from a hypothesis · Start from a campaign archetype · Start from an existing Segment · Continue draft · Build a journey.

### 9.4 Build canvas (`10_cmp_canvas_realtime`, `11_cmp_canvas_scheduled`, `12_cmp_canvas_onetime`)

Three screens, same skeleton, trigger-type-specific blocks. Designer can ship as one HTML with state toggle or three separate files.

**Top region — type, goal, intent:**

```
TRIGGER TYPE:  ◉ Real-time event-triggered    ○ One-time push    ○ Scheduled push

4R GOAL:       [Retain]  [Revenue]  [Reactivate]  [Recruit]

INTENT:        "Rescue players who are losing streaks of ranked matches."
```

The 4R goal at the campaign level (not segment level) is where the Decision Intelligence framing lives — Retain / Revenue / Reactivate / Recruit drives downstream goal-alignment dial and uplift measurement.

**Middle region — campaign composition, varies by trigger type:**

1. **Audience block** — what segment defines the eligible pool. Default state: empty, with two CTAs: *"Pick existing segment"* (opens Segments library in slide-out) or *"Define segment inline"* (opens a mini Segment build flow embedded; on save it creates a Segment in the library named for this campaign and binds it).
   - For One-time and Scheduled: this block is required.
   - For Real-time: this block is optional. A real-time campaign can fire on any matching player without a pre-defined audience pool, or can be scoped to a specific Segment for additional targeting (e.g. *"only fire for players already in the seg-cfm-vip-active segment"*).

2. **Schedule block** — varies by trigger type:
   - One-time: *Send when ready* / *On specific date* radio
   - Scheduled: cadence picker + start/end date range
   - Real-time: active date range (start datetime → end datetime) + delivery controls (frequency cap dropdown — *"No frequency limit / Once per day / Once per user for the duration of this campaign"*)

3. **Event trigger block** — visible only for Real-time. Specified in §9.5.

4. **Action block** — payload composition.
   - Off / On variant toggle (single payload vs A-B variants)
   - Channel selector (IAM · Push · SMS · Email · in-game grant)
   - Copy + reward configuration
   - Channel-specific preview button → modal with rendered preview (IAM dimensions, iOS+Android side-by-side for Push, etc.)

5. **Holdout block** — Campaign-level holdout. Default 90% treatment / 10% control. Slider with live "powered to detect ≥X% lift in Y days" copy.

6. **Forecast + goal alignment block** — reach / cost / lift projection, 7-day daily forecast sparkline, goal-alignment dial showing fit between intent and predicted outcome.

**Right rail — materials shelf:** target segment card, event source card (real-time), features in trigger predicate (real-time), pattern reference, hypothesis reference.

**Bottom action bar (sticky):**

```
Save draft · Backtest 30d · Test on 100 players · Pre-launch monitoring          Activate · 5% rollout →
                  Compiles to: Substrate A (Apollo TEE) + Substrate B (Hatchet)
```

The substrate copy adapts to which substrates this campaign uses — Real-time campaigns show A + B; Segment-backed campaigns show B only.

### 9.5 Event Trigger block (real-time campaigns)

This is where the entry-condition machinery lives — the work that the prior design had as a separate "Live Trigger" object now happens inside this campaign block.

**Event source picker.** Same shape as the Condition Picker but for events. *"Select event source"* dropdown opens a Browse / Search / AI-assist picker over the Kafka event catalog (47 events across 8 domains, per `Hermes_Demo_Data.md` Part 2). Each event card shows daily volume, peak rate, latency class, schema status, drift badge, 7-day sparkline. Default suggestion is `event_match_end` (the canonical demo event).

Selected event renders as a banner row at the top of the trigger predicate stack — `on event = event_match_end` with property filters available (e.g. `event_match_end.outcome = lose`).

**Trigger predicate composer.** Identical to the Segment predicate composer (§8.3) — same AND-of-OR-groups, same row format, same inline feature swap, same inline threshold playground. The difference is what's being authored: a Segment predicate filters a population; a Trigger predicate filters firings at event arrival.

A small banner appears when the trigger predicate mixes latencies (a real-time event source with batch features in the predicate): *"This trigger evaluates at event time. Batch features (`<1h`, `<1d`) are point-in-time as of last refresh — today 06:00 for warm, last night for cold."*

**Trigger policies:**
- Per-player cooldown — minimum gap between fires for a single player. Default 24h. Picker: 1h / 6h / 24h / 7d / custom.
- Global frequency cap — total fires across all players per day. Optional. Default unlimited.
- Anti-fatigue clauses — predicate rows that reference campaign-engagement features (`iam_received_count_24h`, `last_iam_received_ts`).

**Audience preview for real-time campaigns:** *"Estimated fires per day"* and *"Estimated unique players per week"* (instead of UID count). Computed from historical event volume × predicate match rate × cooldown discount.

### 9.6 Hybrid campaigns

A real-time campaign can compose a Segment audience block AND a Trigger predicate. This is the canonical pattern for campaigns like TF-1 Football Hub — a Segment seeds the existing matchers (one-time fire on campaign start), and the Trigger predicate handles new matchers going forward (continuous evaluation). Both feed the same journey.

The canvas shows this as: Segment audience block populated AND event trigger block populated. The launch handoff modal mints both a SegmentID (Substrate B) AND a TriggerID (Substrate A).

### 9.7 Journey canvas (`13_cmp_journey`)

Multi-step orchestration for any campaign that needs more than a single send.

**Components:** Trigger / Segment seed (entry node) → Step nodes (Evaluation + Effect + Transition) → Goal / Exit.

**Node types:**
- **Condition** — If/Else branch on a predicate
- **Wait** — Time delay or Wait-for-Trigger
- **Split** — Traffic % allocation (A/B/holdout) or segment-based branch
- **Action** — IAM · Push · Email · SMS · in-game grant · webshop offer

**Per-step lifecycle:** Edit (requires Pause) · Copy · Delete · Pause/Unpause.

**Branch export-as-segment:** each Split branch shows *"Export this branch as a segment →"* action. Opens side panel: branch name, current population, predicate summary, *"Save as derived segment"* CTA. On save the branch becomes a Segment in module 03's library, badged *"Derived from journey branch · cmp-cfm-407 / variant_A."* Manual derivation by design — Studios opt in.

### 9.8 Pre-launch monitoring (`14_cmp_prelaunch`)

Simulation against last 7 days of real events. Sanity checks. Holdout design summary. Sample fires walkthrough. Forecast restated. *"Activate · 5% rollout"* CTA at the bottom.

Distinct from the post-launch Monitoring tab — pre-launch is a simulation, post-launch is real measurement.

### 9.9 Launch handoff modal (`15_cmp_handoff`)

When the Studio clicks Activate, a confirmation modal appears showing whichever IDs were minted. This is the second load-bearing artifact for the May 12 meeting (alongside the segment handoff modal, §8.7).

Real-time campaign:
```
  ✓  Campaign activated · 5% rollout

     CampaignID  cmp-cfm-407                                  [copy]
     TriggerID   trg-cfm-pass-stuck                           [copy]

     ──── What happens next ────

     1.  Predicate compiled to expr-lang                       · done
     2.  Trigger config written to JourneyDB                   · done
     3.  Apollo TEE picks up on next reload                    · ~30 sec
     4.  TEE evaluates against event_match_end events          · live

     Substrate A · Apollo TEE + Temporal
     TEE evaluates @features.consecutive_ranked_losses_streak
       and @features.is_paying_user_lifetime per match_end event;
     spawns Temporal workflow on match.

     [Open in monitoring]   [Done]
```

Hybrid campaign shows both SegmentID and TriggerID with both substrate blocks. Segment-backed campaign shows only SegmentID with Substrate B copy.

The mono blocks naming substrates, workflow names, and consumer-side paths must match the architecture verbatim — validate with ThangLV2 (Substrate B) and Đạt (Substrate A) before design ships.

### 9.10 Post-launch monitoring (`16_cmp_monitoring`)

Available for Active and Ended campaigns.

**Header:** campaign name + status + active-for-N-days + total fires. Cross-link badges to underlying SegmentID and/or TriggerID — clicking opens the corresponding monitoring screen in module 03.

**Health snapshot row:**
- Total fires · unique players reached · current % of MAU · cost-to-date
- Forecast vs actual sparkline with current ratio (e.g. *"3,420 actual vs 3,259 forecast, +5%, on track"*)

**Uplift measurement:**
- Holdout vs treatment chart on the goal metric, with confidence band
- Headline: *"+8.2% D1 retention vs holdout, p=0.02 (significant)"* or *"+1.1%, p=0.34 (need 4 more days)"*
- Goal-achievement dial: 4R goal Retain → measured Retain score 88 (forecast was 92)

**Operational health:**
- Sanity checks (live, with red highlights if any fail)
- Sample fires (recent fires with timestamp, UID, action, outcome — clickable to per-user timeline in Explore)
- Derived segments — segments derived from this campaign's journey branches, each linking to module 03 monitoring (this is the loop closure)
- Suggested follow-ups — AI-generated, *"Variant A is showing 15% higher D7 spend than holdout — extract as derived segment for whale-track recruitment."*

### 9.11 Campaign Pattern Library (`17_cmp_patterns`)

Intervention archetypes:

- Pass Stuck Rescue
- Loss Streak Rescue
- Whale Comeback
- New Player D2 Nudge
- Shop Window Shopper conversion
- Friend-of-Lapsed social re-engagement
- Mid-Session Step-up offer

Each card: archetype name, origin game, lift band, uses across portfolio, predicate + action template, cross-game lineage timeline.

---

## 10. Cross-cutting

**Substrate badges on feature pills.** Every feature row in any predicate carries its latency badge with substrate icon (`<1s · A`, `<1h · B`, `<1d · B`). Engineering reviewers see them and recognize the architecture without copy explaining it.

**Handoff modals (§8.7, §9.9).** Always render on Save / Activate, never collapse to a toast, cannot be skipped. Non-negotiable.

**Plain-English explainer toggle.** Available on any predicate stack. When on, the predicate collapses into a readable paragraph — *"When a player ends a ranked match they lost, AND they've now lost 5 in a row, AND they've never paid us — this trigger fires once per player per day."* When off, the mono predicate stack is shown.

**Materials shelf** appears on every authoring canvas. Collapsible right rail. Two-way visual binding with predicate rows.

---

## 11. Demo flow for the alignment meeting

A 10-minute walkthrough Khoi runs in the May 12 meeting. References the demo content in `Hermes_Demo_Data.md`.

| # | Action | Screen | Earns |
|---|---|---|---|
| 1 | Open Hermes home | `00_home` | Studios think in outcomes |
| 2 | Open Feature Store, browse Engagement, click `consecutive_ranked_losses_streak` | `01_fs_library` → `02_fs_detail` | Semantic Layer is real — one definition, two substrates |
| 3 | From feature detail, *"Use in segment"* | → `04_seg_canvas` | Cross-module flow |
| 4 | Show predicate composing — AND-of-OR-groups, inline feature swap, inline threshold playground with slider mid-drag, audience number updating live | `04_seg_canvas` | "Show the math" — the data-tool register |
| 5 | Save segment → handoff modal | `06_seg_handoff` | **SegmentID + Substrate B made literal** |
| 6 | From handoff, *"Use in campaign"* → Campaign canvas, pick Real-time trigger type. Same predicate features available; add event source `event_match_end`. Cooldown 24h. | `10_cmp_canvas_realtime` | Trigger machinery lives inside campaign authoring; Studios author one cohesive thing |
| 7 | Walk action / variants / holdout blocks. Open journey canvas briefly | `13_cmp_journey` | Hawkins journey concept made visible |
| 8 | Activate → handoff modal showing both SegmentID and TriggerID minted | `15_cmp_handoff` | **Two substrates, two contracts, made literal at one moment** |
| 9 | Open Campaign monitoring two weeks later — lift +8.2%, click cross-link to Trigger health | `16_cmp_monitoring` | Closure — measure end-to-end, both substrates healthy |

If cut for time, drop step 7. The load-bearing moments are 5, 8, and 9.

---

## 12. Screen inventory

```
# Module 01 — Feature Store
01_fs_library
02_fs_detail

# Module 02 — Explore (deferred · nav-only)

# Module 03 — Segments
03_seg_library
04_seg_canvas                  ← centerpiece: collapsible intent, sticky audience preview,
                                   AND-of-OR-groups predicate, inline swap, inline threshold
05_seg_threshold_deep          ← standalone deep playground (used when entered from FS)
06_seg_handoff                 ← meeting-earner: SegmentID + Substrate B
07_seg_monitoring
08_seg_patterns

# Module 04 — Campaign
09_cmp_library
10_cmp_canvas_realtime         ← real-time trigger type; event block + predicate composer
11_cmp_canvas_scheduled        ← scheduled-push trigger type
12_cmp_canvas_onetime          ← one-time-push trigger type
13_cmp_journey
14_cmp_prelaunch
15_cmp_handoff                 ← meeting-earner: SegmentID + TriggerID + both substrates
16_cmp_monitoring
17_cmp_patterns

# Cross-cutting
00_home                        ← landing
```

**18 screens including home.**

Priority tiers for May 12:

- **Must have (10):** 00, 01, 02, 03, 04, 06, 09, 10, 15, 16. The demo flow §11 routes through 9 of these.
- **Should have (5):** 05, 07, 11 or 12, 13, 14.
- **Nice to have (3):** 08, 17, plus the unused canvas variant from Should Have.

Picker substates (Condition / Exclusion / OR-row) and the inline-threshold-playground state can ship as state classes inside their parent canvas HTML, or as separate files — designer's call.

---

## 13. What NOT to design

- Real data, live API integration, functional logic
- Auth screens, admin/settings, notifications inbox
- Feature registration form (§6.2 entry point — show CTA only)
- Feature definition editor (§6.3 header — show *"Edit definition"* affordance only, modal stub if anything)
- Module 02 Explore screens (deferred)
- Architecture / substrate health dashboards (the substrate badges and handoff-modal copy are sufficient ambient signal)

---

## 14. Acceptance criteria

The design phase is complete when:

1. All must-have screens (10 of 18) render correctly as standalone HTML.
2. The 9-step demo flow in §11 walks end-to-end without dead ends.
3. **The Segment authoring canvas reads as a data tool, not a brief tool** — sticky audience preview at top, predicate composer dominant, intent collapsed by default, no decorative goal bands.
4. **The AND-of-OR-groups predicate model is visible** — at least one canvas screen shows multiple groups with OR rows inside, AND between groups, AND NOT exclusions.
5. **Inline threshold playground is the visible centerpiece** — a screen captured with the slider mid-drag, the audience number visibly updating, the matched-region color animating across the histogram.
6. **Handoff confirmation modals are recognizable to engineering reviewers.** Substrate names, workflow names, and consumer-side paths match the architecture verbatim — both segment save (Substrate B) and campaign activate (Substrate A and/or B) modals are designed.
7. **Feature Store screens make the Semantic Management Layer tangible** — latency badges visible on every feature card; dual-target definitions shown side-by-side on detail pages; *"Used by"* backlinks populated.
8. **Campaign trigger types are explicitly demonstrated** — at least two of the three trigger-type canvas variants are designed (Real-time as the centerpiece; one of Scheduled or One-time as the contrast).
9. **The real-time campaign canvas shows trigger predicate alongside audience eligibility** — event source row + predicate composer + cooldown + frequency cap all visible.
10. Cross-module routing is observably present — at least three CTAs route between modules.
11. Visual identity matches the current Hermes prototype — serif italic for intent, mono for technical, deep red accent, amber for anomalies.
12. Hardcoded content matches `Hermes_Demo_Data.md` — feature names, event names, segment IDs, trigger IDs, sample predicates all sourced from the demo data fixtures, no fabrication.

---

## 15. Open questions

These do not block design but should be resolved before build kickoff:

1. **Substrate copy validation.** Mono blocks in handoff modals (§8.7, §9.9) name workflow types and consumer-side paths. Need a 15-min review with ThangLV2 (Substrate B copy) and Đạt (Substrate A copy) before design ships.

2. **Past-behavior implementation in TEE.** A real-time predicate that mixes a real-time event source with batch-latency features — does the TEE evaluate the batch features via online cache lookup, offline store lookup, or pre-computed segment-as-gate? UI does not commit to any of these. Confirm with engineering before build.

3. **Hybrid campaign UI shape.** The canvas needs to express both Segment audience and Real-time trigger predicate visibly. Designer's call whether they sit as adjacent blocks in the canvas or as toggleable views. Revisit if the layout gets unwieldy.

4. **Derived-segment naming convention.** When a journey branch is exported, what's the name shape? `cmp-cfm-407_variant_A_responders` (technical) or *"Pass Stuck · Variant A responders"* (display)? Recommend both, side-by-side as elsewhere.

---

## 16. References

- *Dynamic Segmentation for LiveOps · Master Pre-Read* — Hawkins (May 2026), parent vision document
- `Hermes_Demo_Data.md` — feature catalog, event catalog, 5 representative campaigns; canonical content source for the mockup
- Current Hermes prototype — visual tokens, components, shell
- Segmentation Engine Proposal — ThangLV2, Substrate B reference (Hatchet, Trino, Iceberg)
- Apollo Journey System Design — Substrate A reference (TEE, Temporal)
- LiveOps Engine BRD — Apollo, orchestration model and channels
- Decision Intelligence Platform PRD — strategic parent (Value, Risk, Responsiveness, Intent model families)

---
