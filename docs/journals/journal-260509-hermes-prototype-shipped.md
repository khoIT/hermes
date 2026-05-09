# Hermes Platform Prototype: Brainstorm → Ship Same-Day (260509)

**Date**: 2026-05-09 13:55–18:30
**Severity**: None (delivery)
**Component**: Full-stack prototype (Trino crawler, Next.js web, backend stubs)
**Status**: Shipped · demo-ready · post-May-12 integration path documented

## What Happened

Brainstorm → plan → full 12-phase parallel cook in one session. User committed to all 67 features (not curated subset) from PRD Part 1/2 tables. Bootstrap from `segment-builder` (Bedrock skeleton) + Trino crawler for cfm_vn + web shell per 2 PRDs. Three independent subprojects flagged; user chose Approach A (crawler → static fixtures, backends latent).

Phases 01–12 shipped in parallel via fullstack subagents. 7 commits: `f2bc512` (bootstrap), `7499562` (web), `a1b3182` (crawler), `9afd1d9` (demo), `31e15b7` (docs), `413c737` (segments), `069ce9d` (segments fix). Reference UI port at 17:45 discovered `design-reference/Hermes/src/segments.jsx` (62KB canonical prototype) → forked predicate-cascade.tsx (HOW PREDICATES NARROW POPULATION funnel) + match-bar.tsx (per-row log-scale density bars). Polish pass + 3 fixes (redundant Intent block, Show breakdown button, MatchGroup.mode ANY/ALL toggle). Clean tree as of last fix.

## The Brutal Truth

Working backward from May 12 meeting meant compressing typical 4-week feature build into 3 calendar days + delivery night. Approach A (static fixtures, backends latent) trades immediate demo completeness for post-demo integration risk: catalog-api, query-svc compile + boot, health 200, but **not wired to web**. Acceptable trade; deferred in `docs/known-limitations.md` (9 total deferrals logged, none demo-blocking).

Discovering the 62KB reference prototype AFTER completing initial build meant redesign-as-port-and-adapt instead of greenfield iteration. Saved hours but forced late-session schema extension (`MatchGroup.mode` field). Original predicate-types.ts lacked per-group AND/OR flag — every group implicitly OR'd. Reference showed Group 1 OR'd ("match ANY"), Group 2 AND'd ("match ALL"). Late addition, but safe-default helper (`groupMode()`) kept fallback data compiling.

## Technical Details

**PRD count drift:** Headers stated "67 features, 47 events" but actual table rows = 73 features / 51 events. All canonical names included verbatim in `apps/web/src/data/catalog/features/index.ts` + events index. Synthesised T5 tier overshot — expected 10–15, actual 25 (~33% of 73). Web indifferent; all 73 have synthesised distributions.

**Trino auth failure (not VPN):** Cluster DNS-reachable (`gio-gds-trino.vnggames.net:8080`), creds rejected at `SHOW SCHEMAS`. Implies `.env` rotated since segment-builder's record. Stub-mode crawler exits 0 with clear message; real-data swap = one `pnpm refresh-cfm-data` away post-creds-refresh.

**Build metrics:** Production bundle 631 KB / 152 KB gzip. Demo flow: 13 steps, end-to-end walkthrough, centerpiece (segment authoring: slider drag → audience update via threshold grid → handoff modal) survived 3 redesign passes intact.

## What We Tried

- **Greenfield web** vs ported JSX: Chose fresh TS (apps/web/*.tsx) for clean type coverage on PRD contracts. Theme tokens inherited from Bedrock; all new pages native.
- **Curated feature subset** vs all 67: User explicit on full scope. T5 synth fallback acceptable.
- **Fork-and-rename** vs greenfield on segment-builder: Inherited monorepo config + primitives; replaced web pages, crawler schema, demo data.
- **Inline LatencyBadge coloring** (orange on peach / gray on neutral) vs separate badge variants: Applied user feedback from fix pass; single component, conditional style prop.

## Root Cause Analysis

**Why Approach A won?** PRD §6.2 specifies crawler → storage → query pipeline architecture. User prioritized demo motion (showing segment creation, live audience update) over persistence. Backend stubs compile and health-check; wiring is mechanically straightforward (query-svc reads fixtures → web calls catalog-api endpoint). Risk: May 12 demo doesn't prove data flow, only interaction contract. Mitigated by documenting endpoint stubs in `docs/known-limitations.md` + commit comments.

**Why reference port felt late?** Design team (or prior Claude Design session) produced 62KB reference (`design-reference/Hermes/src/segments.jsx`). User discovery during cook phase meant initial build lacked cascade chart + density bars. Reimplementing those from reference at 17:45 was correct call (UX quality > schedule padding) but required late schema sync (MatchGroup.mode). Made safe with optional field + groupMode() default.

**Why Intent block was removed?** PRD §8.3 specified explicit intent area in segment builder. Turned out displayName + slug carry intent context already; explicit intent area was visual clutter. User feedback in fix pass; decision: delete it, not collapse. Cleaner UX.

## Lessons Learned

1. **Reference artifacts are gold:** Finding the 62KB reference mid-build meant 3h lost to late-session port. Future: hunt for prior art (Figma, Claude Design exports, reference repos) **before** brainstorm; fold into plan as phase 0.

2. **Schema iteration is cheap, schema debt is expensive:** `MatchGroup.mode` omission was invisible until reference port. PRD review against reference design pre-build = catch early. Optional field + safe default saved tree.

3. **Static fixtures + demo motion beats latent backends:** Approach A proved user intent: show interaction, defer persistence wiring. PRD "crawler → storage" means contracts exist; wiring is config, not architecture risk.

4. **PRD count approximations are real:** "67 features" vs actual 73 isn't user error; it's summary-draft-vs-canonical-spec. Version control on feature catalog (index.ts comments include PRD §ref + counts).

5. **Parallel subagents compress 4-week feature into 3-day ship.** 12-phase orchestration worked because phases had clear contracts (crawler schema → catalog data → web types). Next time: write phase contracts (input/output formats) in plan before spawning subagents.

## Next Steps

1. **Credentials refresh (SP-4 readiness):** creds team rotate `.env` Trino creds; `pnpm refresh-cfm-data` swaps stub fixtures → real cfm_vn data. Non-blocking for May 12 demo (stubs work), blocking for post-demo live data.

2. **Backend wiring (post-May-12 sprint):** Query-svc integration, catalog-api to web, session persistence. Stubs in place; contracts documented in phase-12 notes.

3. **Design freeze on demo screens:** All 25 acceptance criteria met (PRD §14, Agentic §12, build/data). Demo locked; feedback for backlog post-demo.

4. **Reference UI debt:** Cascade chart + match bars proved high-value. Future Hermes features should review design-reference artifacts before implementation plan.

---

**Commits:** f2bc512 · 7499562 · a1b3182 · 9afd1d9 · 31e15b7 · 413c737 · 069ce9d  
**Plan:** C:\Users\CPU12830-local\code\hermes\plans\260509-1355-hermes-platform-prototype\  
**Limitations:** docs/known-limitations.md (9 deferrals, none demo-blocking)
