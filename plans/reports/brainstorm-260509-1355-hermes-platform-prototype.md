---
type: brainstorm
date: 2026-05-09
slug: hermes-platform-prototype
status: approved
authors: [khoitn]
companion_prds:
  - design-reference/Hermes/uploads/PRD_Hermes_Design (1).md
  - design-reference/Hermes/uploads/PRD_Hermes_Agentic.md
  - design-reference/Hermes/uploads/Hermes_Demo_Data.md
  - design-reference/Hermes/uploads/liveops_2026_campaign_requirements.md
reference_repo: C:\Users\CPU12830-local\code\segment-builder
---

# Hermes — Player Engagement Platform · Brainstorm Summary

## 1. Problem statement

Build the working prototype of **Hermes** — VNG Games' Studio-facing LiveOps product layer — bootstrapped from `segment-builder` (Bedrock) skeleton. Three deliverables in one workspace:

1. **Frontend prototype** · 23 screens (18 design + 5 agentic) covering Feature Store, Segments, Campaigns, Agents modules per `PRD_Hermes_Design.md` and `PRD_Hermes_Agentic.md`.
2. **Trino crawler** · pulls real cfm_vn data per `Hermes_Demo_Data.md` (all 67 features, 47 events) → static fixtures the web bundles at build time.
3. **Latent backends** · `catalog-api` + `query-svc` forked from Bedrock, renamed `@hermes/*`, kept compiling but not wired to web in v1. Available for post-May-12 live integration.

Anchor for May 12 alignment meeting. End state: complete prototype matching PRD acceptance criteria.

## 2. Constraints

- PRDs require *no runtime fetch, no real LLM calls, no functional persistence in web*. Real data enters the bundle as committed JSON fixtures, not API calls.
- Trino host `10.164.54.181` is internal VNG — VPN required for crawler runs. Demo must run offline → fixtures committed to git.
- Visual fidelity non-negotiable: serif italic intent, mono technical, deep red `#f05a22`, amber `var(--anomaly)`, latency badges (`<1s · A`, `<1h · B`, `<1d · B`) on every feature pill, handoff modals verbatim per PRD §8.7 / §9.9.
- Three games in scope per PRD: PTG (pilot), CFM, NTH, TF, COS. v1 crawler hits `cfm_vn` only — multi-schema deferred.

## 3. Approaches evaluated

| Approach | Pros | Cons | Verdict |
|---|---|---|---|
| **A · Crawler → static fixtures, latent backends** | PRD-compliant (no fetch); demo offline-safe; fastest to ship; matches Bedrock pattern (`infra/trino-mock/refresh.ts`) | Audience preview is "real numbers, frozen at crawl time" not truly live | **Chosen** |
| B · Live audience preview via query-svc | Truly live demo | Bends PRD; VPN at demo time; query-svc must be production-ready | Rejected |
| C · Full backend port wired end-to-end | Complete platform | Won't fit timeline; over-engineered for design alignment | Rejected |
| D · Crawler standalone, decoupled | Cleanest separation | Loses "real data" hook in demo | Rejected |

User-confirmed: **A** with backends kept (forked + latent), web fresh in TypeScript, all 67 features attempted, no cut list.

## 4. Final architecture

### 4.1 Repo layout

```
hermes/
├── apps/
│   ├── web/             FRESH · Vite + React 18 + TS · pages per Hermes IA
│   ├── catalog-api/     FORKED+RENAMED · NestJS · LATENT (compiles, not wired)
│   └── query-svc/       FORKED+RENAMED · NestJS · LATENT (compiles, not wired)
├── packages/
│   ├── contracts/       Subset port: feature, segment, campaign, primitives, errors,
│   │                    + NEW: opportunity, agent-draft, agent-recommendation
│   ├── tsconfig/        Renamed @bedrock → @hermes
│   └── eslint-config/   Renamed
├── infra/
│   ├── trino-crawler/   NEW · TS CLI · pulls cfm_vn → fixtures
│   ├── trino-mock/      Kept from Bedrock as fallback
│   └── docker-compose.yml  Postgres for catalog-api (latent)
├── docs/
│   ├── project-overview-pdr.md
│   ├── codebase-summary.md
│   ├── system-architecture.md
│   ├── design-guidelines.md
│   ├── code-standards.md
│   ├── deployment-guide.md
│   └── project-roadmap.md
└── plans/               Implementation plans (this brainstorm + /ck:plan output)
```

### 4.2 Data flow

```
┌─ apps/web (Vite + React 18 + TS, no fetch) ──────────────────────┐
│  modules/                                                          │
│   ├─ feature-store/   library, detail                              │
│   ├─ segments/        library, canvas, threshold-deep, handoff,    │
│   │                   monitoring, patterns                         │
│   ├─ campaigns/       library, canvas/{realtime,scheduled,onetime},│
│   │                   journey, prelaunch, handoff, monitoring,     │
│   │                   patterns                                      │
│   ├─ agents/          inbox, opportunity-detail, drafts, activity, │
│   │                   settings                                      │
│   └─ explore/         stub (PRD §7 — deferred to nav-only)         │
│                                                                     │
│  data/                                                              │
│   ├─ catalog/  (handcrafted)                                       │
│   │   ├─ features.ts (67 features per Hermes_Demo_Data.md Part 1) │
│   │   ├─ events.ts (47 events per Part 2)                          │
│   │   ├─ segments.ts (5 demo + 6-8 fictional per Part 6)           │
│   │   ├─ campaigns.ts (5 representative per Part 3)                │
│   │   └─ agents/                                                    │
│   │       ├─ opportunities.ts (9 per Agentic §7.1)                 │
│   │       ├─ drafts.ts (3 per §7.2)                                │
│   │       ├─ recommendations.ts (2 per §7.3)                       │
│   │       └─ activity.ts (3 rejected per §7.4)                     │
│   └─ crawled/  (generated by infra/trino-crawler)                 │
│       ├─ distributions.json   per-feature histogram + p50/p90/p99 │
│       ├─ audience-counts.json predicate-hash → threshold grid     │
│       ├─ event-volumes.json   per-event daily volume + sparkline  │
│       └─ sample-players.json  50-100 UID rows for "Recent values" │
└────────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │  pnpm refresh-cfm-data
┌──────────────────────────────────┴────────────────────────────────┐
│  infra/trino-crawler  (TS CLI, reuses query-svc/trino-client.ts)  │
│   step-0  schema discovery → infra/trino-crawler/schema-audit.md  │
│   step-1  feature distribution sweep (all 67)                     │
│   step-2  audience-count grid (5 demo predicates × thresholds)    │
│   step-3  sample player rows (TABLESAMPLE)                        │
│   step-4  event volume aggregation (47 events daily counts)       │
│   step-5  segment demographics (lifecycle/country/spend per seg)  │
│                                                                    │
│   Failure handling: if a feature cannot be derived from cfm_vn,    │
│   crawler logs the gap, writes a synthesised distribution that    │
│   matches plausible shape, and tags `synthesised: true` in JSON.  │
│   Web renders synthesised features with a subtle "synth" badge.   │
└────────────────────────────────────────────────────────────────────┘
                       │ HTTP + Basic Auth (creds in root .env)
                       ▼
                  Trino @ 10.164.54.181:8080 · iceberg.cfm_vn
```

### 4.3 Feature derivation strategy (all 67)

cfm_vn raw tables (expected per Bedrock mock JSONLs): `etl_login`, `etl_logout`, `etl_match_end`, `etl_recharge`, `etl_inapp_event`, `etl_install`, `etl_money_flow`, `etl_register`, `std_master_user_profile`. Confirmed by step-0 audit.

**Derivation tiers:**

| Tier | Coverage | Strategy | Example features |
|---|---|---|---|
| **T1 · Direct column** | 10–15 | Read raw column from `std_master_user_profile` or recent event | `account_age_days`, `region_code`, `is_test_account` |
| **T2 · Simple aggregate** | 15–20 | `COUNT/SUM/MAX` over event window | `lifetime_login_count`, `session_count_30d`, `purchase_count_7d` |
| **T3 · Window function** | 10–15 | `ROW_NUMBER` / `LAG` over event stream | `consecutive_ranked_losses_streak`, `mmr_drift_7d`, `daily_login_streak_current` |
| **T4 · Cross-table join** | 5–10 | Join master profile × event aggregate | `is_paying_user_lifetime`, `spend_tier_lifetime`, `vip_status` |
| **T5 · Out-of-scope synthesised** | 10–15 | No cfm_vn source — generate plausible shape, badge `synthesised: true` | `mong_hoa_luc_popularity_score` (NTH-only), `dominant_playstyle`, `annual_contribution_tier` |

Crawler ships per-feature derivation in `infra/trino-crawler/derivations/<feature-name>.sql`. Step-0 audit produces a derivation-coverage manifest before any compute.

### 4.4 Web component map (PRD §12 + Agentic §5)

23 screens · all "must-have" + "should-have" + "nice-to-have" tiers from PRD §12 covered.

| ID | Path | Notes |
|---|---|---|
| 00 | `modules/home/page.tsx` | Landing |
| 01 | `modules/feature-store/library.tsx` | Group-by, filter rail, 67-row catalog |
| 02 | `modules/feature-store/detail.tsx` | Showcase: `consecutive_ranked_losses_streak` (dual-tier) |
| 03 | `modules/segments/library.tsx` | 4R goal grouping default |
| 04 | `modules/segments/canvas.tsx` | ★ Centerpiece · AND-of-OR + inline swap + inline threshold |
| 05 | `modules/segments/threshold-deep.tsx` | Standalone playground |
| 06 | `modules/segments/handoff-modal.tsx` | ★ Substrate B · Hatchet + Trino + Iceberg verbatim |
| 07 | `modules/segments/monitoring.tsx` | Overview · Monitoring · Used by tabs |
| 08 | `modules/segments/patterns.tsx` | 5 audience patterns |
| 09 | `modules/campaigns/library.tsx` | 4R + trigger-type chips |
| 10 | `modules/campaigns/canvas/realtime.tsx` | ★ Event source + trigger predicate + cooldown |
| 11 | `modules/campaigns/canvas/scheduled.tsx` | Cadence picker |
| 12 | `modules/campaigns/canvas/onetime.tsx` | Send-when-ready |
| 13 | `modules/campaigns/journey.tsx` | Trigger → Step nodes → Goal/Exit |
| 14 | `modules/campaigns/prelaunch.tsx` | Simulation against last 7d events |
| 15 | `modules/campaigns/handoff-modal.tsx` | ★ Substrate A + B + both contracts |
| 16 | `modules/campaigns/monitoring.tsx` | Holdout chart + Experiment Agent panel inline |
| 17 | `modules/campaigns/patterns.tsx` | 7 intervention archetypes |
| 18 | `modules/agents/inbox.tsx` | ★ 4 tabs · Opportunities default · Drafts · Recs · Activity |
| 19 | `modules/agents/opportunity-detail.tsx` | ★ Atomic Opportunity card full-width + Agent thread |
| 20 | `modules/agents/drafts.tsx` | List view → opens canvas in agent-draft review mode |
| 21 | `modules/agents/activity.tsx` | Chronological feed |
| 22 | `modules/agents/settings.tsx` | Per-agent enable + Studio Agent "Phase 2" slot |
| – | `modules/explore/stub.tsx` | Nav-only per PRD §7 |

Shared (`modules/_shared/`): `OpportunityCard`, `AgentBadge`, `AgentAttribution`, `AgentReasoningPanel`, `ApproveEditDismiss`, `PredicateComposer`, `ThresholdPlayground`, `AudienceBand`, `HandoffModal`, `MaterialsShelf`, `LatencyBadge`, `FeaturePill`, `Sparkline`, `Histogram`.

### 4.5 Demo flow (PRD §11 + Agentic §10 = 13 steps)

| # | Action | Screen | Earns |
|---|---|---|---|
| 1 | Open Hermes | `00` | Landing |
| 2 | Browse Feature Store, click `consecutive_ranked_losses_streak` | `01 → 02` | Semantic Layer literal |
| 3 | "Use in segment" | `04` | Cross-module flow |
| 4 | Compose predicate, drag threshold slider | `04` | Data-tool register · audience updates live |
| 5 | Save → handoff modal | `06` | **SegmentID + Substrate B** |
| 6 | "Use in campaign" → real-time, add `event_match_end`, cooldown 24h | `10` | Trigger machinery inside campaign |
| 7 | Variants + holdout + journey peek | `13` | Hawkins journey concept visible |
| 8 | Activate → handoff | `15` | **SegmentID + TriggerID + both substrates** |
| 9 | Open monitoring 2 weeks later | `16` | Lift +8.2% measurement |
| 10 | Click `05 Agents` | `18` | Module 5 populated |
| 11 | Open CFM Loss Streak opportunity | `19` | Atomic Opportunity card real |
| 12 | Approve & draft → canvas in review mode | `20 → 04` | Approval contract one click |
| 13 | Build → handoff modal with agent attribution | `06` | "Drafted by Authoring Agent" line |

## 5. Acceptance criteria

Composite of PRD §14 + Agentic §12:

1. All 23 screens render correctly as routed pages.
2. 13-step demo flow walks end-to-end without dead ends.
3. Segment authoring canvas reads as a data tool — sticky audience band, predicate composer dominant, intent collapsed by default.
4. AND-of-OR-groups predicate model visible — multiple groups + OR rows + AND NOT exclusions.
5. Inline threshold playground centerpiece — slider mid-drag captured with live audience update.
6. Handoff modals match architecture verbatim — both `06_seg_handoff` (Substrate B) and `15_cmp_handoff` (Substrate A and/or B).
7. Feature Store makes Semantic Layer tangible — latency badges everywhere, dual-target definitions side-by-side on detail.
8. ≥2 of 3 campaign trigger-type canvas variants designed (real-time + one of scheduled/onetime).
9. Real-time campaign canvas shows trigger predicate alongside audience eligibility — event source + composer + cooldown + frequency cap.
10. ≥3 cross-module routing CTAs working.
11. Visual identity matches Bedrock tokens — serif italic intent, mono technical, deep red accent, amber for anomalies.
12. Catalog data sourced from `Hermes_Demo_Data.md` — feature names, event names, segment IDs, trigger IDs, predicates verbatim.
13. Module 05 lands populated · 9 opportunities + 3 drafts + 2 recommendations across 4 tabs.
14. Opportunity card renders all 6 regions (intent · window/confidence · evidence · proposed · why-now collapsed · approve/edit/dismiss).
15. Approving opportunity routes to canvas in agent-draft review mode with predicate pre-populated.
16. Library rows in `03` and `09` show Author column with ≥1 agent-drafted row visible.
17. Experiment Agent panel renders on `16` with 2 recommendations.
18. Agent attribution line on ≥1 handoff modal in demo flow.
19. Hardcoded data only in web bundle — no fetch calls, no LLM calls, snappy navigation.
20. Crawler `pnpm refresh-cfm-data` produces all 5 fixture JSONs against real `iceberg.cfm_vn`.
21. Crawler step-0 audit produces `infra/trino-crawler/schema-audit.md` confirming table coverage.
22. ~10–15 features served from real Trino-derived distributions; remaining synthesised + badged with reason.
23. `pnpm install && pnpm dev` green; web on 5173, catalog-api on 3001 (latent), query-svc on 3002 (latent).
24. `pnpm build` produces deployable web bundle for the meeting demo.
25. `docs/` populated per CLAUDE.md "Documentation Management" structure.

## 6. Implementation phases (proposed for /ck:plan)

| Phase | Scope | Dep |
|---|---|---|
| **P-1 Bootstrap** | Fork bedrock → hermes; rename `@bedrock/*` → `@hermes/*`; strip Bedrock-only pages from web; fresh `apps/web` TS scaffold; port `theme.jsx` → `theme.tsx` + primitives; verify `pnpm install && pnpm dev` green | – |
| **P-2 Crawler step-0** | Connect Trino client; run schema discovery; write `schema-audit.md` with table list + column types; produce derivation-coverage manifest | P-1 |
| **P-3 Catalog data** | Hand-write `apps/web/src/data/catalog/*.ts` from `Hermes_Demo_Data.md` — 67 features, 47 events, 5+8 segments, 5+ campaigns, 9 opportunities, 3 drafts, 2 recs, 3 activity | P-1 (parallel with P-2) |
| **P-4 Crawler steps 1–5** | Per-feature derivations (T1–T5); audience-count grid for 5 demo predicates; sample player rows; event volumes; segment demographics; commit fixtures to git | P-2 |
| **P-5 Web shell + nav + theme** | App shell, 5 module nav (`05 Agents` rightmost), routing, BrandMark, design tokens, `T.*` primitives, latency-badge component, feature-pill component | P-1, P-3 |
| **P-6 Feature Store module** | `01 library` + `02 detail` — group-by, filter rail, dual-target definition block, 28-bin histogram with p50/p90/p99 markers, lineage tab, used-by tab | P-5, P-4 |
| **P-7 Segments module** | `03 library` + `04 canvas` (AND-of-OR + inline swap + inline threshold playground reading audience-counts.json) + `05 threshold-deep` + `06 handoff modal` + `07 monitoring` + `08 patterns` | P-5, P-4 |
| **P-8 Campaigns module** | `09 library` + 3 canvas variants (`10`/`11`/`12`) + `13 journey` + `14 prelaunch` + `15 handoff modal` + `16 monitoring` + `17 patterns` | P-7 |
| **P-9 Agents module** | `18 inbox` + `19 opportunity-detail` + `20 drafts` + `21 activity` + `22 settings` + cross-cutting changes (Author column on `03` + `09`, attribution on right rail, Experiment Agent panel on `16`, agent-attribution line on handoffs) | P-7, P-8 |
| **P-10 Demo flow validation** | Walk 13 steps end-to-end, fix dead ends, copy validation against PRD verbatim (handoff modal blocks especially) | P-6..P-9 |
| **P-11 Docs + polish** | Populate `docs/` (PDR, codebase-summary, system-architecture, design-guidelines, code-standards, deployment-guide, roadmap); README; final pnpm build green | P-10 |
| **P-12 Backend latency check** | Verify `apps/catalog-api` and `apps/query-svc` still compile after rename; smoke test `pnpm --filter @hermes/catalog-api start:dev`; document post-May-12 wiring path | P-1 (parallel with everything) |

P-2 and P-3 run in parallel after P-1. P-4 unblocks the data-bound canvas screens (P-7 thresholds, P-6 histograms). P-12 is independent and can land any time after P-1.

## 7. Risks & mitigations

| ID | Risk | Mitigation |
|---|---|---|
| R1 | cfm_vn schema reality may not cover all 67 features | Step-0 audit before any derivation. Tier-5 synthesised features with explicit badge. Crawler logs gaps. |
| R2 | Timeline · "all 23 screens + all 67 features" against May 12 (3 days) | Phases ordered so P-1 → P-5 → P-6 → P-7 → P-9 (must-haves) lands first; P-8 should-haves; P-11 polish last. Cut from the tail if behind. |
| R3 | TypeScript migration friction | Web is fresh, not migrated. Only theme tokens and primitive components ported from Bedrock. |
| R4 | VPN dependence at demo | Crawler outputs committed to git. Demo runs from build artifact, no Trino calls. |
| R5 | Bedrock backend modules carry wrong concepts (mappings, master-tables) | Latent — not deleted, not wired. Treat as scaffolding for post-May-12 work. |
| R6 | Visual fidelity drift from Bedrock prototype | `LiveOps Engine.html` + `variations.html` from segment-builder are visual reference. Token-only colors. No new hex. |
| R7 | Handoff modal copy drift from architecture | Mono blocks named workflow names + consumer paths verbatim. PRD §14 acceptance #6 enforces. Validate with ThangLV2 (Substrate B) and Đạt (Substrate A) before May 12. |

## 8. Success metrics

- 13-step demo flow walked end-to-end in May 12 alignment meeting without dead ends.
- ≥10–15 of 67 features showing real Trino-derived distributions on Feature Store detail page.
- All 5 demo predicates have working threshold playgrounds reading real audience counts.
- Engineering reviewers (Hawkins, ThangLV2, Đạt) recognise their architecture in handoff modals without copy explanation.
- LiveOps PMs walk the canvas without asking "what's a Trigger?" — UX framing held.

## 9. Next steps

1. `/ck:plan` invoked with this report as context → produces phase-XX-*.md files in `plans/260509-1355-hermes-platform-prototype/`.
2. `/ck:cook` per-phase implementation following plan output.
3. `/ck:journal` upon completion.

## 10. Unresolved questions

1. **Q1 · Crawler refresh cadence** — manual `pnpm refresh-cfm-data` only for v1, or cron in `scripts/`? *Recommend: manual until post-May-12.*
2. **Q2 · Multi-game scope** — v1 crawler hits cfm_vn only. PRD pilots PTG. Schedule for ptg_vn / nth_vn / tf_vn / cos_vn schema discovery? *Recommend: cfm_vn-only for v1, others queued post-May-12.*
3. **Q3 · Substrate copy validation** — handoff modal mono blocks need 15-min review with ThangLV2 (Substrate B) and Đạt (Substrate A) before May 12 ships per PRD §15.1. *Recommend: schedule before May 11.*
4. **Q4 · Hybrid campaign UI shape** — TF-1 hybrid (Segment seed + Real-time trigger). Adjacent blocks vs toggleable views in `10_cmp_canvas_realtime`? *Recommend: adjacent blocks, revisit if layout unwieldy.*
5. **Q5 · Derived-segment naming** — `cmp-cfm-407_variant_A_responders` (technical) or *"Pass Stuck · Variant A responders"* (display)? *Recommend: both side-by-side per PRD pattern.*
6. **Q6 · Timeline against May 12** — "all 23 + all 67" plan ≈ 7-10 dev days vs 3 calendar days available. Plan ships complete spec; demo-day cut list = P-8 should-haves (`11`, `12`, `13`, `14`, `17`) + P-11 polish if compressed.
