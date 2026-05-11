---
phase: 4
title: "Detail page · DE panels"
status: pending
priority: P1
effort: "6h"
dependencies: [1]
---

# Phase 04: Feature Detail Page · Data Engineer Panels

## Overview

4 new panels for the data engineer persona. Consume Phase 01's `/pipeline-health` endpoint + the existing analytics table.

## Panels

1. **PipelineHealthTimelinePanel** — last 30 derivation runs as a strip-chart (green = success, red = error, height = duration). Tooltip shows row count + error message.
2. **CostLatencyCardPanel** — 4 metrics in a 2×2 grid: rowcount in feature_values, storage MB (`pg_total_relation_size` slice), p99 lookup latency (synth for now), median derivation duration.
3. **LineageV2Panel** — split into Upstream (Trino source tables → derivation file path → feature_values) and Downstream (segments referencing this feature, campaigns referencing this feature). Replaces the current static lineage tab.
4. **BackfillHistoryPanel** — small bar chart of `feature_distributions_daily.total_uids` per snapshot_date over 30d, with gaps (zero-count days) highlighted in amber.

## Implementation Steps

1. Add new tab "Engineer" between Analyst (Phase 03) and Lineage in `detail.tsx`. Reframes the existing Lineage tab as part of Engineer view; original Lineage tab becomes Lineage v2 within Engineer.
2. Author 4 panel components in `_components/_de/`.
3. Backend dependency: Phase 01 already adds `feature_pipeline_runs`. PipelineHealthTimelinePanel reads it.
4. Cost & Latency: storage size requires a new lightweight endpoint `GET /features/:name/storage` reading `pg_total_relation_size` for the feature's rows in `feature_values` (approximation: avg row size × count).

## Success Criteria

- [ ] Pipeline timeline shows real run history after a few `pnpm refresh` cycles.
- [ ] Lineage v2 splits upstream/downstream cleanly, downstream uses real segment+campaign refs.
- [ ] Backfill history highlights any gap days.

## Risk

- `feature_pipeline_runs` won't have data until Phase 01 lands + a refresh runs. UX: empty timeline shows "no runs recorded yet — run `pnpm refresh-cfm-data --feature-values-only`".
- Cost & Latency p99 lookup is synth — flag clearly until query-svc telemetry lands.
