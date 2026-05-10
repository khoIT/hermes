# Project Changelog

**Last updated:** 2026-05-10

---

## 2026-05-10 — Phase 12: Chat ↔ Artifact Connectivity (Phases 1–4 Delivered)

**Scope:** 4 phases shipped for May-12 alignment demo. Unified agent surface with reverse navigation, universal CTAs, quick-create dialogs, and guided demo arc.

**Key Changes:**
- **Reverse navigation infrastructure (P2):** `sourceThreadId` persisted on `segments` and `campaigns` tables (migration `0012_add_source_thread_id.sql`). Contracts updated with `sourceThreadId?: string` field. New `<SourceThreadPill>` component renders on board/segment/campaign detail headers.
- **Universal CTA row (P3):** Every `<AssistantResponse>` now renders `<UniversalCtaRow>` with 🎯 Save as segment · 📊 Pin to board · 📣 Build campaign. Smart-hide suppresses redundant CTAs when `action_card_*` sections present. `suppressUniversalCtas` flag on AssistantMessage hides entire row (used by curated demo thread).
- **Quick dialogs (P3):** `<QuickSegmentDialog>` and `<QuickCampaignDialog>` enable inline artifact creation from chat without leaving context.
- **Active thread context (P2/P3):** `useActiveThreadId()` hook via `apps/web/src/utils/active-thread-context.tsx` exposes current thread to action cards and dialogs.
- **Demo arc thread (P4):** Pre-seeded `thread-demo-livops-2026` chains Board pin → Segment confirm → Campaign activate in ≤90s. `<ContinueInChatPill>` returns from artifact detail to source thread. `<RestartDemoChip>` re-seeds demo from fixture without bootstrap dependency.
- **Demo polish (P1):** Campaign action card Confirm now navigates to `/campaigns/{id}`. Off-script chat questions route through `genericFallbackResponse()` instead of dropping. User messages + thread headers prefixed with HelpCircle icon.
- **Warmup script:** `scripts/pre-demo-warmup.ps1` pre-caches catalog-api + audience-count endpoints before live demo.

**Files Modified:** ~30 across chat components, utilities, contracts, clients, and detail pages.

**Deferred (Post-Demo):**
- Phase 5: Refinement playbooks + side-panel resize + one-click Apply (demoted to P2, post-demo).
- Phase 6: Rollout pattern to boards, campaigns, features (P3, post-demo).
- Plan `260510-0045-agents-compose-canvas` reverted from `completed` → `pending` (zero code exists; separate track).

**Test Status:** Phases 1–4 validated; demo flow end-to-end walkable in ≤90s.

---

## 2026-05-09 — Phase 11: Design Alignment Prototype Complete

**Scope:** Full PRD implementation (24/25 acceptance criteria).

**Key Changes:**
- 23 screens across 5 modules (Feature Store v2, Segments, Campaigns, Agents, Explore-stub).
- 67 features (48 real + 28 synthesised from Trino fixtures); 47 events; 5 campaigns; 9 opportunities.
- Two-substrate handoff modals (Substrate A · Apollo TEE; Substrate B · Hatchet/Trino/Iceberg).
- Segment canvas with AND-of-OR composition + live threshold playground.
- Campaign trigger variants (real-time event, scheduled cadence, one-time) + journey + prelaunch.
- Agent inbox with 4 tabs (Opportunities, Drafts, Recommendations, Activity) + opportunity card all 6 regions.
- Trino crawler pipeline (5-step) with Bedrock-derived fixtures committed to git.
- NestJS backends (catalog-api, query-svc) compiling + healthy; Feature Store wired to live catalog-api endpoints.
- Full docs structure per CLAUDE.md (codebase-summary, system-architecture, code-standards, design-guidelines, deployment-guide, project-roadmap, demo-known-limitations).
- Production bundle: 612 KB gzip (warning, not error).

**Catalog-API Slice Delivered:**
- 12 persona endpoints live (`GET /api/v1/features`, distribution, used-by, audience-count, quantiles, samples, pipeline-health, outliers, coverage, top-segments, correlations, plus v1 four).
- `feature_pipeline_runs` table for DE pipeline-health timeline.
- `game_id` schema delta for multi-game readiness (CFM-only data per Phase 00 audit).

**Query-SVC Slice Delivered:**
- Audience module: predicate AST → Postgres set-algebra.
- `POST /api/v1/audience/count` over feature_values table.
- Validated: `account_age_days > 3000` → 137k UIDs · 88ms; AND-of-leaf → 34k UIDs · 153ms.

**Web App (Partial Phase 2.1 Backend Wiring):**
- Vite proxy split: `/api/v1/audience` → :3002; everything else → :3001.
- `useAudienceCount` hook + composer adapter live.
- 3 LM detail panels live: source provenance, health verdict, threshold playground (live audience via API).

**Test Status:** 13-step demo flow validated; 25 acceptance criteria gates passed.

---

## Key Metrics

| Phase | Date | Screens | Features | Tests Passing | Bundle Size | Status |
|-------|------|---------|----------|--------------|-------------|--------|
| 11 | 2026-05-09 | 23/23 | 67 | ✓ | 612 KB | Complete |
| 12 (1–4) | 2026-05-10 | — | +chat connectivity | ✓ | (same) | Complete |

---

## Known Issues & Deferrals

| Item | Impact | Timeline |
|------|--------|----------|
| Multi-game crawler (ptg, nth, tf, cos) | Phase 2.3 blocked on VNG IT Trino provisioning | Post-May-12 |
| Real authoring agent | Phase 2.4 placeholder opportunities | Post-May-12 |
| Real LLM integration | Phase 2.5 placeholder intent | Post-May-12 |
| Apollo TEE wiring | Phase 2.6 TriggerID registration | Post-May-12 |
| Hatchet + Trino batch | Phase 2.7 segment compilation | Post-May-12 |
| Refinement playbooks (Phase 5) | Compose race conditions + cold-start risk | Post-demo |
| Compose canvas (separate plan) | Zero code exists; `260510-0045` reverted pending | Post-demo |

See `docs/demo-known-limitations.md` for detailed workarounds and pre-demo checks.
