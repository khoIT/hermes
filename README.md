# Hermes — Player Engagement Platform

**VNG Games' Studio-facing LiveOps platform.** Self-service player segmentation, real-time campaigns, and AI-assisted recommendations. Two-substrate architecture (Apollo TEE + Temporal for real-time; Hatchet + Trino + Iceberg for batch) bridged by a unified Feature Store.

**Status:** Design-aligned prototype (Phase 1, May 9, 2026). Ready for May 12 alignment meeting. 24/25 acceptance criteria met (docs completed Phase 11).

---

## Quick Start

### Prerequisites
- Node ≥20
- pnpm ≥9
- Docker (optional, for Postgres)
- VPN (required only for real Trino crawler)

### Install & Run

```bash
# Install dependencies
pnpm install

# Start everything with one command (Postgres + all three services)
pnpm dev
# → Postgres: docker hermes_pg on :5432 (boots first, detached)
# → catalog-api: http://localhost:3001/api/v1/health
# → query-svc:  http://localhost:3002/api/v1/health (latent)
# → web:        http://localhost:5173

# Skip the Postgres step (e.g., DB already running, or you don't need it):
pnpm dev:turbo
```

### Build for Production

```bash
# Full build (all services)
pnpm build

# Run locally
pnpm start
# → http://localhost:3000
```

### Refresh Data from Trino (Real cfm_vn)

```bash
# Requires VPN + credentials in .env
# Probe reachability first (writes infra/trino-crawler/trino-diagnostic.md):
pnpm --filter @hermes/trino-crawler diagnose

# Then run the pipeline (Trino → Postgres → catalog-api):
pnpm dev:db                 # boot local Postgres (Docker)
pnpm migrate                # apply drizzle migrations
pnpm refresh-cfm-data       # 7d real → 23d synth → 48 derivations → /features
node scripts/validate-feature-pipeline.cjs   # asserts 19 properties

# Step-specific re-runs:
pnpm refresh-cfm-data --raw-events-only --days=7
pnpm refresh-cfm-data --synth-backfill-only
pnpm refresh-cfm-data --feature-values-only
pnpm refresh-cfm-data --feature-analytics-only
```

**As of plan `260509-2032-real-trino-feature-pipeline`** the Feature Store
module reads from `catalog-api` live (76 features, 48 real + 28 synth).
Static `feature-analytics-180d.json` is deleted from the web bundle.
**`pnpm dev` now boots Postgres + catalog-api + web together**, so the
Feature Store routes render against live data without extra terminals.

**Recovery commands** (if a single service crashes mid-session):
- `pnpm --filter @hermes/catalog-api dev` — restart only catalog-api
- `pnpm --filter @hermes/web dev` — restart only the web dev server
- `pnpm dev:full` — alternative one-shot boot of just Postgres + catalog-api + web (skips query-svc)

---

## Repository Layout

```
hermes/
├── apps/
│   ├── web/              Vite + React 18 · 23 screens · 5 modules
│   ├── catalog-api/      NestJS · metadata service (latent)
│   └── query-svc/        NestJS · audience query service (latent)
├── packages/
│   ├── contracts/        Shared Zod schemas (Feature, Segment, Campaign, etc.)
│   ├── tsconfig/         Shared TS config
│   └── eslint-config/    Shared ESLint preset
├── infra/
│   ├── trino-crawler/    TS CLI · pulls cfm_vn → 5 fixture JSONs
│   ├── trino-mock/       Offline JSONL fixtures (fallback)
│   └── docker-compose.yml  Postgres 16 for catalog-api
├── docs/                 Documentation (see below)
└── plans/                Phase tracking + reports (260509-1355-*)
```

---

## Modules (Apps/Web)

| Module | Purpose | Screens |
|--------|---------|---------|
| **Feature Store** | Inventory of 67 features · latency tiers · dual-target definitions | 2 |
| **Segments** | AND-of-OR predicate composition · threshold playground · handoff | 6 |
| **Campaigns** | Activation authoring · 3 trigger types · journey · monitoring | 9 |
| **Agents** | AI recommendations · inbox (4 tabs) · opportunity card · drafts | 5 |
| **Explore** | Discovery surface (nav-only, deferred) | 1 |

**All 23 screens routed via TanStack Router · hardcoded demo data (no fetch).**

---

## Documentation Entry Points

**Start here → `docs/codebase-summary.md`** — Orientation for new sessions.

| Doc | Purpose |
|-----|---------|
| `docs/project-overview-pdr.md` | Product vision, two contracts, acceptance criteria |
| `docs/codebase-summary.md` | Where to find things, how to add features (entry point) |
| `docs/system-architecture.md` | Two-substrate diagram, data flow, crawler pipeline, post-May-12 wiring |
| `docs/design-guidelines.md` | Design tokens, typography, colors, component patterns |
| `docs/code-standards.md` | TS conventions, file naming, module sizing, error handling |
| `docs/deployment-guide.md` | Run/build/deploy commands, troubleshooting |
| `docs/project-roadmap.md` | Phase tracking, Phase 2 scope, success metrics |
| `docs/demo-known-limitations.md` | Deferred features, workarounds, test gaps |

---

## Key Architecture Decisions

### Two Substrates

| Substrate | Purpose | Latency | Interface |
|-----------|---------|---------|-----------|
| **A · Apollo TEE + Temporal** | Real-time event evaluation + workflow spawn | <1s–1s | TriggerID |
| **B · Hatchet + Trino + Iceberg** | Batch segment compilation + audience refresh | min–hours | SegmentID |

### Feature Store as Bridge

Both substrates read shared 67-feature registry. Semantic Management Layer ensures consistency.

### v1 Offline, Post-May-12 Live

**v1 (now):** Crawler → 5 fixture JSON files → bundled into web app. No fetch, no VPN needed for demo.

**Post-May-12:** Web wires to live catalog-api + query-svc. Real Trino queries. Database persistence.

---

## Demo Flow (13 Steps)

1. Open Hermes landing
2. Browse Feature Store → click `consecutive_ranked_losses_streak`
3. "Use in segment" → Segment canvas
4. Compose AND-of-OR, adjust threshold slider
5. Save → Segment handoff modal (Substrate B)
6. "Use in campaign" → Real-time campaign canvas
7. Add `event_match_end` trigger + variants
8. Activate → Campaign handoff modal (Substrate A + B)
9. View monitoring 2 weeks later (+8.2% lift)
10. Click Agents module
11. Open CFM Loss Streak opportunity
12. Approve & draft → Canvas in review mode
13. Build → Handoff modal with agent attribution

**All 13 steps work end-to-end.** No dead ends. May 12 ready.

---

## Design Language

- **Intent:** Serif italic (strategic, human)
- **Technical:** Mono font (SegmentID, TriggerID, feature names, predicates)
- **Body:** Inter (plain language, readable)
- **Display:** League Gothic (headlines)
- **Accent:** Deep red `#f05a22` (VNG Games brand)
- **Anomalies:** Amber `var(--anomaly)` (warnings, drift)
- **Latency badges:** `[<1s · A]`, `[<1h · B]`, `[<1d · B]` (tier classification)

**All colors + spacing from `apps/web/src/theme.tsx` (single source of truth).**

---

## Latent Backends (Phase 2 Wiring)

Both backends compile, boot, and respond to health checks. **Not connected to web in v1.**

```bash
curl http://localhost:3001/api/v1/health
# {"ok":true,"db":"connected","service":"catalog-api"}

curl http://localhost:3002/api/v1/health
# {"ok":true,"service":"query-svc","driver":"mock"}
```

Post-May-12 integration path documented in `docs/system-architecture.md` → Section 9.

---

## Known Limitations (Phase 1 v1.0)

| Issue | Workaround | Timeline |
|-------|-----------|----------|
| Trino VPN auth blocked | Use offline fixtures (committed to git) | Phase 2 |
| Catalog-api schema Bedrock-derived | Marked latent; schema replacement planned | Phase 2 |
| Draft canvas pre-population | Canvas opens; manual re-selection needed | Phase 2 |
| Inline segment cardinality hardcoded | Reach = 15k users (not dynamic) | Phase 2 |
| No E2E cross-browser tests | HTTP smoke tests + manual visual pass | Phase 3 |

See `docs/demo-known-limitations.md` for full detail.

---

## Build & Deployment

### Local

```bash
pnpm build      # Compile all services + bundle web
pnpm typecheck  # Type validation (0 errors required)
pnpm start      # Serve web on port 3000
```

### Production (Dokploy + Nixpacks)

```bash
# Deploy via Dokploy dashboard
# Auto-detects nixpacks.toml · builds all services · deploys to target
```

See `docs/deployment-guide.md` for detailed runbook.

---

## Contributing

1. **Code:** `apps/web/src/modules/*`
2. **Data:** `apps/web/src/data/catalog/` or `data/crawled/`
3. **Styles:** Tailwind + `theme.tsx` tokens only
4. **Commits:** Conventional format (`feat:`, `fix:`, `docs:`, etc.)
5. **Pre-push:** `pnpm typecheck && pnpm build` must pass

See `docs/code-standards.md` for full conventions.

---

## Roadmap

### Phase 1 (May 9 — COMPLETE)
✓ 23 screens · 67 features · two-substrate handoffs · offline demo · docs populated

### Phase 2 (May 13–August — PLANNED)
- Live backend wiring (catalog-api + query-svc)
- Feature Store schema alignment
- Multi-game crawler (ptg, cfm, nth, tf, cos)
- Real Authoring Agent integration
- Real LLM integration
- Apollo TEE + Temporal wiring
- Hatchet batch compilation
- Monitoring + observability

### Phase 3 (August–October — PLANNED)
- Code splitting + performance optimization
- Database indexing + connection pooling
- Security hardening + OWASP audit
- Cross-browser + responsive testing
- Accessibility audit (WCAG AA)

See `docs/project-roadmap.md` for detailed scope + dates.

---

## Support

**Questions?** Check:
1. `docs/codebase-summary.md` (orientation)
2. `docs/deployment-guide.md` (troubleshooting)
3. `docs/demo-known-limitations.md` (deferred features)
4. Phase reports in `plans/260509-1355-hermes-platform-prototype/`

**Issues?** File in GitHub or contact Khoi (GDS PM).

---

## License

Internal VNG Games project. Not for public distribution.

---

## Acknowledgments

**Designed for:** VNG Games LiveOps PMs (CFM, NTH, TF, COS, PT)

**Architecture reviewers:** Hawkins (GDS arch), ThangLV2 (Hatchet/Trino), Đạt (Apollo)

**Built:** May 2026 · 12 phases · 7–10 dev days · 24/25 acceptance criteria met at kickoff

**May 12 alignment meeting:** Hermes platform demo walkthrough + engineering feedback
