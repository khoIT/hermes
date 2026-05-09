# System Architecture

**Last updated:** 2026-05-09 · Phase 11

---

## 1. Overview — Two-Substrate Architecture

Hermes bridges two independent, substrate-specific platforms within a unified authoring interface:

```
┌─────────────────────────────────────────────────────┐
│  Hermes Web App (Vite + React 18)                   │
│  - Feature Store (inventory, definitions)           │
│  - Segments (population filter authoring)           │
│  - Campaigns (activation + trigger authoring)       │
│  - Agents (AI-assisted recommendations)             │
│  - Explore (discovery, deferred)                    │
│  Port: 5173 (dev) · 3000 (prod)                     │
└─────────────────────────────────────────────────────┘
                         ▲
         ┌───────────────┴───────────────┐
         │                               │
    ┌────────────────────────┐   ┌────────────────────────┐
    │ SUBSTRATE A            │   │ SUBSTRATE B            │
    │ Apollo + Temporal      │   │ Hatchet + Trino        │
    │ (Real-time triggers)   │   │ (Batch segments)       │
    │                        │   │                        │
    │ Output: TriggerID      │   │ Output: SegmentID      │
    │ Latency: <1s–1s        │   │ Latency: min–hours     │
    │ Evaluation: Per event  │   │ Evaluation: Scheduled  │
    │ Consumer: Apollo TEE   │   │ Consumer: Activation   │
    │ & Temporal workflows   │   │ API + channel delivery │
    └────────────────────────┘   └────────────────────────┘
```

**Feature Store as bridge:** Both substrates read shared feature definitions. Semantic Management Layer ensures consistency. Web bundles static feature definitions + crawled data. Post-May-12: live catalog-api queries replace static JSON.

---

## 2. Data Flow (v1 — Static Fixtures)

```
┌─ cfm_vn Schema @ Trino (VPN-gated) ─────────────┐
│ etl_login, etl_logout, etl_match_end,           │
│ etl_recharge, etl_inapp_event, etl_install,    │
│ etl_money_flow, etl_register,                   │
│ std_master_user_profile                         │
└─────────────────────────────────────────────────┘
                    │
                    ▼
       ┌────────────────────────────┐
       │ infra/trino-crawler (TS)   │
       │                            │
       │ Step 0: Schema audit       │
       │ Step 1: Feature distros    │
       │ Step 2: Audience counts    │
       │ Step 3: Sample players     │
       │ Step 4: Event volumes      │
       │ Step 5: Segment demo       │
       └────────────────────────────┘
                    │
                    ▼
    ┌────────────────────────────────────────────┐
    │ 5 Fixture JSON files (committed to git)    │
    │ apps/web/src/data/crawled/                 │
    │ - distributions.json (28-bin histograms)   │
    │ - audience-counts.json (predicate grid)    │
    │ - event-volumes.json (sparklines)          │
    │ - sample-players.json (UID rows)           │
    └────────────────────────────────────────────┘
                    │
                    ▼
      ┌────────────────────────────────┐
      │ pnpm build (Vite bundling)     │
      │ Embeds fixtures in JS output   │
      └────────────────────────────────┘
                    │
                    ▼
      ┌────────────────────────────────┐
      │ Browser (offline, no fetch)    │
      │ Feature Store, Segments, etc.  │
      │ All data from bundle           │
      └────────────────────────────────┘
```

**Why static?** PRD requirement (no fetch, offline demo). Crawler outputs committed to git. Real Trino integration happens post-May-12 via query-svc live queries.

---

## 3. Two Interface Contracts

### 3.1 SegmentID (Substrate B)

**Output:** Frozen UID list in `state_user_segments` table (Hatchet pipeline).

**Minted by:** Segment authoring canvas on explicit "Save & Handoff" action.

**Format example:** `seg-cfm-ss1-weapon-owners-2026`

**Consumed by:** Apollo Activation API for channel delivery (email, push, in-game message).

**Handoff modal shows:**
```
Name: Weapon Owners (Strict Tier 1)
SegmentID: seg-cfm-ss1-weapon-owners-2026
Predicate: [weapon_lifetime_count ≥ 10] AND [last_session_weapon_class = "sword"]
Audience: 245,000 users
Substrate: Hatchet (batch compile) → Trino (segment query) → Iceberg (storage)
Refresh: Every 24h (default)
```

### 3.2 TriggerID (Substrate A)

**Output:** Registered evaluator config in `JourneyDB` (Apollo metadata store).

**Minted by:** Campaign launch → real-time trigger variant (implicit, as side effect).

**Format example:** `trg-cfm-pass-stuck`

**Consumed by:** Apollo TEE for per-event evaluation + Temporal workflow spawn.

**Handoff modal shows:**
```
Name: Pass Stuck (Real-time)
TriggerID: trg-cfm-pass-stuck
Event: event_match_end
Predicate: [consecutive_ranked_losses_streak ≥ 5] AND [mmr_change_7d < -100]
Cooldown: 24h
Substrate: Apollo TEE (sub-second) → Temporal (workflow orchestration)
Launch: Immediate
```

---

## 4. Feature Store — Semantic Management Layer

**Role:** Unifies feature definitions across both substrates.

| Concept | Definition |
|---------|-----------|
| **Feature** | Atomic dimension, count, or predictive score (e.g., `account_age_days`, `purchase_count_7d`, `churn_risk_score`) |
| **Lineage** | Which substrate(s) consume the feature (Substrate A, B, or both) |
| **Tier** | Hot (sub-second), Warm (minutes), Cold (hours) — determines appropriate substrate |
| **Latency Badge** | Visual label: `<1s · A`, `<1h · B`, `<1d · B` |
| **Definition** | Plain-English intent + technical spec (both shown on feature detail page) |

**Feature registry:** 67 features across 9 domains.
- **Tiers:** 38 hot (Substrate A), 56 warm (Substrate A/B hybrid), 33 cold (Substrate B)
- **Coverage:** ~50–60% from real cfm_vn Trino tables; ~10–15% synthesised (marked `synthesised: true` on card)

---

## 5. Web Stack

### 5.1 apps/web

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Build | Vite 5 | Fast dev, optimized production bundle |
| UI Framework | React 18 | Component composition, hooks |
| Language | TypeScript 5 | Type safety, contracts from `@hermes/contracts` |
| Routing | TanStack Router | File-based routing per `modules/*/page.tsx` |
| State (server) | TanStack Query | Data fetching, caching (v1: static JSON) |
| State (client) | Zustand | Client-side state (predicates, canvas edits) |
| Styling | Tailwind CSS | Utility-first; all colors/spacing via `theme.tsx` |
| Components | shadcn/ui + custom | Primitives + domain-specific (OpportunityCard, etc.) |

**Modules:**
- `modules/feature-store/` — Library + detail view, histogram, lineage
- `modules/segments/` — Library + canvas (AND-of-OR) + threshold playground + handoff modal
- `modules/campaigns/` — Library + 3 canvas variants + journey + prelaunch + handoff modal
- `modules/agents/` — Inbox (4 tabs) + opportunity detail + drafts + activity + settings
- `modules/explore/` — Nav-only stub (full module deferred post-May-12)
- `modules/_shared/` — Reusable components (OpportunityCard, LatencyBadge, PredicateComposer, etc.)

**Port:** 5173 (dev), 3000 (prod via `serve`)

---

## 6. Backend Services (Latent — v1 Unconnected)

### 6.1 apps/catalog-api

- **Framework:** NestJS 11
- **Database:** Postgres 16 + Drizzle ORM
- **Port:** 3001 (dev), `/api/v1` prefix
- **Health check:** `GET /api/v1/health` → 200 `{"ok":true,"db":"connected"}`
- **Modules:** audit, auth, catalog, connectors, db, health, mappings, master-tables, metrics, pins, pipelines, scheduler, seed, segments
- **Auth:** JWT (`JWT_SECRET=hermes-dev-secret-change-in-prod`)
- **Job queue:** pg-boss (same Postgres DB)
- **Current state:** Compiles ✓ · Boots ✓ · Health 200 ✓ · Schema Bedrock-derived (deferred replacement)

### 6.2 apps/query-svc

- **Framework:** NestJS 11
- **Drivers:** Trino (live, VPN-gated) + mock JSONL (offline)
- **Port:** 3002 (dev), `/api/v1` prefix
- **Health check:** `GET /api/v1/health` → 200 `{"ok":true,"driver":"mock"}`
- **Driver selection:** `QUERY_DRIVER=mock` (default) or `QUERY_DRIVER=trino` (env var)
- **Modules:** catalog-client, driver, health, mapping-executor, metric-materializer, query, segment-counter, trino-explorer
- **Key routes (JWT-guarded):**
  - `GET  /api/v1/q/metrics/:id/series` — time series for metric
  - `GET  /api/v1/q/metrics/:id/sparkline` — sparkline data
  - `POST /api/v1/q/segments/preview-count` — audience count for predicate
  - `POST /api/v1/q/segments/preview` — sample UID rows
  - `POST /api/v1/q/explorer/run` — ad-hoc query (Trino driver only)
  - `POST /api/v1/q/mappings/execute` — criteria translation
- **Current state:** Compiles ✓ · Boots ✓ · Health 200 ✓ · Ready for May 12 validation

---

## 7. Data Models

**Shared types:** `packages/contracts/src/`

| Schema | Purpose |
|--------|---------|
| `Feature` | Feature definition (name, lineage, tier, units) |
| `Segment` | Population filter (ID, predicate AST, audience count) |
| `Campaign` | Activation plan (ID, trigger, journey, goal, monitoring) |
| `Opportunity` | AI recommendation (window, confidence, evidence, proposed action) |
| `AgentDraft` | Agent-refined draft segment/campaign |
| `Predicate` | Boolean expression AST — `{ all?: Predicate[], any?: Predicate[] }` (AND-of-OR) |
| `Event` | Event catalog entry (name, properties, schema) |

---

## 8. Crawler Pipeline (infra/trino-crawler)

**CLI entry:** `pnpm refresh-cfm-data` (via root `package.json` script).

**5-step process:**

| Step | Name | Output | Notes |
|------|------|--------|-------|
| 0 | Schema audit | `infra/trino-crawler/schema-audit.md` | Discovers cfm_vn tables + columns; checks coverage against 67-feature manifest |
| 1 | Feature distributions | `apps/web/src/data/crawled/distributions.json` | 28-bin histogram + p50/p90/p99 per feature |
| 2 | Audience-count grid | `apps/web/src/data/crawled/audience-counts.json` | 5 demo predicates × 5 thresholds → cached audience counts |
| 3 | Sample player rows | `apps/web/src/data/crawled/sample-players.json` | TABLESAMPLE UID rows; used by Feature detail "Recent values" |
| 4 | Event volumes | `apps/web/src/data/crawled/event-volumes.json` | Per-event daily volume sparkline (30-day window) |

**Fallback behavior:** If crawler fails (VPN, 401, timeout), existing fixtures remain in git. Demo runs offline using committed JSON.

**Derivation tiers:**
- **T1 (Direct column):** 10–15 features (account_age_days, region_code, is_test_account)
- **T2 (Simple aggregate):** 15–20 features (lifetime_login_count, session_count_30d)
- **T3 (Window function):** 10–15 features (consecutive_ranked_losses_streak, mmr_drift_7d)
- **T4 (Cross-table join):** 5–10 features (is_paying_user_lifetime, spend_tier_lifetime)
- **T5 (Synthesised):** 10–15 features (no cfm_vn source; `synthesised: true` badge)

---

## 9. Post-May-12 Live Integration Path (SP-4)

### 9.1 Current Backend Status (Phase 12 Verification)

| Check | Result |
|-------|--------|
| `catalog-api` typecheck | PASS (0 errors) |
| `catalog-api` build | PASS (`dist/src/main.js` produced) |
| `query-svc` typecheck | PASS (0 errors) |
| `query-svc` build | PASS (`dist/main.js` produced) |
| `catalog-api` health check | 200 `{"ok":true,"db":"connected"}` |
| `query-svc` health check | 200 `{"ok":true,"driver":"mock"}` |
| `@bedrock` refs removed | CLEAN · all renamed to `@hermes` |

**Conclusion:** Both backends are production-ready for wiring phase. Not connected to web in v1; all data flows via static JSON.

### 9.2 Five-Step Wiring Plan

**Step 1 — Trim Bedrock-only modules from catalog-api**

Files: `apps/catalog-api/src/{mappings,master-tables}/`

Action:
```bash
# Verify removal doesn't break health check
pnpm --filter @hermes/catalog-api start:dev
curl http://localhost:3001/api/v1/health
# Expected: 200 {"ok":true,"db":"connected"}
```

Keep: audit, auth, catalog, connectors, db, health, metrics, pins, pipelines, scheduler, segments.

**Step 2 — Extend catalog-api with Hermes Feature Store registry**

New module: `apps/catalog-api/src/features/`

Endpoints to add:
```typescript
GET  /api/v1/features              // List all feature definitions
GET  /api/v1/features/:id          // Get feature schema + substrate bindings
POST /api/v1/features              // Register new feature
PUT  /api/v1/features/:id          // Update feature definition
```

Drizzle schema changes:
```typescript
// Replace Bedrock tables with Hermes Feature Store tables
// New: features, feature_domains, feature_tiers, feature_lineage
// Migration: `apps/catalog-api/drizzle/migrations/` new file
```

**Step 3 — Build query-svc `/audience/count` endpoint**

New module: `apps/query-svc/src/audience/`

Endpoint:
```typescript
POST /api/v1/audience/count

Request: {
  predicate: {
    all?: Predicate[],
    any?: Predicate[],
    not?: Predicate
  },
  as_of?: Date // default: now()
}

Response: {
  count: number,
  sampled_uids: string[] // first 100 for preview
}
```

Implementation:
- Use existing `CriteriaTranslator` at `src/driver/sql-builder/criteria.translator.ts`
- Translate AST → SQL WHERE clause
- Mock driver: query `infra/trino-mock/` JSONL files
- Trino driver: query `iceberg.<schema>.std_master_user_profile`

**Step 4 — Wire web app to query-svc**

File: `apps/web/src/modules/segments/_state/audience-lookup.ts`

Current behavior (v1):
```typescript
export async function getAudienceCount(predicate: Predicate) {
  // Reads static JSON from data/crawled/audience-counts.json
}
```

New behavior (post-May-12):
```typescript
export async function getAudienceCount(predicate: Predicate, apiMode = false) {
  if (!apiMode) {
    // Fallback to static (v1 mode)
  }
  
  const token = getJWTFromSession(); // catalog-api issued
  const response = await fetch('/api/query/audience/count', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ predicate })
  });
  
  return response.json();
}
```

**Step 5 — Add `VITE_USE_API=true` feature flag**

File: `apps/web/vite.config.ts`

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api/catalog': 'http://localhost:3001',
      '/api/query': 'http://localhost:3002'
    }
  },
  define: {
    'import.meta.env.VITE_USE_API': process.env.VITE_USE_API === 'true'
  }
});
```

Enable with:
```bash
VITE_USE_API=true pnpm dev
```

### 9.3 Known Limitations (v1 Latent Backends)

| # | Issue | Root Cause | Mitigation | Timeline |
|---|-------|-----------|-----------|----------|
| L1 | Catalog-api dist path | NestJS builds to `dist/src/main.js` (missing `rootDir`) | Boot script + Dockerfile fixed in P-12 | Cosmetic; prod OK |
| L2 | Drizzle migrations required | No auto-run on startup | User must run `pnpm db:migrate` | Expected behavior |
| L3 | Schema Bedrock-derived | Migrations model old platform | Post-May-12 schema replacement planned | On roadmap |
| L4 | Query-svc mock data | Bedrock-shaped JSONL rows | Functional for testing driver path | Refreshed post-May-12 |
| L5 | JWT-gated query endpoints | All `/api/v1/q/*` require token | Health endpoint public (smoke target) | By design |
| L6 | Docker Postgres port conflict | :5432 shared with Bedrock dev container | Run in fresh container or stop Bedrock | Workaround available |

### 9.4 Infrastructure Notes

**Database:**
- `infra/docker-compose.yml` — Postgres 16 on :5432, user `hermes`, DB `hermes_dev`
- Command: `docker compose -f infra/docker-compose.yml up -d postgres`

**Mock data:**
- `infra/trino-mock/` — JSONL fixture files (cfm_vn + ballistar schemas)
- Used by query-svc when `QUERY_DRIVER=mock` (default)

**Crawler:**
- `infra/trino-crawler/` — TS CLI for refreshing crawled fixtures from live Trino
- Command: `pnpm refresh-cfm-data` (requires VPN + creds in `.env`)

**Auth:**
- Both backends share `JWT_SECRET=hermes-dev-secret-change-in-prod`
- Change in production `.env` before deployment

---

## 10. Deployment

**Target:** Dokploy + Nixpacks (Bedrock pattern).

**Build output:** `apps/web/dist/` (Vite SPA) + backend containers (NestJS).

**Environment variables:**
- `NODE_ENV=production` (web, both backends)
- `DATABASE_URL=postgresql://...` (catalog-api)
- `QUERY_DRIVER=trino` (query-svc, live mode)
- `JWT_SECRET=...` (both backends, change from default)
- `VITE_USE_API=true` (web, enables live query-svc calls)

**Startup sequence:**
1. Postgres boot
2. catalog-api `pnpm db:migrate` + `pnpm start:prod`
3. query-svc `pnpm start:prod`
4. Web app via `pnpm start` or static file server

See `docs/deployment-guide.md` for full runbook.
