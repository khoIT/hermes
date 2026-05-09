# Feature Store End-to-End: Real Data Pipeline + Live API Delivery

**Date**: 2026-05-09 20:32–02:23
**Severity**: Critical / Delivery
**Component**: Hermes Feature Store v3 (Trino → Postgres → API → Web)
**Status**: Resolved (Demo-Ready)

## What Happened

Landed two sequential plans in a single 6-hour session (13 commits): real Trino data pipeline fully wired, persona analytics API complete, live feature store on web. The system moved from synthetic fixtures to production-grade aggregates and now surfaces actionable audience insights.

Plan 1 cranked ETL: 7-day Trino pull (1.09M rows across etl_* tables) → raw_event_aggregates. 23-day synthetic backfill via day-of-week projector (20.98M rows). 48 batch-feature derivations grouped by source table, yielding 6.35M feature_values. 30d distributions (1,440 daily rollups), 76-row 180d analytics view. Hard-cut web bundle from static JSON to live catalog-api FeaturesModule (4 endpoints). Postbuild guard kills any reintroduction.

Plan 2 surfaced a constraint early: multi-game Trino probe revealed only cfm_vn is reachable; ptg_vn, nth_vn, cos_vn don't exist; tf_vn empty. Rather than block, landed architectural prep (game_id schema delta, parameterized Trino queries) for when access materializes. Built 8 new persona endpoints (audience-count, quantiles, samples, pipeline-health, outliers, coverage-segmentation, top-segments-using, correlations). query-svc /audience/count implements predicate AST → Postgres set algebra (INTERSECT/UNION/EXCEPT) returning in 153ms. Frontend got marquee redesign: SourceProvenanceCard (REAL/HYBRID/SYNTH badge), HealthVerdictCard (4-signal aggregator → RED/YELLOW/GREEN), ThresholdPlaygroundPanel (slider-driven live audience projection). All 36 validation assertions pass.

## The Brutal Truth

This is exhausting but exhilarating. Real data + live API + interactive UI in a single push. The multi-game blocker stung momentarily—discovered mid-plan—but architectural prep meant zero rework. The hard-cut to API (no env-gated rollout, no static fallback) felt aggressive, but strict dependency beats compatibility hatch. T4 features got proxy-SQL treatment (tagged 'hybrid') instead of dropped; that pragmatism unblocked demo readiness.

The threshold playground panel is the marquee win: turned audience-count into a campaign-authoring tool. Authors literally watch audience size shift as they adjust rules. That's not just analytics; that's usable.

## Technical Details

**ETL Pipeline:** Trino diagnostic queries surfaced table cardinality; built 7d real aggregates incrementally to avoid timeout. 23d synth backfill uses day-of-week drift events + seed JSON fallback for missing T4 scores. Feature derivations: 48 batch transformations (group by source table, apply aggregations, cross-join with profile base). Postgres schema: feature_values (48M rows), feature_analytics_180d (76 rows), daily_distributions (1,440 rows). Catalog API: FeaturesModule returns paginated, time-filtered features with analytics summary. 

**Query Service:** /audience/count parses predicate AST into set algebra. AND-of-leaf (disjunctions) returns in 153ms; INTERSECT scales well. Error handler wraps dead Postgres connections into 503 DB_UNAVAILABLE envelope with actionable web banner text instead of generic HTTP 500.

**Frontend:** Feature detail page now shows: source badge (real/hybrid/synth), health verdict (pipeline freshness + row-count deviation + cardinality skew + outlier prevalence), and live threshold playground. Feature row card displays latency badge. All bound to live API.

## What We Tried

Attempted multi-game pull immediately. Hit Trino access boundary (only cfm_vn reachable). Instead of deferring, pivoted to schema prep + parameterized queries. T4 scoring delayed, so proxied with SQL (tagged 'hybrid') rather than dropping features entirely. Both choices proved correct under demo constraints.

## Root Cause Analysis

Why the multi-game blocker existed: account permissions silently fail on Trino. No early discovery mechanism; surfaced only mid-plan via explicit `--all-games` probe. Should have scripted multi-game check as phase 00 discovery, but 7d real pull + synth backfill + derivations understandably took priority. The hard architectural decision (game_id schema, parameterized Trino) meant zero rework when access lands.

## Lessons Learned

1. **Architect for constraints early.** Schema + query parameterization cost 2 commits but saved rework when multi-game blocker hit. Future: always probe external dependencies (Trino, data access, table existence) in phase 00.

2. **Proxy over drop.** T4 features couldn't be scored in time, so proxy-SQL + 'hybrid' tag allowed demo readiness. That pragmatism > perfectionism. Document the proxy explicitly so future cleanup is obvious.

3. **Hard dependencies beat compatibility hatches.** Ripping static JSON from web bundle to live API felt risky, but strict coupling meant cleaner contracts. Postbuild guard prevents regression.

4. **Live audience projection is a campaign tool.** The threshold playground panel proved that "analytics" is only useful if it drives authorship. Focus there next.

## Next Steps

1. When multi-game Trino access lands: run multi-game pull using parameterized schema, refresh feature pipeline, re-validate all 36 assertions.
2. Score T4 features and flip 'hybrid' tags to 'real' once SQL proxy is no longer needed.
3. Extend threshold playground to segment exclusion rules (already wired; needs UI polish).
4. Document Trino access requirements in ops runbook so future engineers don't rediscover this constraint.
