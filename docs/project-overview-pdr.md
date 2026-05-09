# Hermes Platform — Project Overview & PDR

**Status:** Phase 1 complete · May 9, 2026 · 24/25 acceptance criteria met

---

## 1. Product Vision

**Hermes** is VNG Games' Studio-facing **player engagement platform** replacing the ticket-driven, engineering-mediated LiveOps workflow with self-service authoring. It serves five game studios (PTG, CFM, NTH, TF, COS) and unifies campaigns, player segments, metric definitions, and real-time event evaluation in a single platform.

**Core audience:** LiveOps Product Managers (intent-driven, non-technical). Studios think in player outcomes, not SQL predicates.

**Engineering reviewers:** Hawkins (GDS arch), Apollo Eng leadership, deployment teams. Must recognize the architecture — two substrates, two interface contracts, Feature Store as bridge.

---

## 2. Two Architectural Contracts

The system's foundation — **not** exposed in the UX, but tangible in handoff confirmations:

| Concept | SegmentID | TriggerID |
|---------|-----------|-----------|
| **Output** | Frozen UID list in `state_user_segments` | Registered evaluator config in `JourneyDB` |
| **Substrate** | B · Hatchet + Trino + Iceberg | A · Apollo TEE + Temporal |
| **Latency** | Minutes to hours | Sub-second to seconds |
| **Created by** | Segment authoring canvas (explicit) | Campaign launch → real-time variant (implicit) |
| **Consumed via** | Apollo Activation API (channel delivery) | Apollo TEE evaluation + Temporal workflow spawn |

**Design principle:** SegmentID is a first-class Studio concept (life beyond one campaign: ad exports, ML training, scheduled pushes). TriggerID is minted as a side effect of campaign launch — surfaced in confirmation, but Studios never author a standalone "Trigger" (following mature tools like Braze, Iterable).

---

## 3. Five Core Modules

### 3.1 Feature Store (Module 01)
Inventory of 67 features (dimensions, counts, predictive scores, lifecycle states) shared by both substrates. Group-by domain/tier/owner. Live latency badges showing tier classification. Dual-target definition block on detail page showing which substrate(s) consume each feature.

**Scope:** 67 features across 9 domains per `Hermes_Demo_Data.md` Part 1.

### 3.2 Segments (Module 03)
Player population filter authoring. AND-of-OR predicate composition over Feature Store assets. **Data-tool register** — sticky audience band, threshold playground centerpiece, inline threshold adjustment, live audience updates. Segment handoff modal names Substrate B (Hatchet, Trino, Iceberg) verbatim.

**Scope:** 5 demo segments, 6–8 fictional for UX variety.

### 3.3 Campaigns (Module 04)
Activation authoring. Picks audience (Segment or real-time event entry), wraps with action/payload/journey/channel/holdout/goal. Three trigger types: real-time event, scheduled cadence, one-time send-when-ready. Campaign handoff modal names both substrates and both interface contracts (SegmentID and/or TriggerID).

**Scope:** 5 representative campaigns per `Hermes_Demo_Data.md` Part 3; journey UX visible; monitoring showing +8.2% lift proof point.

### 3.4 Agents (Module 05)
AI-assisted player engagement recommendations. Inbox pattern with four tabs: Opportunities (unsolicited recommendations), Drafts (user-created, agent-refined), Recommendations (user-requested analysis), Activity (approval/rejection log). Opportunity card renders all 6 regions (intent, window/confidence, evidence, proposed action, why-now collapsed, approve/edit/dismiss).

**Scope:** 9 opportunities, 3 drafts, 2 recommendations, 3 activity records.

### 3.5 Explore (Module 02)
Perpendicular discovery surface (nav-only for May 12; full module deferred to post-launch).

---

## 4. Acceptance Criteria Summary

**Must-Have (Acceptance #1–17):**
- All 23 screens render; 13-step demo flow walks end-to-end
- Segment canvas reads as data tool (sticky audience, threshold playground)
- Feature Store latency badges visible; dual-target definitions shown
- ≥2 campaign trigger variants (real-time + scheduled/onetime)
- Handoff modals match architecture verbatim (Substrate A · Apollo TEE/Temporal; Substrate B · Hatchet/Trino/Iceberg)
- 4 cross-module routing CTAs working
- Author column visible on segment/campaign libraries; ≥1 agent-drafted row

**Real Data (Acceptance #18–22):**
- ≥10–15 features showing real Trino-derived distributions
- All 5 demo predicates have working threshold playgrounds
- Crawler produces 5 fixture JSONs
- Schema audit confirms table coverage

**Demo Environment (Acceptance #23–25):**
- `pnpm install && pnpm dev` → web 5173, catalog-api 3001 (latent), query-svc 3002 (latent)
- `pnpm build` produces production bundle
- Docs populated per CLAUDE.md structure

**Current status:** 24/25 met (May 9). Acceptance #25 (docs) completed in Phase 11.

---

## 5. Key Implementation Decisions

| Decision | Rationale |
|----------|-----------|
| **Static fixtures, no fetch in v1** | PRD requires offline demo; VPN-blocked Trino; crawler → git-committed JSON |
| **Crawler synthesizes missing features** | All 67 feature names required; cfm_vn schema incomplete → T5 tier features get plausible shape + `synthesised: true` badge |
| **Latent backends (NestJS) retained** | Backends compile, boot, health-check green; post-May-12 wiring documented; not deleted, not coupled to web |
| **Serif italic for intent, mono for IDs** | Hawkins design language; visual contract between UX and architecture |
| **SegmentID only on explicit save; TriggerID on campaign activation** | Aligns with Studio mental model (segments are reusable; triggers are campaign side-effects) |

---

## 6. Demo Deliverables

| Artifact | Location | Status |
|----------|----------|--------|
| Web app (Vite + React 18) | `apps/web/` | Shipped · 23 screens · 612 KB gzip |
| Trino crawler (TS CLI) | `infra/trino-crawler/` | Shipped · 5 fixture JSONs · schema audit produced |
| Catalog API (NestJS latent) | `apps/catalog-api/` | Compiles · boots · health 200 · DB schema Bedrock-derived |
| Query Service (NestJS latent) | `apps/query-svc/` | Compiles · boots · health 200 · mock + Trino drivers |
| Fixture data | `apps/web/src/data/{catalog,crawled}/` | Committed · 67 features · 47 events · 5 campaigns · 9 opportunities |
| Feature definitions | `packages/contracts/src/` | Shared across all services · Zod schemas for TS safety |
| Design tokens | `apps/web/src/theme.tsx` | Single source of truth · `T.colors`, `T.fonts`, `T.radii`, `T.spacing` |

---

## 7. Known Limitations (Phase 1 v1.0)

| # | Issue | Reason | Impact | Mitigation |
|---|-------|--------|--------|-----------|
| 1 | Trino auth blocked | VPN credential rotation | Real data → fixtures | Fixtures committed to git; offline demo |
| 2 | Catalog-api schema Bedrock-derived | Schema port incomplete | Prod mismatch | Marked latent; post-May-12 replacement planned |
| 3 | Draft pre-population (`?from=draft-...`) | Implementation deferred | Canvas opens; deeper wiring TBD | Manual re-selection on demo |
| 4 | Inline segment reach hardcoded | Real calculation needs Hatchet | Cardinality not dynamic | 15,000 user reach constant |
| 5 | No E2E cross-browser testing | Tooling deferred | Chromatic/Percy unattached | HTTP smoke tests + manual visual pass |

See `docs/demo-known-limitations.md` for full detail.

---

## 8. Deployment & Operations

**Prerequisites:** Node ≥20, pnpm ≥9, optional VPN (crawler only).

**Local development:**
```bash
pnpm install && pnpm dev
# web on 5173, catalog-api on 3001 (latent), query-svc on 3002 (latent)
```

**Production bundle:**
```bash
pnpm build              # → apps/web/dist/
pnpm start             # → serves on port 3000
# Or: pnpm --filter @hermes/web preview
```

**Crawler (real cfm_vn data via Trino):**
```bash
pnpm refresh-cfm-data  # Requires VPN; outputs 5 fixtures; commits if successful
```

**More detail:** See `docs/deployment-guide.md`.

---

## 9. Code Organization

- `apps/web` — Vite + React 18 + TS; 5 modules (feature-store, segments, campaigns, agents, explore-stub)
- `apps/catalog-api`, `apps/query-svc` — NestJS backends; compiling, latent
- `packages/contracts` — Shared Zod schemas
- `infra/trino-crawler` — TS CLI; 5-step data pipeline
- `docs/` — CLAUDE.md structure (this file, codebase-summary, system-architecture, design-guidelines, code-standards, deployment-guide, project-roadmap)

**Details:** See `docs/codebase-summary.md`.

---

## 10. Next Steps

**Immediate (Pre-May 12 alignment meeting):**
1. Walk 13-step demo flow with PMs (CFM, NTH, TF, COS, PT).
2. Validate handoff modal copy with Substrate A (Apollo) and Substrate B (GDS Hatchet/Trino) leads — 15-min review with Hawkins, ThangLV2, Đạt.
3. Confirm May 12 readiness (QA, demo server, WiFi, projector).

**Post-May 12 (Phase 2 — SP-4 · Live integration):**
- Wire web → query-svc for live audience counts.
- Extend catalog-api with Hermes Feature Store schema.
- Multi-game crawler (ptg_vn, nth_vn, tf_vn, cos_vn).
- Real LLM integration for agents.
- Real Hatchet workflow + Trino segment compilation.
- Apollo TEE integration for triggers.

---

## 11. Document Cross-References

- **System Architecture:** `docs/system-architecture.md` — two-substrate diagram, data flow, crawler pipeline
- **Design Guidelines:** `docs/design-guidelines.md` — tokens, typography, color usage, component reference
- **Code Standards:** `docs/code-standards.md` — TS conventions, module sizing, naming rules
- **Codebase Summary:** `docs/codebase-summary.md` — file layout, where to find things, how to add features
- **Deployment Guide:** `docs/deployment-guide.md` — run/build/deploy commands, troubleshooting
- **Project Roadmap:** `docs/project-roadmap.md` — phase tracking, post-May-12 commitments
- **Known Limitations:** `docs/demo-known-limitations.md` — detailed deferred features and workarounds
