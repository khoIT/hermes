# Codebase Summary

> Stub — to be filled in Phase 11.

## Workspace layout
```
apps/web          Vite 5 + React 18 + TypeScript 5 frontend (port 5173)
apps/catalog-api  NestJS 11 + Drizzle + Postgres metadata service (port 3001)
apps/query-svc    NestJS 11 + Trino read/exec service (port 3002)
packages/contracts  Zod schemas shared between services
packages/tsconfig   Shared TS config base/react/node presets
packages/eslint-config  Shared ESLint preset
infra/trino-mock    JSON fixtures for offline Trino development
infra/docker-compose.yml  Local Postgres container
```
