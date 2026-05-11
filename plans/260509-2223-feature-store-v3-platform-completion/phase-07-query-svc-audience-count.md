---
phase: 7
title: "query-svc /audience/count for Segments"
status: pending
priority: P1
effort: "14h"
dependencies: [1, 6]
---

# Phase 07: query-svc Audience Count + Segments Live Wiring

## Overview

Build `POST /api/v1/audience/count` in query-svc that translates a Hermes predicate AST into Postgres SQL hitting `feature_values` and returns audience size + sampled uids. Wire Segments composer + threshold playground to consume it (replaces the hardcoded 15k).

## Endpoint contract

```
POST /api/v1/audience/count
Body: {
  predicate: {
    all?: Predicate[],   // AND
    any?: Predicate[],   // OR
    not?: Predicate,
    leaf?: { feature: string, op: 'gt'|'lt'|'gte'|'lte'|'eq'|'in', value: number|string|string[] }
  },
  asOf?: ISODate,        // default now()
  limit?: number         // sample uid cap, default 100
}
Response: {
  count: number,
  sampledUids: string[],
  predicateSql: string,  // returned for transparency
  durationMs: number
}
```

## Implementation Steps

1. **Predicate translator** — `apps/query-svc/src/audience/predicate-translator.ts`:
   - Pure function `(ast, params) → { sql, bindParams }`
   - Generates `EXISTS (SELECT 1 FROM feature_values WHERE feature_name = $1 AND value_numeric > $2)` per leaf
   - Wraps with `INTERSECT` for `all`, `UNION` for `any`, `EXCEPT` for `not`
   - Final: `SELECT COUNT(DISTINCT uid) FROM (...)`
2. **Audience module** — `apps/query-svc/src/audience/audience.module.ts` + service + controller.
3. **Driver dispatch** — when `QUERY_DRIVER=mock`, run against the mock JSONL via `mock-jsonl.driver.ts`. When `trino`, route to Postgres feature_values directly (NOT Trino — feature_values is the unified store).
4. **Mock vs Postgres parity test** — fixture predicate, run both, assert same count ±5%.
5. **Segments wiring** — update `apps/web/src/modules/segments/_state/audience-lookup.ts` to fetch from `/api/v1/audience/count` instead of static fixtures.
6. **Threshold playground reuse** — Phase 05's panel already uses catalog-api's audience-count for single-feature thresholds. The composer-level threshold (multi-predicate) routes to query-svc.

## Success Criteria

- [ ] `curl -X POST .../audience/count -d '{"predicate":{"leaf":{"feature":"account_age_days","op":"gt","value":30}}}'` returns `{ count: ~120k, sampledUids: [...], durationMs: <500 }`.
- [ ] AND-of-OR predicate (the demo flow's segment shape) returns within 1s.
- [ ] Segments threshold slider in the composer shows live count.
- [ ] Mock + Trino driver parity within 5%.

## Risk

- Predicate translator scope creep — keep the AST minimal (leaf, all, any, not). Defer `between`, `in_range`, etc. to a follow-up.
- COUNT(DISTINCT uid) over 6.35M rows can be slow if the planner doesn't use the indexes. Mitigation: EXPLAIN ANALYZE the worst-case predicate and add an index if needed.
- query-svc is a separate process — the `/api` Vite proxy currently routes `/api → catalog-api:3001`. We'll need either a path split (`/api/catalog/* → 3001`, `/api/query/* → 3002`) or a single gateway. Decision: split prefixes; existing /api routes remain at catalog-api, new audience routes at query-svc.
