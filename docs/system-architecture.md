# System Architecture

> Stub — to be filled in Phase 11.

## Overview (Phase 1)
Three-tier monorepo: React SPA → NestJS APIs → Postgres + Trino.

```
Browser → apps/web (Vite/React)
             │
             ├─ /api/catalog → apps/catalog-api (NestJS, Drizzle, Postgres)
             └─ /api/query   → apps/query-svc   (NestJS, Trino client)
```
