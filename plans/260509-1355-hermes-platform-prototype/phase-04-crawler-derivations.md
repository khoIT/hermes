---
phase: 4
title: "Crawler Steps 1-5"
status: pending
priority: P1
effort: "8h"
dependencies: [2]
---

# Phase 04: Crawler Steps 1-5 (Feature Distributions, Audience Counts, Samples, Event Volumes, Demographics)

## Context Links
- P-2 outputs: `infra/trino-crawler/schema-audit.md`, `derivation-coverage.json`
- Brainstorm §4.2 (data flow), §4.3 (derivation tiers T1-T5)
- Hermes_Demo_Data.md Part 3 (5 demo predicates with thresholds)

## Overview
Compute the 5 crawled fixtures bundled by web. For each PRD feature: distribution (histogram + percentiles + 7d sparkline). For each demo predicate: audience count grid across thresholds. Plus sample player rows, event daily volumes, segment demographics.

## Key Insights
- Run Trino queries in batches with concurrency cap (3-5 parallel) to avoid hammering shared cluster.
- Cache results during a single crawl run; if a query times out, retry once then mark synthesised.
- Synthesised distributions follow plausible shapes per feature type (counter → power-law, score → normal, bool → bernoulli) and are tagged `synthesised: true`.
- Crawler is idempotent — overwrites previous outputs.
- 5 demo predicates from Hermes_Demo_Data Part 3:
  - CFM-2 Voting SS1 (segment, weapon array)
  - CFM-11 RFM tiers (4 sibling segments)
  - CFM-13 Pass Stuck (real-time, mixed-latency) ← canonical
  - CFM-18 Low CF Coin (real-time, currency-band)
  - TF-1 Football Hub (hybrid segment + trigger)

## Requirements
**Functional**
- `pnpm refresh-cfm-data` runs all 5 steps end-to-end.
- Outputs to `apps/web/src/data/crawled/`:
  - `distributions.json` — keyed by feature name; each entry: source, computedAt, nTotal, histogram[], p50/p90/p99, sparkline7d[], synthesised
  - `audience-counts.json` — keyed by predicate-id; each entry: predicate, thresholdGrid[], breakdownAtCanonical
  - `sample-players.json` — keyed by feature name; 50-100 sample player UIDs with current values
  - `event-volumes.json` — keyed by event name; dailyVolume, peakRate, sparkline7d[]
  - `segment-demographics.json` — keyed by segmentId; lifecycle/country/spend-tier breakdowns
- Each step has a `--<step>-only` CLI flag for partial reruns.

**Non-functional**
- Total run ≤30 min on full fresh pull.
- Per-query timeout 30s (matches `TRINO_QUERY_TIMEOUT_MS` in `.env`).
- Synthesised tier tagged clearly; web shows `synth` badge.
- All outputs valid JSON, parsed by Vite as static assets.

## Architecture
```
infra/trino-crawler/src/
├── steps/
│   ├── 01-feature-distributions.ts    runs T1-T4 derivations; T5 synthesised
│   ├── 02-audience-counts.ts          per demo predicate, thresholds × counts
│   ├── 03-sample-players.ts           TABLESAMPLE per feature
│   ├── 04-event-volumes.ts            daily volume + sparkline per event
│   └── 05-segment-demographics.ts     per demo segment, breakdowns
├── derivations/
│   ├── account-age-days.sql           T1
│   ├── consecutive-ranked-losses-streak.sql  T3 (window function)
│   ├── mmr-drift-7d.sql               T3
│   ├── is-paying-user-lifetime.sql    T2
│   ├── ... (one file per derivable feature)
│   └── _synth/<feature>.ts            T5 — generates plausible shape in code
├── synthesizers/
│   ├── counter.ts                     power-law shape
│   ├── score.ts                       normal/log-normal
│   ├── bool.ts                        bernoulli
│   ├── enum.ts                        categorical
│   └── tuple.ts                       multivariate
└── outputs.ts                         writes JSON to apps/web/src/data/crawled/
```

## Related Code Files
**Create**
- `infra/trino-crawler/src/steps/01-feature-distributions.ts` ... `05-segment-demographics.ts`
- `infra/trino-crawler/src/derivations/*.sql` (one per T1-T4 feature; ~50-55 files)
- `infra/trino-crawler/src/synthesizers/*.ts` (5 shape modules)
- `infra/trino-crawler/src/outputs.ts`
- `apps/web/src/data/crawled/distributions.json` (output, committed)
- `apps/web/src/data/crawled/audience-counts.json` (output, committed)
- `apps/web/src/data/crawled/sample-players.json` (output, committed)
- `apps/web/src/data/crawled/event-volumes.json` (output, committed)
- `apps/web/src/data/crawled/segment-demographics.json` (output, committed)
- `apps/web/src/data/index.ts` — re-export catalog + crawled

**Modify**
- `infra/trino-crawler/src/main.ts` — wire steps 01-05
- `apps/web/vite.config.ts` — ensure JSON imports work as static assets

## Implementation Steps
1. Implement synthesizers first — pure TS, no Trino needed. Each takes a seed (feature name) for deterministic output.
2. Write 5 demo-predicate SQL files per Hermes_Demo_Data Part 3:
   - `predicates/cfm-2-ss1-weapon-owners.sql`
   - `predicates/cfm-11-tier-1-nru.sql`, `tier-2-mid.sql`, `tier-3-high.sql`, `tier-4-whale.sql`
   - `predicates/cfm-13-pass-stuck.sql`
   - `predicates/cfm-18-low-cf-coin.sql`
   - `predicates/tf-1-returning-coaches.sql`
3. For each derivable feature (T1-T4 from coverage manifest), write `derivations/<feature>.sql`. Many features share patterns — parameterise where possible (e.g. one SQL template with `{{column}}` and `{{window}}` placeholders).
4. Implement `steps/01-feature-distributions.ts`:
   - For each of 67 features:
     - If T1-T4: load SQL, execute against Trino, build histogram (28 bins) + percentiles + sparkline.
     - If T5: call synthesizer for feature.type with feature.name as seed.
   - Write `distributions.json`.
5. Implement `steps/02-audience-counts.ts`:
   - For CFM-13 Pass Stuck: run COUNT(*) with `consecutive_ranked_losses_streak >= ?` for thresholds [3, 4, 5, 6, 7, 8, 10] → threshold grid.
   - For CFM-18: COUNT(*) with `cf_coin_balance_current BETWEEN ? AND ?` for ranges [(300,500), (400,700), (500,900), (500,1000)].
   - For CFM-2: CONTAINS array predicate at canonical threshold (single value).
   - For CFM-11 ladder: per-tier COUNT.
   - For TF-1: COUNT for hybrid predicate.
   - Compute breakdownAtCanonical for the canonical threshold of each (lifecycle/country/spend-tier % splits).
   - Write `audience-counts.json`.
6. Implement `steps/03-sample-players.ts`:
   - For each feature: `SELECT user_id, <feature_value> FROM <source> TABLESAMPLE BERNOULLI (0.001) LIMIT 100`.
   - Anonymise UIDs to `uid-<hash6>` for safety.
   - Write `sample-players.json`.
7. Implement `steps/04-event-volumes.ts`:
   - Bedrock mock JSONLs hint at events stored in raw event tables. For each PRD event, find closest table:
     - `event_match_end` → `etl_match_end` or similar
     - `event_login` → `etl_login`
     - etc.
   - For each: `SELECT date_trunc('day', ts), COUNT(*) FROM <event_table> WHERE ts >= now() - interval '7' day GROUP BY 1 ORDER BY 1`.
   - For events without source mapped (UGC, social subset): synthesise.
   - Write `event-volumes.json`.
8. Implement `steps/05-segment-demographics.ts`:
   - For each demo segment: COUNT with breakdowns (`GROUP BY player_lifecycle_stage`, `region_code`, `spend_tier_lifetime`).
   - Write `segment-demographics.json`.
9. Implement `outputs.ts` writer that JSON.stringify's to `apps/web/src/data/crawled/*.json` with stable key ordering (so git diffs are minimal across runs).
10. Run full pull: `pnpm refresh-cfm-data`. Validate JSON outputs.
11. Visual smoke: open `distributions.json` in editor, verify p50/p90/p99 reasonable, no all-zero histograms for T1-T4 features.
12. Commit: `feat(crawler): pull cfm_vn distributions, audience counts, samples, event volumes`.

## Todo List
- [ ] Implement 5 synthesizers (counter, score, bool, enum, tuple)
- [ ] Write SQL for 5 demo predicates
- [ ] Write SQL for ~50 T1-T4 feature derivations
- [ ] Implement step 01 (distributions)
- [ ] Implement step 02 (audience counts)
- [ ] Implement step 03 (sample players, anonymise UIDs)
- [ ] Implement step 04 (event volumes)
- [ ] Implement step 05 (segment demographics)
- [ ] Implement outputs.ts JSON writer with stable ordering
- [ ] Run `pnpm refresh-cfm-data` end-to-end
- [ ] Visual sanity check of all 5 outputs
- [ ] Commit fixtures to git

## Success Criteria
- [ ] `apps/web/src/data/crawled/distributions.json` has 67 entries (T1-T4 real + T5 synth)
- [ ] `audience-counts.json` has ≥7 predicate entries with threshold grids
- [ ] `sample-players.json` has 50-100 UIDs per feature, all anonymised
- [ ] `event-volumes.json` has ≥40 events with non-zero daily volume
- [ ] `segment-demographics.json` has ≥5 segments with full breakdowns
- [ ] Web `pnpm build` includes crawled JSONs in bundle
- [ ] No SQL injection vectors — all dynamic values parameterised

## Risk Assessment
| Risk | Mitigation |
|---|---|
| T3 window-function SQL slow on large fact tables | Add `WHERE ts >= now() - interval '90' day` cap; limit features computed during dev |
| Trino cluster contention causes timeouts | Concurrency=3; per-query timeout 30s; retry-once-then-synth fallback |
| Demo predicate counts come back as 0 (schema mismatch) | Step-0 audit catches this; fall back to synthesised count grids with warning |
| Sample player UIDs not actually anonymised | Hash with stable salt before write; smoke-test no raw UIDs in output |
| JSON output too large (>5MB) breaks Vite | Trim sparkline to 7 points, histogram to 28 bins, samples to 50-100 each |

## Security Considerations
- Sample player UIDs anonymised before commit (hash+salt). No raw VNG user IDs in repo.
- No purchase amounts, payment data, or PII columns selected.
- Crawler reads `.env` only; never logs creds.
- Outputs scrubbed of any field matching `/email|phone|name|address/i` before write.

## Next Steps
- P-6 reads `distributions.json` for Feature Store detail histograms.
- P-7 reads `audience-counts.json` for canvas threshold playground + audience preview band.
- P-8 reads `event-volumes.json` for event source picker cards.
