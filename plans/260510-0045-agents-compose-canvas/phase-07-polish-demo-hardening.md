---
phase: 7
title: "Polish & Demo Hardening"
status: pending
priority: P2
effort: "4h"
dependencies: [1, 2, 3, 4, 5, 6]
---

# Phase 7: Polish & Demo Hardening

## Overview

Take the canvas from "loss-streak works" to "any of 5 playbooks runs in 90s on stage." Fill out the remaining 4 playbook templates, harden the fallback flow, dry-run the demo, update demo script docs.

## Requirements

- **Functional:**
  - 4 additional playbooks fully scripted: `whale-dormancy`, `stuck-on-first-match`, `7-day-non-payers`, plus one more (selected during phase based on what plays best)
  - Each playbook has: keywords, proposedFeatures (3 rows), segmentMatch threshold, campaignTemplate (event source + action card + samples), 2–3 scripted refinement replies, 4R tag + alignment
  - Fallback flow when no playbook matches: agent message *"I don't recognize that pattern yet — try one of these"* with 5 chips (4 playbook starters + "browse opportunities →")
  - Stage transition animations (200ms ease-in-out collapse / expand)
  - Loading shimmers for audience-count fetch (replace plain "computing…" text)
  - Empty-state visuals for stages before they're reached (placeholder serif italic text *"awaiting features…"*)
  - Demo dry-run logged: timing for each playbook, friction points, fixes
  - Update `docs/feature-store-demo-script.md` with a new section "Beat 5 — Compose canvas" (or add it as a separate doc)
- **Non-functional:**
  - 90-second target for canonical loss-streak flow
  - All 5 playbooks pass typecheck and run end-to-end
  - No console errors during demo flow

## Related Code Files

- **Modify:**
  - `apps/web/src/data/catalog/agents/compose-playbooks.ts` — fill out 4 stub playbooks
  - `apps/web/src/modules/agents/compose/_components/intent-input.tsx` — fallback message UI
  - `apps/web/src/modules/agents/compose/_components/stage-stepper.tsx` — animations
  - `apps/web/src/modules/agents/compose/_components/audience-count-card.tsx` — shimmer
  - `apps/web/src/modules/agents/compose/_components/stage-segment.tsx` — empty state
  - `docs/feature-store-demo-script.md` — add Compose canvas section (or `docs/agents-compose-demo-script.md` if it grows large)
- **Create (optional):**
  - `docs/agents-compose-demo-script.md` if compose section gets long enough to warrant its own doc

## Implementation Steps

1. **Whale dormancy playbook.** Features: `last_login_days_ago ≥ 14`, `lifetime_revenue_local ≥ 500000`, `session_count_7d == 0`. Existing match: none (nullish), suggest creating new draft. Campaign template: scheduled refresh, gem-discount push. 4R tag: reactivate · 88%.
2. **Stuck on first match (FTUE).** Features: `tutorial_completed = false`, `account_age_hours ≥ 1`, `match_count_total ≤ 1`. Match: none. Campaign: real-time IAM with onboarding hint. 4R: recruit · 90%.
3. **7-day non-payers (conversion push).** Features: `tenure_days >= 7 AND tenure_days <= 14`, `is_paying_user_lifetime = false`, `session_count_7d >= 3`. Match: scan; likely none. Campaign: scheduled, starter pack offer. 4R: revenue · 84%.
4. **Fifth playbook — pick during phase.** Likely candidates: "high-pLTV low-engagement", "lapsed VIP last touch", or "regional spike". Choose what demos with cleanest data.
5. Fallback message in `intent-input.tsx`: when `keywordMatcher` returns null and user submits, render an inline agent reply with chips. Chips → re-fill textarea + auto-submit.
6. Stage-stepper animations: `<details>` semantic with CSS height transition or framer-motion (if already in deps). Fallback: instant collapse, acceptable.
7. Loading shimmers: replace text "computing…" with skeleton rectangles of approximate final size. Match existing Feature Store loading state visual language.
8. Demo dry-run script. Run all 5 playbooks back-to-back, time each, note friction. Fix any sub-90s playbook that takes >120s.
9. Write demo script section. Format: *"Beat N · Compose canvas"*, ~30 lines, mirrors existing demo-script.md style. List 5 playbook prompts as a chooser.

## Success Criteria

- [ ] All 5 playbooks fully scripted in `compose-playbooks.ts`
- [ ] Each playbook runs end-to-end (intent → stage 1 → stage 2 → stage 3 → handoff) without console errors
- [ ] Fallback message renders for input *"hello world"* with 5 chips
- [ ] Stage transitions animate smoothly (no jank)
- [ ] Audience-count card shows skeleton while fetching
- [ ] Demo script doc updated with Compose section
- [ ] Loss-streak canonical flow runs in ≤90 seconds, measured with dry-run
- [ ] No regressions in earlier-phase functionality
- [ ] `pnpm typecheck` and `pnpm build` pass

## Risk Assessment

- **Risk:** Whale-dormancy / FTUE features don't exist in current catalog. **Mitigation:** check feature catalog at start of phase; substitute closest available feature; document substitution in playbook spec.
- **Risk:** Animations introduce flicker / jank. **Mitigation:** measure with React Profiler; if >16ms, drop to instant transitions.
- **Risk:** Demo dry-run reveals UX confusion (e.g. user doesn't realize stage 1 is collapsible). **Mitigation:** add "Edit" affordance + tooltip on collapsed stage cards; this is the most likely friction point.
- **Risk:** Adding more playbooks bloats `compose-playbooks.ts` past readable size. **Mitigation:** if it crosses 700 LOC, split per-playbook into `_playbooks/{id}.ts` with a barrel export. Mention in plan; not strict.

## Notes

- Post-May-12 work (deferred from this plan): real LLM integration, multi-problem sessions, persistence across reloads, mobile layout, "Recent Compose sessions" history UI in the inbox
- Demo coverage: phases 1–6 give canonical demo; phase 7 makes it bulletproof and lets the demoer pick any of 5 starting prompts on stage
