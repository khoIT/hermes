---
phase: 5
title: "Catalog-API Feature Endpoints"
status: pending
priority: P1
effort: "5h"
dependencies: [4]
---

# Phase 05: Catalog-API Feature Endpoints

## Overview

Expose 73 features through `apps/catalog-api` with the same `HermesFeature` zod shape the frontend already imports from `@hermes/contracts`. The endpoints read the **catalog metadata** (display name, type, latency, substrate, games, etc.) from the existing TS source files mounted as a static seed at boot, and the **analytics block** from `feature_analytics_180d` Postgres table populated by Phase 04.

## Requirements

**Functional:**
- `GET /api/v1/features` → `HermesFeature[]` (all 73, sorted by name).
- `GET /api/v1/features/:name` → single `HermesFeature`, 404 if unknown.
- `GET /api/v1/features/:name/distribution?days=30` → `{ snapshot_date, buckets[] }[]` from `feature_distributions_daily`.
- `GET /api/v1/features/:name/used-by` → `{ segments: [], campaigns: [] }` aggregated from existing static catalog files.
- All responses Zod-validated at the boundary.

**Non-functional:**
- Cold response < 200ms p95 (Postgres index hits).
- Cached in-memory at the controller after first read of static catalog (changes only at deploy).
- Health endpoint reports `features.count` so we know the seed loaded.

## Architecture

### Module layout

```
apps/catalog-api/src/features/
  features.module.ts
  features.controller.ts
  features.service.ts
  feature-catalog-loader.ts   — reads source TS files at build (or via packaged JSON)
  __tests__/features.controller.spec.ts
```

### Catalog-source loading

The 73 feature catalog rows live in `apps/web/src/data/catalog/features/*.ts`. The catalog-api can't import them directly across workspace boundaries cleanly, so we add a build step that exports them as JSON:
- New script `apps/web/scripts/export-feature-catalog.ts` writes `apps/web/src/data/catalog/features/_catalog.json` at build time.
- catalog-api reads that JSON path via a relative resolve; falls back to the latest committed copy when the file is absent (CI safety).

Alternatively (if cleaner): move feature source files into `packages/catalog-data/` and have both web + catalog-api import from there. **Decision deferred to impl** — pick the simpler path; the JSON export approach is the YAGNI default.

### Service layer

```ts
@Injectable()
class FeaturesService {
  async listAll(): Promise<HermesFeature[]> {
    const catalog = await this.loader.read();      // 73 feature metadata rows
    const analytics = await this.db.select(...);   // 73 analytics rows from feature_analytics_180d
    return catalog.map(c => ({ ...c, analytics: analytics[c.name] ?? emptyAnalytics() }));
  }

  async getDistribution(name: string, days: number) { ... }
  async getUsedBy(name: string) { ... }
}
```

### Validation

Use the existing `HermesFeature` zod schema from `@hermes/contracts` to validate every response in development; in prod, only validate inputs. This catches drift between catalog-api shape and what the frontend expects.

## Related Code Files

**Create:**
- `apps/catalog-api/src/features/features.module.ts`
- `apps/catalog-api/src/features/features.controller.ts`
- `apps/catalog-api/src/features/features.service.ts`
- `apps/catalog-api/src/features/feature-catalog-loader.ts`
- `apps/catalog-api/src/features/__tests__/features.controller.spec.ts`
- `apps/web/scripts/export-feature-catalog.ts` (build-time JSON exporter)
- `apps/web/src/data/catalog/features/_catalog.json` (generated, gitignored)
- `apps/catalog-api/src/seed/feature-analytics-180d.json` (move from `apps/web/src/data/catalog/`; T5 fallback source — see Phase 06)

**Modify:**
- `apps/catalog-api/src/app.module.ts` — register FeaturesModule
- `apps/catalog-api/src/health/health.controller.ts` — add `features.count` to health output
- `apps/web/package.json` — add `prebuild` step to run export-feature-catalog
- `apps/catalog-api/package.json` — add dep on the JSON path resolver if needed

**Delete:** none

## Implementation Steps

1. Decide JSON-export vs. shared-package — pick JSON-export for YAGNI.
2. **Move** `apps/web/src/data/catalog/feature-analytics-180d.json` → `apps/catalog-api/src/seed/feature-analytics-180d.json`. This is the T5 fallback source for `feature-analytics-180d` rows; the web bundle no longer needs it (Phase 06 deletes its web copy).
3. Author `export-feature-catalog.ts` writing `_catalog.json` with strip of `analytics` field (analytics comes from DB).
4. Author `feature-catalog-loader.ts` reading the JSON, with fallback to a last-known-good committed copy when file is absent.
5. Author `features.service.ts` with `listAll`, `getOne`, `getDistribution`, `getUsedBy`.
6. Author `features.controller.ts` with the 4 routes.
7. Wire FeaturesModule in `app.module.ts`. Add `features.count` to health.
8. Smoke: `curl http://localhost:3001/api/v1/features | jq 'length'` → 73.
9. Smoke: `curl http://localhost:3001/api/v1/features/account_age_days | jq '.analytics.driftScore'` → number.
10. `pnpm typecheck` and commit.

## Todo List

- [ ] Build `export-feature-catalog.ts` and wire to `pnpm build`
- [ ] Build `feature-catalog-loader.ts` with fallback path
- [ ] Build `features.service.ts` (listAll, getOne, getDistribution, getUsedBy)
- [ ] Build `features.controller.ts`
- [ ] Wire FeaturesModule in app.module.ts
- [ ] Add health probe for `features.count`
- [ ] Smoke test all 4 routes via curl
- [ ] Unit tests for controller
- [ ] `pnpm typecheck` green
- [ ] Commit

## Success Criteria

- [ ] `curl http://localhost:3001/api/v1/features` returns 73 features matching `HermesFeature[]` zod parse.
- [ ] `curl http://localhost:3001/api/v1/features/account_age_days/distribution?days=30` returns 30 daily histogram entries.
- [ ] `curl http://localhost:3001/api/v1/health` shows `features.count: 73`.
- [ ] Re-running with empty `feature_analytics_180d` falls back to the empty-analytics block per feature without 500ing.
- [ ] Controller spec passes: `pnpm --filter @hermes/catalog-api test`.

## Risk Assessment

- **Workspace boundary headache:** importing TS source from `apps/web` into `apps/catalog-api` is brittle. **Mitigation:** JSON export step decouples them. Last-known-good fallback file committed.
- **Zod-validation overhead:** validating 73 features × 180 sparkline numbers on every request is non-trivial. **Mitigation:** validate once at boot, then in-memory cache; only re-validate on cache invalidation (15min TTL or DB-table-version bump).
- **Seed/migration ordering:** if Postgres has no `feature_analytics_180d` row yet, the API must still respond with the catalog plus empty analytics, not 500. **Mitigation:** `analytics ?? emptyAnalytics()` fallback at the service layer.
- **Used-by aggregation cost:** scanning `segments.ts` + `campaigns.ts` for each request is wasteful. **Mitigation:** precompute a `Map<featureName, {segments[], campaigns[]}>` at module init.
