---
phase: 1
title: "Bootstrap"
status: completed
priority: P1
effort: "4h"
dependencies: []
completed_at: 2026-05-09
commit: f2bc512
---

# Phase 01: Bootstrap

## Context Links
- Brainstorm: `../reports/brainstorm-260509-1355-hermes-platform-prototype.md` §4.1
- Reference repo: `C:\Users\CPU12830-local\code\segment-builder`
- CLAUDE.md modularization rules

## Overview
Fork segment-builder skeleton into hermes/. Rename `@bedrock/*` → `@hermes/*`. Strip Bedrock-only web pages. Stand up fresh `apps/web` Vite+React+TS scaffold with theme tokens ported. Verify dev/build green.

## Key Insights
- Bedrock's `apps/web` is JSX-no-TS — DO NOT migrate it. Replace with fresh TSX scaffold; only port `theme.jsx`, primitives, and CSS globals.
- Bedrock backends (`apps/catalog-api`, `apps/query-svc`) are TS already — keep as-is, just rename package + workspace refs.
- Root `.env` already has Trino creds; do not overwrite. Move catalog-api / query-svc creds to per-app `.env` per Bedrock pattern.
- `release-manifest.json` and `Segment Builder.zip` (if present from bedrock) are throwaway — gitignore.

## Requirements
**Functional**
- `pnpm install` resolves all workspaces.
- `pnpm dev` starts web (5173), catalog-api (3001), query-svc (3002), contracts watch.
- `pnpm build` produces `apps/web/dist/`.
- `pnpm typecheck` green across workspace.

**Non-functional**
- All package names use `@hermes/*` (no remaining `@bedrock/*` refs).
- Web is TypeScript with `tsconfig` extending `@hermes/tsconfig/react`.
- Visual tokens identical to Bedrock — same `#f05a22`, same fonts, same spacing scale.

## Architecture
```
hermes/
├── apps/
│   ├── web/             FRESH TSX scaffold; src/main.tsx, App.tsx, theme.tsx, ui/*.tsx
│   ├── catalog-api/     FORKED · package renamed @hermes/catalog-api
│   └── query-svc/       FORKED · package renamed @hermes/query-svc
├── packages/
│   ├── contracts/       FORKED · subset port (next phases trim)
│   ├── tsconfig/        FORKED · renamed
│   └── eslint-config/   FORKED · renamed
├── infra/
│   ├── trino-crawler/   STUB (created in P-2)
│   ├── trino-mock/      FORKED from segment-builder
│   └── docker-compose.yml
├── package.json         renamed "hermes", scripts adjusted
├── pnpm-workspace.yaml
├── turbo.json
├── nixpacks.toml
└── .gitignore + .repomixignore
```

## Related Code Files
**Create**
- `apps/web/package.json`, `apps/web/index.html`, `apps/web/vite.config.ts`, `apps/web/tsconfig.json`
- `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/theme.tsx`
- `apps/web/src/ui/{button,card,input,select,switch,tabs,avatar,kpi,section-header,sparkline,badge,icon}.tsx`
- `apps/web/src/styles/colors-and-type.css` (port from Bedrock `colors_and_type.css`)
- Root: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.repomixignore`, `README.md`
- `docs/` placeholders for P-11

**Modify (after copy)**
- `apps/catalog-api/package.json` → `@hermes/catalog-api`
- `apps/query-svc/package.json` → `@hermes/query-svc`
- `packages/contracts/package.json` → `@hermes/contracts`
- `packages/tsconfig/package.json` → `@hermes/tsconfig`
- `packages/eslint-config/package.json` → `@hermes/eslint-config`
- All `import` statements referencing `@bedrock/*` → `@hermes/*`

**Delete (from web)**
- All Bedrock app pages: `SegmentBuilder.jsx`, `MetricsCatalog.jsx`, `MetricBuilder.jsx`, `Sources.jsx`, `FreshnessSLAs.jsx`, `LineageGraph.jsx`, `LineageDrawer.jsx`, `LineageAdapters.jsx`, `LineagePicker.jsx`, `LiveMonitor.jsx`, `Screens.jsx`, etc.
- `bedrockData.jsx`, `data.jsx` (Bedrock data — Hermes builds own in P-3)
- `metrics-*.jsx`, `data-catalog/`, `metric-builder/`, `sources/`

## Implementation Steps
1. Copy structure (not git history) from `C:\Users\CPU12830-local\code\segment-builder` into `C:\Users\CPU12830-local\code\hermes`. Skip: `.git/`, `node_modules/`, `apps/*/node_modules/`, `apps/*/dist/`, `pnpm-lock.yaml`, `apps/web/src/*` (replace fresh).
2. Rename root `package.json` `name` to `hermes`. Update scripts: `start`, `migrate`, `seed`, `sim:drip`, `refresh-mocks` (rename to `refresh-cfm-data` later in P-4).
3. Rename `@bedrock/*` → `@hermes/*` across all `package.json` files in `packages/` and `apps/`.
4. Grep-replace all `@bedrock/` import paths in `apps/catalog-api/src/`, `apps/query-svc/src/`, `packages/contracts/src/`.
5. Create fresh `apps/web/`:
   - `package.json` with deps: `react@18`, `react-dom@18`, `react-router-dom@6`, `vite@5`, `@vitejs/plugin-react`, `typescript@5`, `@types/react`, `@types/react-dom`, `recharts`, `lucide-react`.
   - `vite.config.ts`, `tsconfig.json` extending `@hermes/tsconfig/react.json`.
   - `index.html` with League Gothic + Inter + Geist Mono font links.
   - `src/main.tsx` mounting `<App />` from `App.tsx`.
   - `src/App.tsx` minimal shell with placeholder route table.
6. Port `theme.jsx` → `theme.tsx`:
   - Tokens object `T` with all colors, fonts (`fSans`, `fDisp`, `fMono`), radii, spacing, shadows.
   - Primitive components: `Button`, `Badge`, `Card`, `Input`, `Select`, `Switch`, `Tabs`, `Avatar`, `Kpi`, `SectionHeader`, `Icon`, `Sparkline`.
   - Type all props.
7. Copy `colors_and_type.css` → `apps/web/src/styles/colors-and-type.css`. Import in `main.tsx`.
8. Copy `public/assets/logo/` and `public/fonts/` from segment-builder if not bundled via CDN.
9. Run `pnpm install` (root). Resolve any rename misses.
10. Run `pnpm dev` — verify web on 5173 (placeholder home), catalog-api on 3001 (no errors), query-svc on 3002 (no errors).
11. Run `pnpm typecheck` — fix any rename leftovers.
12. Run `pnpm build` — verify `apps/web/dist/index.html` produced.
13. Init `docs/` directory with empty stubs for: `project-overview-pdr.md`, `code-standards.md`, `codebase-summary.md`, `design-guidelines.md`, `deployment-guide.md`, `system-architecture.md`, `project-roadmap.md` (filled in P-11).
14. Commit checkpoint: `feat: bootstrap hermes monorepo from segment-builder skeleton`.

## Todo List
- [ ] Copy segment-builder structure (excluding node_modules, dist, .git)
- [ ] Rename all `@bedrock/*` → `@hermes/*` (package.json + import paths)
- [ ] Strip Bedrock-only web pages from `apps/web/src/`
- [ ] Create fresh `apps/web` TSX scaffold (vite + react18 + ts)
- [ ] Port `theme.jsx` → `theme.tsx` with full type coverage
- [ ] Port primitives (Button, Card, Badge, Icon, etc.) to TSX
- [ ] Port `colors_and_type.css`
- [ ] Verify `pnpm install` resolves
- [ ] Verify `pnpm dev` starts all 3 apps
- [ ] Verify `pnpm typecheck` green
- [ ] Verify `pnpm build` green
- [ ] Initialise `docs/` stubs
- [ ] Commit checkpoint

## Success Criteria
- [ ] `pnpm install` resolves with no `@bedrock/*` errors
- [ ] `pnpm dev` runs web (5173) + catalog-api (3001) + query-svc (3002)
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` produces `apps/web/dist/index.html`
- [ ] Visual smoke: web home renders with VNGGames red `#f05a22` accent and League Gothic display font
- [ ] No Bedrock-only page imports remain in `apps/web/src/`

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Rename misses leave `@bedrock/*` refs | grep -r `@bedrock` after rename; auto-fix |
| Theme.jsx port loses interactive states (hover/focus) | Side-by-side compare against `LiveOps Engine.html` after port |
| TS strict catches Bedrock typing gaps in catalog-api | Loosen tsconfig if needed; mark with TODO; fix in P-12 |
| Bedrock `data.jsx` references break catalog-api seeds | catalog-api seed module uses its own fixtures (in P-12) |

## Security Considerations
- `.env` files NOT copied — keep `.env.example` and require user to fill (Hermes already has root `.env` with creds).
- `.gitignore` retains `.env*` rule from Bedrock.
- No third-party API keys at this phase.

## Next Steps
- P-2 schema audit unblocked.
- P-3 catalog data (parallel) unblocked.
- P-5 web shell unblocked.
- P-12 backend latency check unblocked (parallel, low priority).
