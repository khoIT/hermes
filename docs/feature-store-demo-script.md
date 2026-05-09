# Feature Store — 5-Minute Demo Script

A walkthrough that shows what the Feature Store does for each persona using real cfm_vn data flowing through the live pipeline.

**Total runtime:** 5 minutes spoken pace.
**Audience:** anyone who hasn't seen the platform — LiveOps PM, Data Engineer, Data Analyst, exec stakeholder.

---

## Setup (60 sec, before starting)

```bash
pnpm dev:db                                    # postgres
pnpm --filter @hermes/catalog-api start:dev    # 3001
pnpm --filter @hermes/query-svc  start:dev    # 3002
pnpm dev                                        # web :5173
```

Open `http://localhost:5173/feature-store` in a browser. Everything below assumes those four are running.

If the page shows **Feature Store unavailable**, check `pnpm dev:db` is up and `curl http://127.0.0.1:3001/api/v1/health` returns 200.

---

## Beat 1 — Library landing (20 sec)

**You see:** 76 features grouped by domain, each with a sparkline + health badge.

**Talking points:**

> "This is computed from 22 million rows of real cfm_vn data we pull from Trino. Group by domain, filter by latency tier, sort by drift. Notice some have a green badge, some red — that's the provenance signal. Some features are fully derived from real Trino aggregates, others are still synthetic because they don't have a Trino source mapping yet."

Click **`account_age_days`**.

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
