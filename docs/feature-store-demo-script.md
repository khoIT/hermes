# Feature Store — 5-Minute Demo Script

A walkthrough that shows what the Feature Store does for each persona using real cfm_vn data flowing through the live pipeline.

**Total runtime:** 5 minutes spoken pace.
**Audience:** anyone who hasn't seen the platform — LiveOps PM, Data Engineer, Data Analyst, exec stakeholder.

---

## Curated demo features — pick by what you want to show

The threshold playground only renders meaningfully when a feature has real-data distribution rows. **Provenance signals** in the UI:
- 🟢 dot in the library row · green REAL badge in LiveOps tab
- ⚪ gray dot · red SYNTHETIC card · empty playground

**For the slider experience** (numeric, real, lots of uids — pick from these):

| Feature | Range | Why it demos well |
|---|---|---|
| `account_age_days` | 1–7831 days | Long-tail; 155k uids; the canonical demo feature |
| `lifetime_revenue_local` | 0–25M VND | Whale tail; only 21k uids; nice power-law |
| `mmr_current` | 800–3500 | 153k uids; PVP-relevant for CFM |
| `ranked_match_count_30d` | 0–300 | Engagement signal; tight distribution |
| `session_count_7d` | 0–30 | Stickiness; tiny range = fast slider |
| `consecutive_ranked_losses_streak` | 0–20 | The CFM-13 anchor feature; small numbers, narrative payoff |

**For the categorical picker** (real, dropdown of labels with counts):

| Feature | Labels | Notes |
|---|---|---|
| `vip_status` | `none` / `vip_max` | 199k uids; pick `vip_max` → 75k whales |
| `player_lifecycle_stage` | `nru`/`mid`/`veteran`/`lapsed` | 200k uids |
| `region_code` | `VN`/`TH`/`ID`/`PH`/`Other` | regional breakdown |
| `dominant_playstyle` | `pvp`/`pve`/`housing`/`fishing`/`social` | 153k uids |
| `spend_tier_lifetime` | `free`/`low`/`mid`/`high`/`whale` | only payers (21k uids) |

**Synth features (DON'T use for playground demo)** — open one of these to demonstrate the empty state + red badge instead. Examples: `iam_received_count_24h`, `weapon_count_owned`, `pltv_30d_score`, `pass_owned_current`. These are all features with no upstream Trino source (T5 in the original derivation coverage), so the playground correctly shows "No distribution available — feature may have no real data yet."

---

## Setup (60 sec, before starting)

```bash
pnpm dev    # postgres + catalog-api :3001 + query-svc :3002 + web :5173
```

Open `http://localhost:5173/feature-store` in a browser. Everything below assumes that command is running.

If the page shows **Feature Store unavailable**, the catalog-api process likely crashed (Vite kept running). The banner now reads `502 · catalog-api not reachable on :3001 · run \`pnpm --filter @hermes/catalog-api dev\`` because Vite's proxy translates ECONNREFUSED to a 502 with an `UPSTREAM_UNREACHABLE` envelope. Restart just it with `pnpm --filter @hermes/catalog-api dev`, or re-run `pnpm dev`. Health check: `curl http://127.0.0.1:3001/api/v1/health` should return 200.

---

## Beat 1 — Library landing (20 sec)

**You see:** 76 features grouped by domain. Each row has a small **colored dot** before the feature name:

- 🟢 **Green** = real (Trino-derived from cfm_vn raw events)
- 🟠 **Amber** = hybrid (proxy SQL approximation — still real-data-anchored)
- ⚪ **Gray** = synth (no upstream source · preview only)

**Talking points:**

> "Computed from 22M rows of real cfm_vn data. The dot before each feature name tells you provenance at a glance — green is safe to bet a campaign on, gray is preview-only. Use the **Data source** filter on the left to show only real features if you want to skip the synth ones."

Click **Data source → Real** in the filter rail to narrow to the 48 fully-real features. Then click **`account_age_days`**.

---

## Beat 2 — LM persona view (default tab) (60 sec)

The detail page lands on the **LiveOps** tab.

**Top card: SourceProvenanceCard**

> "This is the trust signal. Green REAL · TRINO-DERIVED tells the campaign author 'computed from cfm_vn raw events, safe for targeting'. We tell the user when it's hybrid (proxy SQL) or synth (no upstream source) so they don't accidentally fire a campaign on fake data."

**Middle card: HealthVerdictCard**

> "Single chip — GREEN HEALTHY. Drilldown shows 4 signals: drift, freshness SLA, null rate, MAU coverage. The worst signal wins. PMs don't need to interpret a 0.078 drift score — they see green / amber / red."

**Bottom panel: ThresholdPlaygroundPanel — the marquee**

> "This is the killer demo. Watch."

**Drag the threshold slider.** The big red number updates in 200ms; histogram below colors matching buckets in brand red.

> "Live audience size from real Postgres COUNT against 6.35M `feature_values` rows. PMs can prototype audiences without writing SQL or waiting on a data engineer. The 'Use in segment' CTA pre-fills the composer."

---

## Beat 3 — DA persona view (60 sec)

Click the **Analyst** tab.

**5 panels load in sequence:**

1. **Quantile Strip** — p10 / p25 / p50 / p75 / p90 / p99 bar chart.
   > "Distribution shape change at a glance, better than a single drift number. p99 here is ~7800 days — these are real CFM accounts going back to 2008."

2. **Coverage Segmentation** — 3 horizontal stacked bars (lifecycle / region / spend tier).
   > "Is this feature populated for paying VN whales or just everyone? We join `feature_values` with each cohort feature so you can see the breakdown."

3. **Sample Value Cards** — 8 anonymized uids with their values + game.
   > "What does a value of 3829 days actually mean? Here are 8 real users for context."

4. **Correlated Features** — top-5 by Pearson on standardized 5k uid sample.
   > "Lazy-cached. Click any row to navigate to that feature. Surfaces redundancy and complementary features for compose."

5. **Outliers** — top-5 by z-score with severity badges (>3σ red, 2-3σ amber).
   > "Spot data-quality issues — `account_age_days = 99999` would jump out here."

---

## Beat 4 — DE persona view (50 sec)

Click the **Engineer** tab.

1. **Pipeline Health Timeline** — last 30 derivation runs as a strip-chart.
   > "Each bar is one run. Green is success, red is failure, height is duration. p99 here is ~1.9 seconds."

2. **Cost & Latency** — 4 metric cards.
   > "Derivation p99, online lookup p99, freshness lag, 180d request count. Capacity-planning view."

3. **Lineage v2** — split upstream / downstream.
   > "Upstream parses dbt refs from the definition. Downstream lists segments + campaigns referencing this feature — impact analysis before you change the spec."

4. **Backfill History** — 30-day daily distribution coverage with gaps in amber.
   > "Confirms the historical sparkline isn't lying about coverage gaps."

---

## Beat 5 — Synth comparison (30 sec)

Navigate to **`/feature-store/weapon_count_owned`**.

> "Same UI, different provenance."

- Source card: **red SYNTHETIC · NO UPSTREAM SOURCE**, body says "Use for preview only; do NOT bet a live campaign on this."
- Engineer tab pipeline timeline: empty state ("no runs recorded yet").

> "We're honest about what's real and what's synthesized. Campaign authors don't get tricked."

---

## Beat 6 — Predicate composition under the hood (40 sec, technical audience)

In a terminal:

```bash
# Single-feature audience size
curl -s "http://127.0.0.1:3001/api/v1/features/account_age_days/audience-count?op=gt&value=3000" | jq

# Multi-feature predicate via query-svc set-algebra
curl -s -X POST http://127.0.0.1:3002/api/v1/audience/count \
  -H "content-type: application/json" \
  -d '{
    "predicate": {
      "all": [
        {"leaf":{"feature":"account_age_days","op":"gt","value":2000}},
        {"leaf":{"feature":"vip_status","op":"eq","value":"vip_max"}}
      ]
    }
  }' | jq
# → 33,813 uids · 153ms across 6.35M rows
```

> "AND-of-OR predicates compile to Postgres INTERSECT / UNION / EXCEPT over the `feature_values` table. Sub-200ms on real data. Same translator will back the Segments composer once we wire it."

---

## Beat 7 — Validation (10 sec hand-wave)

```bash
node scripts/validate-feature-pipeline.cjs
# → 36/36 assertions PASS
```

> "Pipeline + API + cleanup + DB schema — all assertion-tested end-to-end."

---

## What you've shown in 5 minutes

| Capability | Surface |
|---|---|
| Real cfm_vn data flowing into a self-service catalog | Library page · 48 real features |
| Provenance honesty (real / hybrid / synth) | SourceProvenanceCard |
| One-glance feature health | HealthVerdictCard |
| Live audience exploration without SQL | ThresholdPlaygroundPanel |
| Distribution shape + cohort breakdown | Analyst tab (5 panels) |
| Pipeline ops + cost transparency | Engineer tab (4 panels) |
| Multi-feature predicate composition | query-svc /audience/count |
| 12 persona-aware endpoints | catalog-api `/features/*` |

---

## Known limitations to mention if asked

- **Multi-game features** show CFM only. PTG/NTH/TF/COS need Trino schema provisioning by VNG IT (architectural prep is in place — `game_id` column everywhere).
- **Segments composer audience count** still uses synchronous fixtures; the threshold playground hits live API but the multi-row composer doesn't yet. Migration via `useAudienceCount` hook is shipped, opt-in per call site.
- **DE pipeline timeline** populates after each `pnpm refresh-cfm-data --feature-values-only` or `--feature-analytics-only` run; first-run users see an empty state.

## Reset between demos

If something breaks (Postgres container restart, etc.):

```bash
pnpm dev:db
pnpm --filter @hermes/catalog-api start:dev          # restart api
# wait for "listening on :3001"
# reload browser
```

Banner now shows `Reason: 503 · Database temporarily unreachable` instead of generic 500 when this happens.
