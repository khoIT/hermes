# Deployment Guide

**Last updated:** 2026-05-09 · Phase 11

---

## 1. Prerequisites

- **Node.js:** ≥20 (check with `node --version`)
- **pnpm:** ≥9 (check with `pnpm --version`)
- **Docker:** For Postgres (optional; required only if using live catalog-api)
- **VPN:** Required for `pnpm refresh-cfm-data` to reach Trino (10.164.54.181:8080)

---

## 2. Local Development

### 2.1 Fresh Start

```bash
# Clone and install
git clone <repo>
cd hermes
pnpm install

# Start all services (web + latent backends)
pnpm dev
```

**Output:**
```
@hermes/web:dev      Running at http://localhost:5173
@hermes/catalog-api:dev  Running at http://localhost:3001
@hermes/query-svc:dev    Running at http://localhost:3002
```

**Access:** Open http://localhost:5173 in browser.

### 2.2 Using Live Backends (Optional)

If you need to test Postgres connectivity or JWT auth:

```bash
# Start Postgres container
pnpm dev:db

# Run migrations
pnpm migrate

# Optionally seed demo data
pnpm seed

# Continue with pnpm dev
pnpm dev
```

**Postgres details:**
- Host: `localhost`
- Port: `5432`
- User: `hermes`
- Database: `hermes_dev`
- Password: (empty, or use `.env` from root)

**Note:** Catalog-api and query-svc boot but are not wired to the web app in v1. All data flows from static JSON fixtures.

### 2.3 Refreshing Crawler Fixtures (Real Trino Data)

```bash
# Requires VPN + credentials in .env
pnpm refresh-cfm-data
```

**Expected output:**
```
✓ Connecting to Trino @ 10.164.54.181:8080
✓ Schema audit complete (table coverage 95%)
✓ Step 1: Feature distributions → infra/trino-crawler/fixtures/
✓ Step 2: Audience counts → apps/web/src/data/crawled/
✓ Step 3: Sample players → apps/web/src/data/crawled/
✓ Step 4: Event volumes → apps/web/src/data/crawled/
✓ Fixtures committed to git
```

**If fails:**
```bash
# Check credentials
cat .env | grep TRINO

# Check VPN
ping 10.164.54.181

# Fallback: use fixtures from git
git checkout apps/web/src/data/crawled/
pnpm dev  # will use old fixtures offline
```

---

## 3. Building for Production

### 3.1 Full Build

```bash
pnpm build
```

**Output:**
```
@hermes/catalog-api:build: ✓ dist/src/main.js
@hermes/query-svc:build:    ✓ dist/main.js
@hermes/web:build:          ✓ dist/index.html + assets/
```

**Verification:**
```bash
# Check builds succeeded
ls -la apps/web/dist/
ls -la apps/catalog-api/dist/
ls -la apps/query-svc/dist/
```

### 3.2 Type Checking (Pre-Build)

Always run before deploying:

```bash
pnpm typecheck
```

**Must report:** 0 errors (warnings OK).

### 3.3 Web-Only Build (Fast)

If only updating the web app:

```bash
pnpm --filter @hermes/web build
```

---

## 4. Running Locally (Production Mode)

### 4.1 Web App Only

```bash
pnpm build
pnpm start
# Serves on http://localhost:3000 (or $PORT)
```

**Or using Vite preview:**
```bash
pnpm --filter @hermes/web preview
# Serves on http://localhost:4173
```

### 4.2 Full Stack (Web + Backends)

```bash
# Terminal 1: Postgres
pnpm dev:db

# Terminal 2: Migrations + seed (first time only)
pnpm migrate
pnpm seed

# Terminal 3: All apps in production mode
pnpm build
# Start each service separately:
pnpm --filter @hermes/catalog-api start:prod &
pnpm --filter @hermes/query-svc start:prod &
pnpm start  # web on 3000
```

**Verification:**
```bash
curl http://localhost:3001/api/v1/health
# {"ok":true,"db":"connected","service":"catalog-api","ts":"2026-05-09T..."}

curl http://localhost:3002/api/v1/health
# {"ok":true,"service":"query-svc","driver":"mock","ts":"2026-05-09T..."}

curl http://localhost:3000/
# <html>... (SPA loads)
```

---

## 5. Docker & Deployment

### 5.1 Target Platform

**Dokploy + Nixpacks** (Bedrock pattern).

**Nixpacks config:** `nixpacks.toml` (root, auto-detected).

### 5.2 Environment Variables

Create `.env` at root for local dev, `.env.production` for prod:

```bash
# .env (local dev)
NODE_ENV=development
DATABASE_URL=postgresql://hermes:@localhost:5432/hermes_dev
JWT_SECRET=hermes-dev-secret-change-in-prod
QUERY_DRIVER=mock
VITE_USE_API=false

# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}
JWT_SECRET=${JWT_SECRET_PROD}
QUERY_DRIVER=trino
TRINO_HOST=10.164.54.181
TRINO_PORT=8080
VITE_USE_API=true
```

**Critical variables:**
- `JWT_SECRET` — Change before production deployment
- `DATABASE_URL` — Point to production Postgres
- `VITE_USE_API` — Set to `true` to wire web to live query-svc
- `QUERY_DRIVER` — Set to `trino` for live data (requires VPN)

### 5.3 Docker Compose (Local Multi-Container)

```bash
# Start Postgres only
docker compose -f infra/docker-compose.yml up -d postgres

# Stop
docker compose -f infra/docker-compose.yml down
```

### 5.4 Deployment Steps (Dokploy)

1. **Build:** `pnpm build` (on deployment machine or CI/CD)
2. **Push:** Docker images for each service (auto via Dokploy)
3. **Migrate:** `pnpm --filter @hermes/catalog-api db:migrate` (first time)
4. **Start:** Services boot in order (Postgres → catalog-api → query-svc → web)

**Nixpacks handles:**
- Node installation
- pnpm dependency installation
- TypeScript compilation
- Vite bundling
- NestJS build

---

## 6. Troubleshooting

### 6.1 Web App Won't Start

**Error:** `EADDRINUSE: address already in use :::5173`

**Solution:**
```bash
# Kill existing process
lsof -i :5173 | grep -v PID | awk '{print $2}' | xargs kill -9

# Or use different port
pnpm --filter @hermes/web dev --port 5174
```

### 6.2 Postgres Connection Fails

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Ensure container is running
docker ps | grep postgres

# If not, start it
pnpm dev:db

# Verify connection
psql -h localhost -U hermes -d hermes_dev -c "SELECT 1;"
```

### 6.3 Migrations Not Applied

**Error:** `table "segments" does not exist`

**Solution:**
```bash
pnpm migrate

# Check applied migrations
psql -h localhost -U hermes -d hermes_dev -c "\dt"
```

### 6.4 Crawler VPN Fails

**Error:** `ENOTFOUND 10.164.54.181:8080` or `401 Unauthorized`

**Solution:**
```bash
# Check VPN connectivity
ping 10.164.54.181

# Verify credentials in .env
cat .env | grep TRINO_USER TRINO_PASSWORD

# Test with curl
curl -u ${TRINO_USER}:${TRINO_PASSWORD} \
  http://10.164.54.181:8080/api/v1/info

# If fails, use offline mode
git checkout apps/web/src/data/crawled/
pnpm build  # Uses committed fixtures
```

### 6.5 Build Output Path Errors

**Error:** `dist/main.js not found` (expected from catalog-api)

**Info:** catalog-api builds to `dist/src/main.js` (not idiomatic, but expected). Boot script already handles this.

```bash
node dist/src/main.js  # ✓ Works
```

### 6.6 Type Errors on Build

**Error:** `Type 'X' is not assignable to type 'Y'`

**Solution:**
```bash
# Run typecheck to see full errors
pnpm typecheck

# Fix errors (usually missing type annotation or schema mismatch)
# Then rebuild
pnpm build
```

---

## 7. Monitoring & Debugging

### 7.1 Health Checks

All services expose `/api/v1/health`:

```bash
curl http://localhost:3001/api/v1/health  # catalog-api
curl http://localhost:3002/api/v1/health  # query-svc
curl http://localhost:3000/api/health     # web (if served from backend)
```

### 7.2 Logs

```bash
# Web app logs (dev server)
pnpm --filter @hermes/web dev

# Backend logs (dev server)
pnpm --filter @hermes/catalog-api start:dev
pnpm --filter @hermes/query-svc start:dev

# Production: check service logs in Dokploy dashboard
```

### 7.3 Network Inspection

```bash
# Check ports in use
lsof -i -P -n | grep LISTEN

# Example output:
# node    12345  user  20u  IPv6   456  TCP *:5173 (LISTEN)
# node    12346  user  20u  IPv6   789  TCP *:3001 (LISTEN)
```

---

## 8. Performance Tuning (Post-May-12)

### 8.1 Web Bundle Optimization

Current warning (612 KB gzip): Not critical for demo, but can improve:

```bash
# Enable code splitting in vite.config.ts
rollupOptions.output.manualChunks = {
  vendor: ['react', 'react-dom'],
  charts: ['recharts'],
  router: ['react-router-dom'],
};
```

### 8.2 Database Query Optimization

Catalog-api can benefit from indexing:

```bash
# Create indexes on frequently queried columns
psql -h localhost -U hermes -d hermes_dev -f infra/indexes.sql
```

### 8.3 Caching Strategy

TanStack Query (v1: static JSON; post-May-12: live API):

```typescript
const { data } = useQuery({
  queryKey: ['features'],
  queryFn: getFeatures,
  staleTime: 1000 * 60 * 5,  // 5 min
  gcTime: 1000 * 60 * 10,     // 10 min (was cacheTime)
});
```

---

## 9. Quick Commands Reference

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Dev (all services) | `pnpm dev` |
| Start Postgres | `pnpm dev:db` |
| Run migrations | `pnpm migrate` |
| Seed demo data | `pnpm seed` |
| Type check | `pnpm typecheck` |
| Build all | `pnpm build` |
| Build web only | `pnpm --filter @hermes/web build` |
| Run locally (prod) | `pnpm start` |
| Preview web build | `pnpm --filter @hermes/web preview` |
| Refresh Trino data | `pnpm refresh-cfm-data` |
| Lint | `pnpm lint` (partial; web lint TBD) |
| Clean + reinstall | `pnpm clean && pnpm install` |

---

## 10. Demo Readiness Checklist (May 12)

- [ ] `pnpm typecheck` → 0 errors
- [ ] `pnpm build` → successful output in `apps/web/dist/`
- [ ] `pnpm start` → web loads at http://localhost:3000
- [ ] All 23 routes respond (HTTP 200)
- [ ] 13-step demo flow walks end-to-end
- [ ] Crawler fixtures up-to-date (or offline copies committed)
- [ ] Postgres not needed (web uses static JSON v1)
- [ ] Latency badges visible
- [ ] Handoff modals show correct substrate copy
- [ ] Opportunity card renders all 6 regions
- [ ] Backend health checks green (latent verification)
