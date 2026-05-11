---
phase: 10
title: "Demo Flow Validation"
status: pending
priority: P1
effort: "3h"
dependencies: [6, 7, 8, 9]
---

# Phase 10: Demo Flow Validation (13-step end-to-end walkthrough)

## Context Links
- PRD_Hermes_Design.md §11 (10-min demo flow), §14 (12 acceptance criteria)
- PRD_Hermes_Agentic.md §10 (4-min agent demo flow), §12 (10 acceptance criteria)
- Brainstorm §5 (25-criteria composite acceptance)

## Overview
Walk the full 13-step demo end-to-end. Fix dead ends. Validate substrate copy verbatim against PRDs. Validate cross-module routing. Capture screenshots for the 5 load-bearing moments (steps 5, 8, 9, 11, 13). Run the full 25-criteria acceptance gate.

## Key Insights
- This phase is *not* a feature build — it's a validation gate. Anything missing surfaces here and gets fixed in the corresponding earlier phase.
- 5 load-bearing moments capture (per PRD §11 + Agentic §10):
  - Step 5: SegmentID handoff modal — Substrate B verbatim
  - Step 8: Campaign handoff modal — Substrate A + B (hybrid)
  - Step 9: Monitoring shows lift +8.2%
  - Step 11: Atomic Opportunity card full-width
  - Step 13: Handoff with agent-drafted attribution
- Substrate copy validation requires PRD verbatim — `consumerPath` strings, workflow names, evaluator function refs. PRD §15.1 flags review with ThangLV2 (Substrate B) and Đạt (Substrate A) before May 12.

## Requirements
**Functional**
- 13-step demo flow walks end-to-end without:
  - Dead-end routes (404)
  - Missing components (empty divs)
  - Console errors
  - Missing copy / Lorem ipsum / TODO strings
- All 25 acceptance criteria from brainstorm §5 verified.
- Screenshots for 5 load-bearing moments saved to `docs/demo-screenshots/`.

**Non-functional**
- Demo runs against `pnpm build` output (not dev mode) — verifies production bundle works.
- All routes respond <200ms (static fixtures, should be instant).

## 13-step demo flow checklist
| # | Action | Screen | Validates | ✓ |
|---|---|---|---|---|
| 1 | Open Hermes | `/` (00) | Landing renders, nav 5 tabs visible | ☐ |
| 2 | Browse Feature Store, click `consecutive_ranked_losses_streak` | `/feature-store` → `/feature-store/consecutive_ranked_losses_streak` | Library 67 rows, dual-tier badge on detail, side-by-side definitions | ☐ |
| 3 | Click "Use in segment" | `/segments/new?seedFeature=...` | Canvas opens with row 1 pre-populated | ☐ |
| 4 | Drag threshold slider | (canvas inline playground) | Slider mid-drag updates audience number, matched-region color sweeps | ☐ |
| 5 | Click "Build segment" → handoff modal | (modal over canvas) | **Substrate B verbatim copy**, SegmentID minted, 4 step rows | ☐ |
| 6 | Click "Use in campaign" → real-time, add `event_match_end`, cooldown 24h | `/campaigns/new/realtime?seedSegment=...` | Trigger type real-time selected, audience block populated, event source selected, predicate composer with mixed-latency banner | ☐ |
| 7 | Walk variants + holdout + journey peek | (canvas blocks visible) → `/campaigns/.../journey` | Action variants A/B/holdout 45/45/10, holdout block with sensitivity copy, journey graph readable | ☐ |
| 8 | Click "Activate · 5% rollout" → handoff modal | (modal) | **Substrate A + B blocks both rendered for hybrid**, CampaignID + TriggerID + SegmentID | ☐ |
| 9 | Open Campaign monitoring | `/campaigns/cmp-cfm-407` | Lift +8.2% headline, holdout vs treatment chart, cross-link badges to TriggerID + SegmentID | ☐ |
| 10 | Click `05 Agents` nav tab | `/agents` | Inbox lands populated 9 opportunities | ☐ |
| 11 | Open CFM Loss Streak opportunity | `/agents/op/ag-op-1042` | OpportunityCard 6 regions, Evidence panel expanded, Agent thread visible | ☐ |
| 12 | Click "Approve & draft" → canvas in review mode | `/segments/new?from=draft-pass-stuck-variant-b` | Banner replaces intent ribbon, predicate pre-populated | ☐ |
| 13 | Click "Build segment" → handoff with agent attribution | (modal) | Agent-attribution line above "What happens next": "Drafted by Authoring Agent · approved by Khoi · thread #ag-1042" | ☐ |

## 25-criteria acceptance gate
Composite from PRD §14 (12) + Agentic §12 (10) + 3 build/data criteria:

**Frontend & flow (1-12)** per PRD §14:
- [ ] 1. All 23 screens render correctly (10 must-have + should-have + nice-to-have)
- [ ] 2. 13-step demo flow walks end-to-end
- [ ] 3. Segment canvas reads as data tool not brief
- [ ] 4. AND-of-OR-groups predicate visible (≥1 screen with multi-group + OR + AND NOT)
- [ ] 5. Inline threshold playground centerpiece (slider mid-drag captured)
- [ ] 6. Handoff modals match architecture verbatim (both segment + campaign)
- [ ] 7. Feature Store makes Semantic Layer tangible (latency badges + dual-target side-by-side)
- [ ] 8. ≥2 of 3 campaign trigger-type variants designed
- [ ] 9. Real-time canvas shows trigger predicate alongside audience eligibility
- [ ] 10. ≥3 cross-module routing CTAs working
- [ ] 11. Visual identity matches Bedrock tokens (serif italic / mono / deep red / amber)
- [ ] 12. Catalog data sourced from Hermes_Demo_Data.md verbatim

**Agent layer (13-19)** per Agentic §12:
- [ ] 13. Module 05 nav tab lands rightmost with active-route highlighting
- [ ] 14. Inbox renders 9 opportunities + 3 drafts + 2 recommendations across 4 tabs
- [ ] 15. OpportunityCard renders 6 regions
- [ ] 16. Approve routes to canvas in agent-draft review mode with predicate pre-populated
- [ ] 17. Library Author column shows ≥1 agent-drafted row on `03` and `09`
- [ ] 18. Experiment Agent panel on `16` with 2 recommendations + 3 CTAs
- [ ] 19. Agent attribution line on ≥1 handoff modal

**Build & data (20-25)** specific to this prototype:
- [ ] 20. Crawler `pnpm refresh-cfm-data` produces all 5 fixture JSONs from real cfm_vn
- [ ] 21. `infra/trino-crawler/schema-audit.md` exists confirming table coverage
- [ ] 22. ≥10-15 features from real Trino data; rest synthesised + badged
- [ ] 23. `pnpm install && pnpm dev` green
- [ ] 24. `pnpm build` produces deployable web bundle
- [ ] 25. `docs/` populated per CLAUDE.md structure (deferred to P-11)

## Implementation Steps
1. Run `pnpm build`. Serve dist via `pnpm start`.
2. Open browser, walk all 13 demo steps in order. For each step:
   - Note any dead end / 404 / missing component / wrong copy
   - Capture screenshot if step is load-bearing (5, 8, 9, 11, 13)
3. Cross-check substrate copy against PRD §8.7 + §9.9. Diff line-by-line. Any mismatch → fix in P-7 / P-8 handoff modals.
4. Cross-check OpportunityCard regions against Agentic §4 ASCII spec.
5. Cross-check 25 criteria — for each fail, identify owning phase, file fix.
6. Re-run after fixes until all green.
7. Save screenshots to `docs/demo-screenshots/` with kebab-case names: `step-05-segment-handoff-substrate-b.png` etc.
8. Test demo flow on a second browser (Chrome + Firefox) to catch flexbox/grid quirks.
9. Test demo flow at common laptop resolutions (1440×900, 1920×1080).
10. Document any deferred / known-limitation items in `docs/demo-known-limitations.md`.
11. Commit: `test(demo): validate 13-step demo flow + 25-criteria acceptance gate`.

## Todo List
- [ ] `pnpm build && pnpm start` — production bundle test
- [ ] Walk demo steps 1-13 in order
- [ ] Diff substrate copy against PRD §8.7 + §9.9
- [ ] Validate OpportunityCard regions against Agentic §4
- [ ] Run 25-criteria checklist
- [ ] Capture 5 load-bearing screenshots
- [ ] Cross-browser test (Chrome + Firefox)
- [ ] Cross-resolution test
- [ ] Document known limitations
- [ ] Commit checkpoint

## Success Criteria
- [ ] All 13 demo steps walk end-to-end without errors
- [ ] All 25 acceptance criteria checked green
- [ ] 5 load-bearing screenshots saved
- [ ] No console errors during demo walk
- [ ] No "TODO" / "Lorem" / placeholder strings in any screen reachable by demo flow
- [ ] Substrate copy verbatim against PRD on both handoff modals
- [ ] Demo runs from `pnpm build` artifact (production bundle, not dev mode)

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Substrate copy drift discovered late | Centralised in `components/handoff-modal-copy.ts` (P-5); diff against PRD verbatim |
| Cross-module routing breaks under URL state changes | Test all "Use in X" CTAs explicitly in demo flow |
| Production bundle breaks where dev mode worked | Always test `pnpm build` not just dev; this phase forces it |
| Demo discovers a missing feature requiring re-architecture | Time-box fixes to 30 min each; if larger, defer to known-limitations and document |
| ThangLV2 / Đạt unavailable for substrate copy review pre-May-12 | Best-effort verbatim match against PRD §8.7 + §9.9 (which they already reviewed) |

## Security Considerations
- Production bundle should not embed Trino creds — verify `.env` not committed and `vite build` doesn't pull `import.meta.env.TRINO_*`.
- Demo screenshots saved to `docs/` — verify no real player UIDs or PII visible.

## Next Steps
- P-11 docs polish (add demo-known-limitations.md, demo-screenshots references).
- May 12 alignment meeting: Khoi runs the 13-step walkthrough live.
