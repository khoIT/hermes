---
phase: 6
title: "Trim Bedrock modules"
status: pending
priority: P3
effort: "4h"
dependencies: []
---

# Phase 06: Trim Bedrock Modules

## Overview

Delete `apps/catalog-api/src/{mappings,master-tables}/` and the corresponding Drizzle tables. They're Bedrock-derived holdovers, unused by Hermes UI, and cluttering the API surface ahead of query-svc wiring (Phase 07).

## Implementation Steps

1. **Scout** — `grep -r "mappings\|MasterTables\|MappingsModule\|MasterTablesModule" apps/ packages/ --include='*.ts' --include='*.tsx'` and confirm zero non-self-referential hits.
2. Delete `apps/catalog-api/src/mappings/` and `apps/catalog-api/src/master-tables/`.
3. Remove their imports from `app.module.ts`.
4. Remove `mappings`, `mappingTemplates`, `mappingDryRuns`, `masterTables`, `buildJobs`, `masterUserProfileDx` from `schema.ts`.
5. Migration `0011_trim_bedrock.sql`: `DROP TABLE` for the 6 above (cascade for any dangling FKs).
6. Remove the `mapping/`, `master-table.ts` exports from `packages/contracts/src/`.
7. Remove the seed code in `apps/catalog-api/src/seed/seed.ts` that references mappings/master-tables.
8. `pnpm typecheck && pnpm build` — green.
9. Smoke: `curl http://localhost:3001/api/v1/health` still 200.

## Success Criteria

- [ ] `apps/catalog-api/src/{mappings,master-tables}/` deleted.
- [ ] No build errors workspace-wide.
- [ ] Migration applies cleanly to a fresh DB.
- [ ] Existing integration tests still pass.

## Risk

- `mapping-executor` in query-svc may reference these — check first. If yes, scope shifts: query-svc also needs trimming.
- Some segments-related code may import master-tables for legacy reasons. Mitigation: deep grep before delete.
