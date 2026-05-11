---
phase: 7
title: "Docs + Validation"
status: complete
priority: P1
effort: "3h"
dependencies: [3, 4, 5, 6]
---

# Phase 7: Docs + Validation

## Context Links

- Parent plan: [../plan.md](../plan.md)
- All prior phases (1-6)
- Existing docs: `docs/project-overview-pdr.md`, `docs/codebase-summary.md`, `docs/system-architecture.md`, `docs/design-guidelines.md`, `docs/demo-known-limitations.md`
- PRD source folder: `design-reference/Hermes/uploads/`

## Overview

Two deliverables:
1. **Addendum PRD** — `docs/feature-store-v2-prd.md` capturing what changed in v2, the rationale, the new schema/contracts, and acceptance criteria. Anchors the next code review and Phase 2 (post-May-12) wiring.
2. **End-to-end validation** — typecheck, build, smoke-test the original 13-step demo flow + new flow (register → use → handoff). Update the limitations doc with anything deferred.

This phase is the gate. Nothing ships without all 12 acceptance criteria green.

## Key Insights

- Parent prototype's PRD is the design baseline. v2 is an addendum, not a rewrite — explicitly call out what's different vs the original PRD §6 and §10.
- The two-audience principle (PMs see plain-English; engineers see substrate IDs) is the load-bearing rule. The validation step explicitly verifies both lenses.
- The original 13-step demo flow must still work — these are the May 12 alignment-meeting steps. The new "register" flow extends it but does not replace it.
- Limitation log captures honest deferrals: live drift monitoring, per-substrate parity tests, real backend wiring all remain Phase 2 of the parent plan.

## Requirements

**Functional**

### 7.1 PRD addendum (new doc)
Single file `docs/feature-store-v2-prd.md`, ~400 lines max. Sections:
- Context — pointer to parent PRD §6 and what's superseded
- Two-audience contract restated
- Schema deltas (games[], platform, propensityModel, analytics) with examples
- Substrate label policy (Realtime / Batch warm / Batch cold for PMs; Substrate A/B for engineers; the 5 surfaces where each applies)
- Detail page contract (4 tabs, 6 analytics panels, propensity model card)
- Register page contract (form fields, validation, handoff modal)
- Library contract (stat strip, filters, group-by, sort)
- Segment wiring contract (5 surfaces; predicate row chip rules)
- Acceptance criteria (12 — replicated below)
- Open questions (carry forward whatever lands in scope)

### 7.2 Existing doc updates
- `docs/codebase-summary.md` — add Feature Store v2 entry under "Modules"; describe new files in Phase 1-6 component tree
- `docs/system-architecture.md` — § Feature Store: note the v2 attribution model + propensity-feature class. Latency badge policy section.
- `docs/design-guidelines.md` — add the game-color token table; add the substrate-label policy ("Realtime/Batch warm/Batch cold for PMs, Substrate A/B for engineers")
- `docs/demo-known-limitations.md` — add v2 deferrals (see below)

### 7.3 Validation
Run in this order:
1. `pnpm typecheck` — 0 errors
2. `pnpm build` — green across all workspaces
3. Manual smoke pass over the 13-step demo flow (parent PRD §11) — every step still works visually
4. Manual smoke pass over the new "register" flow (entry from library → form → handoff → detail → use in segment)
5. Lint pass — `pnpm lint` if the parent prototype has it; otherwise spot-check

### 7.4 Acceptance criteria (12)

1. Substrate copy: PM-facing surfaces show Realtime / Batch warm / Batch cold; handoff modals + lineage detail show Substrate A/B verbatim
2. Owner avatar removed from all surfaces (FS detail header, library row card, picker card, swap popover, predicate row pill, features-in-use rail)
3. Games chip cluster visible on every surface where features surface
4. Platform · Propensity chip on cross-game features (3 platform features minimum)
5. Propensity Model card renders on detail page Overview tab when applicable
6. Detail page Analytics tab renders 6 panels: Health · Freshness · Distribution-over-time · Top consuming campaigns · Online request rate · Data quality
7. Health snapshot card visible on detail right rail across all tabs
8. Library filter rail has Games + Platform-only; group-by has Game + Platform; sort has 4 strategies
9. Register page (`/feature-store/new`) reachable, validates, submits, opens handoff modal, navigates to detail
10. Segment composer: pickers + swap + features-in-use + predicate row + library all show games attribution
11. Original 13-step demo flow walks end-to-end without regressions
12. `pnpm typecheck && pnpm build` clean

### 7.5 Limitation log additions (`docs/demo-known-limitations.md`)

| Issue | Workaround | Timeline |
|-------|-----------|----------|
| Newly-registered features persist only for the session | Reload returns to base catalog; expected for offline demo | Phase 2 (catalog-api wiring) |
| Drift score values are synthesised | Real drift requires the parity-monitoring service from PRD §10 follow-ups | Phase 2 |
| Top consuming campaigns numbers are synth for non-CFM games | CFM uses real data; others derived from campaign-requirements doc + plausible curves | Phase 2 multi-game crawler |
| Edit Definition CTA on detail page is no-op | Original PRD §13 deferral preserved; only "Register similar" is wired | Phase 2 |
| Propensity model AUC bands are illustrative | Real values pulled from ML pipeline metadata in Phase 2 | Phase 2 ML integration |
| Per-substrate parity test surface not built | Detail page surfaces drift score but parity-test results panel deferred | Phase 2 (post-May-12) |

## Architecture

```
Validation flow:
┌─ Phase 1-6 work merged ─┐
        ▼
   pnpm typecheck ── fail ─► fix issues, restart
        │ pass
        ▼
   pnpm build ─────── fail ─► fix issues, restart
        │ pass
        ▼
   13-step demo smoke
        │ pass
        ▼
   Register-flow smoke
        │ pass
        ▼
   Docs updated
        │
        ▼
   Acceptance grid green ─► PHASE COMPLETE
```

## Related Code Files

**Modify**
- `docs/codebase-summary.md`
- `docs/system-architecture.md`
- `docs/design-guidelines.md`
- `docs/demo-known-limitations.md`

**Create**
- `docs/feature-store-v2-prd.md`

**No code changes** in this phase — purely docs + validation.

## Implementation Steps

1. **Write PRD addendum.** `docs/feature-store-v2-prd.md` per section list above. Cap at 400 lines. Cite parent PRD sections explicitly. Include schema TypeScript snippets from Phase 1.
2. **Update codebase-summary.** Append Feature Store v2 module entry. List new files (analytics panels, register page, chip components). Update file count from Phase 11 (parent plan).
3. **Update system-architecture.** § Feature Store: add the v2 attribution model paragraph. Add the substrate-label policy table.
4. **Update design-guidelines.** Add: game color tokens (CFM red, PT blue, NTH green, TF amber, COS pink, PG indigo); platform brand red `#f05a22`; substrate-label two-audience policy.
5. **Update demo-known-limitations.** Append the 6 v2 deferrals from §7.5 above.
6. **Typecheck.** `pnpm typecheck` — fix anything red.
7. **Build.** `pnpm build` — fix anything red.
8. **13-step demo smoke.** Walk through parent PRD §11 — verify every step still works. Especially:
   - Step 2: feature detail — new tabs, new chips, no owner
   - Step 4: predicate composing — new picker cards, new predicate row pills
   - Step 5: handoff — Substrate B copy unchanged
9. **Register-flow smoke.** Library → "Register a new feature" → fill form → submit → handoff modal → "View feature" → detail page → "Use in segment" → segment canvas with new feature in predicate.
10. **Acceptance grid.** Tick off all 12 criteria. Any red → loop back to the relevant phase.
11. **Final commit.** Conventional commit on master: `feat(feature-store): v2 redesign with games attribution + propensity models`.

## Todo List

- [ ] Write `docs/feature-store-v2-prd.md`
- [ ] Update `docs/codebase-summary.md`
- [ ] Update `docs/system-architecture.md`
- [ ] Update `docs/design-guidelines.md`
- [ ] Update `docs/demo-known-limitations.md`
- [ ] `pnpm typecheck` clean
- [ ] `pnpm build` clean
- [ ] 13-step demo smoke pass
- [ ] Register-flow smoke pass
- [ ] All 12 acceptance criteria green
- [ ] Final commit

## Success Criteria

- [ ] `docs/feature-store-v2-prd.md` exists, ≤400 lines, covers all 9 sections
- [ ] 4 existing docs updated with v2 content
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` exits 0
- [ ] All 13 parent-PRD demo steps walk without regression
- [ ] Register flow walks end-to-end (library → form → modal → detail → segment)
- [ ] All 12 acceptance criteria from §7.4 green
- [ ] Limitation log includes 6 v2 deferrals

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Acceptance criteria 11 (no demo regressions) reveals a Phase 2-6 bug | Loop back to that phase, fix, re-run validation. Plan budget includes 1-2 fix loops. |
| New PRD doc grows past 400 lines | Trim by linking back to parent PRD sections instead of repeating. Goal is "diff" not "spec." |
| Smoke test misses a hidden regression (e.g. a route 404 from accidental import) | After typecheck/build, run `pnpm dev` and click every route in the nav. ~10 min coverage. |
| Hot-reloaded register-flow features survive across smoke runs and pollute the test | Refresh the page between smoke runs; in-memory state resets. |

## Security Considerations

- PRD addendum should not include real player UIDs or any secrets. Use the existing demo data placeholders.
- Validate that no `.env` content leaked into the docs during edits.

## Next Steps

This is the final phase. After acceptance:
- Set parent plan back to active (it's already completed; v2 is a follow-on)
- Optional: write a journal entry via `/ck:journal` capturing what changed and why
- Defer to Phase 2 of the parent plan (May 13–August) for live backend wiring of the new schema fields
