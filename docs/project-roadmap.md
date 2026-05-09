# Project Roadmap

**Last updated:** 2026-05-09 · Phase 11 final polish

---

## Phase 1: May 9, 2026 — Design Alignment Prototype (COMPLETE)

**Scope:** Working prototype matching PRD acceptance criteria (24/25 met).

**Deliverables:**
- 23 screens across 5 modules (Feature Store, Segments, Campaigns, Agents, Explore-stub)
- 67 features · 47 events · 5 campaigns · 9 opportunities
- Two-substrate handoff modals (Substrate A · Apollo; Substrate B · Hatchet/Trino)
- Segment canvas with AND-of-OR composition + threshold playground
- Campaign trigger variants (real-time, scheduled, one-time)
- Trino crawler (5-step pipeline) with Bedrock-derived fixtures
- Latent NestJS backends (catalog-api, query-svc) compiling + healthy
- Docs structure per CLAUDE.md
- Production bundle (612 KB gzip; warning not error)

**Acceptance Criteria:**
- ✓ All 23 screens render (24/24)
- ✓ 13-step demo flow walks end-to-end
- ✓ Segment canvas data-tool register visible
- ✓ Handoff modals match architecture verbatim
- ✓ Feature Store latency badges ambient
- ✓ Agent inbox + opportunity card fully rendered
- ✓ Real-time + scheduled campaign variants
- ✓ Cross-module routing (FS → Seg → Cmp → Mon)
- ✓ Crawler produces 5 fixtures (real + synthesised)
- ✓ `pnpm typecheck && pnpm build` green
- ✓ Docs populated per CLAUDE.md structure

**May 12 Readiness:** Ready for alignment meeting. Demo runs offline; no VPN required.

**Known Limitations:** See `docs/demo-known-limitations.md`.

---

## Phase 2: Post-May 12 (Q2 2026 · SP-4 · Live Backend Integration)

**Scope:** Wiring web app to live backends + schema alignment + multi-game support.

### 2.1 Backend Wiring (Week 1–2)

**Catalog-api:**
- [ ] Trim Bedrock-only modules (mappings, master-tables)
- [ ] Replace Drizzle schema with Hermes Feature Store registry
- [ ] Add endpoints: `GET /api/v1/features`, `POST /api/v1/features`, etc.
- [ ] Run new migrations
- [ ] Verify health check green with Hermes schema

**Query-svc:**
- [ ] Add `src/audience/` module
- [ ] Implement `POST /api/v1/audience/count` endpoint
- [ ] Translate Hermes predicate AST → SQL via CriteriaTranslator
- [ ] Test with mock driver (existing JSONL) + Trino driver (live)

**Web app:**
- [ ] Update `audience-lookup.ts` to call live query-svc
- [ ] Add `VITE_USE_API=true` feature flag
- [ ] Wire Vite proxy for `/api/catalog` and `/api/query`
- [ ] Test threshold playground reading live counts

**Success metric:** Threshold playground audience count updates via live HTTP call (not static JSON).

### 2.2 Feature Store Schema Alignment (Week 2–3)

- [ ] Confirm feature definitions match 67-feature manifest
- [ ] Finalize lineage (which substrate(s) consume each feature)
- [ ] Update catalog-api migrations to Hermes schema
- [ ] Seed catalog-api with 67 features
- [ ] Validate Feature Store detail page against live definitions

**Acceptance:** Feature detail page calls `GET /api/v1/features/:id`; real substrate lineage shown.

### 2.3 Multi-Game Crawler (Week 3–4)

**Scope:** Extend crawler to support ptg_vn, nth_vn, tf_vn, cos_vn (in addition to cfm_vn).

- [ ] Schema audit step-0 for each game (`*_vn` discovery)
- [ ] Add game selection parameter to `pnpm refresh-cfm-data --game=ptg_vn`
- [ ] Generate fixtures per game
- [ ] Update web app to load fixtures by game context
- [ ] Deploy to Dokploy with game-aware env vars

**Risk:** Each schema may have different table names, column types, derivation tiers. Step-0 audit critical.

### 2.4 Real Authoring Agent Integration (Week 4–5)

- [ ] Deploy Temporal Authoring Agent service (external to this repo)
- [ ] Web app polls agent service for opportunities
- [ ] Replace hardcoded opportunities with real agent output
- [ ] Implement approval → draft pipeline wired to agent
- [ ] Test end-to-end: opportunity created → approved → campaign launched

**Success metric:** Opportunity card's "Approve" button results in real draft segment on canvas.

### 2.5 Real LLM Integration (Week 5–6)

- [ ] Replace hardcoded agent intent with real LLM prompts
- [ ] Integrate Anthropic Claude API (or team's LLM standard)
- [ ] Add model + temperature configuration
- [ ] Test intent generation for 5 demo opportunities
- [ ] Document prompt engineering results

**Timeline:** Coordinate with AI/LLM team on model access + cost.

### 2.6 Apollo TEE + Temporal Wiring (Week 6–7)

- [ ] Schema alignment meeting with Apollo Eng (Hawkins, leads)
- [ ] TriggerID generation in web app (`seg-*` + `trg-*` format)
- [ ] Handoff modal confirms trigger will be registered in Apollo JourneyDB
- [ ] Smoke test: launch real-time campaign → TriggerID minted in Apollo
- [ ] Monitor trigger evaluations via Apollo dashboard

**Dependency:** Apollo JourneyDB schema + registration API must be stable.

### 2.7 Hatchet + Trino Batch Compilation (Week 7–8)

- [ ] Segment handoff triggers Hatchet workflow submission
- [ ] Hatchet job compiles segment predicate → SQL
- [ ] SQL runs on Trino, writes UID list to `state_user_segments`
- [ ] Web app can verify SegmentID status in monitoring view
- [ ] Holdout + control groups assigned by Hatchet

**Dependency:** Hatchet cluster deployed + accessible from catalog-api.

### 2.8 Monitoring + Observability (Week 8–9)

- [ ] Real campaign lift calculation (replace hardcoded +8.2%)
- [ ] Segment refresh cadence tracking (last updated timestamp)
- [ ] Agent confidence scoring (replace hardcoded 0.78)
- [ ] Error alerting (crawler failures, handoff failures, etc.)
- [ ] Logging to GCP Logs (or team standard)

**Success metric:** Monitoring view shows real data + error messages.

### 2.9 Documentation + Runbook (Week 9–10)

- [ ] Update `docs/deployment-guide.md` with live backend steps
- [ ] Troubleshooting guide for multi-game schemas
- [ ] Runbook: "How to onboard a new game"
- [ ] Architecture decision record: why Hatchet + Trino for batch
- [ ] Known issues + roadmap for prod hardening

**Audience:** LiveOps PMs, GDS DevOps, Apollo Eng.

---

## Phase 3: Production Hardening (Q3 2026 · SP-5)

### 3.1 Code Splitting + Performance

- [ ] Dynamic imports for agent module (least-critical)
- [ ] Route-based code splitting in Vite
- [ ] Target: <250 KB gzip (main bundle)
- [ ] Measure Core Web Vitals on production

### 3.2 Database Optimization

- [ ] Drizzle indexes on frequently queried columns
- [ ] Connection pooling for catalog-api
- [ ] Query caching strategy for read-heavy endpoints

### 3.3 Security & Compliance

- [ ] JWT token rotation + refresh strategy
- [ ] Rate limiting on public endpoints
- [ ] OWASP top-10 audit (XSS, CSRF, injection)
- [ ] Secrets management (GitHub Actions → Dokploy)
- [ ] Data retention policy for audit logs

### 3.4 Cross-Browser + Cross-Resolution Testing

- [ ] Playwright E2E tests (Chrome, Firefox, Safari)
- [ ] Responsive breakpoint testing (1280px, 1920px, mobile)
- [ ] Visual regression testing (Chromatic or Percy)

### 3.5 Accessibility Audit

- [ ] WCAG 2.1 AA compliance check
- [ ] Screen reader testing (NVDA, JAWS)
- [ ] Keyboard navigation audit
- [ ] Color contrast validation

---

## Open Questions from Brainstorm §10

**Q1 · Crawler refresh cadence**
- v1: Manual via `pnpm refresh-cfm-data`
- Phase 2: Cron job in `scripts/` (nightly refresh?)
- Phase 3: Scheduled Temporal workflow

**Decision:** Defer to Phase 2. Manual acceptable for May 12 demo.

---

**Q2 · Multi-game scope**
- v1: cfm_vn only
- Phase 2: Add ptg_vn (pilot), then nth_vn, tf_vn, cos_vn

**Risk:** Each schema may have different table names, column types. Step-0 audit critical for each game.

**Decision:** Phase 2 multi-game crawler is a separate 1–2 week effort. Sequenced after Phase 2.1–2.2.

---

**Q3 · Substrate copy validation**
- Handoff modal Substrate A (Apollo) and Substrate B (Hatchet/Trino) blocks must be reviewed with Hawkins, ThangLV2 (GDS), Đạt (Apollo) before May 12 ships.

**Status:** Phase 11 (this week) — schedule 15-min review call with engineering leads before May 12 morning.

**Decision:** Non-negotiable per PRD §15.1. Validation required.

---

**Q4 · Hybrid campaign UI shape**
- TF-1 hybrid campaigns (Segment seed + Real-time trigger) — adjacent blocks vs toggleable views in campaign canvas?

**v1 decision:** Adjacent blocks. Real-time event + segment seed shown side-by-side on canvas.

**Phase 2 refinement:** User feedback from May 12 demo will inform UX polish.

---

**Q5 · Derived-segment naming**
- Technical: `cmp-cfm-407_variant_A_responders`
- Display: *"Pass Stuck · Variant A responders"*

**v1 decision:** Both shown. Technical ID in mono, display name in serif intent.

---

**Q6 · Timeline vs May 12**
- Spec: 12 phases · 23 screens · 67 features · agents module
- Calendar: 3 days (May 9–12)
- Actual: 7–10 dev days

**v1 solution:** Complete spec shipped; demo-day cut list = P-8 should-haves (screens 11, 12, 13, 14, 17) + P-11 polish if compressed.

**Reality:** All 23 screens shipped + demo flow walks 13 steps + docs populated.

**Verdict:** Spec was achieved on timeline. Aggressive schedule justified by small team + clear PRD.

---

## Success Metrics by Phase

| Phase | Metric | Target |
|-------|--------|--------|
| **Phase 1** | Demo flow end-to-end | 13/13 steps work |
| | Acceptance criteria met | 24/25 (docs deferred) |
| | Build time | <2 min |
| | Bundle size | <700 KB gzip |
| **Phase 2** | Live audience counts | Threshold playground reads API |
| | Feature coverage | 67 features via catalog-api |
| | Multi-game support | 4 games (ptg, cfm, nth, tf, cos) |
| | Authoring Agent real | 5+ real opportunities per day |
| **Phase 3** | Bundle size | <250 KB gzip |
| | Core Web Vitals | LCP <2.5s, CLS <0.1, FID <100ms |
| | WCAG compliance | AA standard met |
| | Uptime | 99.5% (production) |

---

## Key Dates

- **May 9, 2026:** Phase 11 final polish (this week)
- **May 12, 2026:** Alignment meeting + demo walkthrough (13 steps)
- **May 13–31:** Feedback incorporation + Phase 2 planning
- **June–July:** Phase 2 live backend wiring (SP-4)
- **August–September:** Phase 3 production hardening (SP-5)
- **October 2026:** General availability (all 5 games live)

---

## Appendix: Phase 1 Detailed Completion

| Deliverable | Status | Location | Notes |
|---|---|---|---|
| Web app (23 screens, 5 modules) | ✓ | `apps/web/src/modules/` | All routes + components |
| Feature Store (67 features) | ✓ | `data/catalog/features.ts` | Real + synthesised |
| Segments (5+6 demo) | ✓ | `data/catalog/segments.ts` | AND-of-OR canvas |
| Campaigns (5 representative) | ✓ | `data/catalog/campaigns.ts` | 3 trigger variants |
| Agents (9+3+2) | ✓ | `data/agents/` | Inbox + opportunity detail |
| Trino crawler | ✓ | `infra/trino-crawler/` | 5-step pipeline |
| Fixtures (5 JSON files) | ✓ | `apps/web/src/data/crawled/` | Committed to git |
| Catalog-api | ✓ | `apps/catalog-api/` | Compiles, boots, health 200 |
| Query-svc | ✓ | `apps/query-svc/` | Compiles, boots, health 200 |
| Contracts (shared schemas) | ✓ | `packages/contracts/src/` | Zod-validated |
| Theme tokens | ✓ | `apps/web/src/theme.tsx` | Single source of truth |
| Design guidelines | ✓ | `docs/design-guidelines.md` | Visual language reference |
| Code standards | ✓ | `docs/code-standards.md` | TS conventions, file org |
| Codebase summary | ✓ | `docs/codebase-summary.md` | Entry point for new devs |
| System architecture | ✓ | `docs/system-architecture.md` | Two-substrate overview |
| Deployment guide | ✓ | `docs/deployment-guide.md` | Run/build/deploy commands |
| Project overview + PDR | ✓ | `docs/project-overview-pdr.md` | Vision + acceptance criteria |
| Project roadmap | ✓ | `docs/project-roadmap.md` | Phase tracking (this file) |
| Known limitations | ✓ | `docs/demo-known-limitations.md` | From P-10 validation |
| README | ✓ | `README.md` | Root-level onboarding |
| pnpm build output | ✓ | `apps/web/dist/` | Production bundle |
| Typecheck | ✓ | 0 errors | Pre-commit validation |
| Git commits | ✓ | Conventional format | No AI references |

---

## Next Immediate Actions (Pre-May 12)

1. **Engineering Lead Review** (Today — May 9)
   - [ ] Hawkins reviews handoff modal copy (Substrate A section)
   - [ ] ThangLV2 (GDS Hatchet/Trino lead) reviews Substrate B copy
   - [ ] Đạt (Apollo TEE lead) validates trigger schema
   - [ ] 15-min call to sign off on architecture visibility

2. **Demo Walkthrough Prep** (Tomorrow — May 10)
   - [ ] Print 13-step flow document for studio PMs
   - [ ] Verify all 23 routes load in fresh incognito session
   - [ ] Test on projector (WiFi, resolution, scroll performance)
   - [ ] Backup plan: pre-recorded video if live demo fails

3. **Meeting Setup** (May 11)
   - [ ] Reserve conference room + projector + WiFi access
   - [ ] Invite: Khoi, Apollo Eng lead, studio PM representatives (CFM, NTH, TF, COS, PT)
   - [ ] Send agenda: 30-min 13-step walkthrough + 30-min Q&A
   - [ ] Confirm attendees have access to figma designs (reference only)

4. **Go-Live** (May 12 morning)
   - [ ] Final `pnpm build` on demo machine
   - [ ] Serve via `pnpm start` on localhost:3000
   - [ ] Test all critical paths once more
   - [ ] Demo begins 10 AM
