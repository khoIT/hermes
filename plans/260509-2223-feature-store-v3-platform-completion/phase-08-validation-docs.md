---
phase: 8
title: "Validation + docs"
status: pending
priority: P1
effort: "3h"
dependencies: [2, 3, 4, 5, 6, 7]
---

# Phase 08: Validation + Docs

## Overview

Extend `scripts/validate-feature-pipeline.cjs` with the new endpoints + multi-game + audience-count assertions. Walk the demo flow with all 4 work-items live. Update docs.

## Implementation Steps

1. Extend validator to assert ~30 properties:
   - All Phase 01 endpoints respond 200 for sample features.
   - `feature_pipeline_runs` has rows after a refresh.
   - `feature_values` has `game_id` populated (multi-game).
   - `/audience/count` returns count + sampledUids for at least 3 predicate shapes.
   - `mappings/master-tables` directories absent.
2. New report: `personas-coverage-audit.md` — per persona, which detail panels render correctly per source (real / hybrid / synth) with screenshots noted.
3. Walk the 13-step demo flow + 5-step Segments composer flow with live audience-count.
4. Update docs:
   - `docs/system-architecture.md` §9 — Feature Store v3 status; query-svc audience-count diagram.
   - `docs/deployment-guide.md` — new `--game=X` flag, query-svc dev command, validate script.
   - `docs/project-roadmap.md` — Phase 2 closeout; mark all 4 work items complete.
   - `docs/codebase-summary.md` — new persona-panels structure.
   - `README.md` — link to v3 plan + new commands.

## Success Criteria

- [ ] 30+ validator assertions pass.
- [ ] Personas audit captures a representative panel per persona-source matrix.
- [ ] Demo flow walks end-to-end with live data.
- [ ] All 5 docs updated with Phase 2 closeout.
- [ ] Plan status marked `completed`.

## Risk

- Demo flow regression risk after multi-game crawler changes data shape. Mitigation: smoke before each merge.
