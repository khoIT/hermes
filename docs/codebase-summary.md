# Codebase Summary — Entry Point for New Sessions

**Last updated:** 2026-05-09 · Phase 11

This document is your reference when onboarding to Hermes. Read this first when starting a new session.

---

## 1. Repository Layout

```
hermes/
├── apps/
│   ├── web/                Vite 5 + React 18 + TypeScript 5 frontend
│   │                       Port 5173 (dev) · 3000 (prod) · TanStack Router
│   │                       5 modules: feature-store, segments, campaigns, agents, explore-stub
│   ├── catalog-api/        NestJS 11 + Drizzle ORM + Postgres (LATENT)
│   │                       Port 3001 · metadata & audit service · health at /api/v1/health
│   └── query-svc/          NestJS 11 + Trino/mock driver (LATENT)
│                           Port 3002 · audience & segment queries · health at /api/v1/health
├── packages/
│   ├── contracts/          Zod schemas + TypeScript types (shared across all services)
│   │                       → Feature, Segment, Campaign, Opportunity, AgentDraft, etc.
│   ├── tsconfig/           Shared TypeScript config (base, react, node presets)
│   └── eslint-config/      Shared ESLint configuration
├── infra/
│   ├── trino-crawler/      TypeScript CLI · pulls cfm_vn → 5 fixture JSONs
│   │                       Runs: pnpm refresh-cfm-data · outputs to apps/web/src/data/crawled/
│   ├── trino-mock/         Fallback JSONL fixtures (offline dev, Bedrock legacy)
│   └── docker-compose.yml  Postgres 16 for catalog-api · port 5432
├── docs/                   Populated per CLAUDE.md structure
│   ├── project-overview-pdr.md
│   ├── codebase-summary.md (this file)
│   ├── system-architecture.md
│   ├── design-guidelines.md
│   ├── code-standards.md
│   ├── deployment-guide.md
│   ├── project-roadmap.md
│   └── demo-known-limitations.md
├── plans/                  Phase tracking + reports (260509-1355-hermes-platform-prototype/)
└── design-reference/       PRD source material (read-only reference)
```

---

## 2. Quick Start

**Install & run all services:**
```bash
pnpm install
pnpm dev
# web: http://localhost:5173
# catalog-api: http://localhost:3001/api/v1/health (latent — boots but not wired to web)
# query-svc: http://localhost:3002/api/v1/health (latent)
```

**Build for production:**
```bash
pnpm build              # Compiles all services
# Output: apps/web/dist/ ready for deployment
pnpm start              # Serves on port 3000 or $PORT
# Or locally: pnpm --filter @hermes/web preview
```

**Refresh crawler fixtures (requires VPN):**
```bash
pnpm refresh-cfm-data
# Connects to Trino @ 10.164.54.181:8080 · outputs 5 JSON files to apps/web/src/data/crawled/
```

---

## 3. Screen Map — Where Each PRD Screen Lives

| ID | Screen | File | Module | Status |
|---|---|---|---|---|
| 00 | Landing | `modules/home/page.tsx` | shared | ✓ |
| 01 | Feature Store Library | `modules/feature-store/library.tsx` | feature-store | ✓ |
| 02 | Feature Detail | `modules/feature-store/detail.tsx` | feature-store | ✓ |
| 03 | Segment Library | `modules/segments/library.tsx` | segments | ✓ |
| 04 | Segment Canvas (AND-of-OR) | `modules/segments/canvas.tsx` | segments | ✓ |
| 05 | Threshold Playground | `modules/segments/threshold-deep.tsx` | segments | ✓ |
| 06 | Segment Handoff Modal | `modules/segments/handoff-modal.tsx` | segments | ✓ |
| 07 | Segment Monitoring | `modules/segments/monitoring.tsx` | segments | ✓ |
| 08 | Segment Patterns | `modules/segments/patterns.tsx` | segments | ✓ |
| 09 | Campaign Library | `modules/campaigns/library.tsx` | campaigns | ✓ |
| 10 | Campaign Canvas (Real-time) | `modules/campaigns/canvas/realtime.tsx` | campaigns | ✓ |
| 11 | Campaign Canvas (Scheduled) | `modules/campaigns/canvas/scheduled.tsx` | campaigns | ✓ |
| 12 | Campaign Canvas (One-time) | `modules/campaigns/canvas/onetime.tsx` | campaigns | ✓ |
| 13 | Campaign Journey | `modules/campaigns/journey.tsx` | campaigns | ✓ |
| 14 | Campaign Prelaunch | `modules/campaigns/prelaunch.tsx` | campaigns | ✓ |
| 15 | Campaign Handoff Modal | `modules/campaigns/handoff-modal.tsx` | campaigns | ✓ |
| 16 | Campaign Monitoring | `modules/campaigns/monitoring.tsx` | campaigns | ✓ |
| 17 | Campaign Patterns | `modules/campaigns/patterns.tsx` | campaigns | ✓ |
| 18 | Agent Inbox | `modules/agents/inbox.tsx` | agents | ✓ |
| 19 | Opportunity Detail | `modules/agents/opportunity-detail.tsx` | agents | ✓ |
| 20 | Draft Canvas (Review) | `modules/agents/drafts.tsx` | agents | ✓ |
| 21 | Agent Activity | `modules/agents/activity.tsx` | agents | ✓ |
| 22 | Agent Settings | `modules/agents/settings.tsx` | agents | ✓ |

**Navigation route structure:** Home → Feature Store / Explore / Segments / Campaigns / Agents (left sidebar, Agents rightmost).

---

## 4. Data Location

### 4.1 Handcrafted Catalog Data
```
apps/web/src/data/catalog/
├── features.ts          67 features (domains, latency tiers, definitions, lineage)
├── events.ts            47 events (per-event metadata, payloads)
├── segments.ts          5 demo + 6 fictional segments for UX variety
├── campaigns.ts         5 representative campaigns + trigger variants
└── agents/
    ├── opportunities.ts 9 opportunities (window, confidence, evidence)
    ├── drafts.ts        3 user-created drafts
    ├── recommendations.ts 2 analysis recommendations
    └── activity.ts      3 approval/rejection records
```

**How to add a new feature:**
1. Add entry to `data/catalog/features.ts` with `FeatureSchema` shape (Zod-validated)
2. Update feature count in landing page header stat strip
3. Run `pnpm build` to type-check
4. Feature now browsable in Feature Store library

**How to add a new segment:**
1. Add entry to `data/catalog/segments.ts` with `SegmentSchema` shape
2. Add corresponding row to `data/crawled/audience-counts.json` (predicate-hash → threshold grid)
3. Segment now appears in library; threshold playground reads audience counts

**How to add a new campaign:**
1. Add entry to `data/catalog/campaigns.ts` with `CampaignSchema` shape
2. Optionally: add monitoring data to `data/crawled/` if campaign needs visibility in the monitoring view
3. Campaign now appears in library; click-through to canvas works

### 4.2 Crawled (Trino-Derived) Fixtures
```
apps/web/src/data/crawled/
├── distributions.json       Per-feature histogram (28 bins) + p50/p90/p99 markers
├── audience-counts.json     Predicate-hash → threshold grid (5 demo predicates × 5 thresholds)
├── event-volumes.json       Per-event daily volumes + sparkline data
└── sample-players.json      Sample UID rows for "Recent values" display in Feature detail
```

**Generated by:** `infra/trino-crawler/` (TS CLI invoked via `pnpm refresh-cfm-data`).

**Fallback:** If crawler fails (VPN, 401, timeout), fixtures remain in git — demo still runs offline.

---

## 5. Theme & Design Tokens

**Source of truth:** `apps/web/src/theme.tsx`

```typescript
// Tokens exported as T object
T.colors        // VNG red #f05a22, grays, success, anomaly (amber)
T.fonts         // fSans (Inter), fDisp (League Gothic), fMono (Geist)
T.radii         // sm, md, lg, full
T.spacing       // 4, 8, 12, 16, 20, 24, 32, etc.
T.shadows       // sm, md, lg for elevation
T.transitions   // smooth, snappy for animations
```

**CSS mirror:** `apps/web/src/styles/colors-and-type.css` (same tokens as custom properties).

**Component library:** Reusable primitives in `modules/_shared/components/`:
- `OpportunityCard` — all 6 regions (intent, window/confidence, evidence, proposed, why-now, approve/edit/dismiss)
- `AgentBadge`, `AgentAttribution` — agent metadata
- `HandoffModal` — Substrate A + B copy, SegmentID/TriggerID display
- `PredicateComposer` — AND-of-OR builder
- `ThresholdPlayground` — slider + audience band + live counts
- `LatencyBadge` — tier classification (`<1s · A`, `<1h · B`, `<1d · B`)
- `FeaturePill` — feature name + latency badge
- `AudienceBand` — sticky segment audience overview band
- `Histogram`, `Sparkline` — recharts-based visualizations

---

## 6. Module Architecture

Each module follows a consistent structure:

```
modules/{module-name}/
├── page.tsx               Router entry point (TanStack Router file-based)
├── _components/           React components (NOT exported as default)
│   ├── canvas.tsx
│   ├── library.tsx
│   └── ...
├── _logic/                Business logic (helpers, formatters, validators)
│   ├── segment-builder.ts
│   └── ...
├── _state/                Client state (Zustand stores)
│   ├── audience-lookup.ts
│   └── ...
└── _composer/             Complex multi-part views
    └── ...
```

**Key modules:**

**Feature Store:** Browse 67 features by domain/tier. Detail page shows dual-target definitions (which substrate). Histogram + lineage + used-by tabs.

**Segments:** AND-of-OR predicate composition. Threshold playground reads `data/crawled/audience-counts.json`. Sticky audience band updates live as you adjust predicates. Handoff modal names Substrate B verbatim.

**Campaigns:** Three trigger variants (real-time event, scheduled cadence, one-time). Journey view shows trigger → steps → goal/exit. Monitoring shows proof-point lift (+8.2% for one demo campaign). Handoff modal names both substrates + both interface contracts.

**Agents:** Inbox with 4 tabs (Opportunities, Drafts, Recommendations, Activity). Opportunity card renders all 6 regions. Drafts open segment canvas in review mode (deeper pre-population deferred). Settings page has Phase 2 slot for Studio Agent.

---

## 7. Latent Backends — Post-May-12 Wiring

**Current state:** Both backends compile, boot successfully, respond to health checks. Not connected to web in v1.

```
apps/catalog-api    ← /api/v1/health returns 200 (DB: "connected")
apps/query-svc      ← /api/v1/health returns 200 (driver: "mock")
```

**Post-May-12 integration path:**

1. **catalog-api** — Replace Bedrock Drizzle schema with Hermes Feature Store registry. Expose `/api/v1/features/`, `/api/v1/features/:id`.
2. **query-svc** — Build `/api/v1/audience/count` endpoint (predicate AST → SQL translation via existing `CriteriaTranslator`).
3. **Web app** — Wire `modules/segments/_state/audience-lookup.ts` to call query-svc instead of static JSON.
4. **Deployment** — Dokploy + Nixpacks per Bedrock pattern; Postgres migrations automated.

**Full detail:** See `docs/system-architecture.md` → "Post-May-12 wiring path" section.

---

## 8. Build & CI/CD

**Local build:**
```bash
pnpm build         # Runs turbo: compiles TS, bundles Vite, NestJS dist
pnpm typecheck     # 0 errors required
# Warning: lint not yet fully integrated (ESLint pending)
```

**Deployment target:** Dokploy + Nixpacks (Bedrock pattern in `nixpacks.toml`).

**Environment variables:**
- `VITE_USE_API=false` (default) — use static fixtures
- `VITE_USE_API=true` — wire to live catalog-api / query-svc (post-May-12)
- `.env.example` documents all variables

---

## 9. Common Tasks

| Task | Command |
|------|---------|
| Add a new feature to catalog | Edit `data/catalog/features.ts` |
| Add a new segment | Edit `data/catalog/segments.ts` + `data/crawled/audience-counts.json` |
| Add a new campaign | Edit `data/catalog/campaigns.ts` |
| Add an opportunity | Edit `data/agents/opportunities.ts` |
| Update theme tokens | Edit `apps/web/src/theme.tsx` |
| Run typecheck | `pnpm typecheck` |
| Build for prod | `pnpm build` |
| Start prod server locally | `pnpm start` (or `pnpm --filter @hermes/web preview`) |
| Refresh crawled data from Trino | `pnpm refresh-cfm-data` (requires VPN) |

---

## 10. Debugging Tips

**Web app won't start:**
- Check Node version: `node --version` (need ≥20)
- Check pnpm version: `pnpm --version` (need ≥9)
- Run `pnpm install` to ensure all deps installed

**Typecheck fails:**
- Run `pnpm typecheck` to see detailed errors
- Ensure all data types use schemas from `@hermes/contracts`

**Feature missing from Feature Store:**
- Check `data/catalog/features.ts` entry exists
- Check feature ID matches expected format (kebab-case)
- Run `pnpm build` to compile

**Segment threshold playground shows old counts:**
- Check `data/crawled/audience-counts.json` has entry for your predicate hash
- Refresh crawler: `pnpm refresh-cfm-data` (requires VPN)

**Crawler fails with 401 error:**
- Credentials in `.env.example` — fill `.env` before running
- VPN required to reach Trino @ 10.164.54.181:8080

---

## 11. Document Cross-References

- **System Architecture:** `docs/system-architecture.md` — detailed diagrams, data flow, backend wiring
- **Design Guidelines:** `docs/design-guidelines.md` — token reference, typography rules, component patterns
- **Code Standards:** `docs/code-standards.md` — TS rules, module sizing, naming conventions
- **Deployment Guide:** `docs/deployment-guide.md` — run/build/deploy, troubleshooting, VPN setup
- **Project Overview:** `docs/project-overview-pdr.md` — product vision, acceptance criteria, next steps
- **Project Roadmap:** `docs/project-roadmap.md` — phase tracking, post-May-12 scope
- **Known Limitations:** `docs/demo-known-limitations.md` — deferred features, workarounds
