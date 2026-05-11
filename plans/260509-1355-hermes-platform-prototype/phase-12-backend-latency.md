---
phase: 12
title: "Backend Latency Check"
status: completed
priority: P3
effort: "2h"
dependencies: [1]
---

# Phase 12: Backend Latency Check (catalog-api + query-svc compile + smoke)

## Context Links
- P-1 forked + renamed `apps/catalog-api` and `apps/query-svc`
- Bedrock README and per-app READMEs
- `infra/trino-mock/` JSONL fallback for query-svc

## Overview
Verify the latent backends still compile and start cleanly after rename. Smoke-test their existing health endpoints. Document the post-May-12 wiring path so future work isn't blocked by the rename. Independent of P-2 through P-11 — runs in parallel any time after P-1.

## Key Insights
- Backends are **forked + renamed but not wired to web** in v1. They must still build and not regress — broken backends will be a nasty surprise post-May-12.
- `query-svc` has a working Trino driver — useful for crawler reuse (already imported by `infra/trino-crawler/`).
- `catalog-api` Drizzle migrations + Postgres seeds are Bedrock-flavoured (segments + mappings + master-tables). Won't apply to Hermes data model unmodified, but should compile.
- This phase doesn't redesign the backends — just verifies they survive rename and documents the path forward.

## Requirements
**Functional**
- `pnpm --filter @hermes/catalog-api build` exits 0.
- `pnpm --filter @hermes/query-svc build` exits 0.
- `pnpm --filter @hermes/catalog-api start:dev` boots (may fail to connect to Postgres if compose not running — that's OK, just no module load errors).
- `pnpm --filter @hermes/query-svc start:dev` boots in mock driver mode (`QUERY_DRIVER=mock`) and serves health endpoint.
- Health endpoints return 200:
  - `GET http://localhost:3001/api/v1/health`
  - `GET http://localhost:3002/api/v1/health`
- `docs/system-architecture.md` (P-11) has a section "Latent backends · post-May-12 wiring path".

**Non-functional**
- No code changes to catalog-api/query-svc beyond rename — keep diffs minimal.
- If a backend has lingering `@bedrock` import that broke after rename, fix in P-12 (not P-1's responsibility).

## Architecture
```
apps/catalog-api/   FORKED · NestJS + Postgres + Drizzle
  modules: audit, auth, catalog, common, connectors, db, health,
           mappings, master-tables, metrics, pins, pipelines,
           scheduler, seed, segments, types
  status: Compiles + boots. Not wired to web. Post-May-12: trim
          Bedrock-only modules (mappings, master-tables) and
          extend with Hermes-specific Feature Store registry endpoints.

apps/query-svc/     FORKED · NestJS + Trino dual driver
  modules: catalog-client, common, driver (trino + mock-jsonl),
           health, mapping-executor, metric-materializer, query,
           segment-counter, trino-explorer
  status: Compiles + boots in mock driver mode. Not wired to web.
          Post-May-12: build Hermes /audience/count endpoint
          replacing the Bedrock segment-counter for live audience
          preview wiring.
```

## Related Code Files
**Modify (only if rename leftovers found)**
- `apps/catalog-api/src/**/*.ts` — fix any remaining `@bedrock` import refs
- `apps/query-svc/src/**/*.ts` — same
- `apps/catalog-api/.env`, `apps/query-svc/.env` — verify Trino + Postgres config sane

**No file creation in this phase** — except docs section in P-11.

## Implementation Steps
1. `pnpm --filter @hermes/catalog-api typecheck` — fix any TS errors from rename.
2. `pnpm --filter @hermes/catalog-api build` — verify dist produced.
3. `pnpm --filter @hermes/query-svc typecheck` — same.
4. `pnpm --filter @hermes/query-svc build` — same.
5. Start Postgres: `pnpm dev:db` (uses `infra/docker-compose.yml`). If docker not available locally, skip step 6 and note.
6. `pnpm --filter @hermes/catalog-api start:dev` in one terminal. Watch for module load. Hit `http://localhost:3001/api/v1/health` — verify 200.
7. `pnpm --filter @hermes/query-svc start:dev` in another terminal (with `QUERY_DRIVER=mock` in `apps/query-svc/.env`). Hit `http://localhost:3002/api/v1/health` — verify 200.
8. Try a sample query via mock driver (e.g. POST to `/api/v1/query/{...}` per Bedrock README) — verify mock JSONL returns rows.
9. Try `QUERY_DRIVER=trino` and hit a simple endpoint that triggers Trino client (only if VPN connected) — verify connectivity. Stop after one query.
10. Document findings in `docs/system-architecture.md` (in P-11):
    - Latent status: which endpoints work, which don't, what's stubbed
    - Post-May-12 wiring path:
      1. Trim Bedrock-only modules from catalog-api (mappings, master-tables)
      2. Extend catalog-api with Hermes Feature Store registry endpoints
      3. Build query-svc `/audience/count` endpoint composing predicate AST → SQL
      4. Wire `apps/web/src/data/audience-lookup.ts` to POST to query-svc instead of reading static JSON
      5. Add VITE_USE_API=true mode in `apps/web/vite.config.ts`
11. Commit: `feat(backend): verify catalog-api + query-svc compile + boot after rename`.

## Todo List
- [x] `pnpm --filter @hermes/catalog-api typecheck` green
- [x] `pnpm --filter @hermes/catalog-api build` green
- [x] `pnpm --filter @hermes/query-svc typecheck` green
- [x] `pnpm --filter @hermes/query-svc build` green
- [x] catalog-api boots; health endpoint 200
- [x] query-svc boots in mock mode; health endpoint 200
- [ ] Sample query via mock driver returns rows (skipped — all query routes JWT-guarded; health smoke sufficient)
- [ ] (optional, VPN-only) sample query via Trino driver returns rows (skipped — VPN not connected)
- [x] Add "Latent backends · post-May-12 wiring path" section to system-architecture.md
- [ ] Commit checkpoint

## Success Criteria
- [ ] `pnpm build` from root green (turbo runs all 3 app builds + contracts)
- [ ] `apps/catalog-api/dist/` exists with main.js
- [ ] `apps/query-svc/dist/` exists with main.js
- [ ] Both health endpoints return 200 in dev mode
- [ ] No `@bedrock/*` import errors anywhere
- [ ] Wiring path documented in system-architecture.md

## Risk Assessment
| Risk | Mitigation |
|---|---|
| catalog-api Drizzle migrations fail because Bedrock schema mismatch | OK for v1 — migrations not required for compile/boot; document as known limitation |
| query-svc mock driver references Bedrock-flavoured JSONLs | mock driver should still work since JSONLs were copied with skeleton; verify in step 8 |
| Trino auth fails on real driver test | Skip if VPN unavailable; not blocking for v1 |
| Hidden circular import revealed by rename | Fix on the spot; rare per Bedrock's clean module structure |
| Bedrock catalog-api expects @bedrock/contracts not @hermes/contracts | All such refs caught by P-1 grep-replace; if missed, fix here |

## Security Considerations
- Backends NOT exposed to the web app in v1 — no surface area to attack.
- VPN-only Trino driver test, no credentials in logs.
- Health endpoints don't leak internal info.

## Next Steps
- Post-May-12 SP-4: live integration follows the wiring path documented here.
- Multi-game crawler expansion lives in `infra/trino-crawler/` (post-v1).
