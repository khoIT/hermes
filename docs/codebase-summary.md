# Codebase Summary — Entry Point for New Sessions

**Last updated:** 2026-05-11 · Phase 13 (Welcome Inbox Promotion & Agent-First Threads)

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

> **Note (2026-05-10, Phase 12):** The original `modules/agents/` module
> (Inbox · Opportunity · Drafts · Activity · Settings) has been superseded by
> the **chat-driven** experience: `modules/welcome/` (cockpit), `modules/chat/`
> (full thread + chat-rail), `modules/canvas/` (boards), and the agent-first
> demo path on /welcome (`HermesNoticedPanel` → `thread-demo-agent-livops-2026`).
> Agent-attribution surfaces (opportunities, drafts, activity) are intentionally
> not separate screens in the current build — they are integrated into chat
> threads + welcome cards. References below to a discrete `agents/` module are
> historical and have been removed from the screen map.

| ID | Screen | File | Module | Status |
|---|---|---|---|---|
| 00 | Welcome (cockpit) | `modules/welcome/page.tsx` | welcome | ✓ |
| 01 | Feature Store Library | `modules/feature-store/library.tsx` | feature-store | ✓ |
| 02 | Feature Detail | `modules/feature-store/detail.tsx` | feature-store | ✓ |
| 03 | Segment Library | `modules/segments/library.tsx` | segments | ✓ |
| 04 | Segment Canvas (AND-of-OR) | `modules/segments/canvas.tsx` | segments | ✓ |
| 05 | Threshold Playground | `modules/segments/threshold-deep.tsx` | segments | ✓ |
| 06 | Segment Handoff Modal | `modules/segments/handoff-modal.tsx` | segments | ✓ |
| 07 | Segment Patterns | `modules/segments/patterns.tsx` | segments | ✓ |
| 08 | Campaign Library | `modules/campaigns/library.tsx` | campaigns | ✓ |
| 09 | Campaign Prelaunch / Canvas | `modules/campaigns/prelaunch.tsx` | campaigns | ✓ |
| 10 | Campaign Journey | `modules/campaigns/journey.tsx` | campaigns | ✓ |
| 11 | Campaign Handoff Modal | `modules/campaigns/handoff-modal.tsx` | campaigns | ✓ |
| 12 | Campaign Monitoring | `modules/campaigns/monitoring.tsx` | campaigns | ✓ |
| 13 | Campaign Patterns | `modules/campaigns/patterns.tsx` | campaigns | ✓ |
| 14 | Chat Landing | `modules/chat/landing-page.tsx` | chat | ✓ |
| 15 | Chat Thread | `modules/chat/thread-page.tsx` | chat | ✓ |
| 16 | Canvas Library | `modules/canvas/list-page.tsx` | canvas | ✓ |
| 17 | Canvas Detail (Board) | `modules/canvas/detail-page.tsx` | canvas | ✓ |
| 18 | Knowledge | `modules/knowledge/page.tsx` | knowledge | ✓ |
| 19 | Funnels (stub) | `modules/funnels/list-page.tsx` | funnels | stub |
| 20 | Retentions (stub) | `modules/retentions/list-page.tsx` | retentions | stub |
| 21 | Playbooks (stub) | `modules/playbooks/list-page.tsx` | playbooks | stub |
| 22 | Explore (stub) | `modules/explore/stub.tsx` | explore | stub |

**Navigation route structure:** Welcome (`/`) → Feature Store / Segments / Campaigns / Canvas / Chat. Chat-rail anchors the right gutter on detail pages. The `HermesNoticedPanel` (promoted to full-width row above Active Campaigns, plan 260511-1122) surfaces three agent-first demo entries with staggered timestamps (ARPDAU detection, D7 FB cohort, whale recall) across `/chat/thread-demo-agent-livops-2026` and two new agent-first threads.

---

## 4. Data Location

### 4.1 Handcrafted Catalog Data
```
apps/web/src/data/catalog/
├── features/             67 features split by domain (latency tiers, definitions, lineage)
├── events.ts             47 events (per-event metadata, payloads)
├── segments.ts           demo + fictional segments for UX variety
└── campaigns.ts          representative campaigns + trigger variants
```

### 4.2 Chat Threads
```
apps/web/src/data/chat/threads/
├── thread-001..008                           scripted research/segment-build threads
├── thread-demo-livops-2026.ts                CANONICAL analyst arc (T1→T2→T3 + 6 alts)
├── thread-demo-agent-livops-2026.ts          AGENT-FIRST arc (T1→T2→T3→T4 retro,
│                                             with tool-call chips + provenance, ARPDAU focus)
├── thread-demo-agent-d7-fb-cohort-2026.ts    AGENT-FIRST arc (D7 first-time payer cohort,
│                                             T1→T2→T3→T4 diagnose→segment→campaign→retro)
└── thread-demo-agent-whale-recall-2026.ts    AGENT-FIRST arc (whale retention recall,
                                              T1→T2→T3→T4 diagnose→segment→campaign→retro)
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

## 5.5 Chat ↔ Artifact Connectivity & Agent-First Inbox (May 11–12)

**Phase 12 (May 10–12):** Unified agent experience tying chat surface to segments, campaigns, and boards.

**Phase 13 (May 11):** Welcome inbox promoted to full-width row; three agent-first cards with staggered timestamps (continuous monitoring UX). Key surfaces:

- **Agent-first inbox (Phase 13):** `HermesNoticedPanel` on Welcome page stacks three agent-detected anomalies with staggered timestamps (06:14 today, yesterday 14:20, 2d ago) → routes to three full agent-first demo threads: ARPDAU, D7 FB cohort, whale recall. Each thread follows T1→T2→T3→T4 diagnose→segment→campaign→retrospective arc, mirroring analyst-led `thread-demo-livops-2026`.
- **Reverse navigation:** Every segment/campaign detail displays `<SourceThreadPill>` (if `sourceThreadId` persisted) linking back to originating chat thread. Pill shows avatar + thread title.
- **Universal CTAs:** Every `<AssistantResponse>` renders `<UniversalCtaRow>` with 🎯 Save as segment · 📊 Pin to board · 📣 Build campaign. Smart-hides when payload already includes matching `action_card_*` sections.
- **Quick dialogs:** `<QuickSegmentDialog>` and `<QuickCampaignDialog>` spawn inline from CTAs for rapid creation without leaving chat.
- **Active thread context:** `useActiveThreadId()` hook via `apps/web/src/utils/active-thread-context.tsx` lets action cards access current thread and persist `sourceThreadId` on segment/campaign POST.
- **Demo arc threads:** Three agent-first arcs: `thread-demo-agent-livops-2026` (ARPDAU), `thread-demo-agent-d7-fb-cohort-2026`, `thread-demo-agent-whale-recall-2026`. Each chains artifact creation (segment → campaign) with T1→T2→T3→T4 auto-play structure.
- **Demo polish:** Campaign action card Confirm navigates to `/campaigns/{id}`; off-script chat routes through `genericFallbackResponse()`; user messages/headers prefixed with HelpCircle icon.

**Implementation notes:**
- `sourceThreadId?: string` added to `HermesSegment` and `HermesCampaign` contracts.
- DB migration `0012_add_source_thread_id.sql` adds nullable `source_thread_id` columns to segments + campaigns tables.
- Warmup script `scripts/pre-demo-warmup.ps1` pre-caches loader + audience-count + segments-list before live demo.
- BOOTSTRAP_VERSION bumped (`v12-260510-2330` → `v13-260511-1145`) to auto-seed new agent-first threads on next page load.
- Vietnamese localization parity: `dictionary.ts` + `entity-names.ts` updated for thread names (ARPDAU, D7, whale recall).
- **Deep-research section types** (May 11): Three new `AssistantResponse` section types gate behind `DeepResearchToggle` in agent-first threads (`AGENT_FIRST_THREAD_IDS`):
  - `working_status` — `<WorkingStatusBlock>` renders header with pulsing/filled dot + intent statement + optional collapse toggle.
  - `task_progress` — `<TaskProgressPanel>` shows step-by-step task checklist (e.g., "Find users," "Build segment," "Launch campaign").
  - `subagent_panel` — `<SubagentPanel>` wraps `<SubagentList>` to display subagent roster + provenance metadata.
  - **Render gate:** In `assistant-response.tsx`, when `useDeepResearch()` is ON and thread is agent-first, these sections render; when OFF, section falls through to default chip-based tool-call rendering.
  - **Components:** `apps/web/src/components/chat/sections/{working-status-block, task-progress-panel, subagent-panel, subagent-list}.tsx` (4 new files).

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

**Feature Store (v2 May 2026):** Browse 76 features (73 game + 3 platform propensity) with attribution by `games[]`, not owner. 7 group-by strategies (Domain · Game · Tier · Status · Platform · In-prod · None) and 4 sort strategies. Filter rail: Type · Latency · Games · Platform · Status. Detail page has 4 tabs (Overview · Analytics · Lineage · Used By); Analytics tab renders 6 panels (health · freshness · distribution-over-time · top consuming campaigns · online request rate · data quality). Right rail shows a Health snapshot card across all tabs. New `/feature-store/new` route lets PMs register features into the in-memory catalog with a side-by-side definition editor + handoff modal mirroring segment/campaign handoffs.

Component tree (v2 additions): `_components/games-chip-cluster.tsx` · `platform-propensity-chip.tsx` · `propensity-model-card.tsx` · `description-block.tsx` · `health-snapshot-card.tsx` · `analytics-tab.tsx` · `_analytics/{6 panels + format helpers}` · `_register/{8 form sections + handoff modal}` · `_logic/{sort, definition-stubs, feature-form-validation}`. Shared: `components/drift-badge.tsx`, `components/_logic/latency-labels.ts` (Realtime / Batch warm / Batch cold), `components/_logic/game-colors.ts` (per-game tints).

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
