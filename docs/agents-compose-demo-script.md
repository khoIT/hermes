# Agents Compose canvas — 90-second demo

A walkthrough of `/agents/compose`, the new intent-first authoring surface that turns the Agents module from purely reactive (inbox of pre-computed opportunities) into a proactive surface where a LiveOps PM types a problem and the platform composes Features → Segment → Campaign with agent assistance.

**Target runtime:** 90 seconds.
**Audience:** LiveOps PM, Data Engineer, Data Analyst, exec stakeholder.
**Prereqs:** `pnpm dev` running (postgres + catalog-api :3001 + query-svc :3002 + web :5173).

---

## Pick a starter

| Starter chip / canonical prompt | Playbook | 4R tag | Existing-segment match |
|---|---|---|---|
| `losing streaks` — *"players losing 5+ ranked matches in a row are getting frustrated"* | `loss-streak` | Retain · 92% | ✓ `seg-cfm-loss-streak-non-paying-2026-0508-a3f9` |
| `whales gone dormant` | `whale-dormancy` | Reactivate · 88% | — |
| `stuck on first match` | `stuck-on-first-match` | Recruit · 90% | — |
| `7-day non-payers` | `7-day-non-payers` | Revenue · 84% | — |

The canonical demo flow is the loss-streak playbook. The other 3 are bulletproof fallbacks if you want to demo a different motion.

---

## Beat 1 — Open the canvas (10 sec)

From `/agents` (Insight Inbox), click the new **`✦ Describe a problem`** button in the top-right of the stat strip. The Compose canvas mounts at `/agents/compose` with an empty conversation rail and three placeholder stage cards. The 4R chip in the header reads "awaiting intent…".

Alternative entry: click `Open in Compose →` on the **ag-op-1042** opportunity card to pre-load the canvas with the loss-streak intent, the agent's drift-detection thread, and stage 1 features already seeded.

---

## Beat 2 — Submit an intent (15 sec)

Type *"players are losing 5+ ranked matches in a row and getting frustrated"* in the textarea (or click the `losing streaks` starter chip → Send).

- The agent replies in the rail with *"I see this pattern — frustration-rescue. Players hitting consecutive ranked losses tilt off the platform…"*
- The 4R chip animates in: **`4R · Retain · 92%`**
- Stage 1 expands; Stage 2 + Stage 3 stay collapsed.

---

## Beat 3 — Stage 1 · Features (20 sec)

The agent has proposed 3 features:

1. `consecutive_ranked_losses_streak` ≥ 5 — `core signal`
2. `tenure_days` ≥ 7 — `filter bots`
3. `is_paying_user_lifetime` is false — `cohort filter`

Each row shows:
- Provenance dot (green = real-data Trino-derived)
- Plain-English rephrase
- Rationale chip
- 30-day request-rate sparkline pulled from the live feature analytics
- Approve / Swap / Drop buttons

Click **Open in Feature Store →** on any row to pop the read-only detail drawer (provenance card, distribution sparkline, drift, null rate, coverage, downstream usage). Close it.

Click **Swap** on `tenure_days` → side drawer opens with two tabs:
- **Suggested** — top correlated features pulled live from `/api/v1/features/{name}/correlations` (Pearson on a 5k uid sample)
- **All features** — searchable list of the full catalog (~76 features)

Close the swap drawer. Click **Approve** on each of the 3 rows. The pulse on **`Continue to segment →`** turns on. Click it.

---

## Beat 4 — Stage 2 · Segment (20 sec)

Stage 1 collapses to its summary; Stage 2 expands.

The agent renders:
- **Predicate blocks** — `WHEN consecutive_ranked_losses_streak ≥ 5 / AND tenure_days ≥ 7 / AND is_paying_user_lifetime is false`
- **Live audience size** — big serif number, fetched in real-time from `POST /api/v1/audience/count` (query-svc :3002), shimmer placeholder during fetch. Expect ~23k UIDs from cfm_vn data.
- **Cohort breakdown bars** — lifecycle / region / spend tier (illustrative; matches Feature Store coverage panel precedent)
- **Threshold slider** on the headline numeric feature (`consecutive_ranked_losses_streak`) — drag it; the audience number debounces and re-fetches at 300ms
- **Existing-segment match pill** — *"Match found · seg-cfm-loss-streak-non-paying-2026-0508-a3f9 · ~84.2k UIDs · overlap 95%"*

Three actions: **Use existing**, **Open in /segments/new ↗**, **Approve as new draft →**. Click **Approve as new draft →**.

---

## Beat 5 — Stage 3 · Campaign (20 sec)

Stage 2 collapses. Stage 3 expands with the full campaign card:

1. **Trigger headline** (serif) — *"The moment a player loses 5 in a row, offer a starter pack — once per 72h."*
2. **Event source banner** (dark) — `ranked_match_completed` · peak ~14k/min · mature lifecycle
3. **Action card** — IAM channel · 30% off Starter Pack · 72h cooldown · 1/day · 10% A/B holdout
4. **Alignment card** — `4R · Retain · 92%` · *"Pattern recognized as frustration-rescue · 3 prior wins +6.4% D1 retention"*
5. **Fire metrics** — Forecast ~3.4k/day · Peak 14k events/min · Latency p99 152ms · Est lift +6.4% D1
6. **Trigger lifecycle strip** — event › predicate match › IAM render › cooldown 72h › resume
7. **3 sample profile cards** — anonymised uids with one-liners

In the **Refine this campaign** input, type *"don't make the offer too generous"* → Send. The action card payload swaps to `Starter Pack · 15% off · 100 gems`; the agent replies in the rail with the rationale.

---

## Beat 6 — Hand off (5 sec)

Click **Continue in Campaigns →**. The session blob is written to `sessionStorage` and the canvas routes to `/campaigns/new/realtime?from=compose-{sessionId}`. The destination page shows a brand-soft banner: *"✦ Authored from agent session sa-… · ← back to agent"*. The intent textbox, audience block, and 4R goal are pre-filled from the handoff.

The demo loop closes — from a free-text problem statement to a real-time campaign canvas in 90 seconds, no SQL, no manual segment composition.

---

## What you've shown

| Capability | Surface |
|---|---|
| Intent-first authoring | Compose canvas conversation rail |
| Auto-tagged 4R goal (no user picker) | Header chip animates in from playbook |
| Live correlation API for swap suggestions | Side drawer · Suggested tab |
| Live audience-count over real Postgres | Stage 2 audience card |
| Existing-segment de-duplication | Stage 2 match pill (Jaccard heuristic) |
| Scripted refinement reflexes | Stage 3 refinement input |
| Stitched handoff into existing modules | Stage 3 → /campaigns/new/realtime banner |

---

## Known limitations

- **No real LLM** — pattern recognition is keyword-matched against 5 scripted playbooks. New patterns fall back to *"I don't recognize this yet — try one of these"* with the starter chips.
- **One problem per session** — the canvas doesn't multiplex; opening a new intent resets the stage stepper.
- **Session memory is in-tab** — the handoff blob lives in `sessionStorage`, so closing the tab loses the session. Acceptable for demo; production needs durable persistence.
- **Cohort breakdown bars** are illustrative — they use a fixed fixture. Same precedent as the Feature Store coverage panel.

---

## Reset between demos

Reload `/agents/compose` (the URL with no query params is a fresh canvas). To re-run from the inbox entry, navigate `/agents` → `Open in Compose →` on the loss-streak opportunity.

If `/api/v1/audience/count` returns 5xx, the audience card switches to a "Couldn't fetch · Retry" state without crashing the rest of the canvas — the demo can still proceed and the threshold slider is the only feature impacted.
