# Deployment Guide

> Stub — to be filled in Phase 11.

## Local dev
```bash
pnpm dev:db          # start Postgres via Docker
pnpm migrate         # run Drizzle migrations
pnpm seed            # seed demo data
pnpm dev             # start all apps (web:5173, catalog-api:3001, query-svc:3002)
```

## Build
```bash
pnpm build           # produces apps/web/dist/
```
