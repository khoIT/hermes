# Chat-First IA Backends Shipped + Feature Store 500 Root Cause Fix

**Date**: 2026-05-10
**Severity**: Medium
**Component**: Chat-First Sidebar (backends), Feature Store client
**Status**: Resolved

## What Happened

Two parallel fixes landed today:

1. **Campaigns + Boards Nest backends** — closed the loop on 260510-0151 frontend-only phase. Frontend stubs hit 401's silently due to missing JWT auth wiring, so entire two-phase implementation was localStorage-bound. Today: added auth-fetch layer, completed both REST modules, verified round-trip on boards pin-card and campaign CRUD.

2. **HTTP 500 "Feature Store unavailable"** — recurring post-mortem. Root cause: Vite's default proxy ECONNREFUSED → HTTP 500 (bare, no body). Feature loader had branches for 502/503/504 but 500 fell through to generic text. Catalog-api restart = confusing outage report.

## The Brutal Truth

The auth-fetch issue is genuinely embarrassing. Frontend hit backends for weeks without Authorization headers. All three clients (segments, campaigns, boards) silently fell back to localStorage, and we didn't notice because the stubs worked *just well enough* for demos. The second you tried real data flow or multi-session consistency, it imploded.

The 500 bug was even worse from a UX angle — users saw "HTTP 500" with zero actionable guidance on what actually failed or how to fix it. We shipped without a sensible upstream-error translation layer.

## Technical Details

### Auth Wiring Gap
- **Created:** `apps/web/src/api/auth-fetch.ts` — wraps fetch, caches JWT from `/api/v1/auth/dev-login`, retries once on 401
- **Updated:** `modules/campaigns/`, `modules/segments/`, `modules/canvas/` clients to use authFetch instead of bare fetch
- **Result:** All three hit catalog-api with Authorization header now; 401 no longer masqueraded as network failure

### Campaigns Module
- `apps/catalog-api/src/campaigns/{campaigns.module,controller,service}.ts` — standard Nest CRUD
- `apps/catalog-api/db/schema-campaigns.ts` — campaigns + campaign_changelog tables (optimistic concurrency via version column, audit via global AuditService)
- Indexes on account_id + created_at for list queries

### Boards Module
- `apps/catalog-api/src/boards/{boards.module,controller,service}.ts` — list() enriches with cardCount; get(id) hydrates cards into sections
- `apps/catalog-api/db/schema-boards.ts` — boards table (sections jsonb), board_cards table (widget snapshot stored at pin-time)
- Migration: `apps/catalog-api/drizzle/0011_campaigns_boards.sql` (idempotent, applied clean)

### Feature Store 500 Fix (Two Layers)

**Layer 1 — Wire-level signal correction:**
```
apps/web/vite.config.ts proxy on('error'):
  ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND → HTTP 502 + JSON envelope
  {code: "UPSTREAM_UNREACHABLE", target: "catalog-api"|"query-svc", reason, message}
```

**Layer 2 — Client-side translation:**
```
apps/web/src/data/catalog/features/_loader.ts:
  500/502/503/504 — prefer upstream JSON message, else canonical text
  Actionable banner: "catalog-api not reachable on :3001"
```

**Verification:**
- Catalog-api UP → HTTP 200 (no regression)
- Catalog-api DOWN → HTTP 502 + actionable error message displayed to user

## What We Tried

- Initial thought: feature-loader was broken (it wasn't, just under-defensive)
- Assumption: frontend clients were auto-retrying auth (they weren't — 401 → localStorage immediately)
- Explored Vite proxy behavior docs, confirmed: ECONNREFUSED emits bare 500

## Root Cause Analysis

**Auth gap:** No shared JWT layer at fetch time. Each module independently hit backends, failed auth silently, fell back to localStorage. Worked for demos because stubs returned consistent data. Broke on real workflows needing server-side state.

**500 semantics:** Vite's default proxy treated connection errors as HTTP 500 (technically "server error" to the browser, but misleading). Feature loader didn't distinguish genuine 500s from connection timeouts. Result: users saw confusing error text with zero remediation path.

## Lessons Learned

- **Day-1 mistake:** authFetch should have wrapped ALL cross-app network calls from the start. Silent 401 → stub fallback is a landmine.
- **Defense-in-depth required:** Error classification at proxy layer (wire errors vs app errors) + client-side actionable messaging eliminate confusion. Without both layers, users get either "500" or "something broke somewhere."
- **Stubs as emergency fallback only:** localStorage stubs are legitimate for offline-first patterns, but current implementation risks stale stub colliding with later live response if network recovers. Recommend clearing on first successful live read in follow-up.

## Next Steps

- [ ] Review and clear localStorage stubs on first successful catalog-api response (prevents collision if network transient)
- [ ] Extend Vite proxy error handler to all app routes (query-svc, audience-count, etc.) — pattern proven
- [ ] Add request timeout to authFetch (currently no deadline; could hang indefinitely on flaky networks)
- [ ] Document auth-fetch layer in `docs/api-integration-patterns.md`

**Files modified (grep keys):**
- `apps/web/src/api/auth-fetch.ts` (new)
- `apps/web/vite.config.ts` (proxy error handler)
- `apps/web/src/data/catalog/features/_loader.ts` (error classification)
- `apps/catalog-api/src/campaigns/` (CRUD module)
- `apps/catalog-api/src/boards/` (CRUD module)
- `apps/catalog-api/db/schema-campaigns.ts`, `schema-boards.ts` (new)
- `apps/catalog-api/drizzle/0011_campaigns_boards.sql` (migration)
- `packages/contracts/src/campaign.ts`, `board.ts` (type extensions)

---

## Addendum (2026-05-10 PM) — Long-Tail Boot Starvation

After shipping the wire-level + client-level error fixes above, the recurring "Feature Store unavailable" pattern returned in a different form. Even with proper 502 envelope + actionable banner, the loader would give up forever after 3 retries totaling ~7s. Common trigger: cook commands that rebuild the workspace cause catalog-api's NestJS `--watch` to take >7s to fully recover, leaving the user stuck on the unavailable page until manual Retry click or hard reload.

### Root cause
`_loader.ts` had a fixed `RETRY_BACKOFF_MS = [1_000, 2_000, 4_000]`. After exhausting it, `scheduleNextRetry` returned silently — status stayed at 'error' indefinitely. Sufficient for a 5-second cold start; insufficient for cook-induced rebuilds that take 10–30s.

### Fix
- `_loader.ts`: extend retry chain with **unbounded 8s tail** (`STEADY_RETRY_MS = 8_000`). Loader now keeps polling every 8s until catalog-api answers, instead of giving up.
- `_loader.ts`: install one-time recovery hooks on `window.online` and `document.visibilitychange` events. When tab refocuses or network reconnects while in 'error' state, immediately attempt a fresh fetch (cancels any pending timer).
- Vite proxy error log: `customLogger` filter for `[vite] http proxy error` lines so the dev console isn't spammed during NestJS hot-reload windows.

### Prevention
Do NOT shrink the retry chain. Do NOT add retry caps. The unbounded tail is intentional — dev ergonomics demand the page recovers automatically when the backend comes up, even if that takes 30+ seconds. If you need to bound retries, add a kill switch via env flag, not a hardcoded ceiling.

### Files modified (addendum)
- `apps/web/src/data/catalog/features/_loader.ts` (unbounded backoff + recovery hooks)
- `apps/web/vite.config.ts` (customLogger filter for proxy noise)
