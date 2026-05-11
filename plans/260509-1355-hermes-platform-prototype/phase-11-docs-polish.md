---
phase: 11
title: "Docs + Polish"
status: pending
priority: P2
effort: "3h"
dependencies: [10]
---

# Phase 11: Docs + Polish

## Context Links
- CLAUDE.md "Documentation Management" section — required `docs/` structure
- Brainstorm §5 acceptance #25
- Demo screenshots from P-10 in `docs/demo-screenshots/`

## Overview
Populate `docs/` per CLAUDE.md required structure. Write README. Final visual polish pass on screens. Final `pnpm build` green.

## Key Insights
- CLAUDE.md mandates 7 specific docs files. Don't invent extras.
- Each doc <800 LOC per session hook (`docs.maxLoc`).
- Roadmap.md is forward-looking — captures post-May-12 phase 2 work explicitly.
- Codebase-summary.md is the entry-point for new contributors / future Claude sessions.

## Requirements
**Functional**
- `docs/project-overview-pdr.md` — Product requirements summary derived from PRDs.
- `docs/code-standards.md` — TS conventions, file naming, module size rules, theme token usage.
- `docs/codebase-summary.md` — High-level architecture overview, module map, where to find things.
- `docs/design-guidelines.md` — Visual language summary (tokens, fonts, spacing, components) — derived from Bedrock + Hermes PRD §4.
- `docs/deployment-guide.md` — How to run, build, deploy. Crawler refresh procedure. VPN requirement.
- `docs/system-architecture.md` — Two-substrate architecture overview, data flow, latent backends, crawler pipeline.
- `docs/project-roadmap.md` — Phase 1 (this) marked complete; Phase 2 items: live backend wiring, Studio Agent, multi-game crawler, real LLM integration.
- `docs/demo-known-limitations.md` (from P-10) finalised with v1 caveats.
- `README.md` at root — onboarding, prereqs, run/build/deploy commands, repo layout.

**Non-functional**
- Each doc passes manual review by reading top to bottom — clear, concise, accurate.
- Code blocks include actual commands that work.
- Cross-links between docs use relative paths.

## Architecture
```
docs/
├── project-overview-pdr.md         derived from PRDs §1-3
├── code-standards.md
├── codebase-summary.md             ★ entry point for new sessions
├── design-guidelines.md
├── deployment-guide.md
├── system-architecture.md          ★ two-substrate overview
├── project-roadmap.md
├── demo-known-limitations.md       from P-10
└── demo-screenshots/               5 load-bearing moments
README.md                            root-level onboarding
```

## Related Code Files
**Create**
- All `docs/*.md` files (P-1 created stubs; this fills content)
- Root `README.md`

**Modify**
- `package.json` — verify scripts documented match deployment-guide.md
- `apps/web/src/modules/_shared/` — final polish pass (any TODO comments removed)

## Implementation Steps
1. `docs/project-overview-pdr.md`:
   - Hermes mission statement (from PRD §1)
   - Two architectural contracts (SegmentID, TriggerID) summary
   - 5 modules description
   - Audience (Studios + engineering reviewers)
   - Acceptance criteria summary
2. `docs/codebase-summary.md`:
   - Repo layout (apps/, packages/, infra/, docs/)
   - Where each PRD screen lives (table mapping ID → file)
   - Where catalog data lives
   - Where crawled data lives
   - How to add a new feature / segment / campaign
   - Latent backend status
3. `docs/system-architecture.md`:
   - Two-substrate diagram (Substrate A = Apollo TEE + Temporal; Substrate B = Hatchet + Trino + Iceberg)
   - Feature Store as bridge with Semantic Management Layer
   - SegmentID and TriggerID contracts
   - Data flow (crawler → fixtures → web bundle, no runtime fetch in v1)
   - Latent backends and post-May-12 wiring path
4. `docs/design-guidelines.md`:
   - Token reference (T.colors, T.fonts, T.radii, T.spacing)
   - Typography hierarchy (serif italic intent, mono technical, Inter body)
   - Color usage (deep red for active, amber for anomalies)
   - Component primitives reference
   - Latency badge format spec
5. `docs/code-standards.md`:
   - File naming (kebab-case, descriptive)
   - Module size <200 lines
   - TS strict, all data types from contracts
   - No `any` without comment
   - No emojis in code/copy unless requested
   - Conventional commits (no AI references)
   - Error handling pattern
6. `docs/deployment-guide.md`:
   - Prereqs (Node ≥20, pnpm ≥9, VPN for crawler)
   - `pnpm install && pnpm dev` for local
   - `pnpm refresh-cfm-data` for crawler
   - `pnpm build && pnpm start` for production-mode local
   - Deploy target (Dokploy + Nixpacks per Bedrock pattern)
   - Crawler troubleshooting (VPN, 401, timeouts)
7. `docs/project-roadmap.md`:
   - Phase 1 (May 12 alignment) — this prototype, scope as built
   - Phase 2 (post-May-12, no commitments yet):
     - Live backend wiring (catalog-api + query-svc → web)
     - Studio Agent custom layer
     - Multi-game crawler (ptg_vn, nth_vn, tf_vn, cos_vn)
     - Real LLM integration for agents
     - Real Hatchet workflow + Trino segment compilation
     - Apollo TEE integration for triggers
   - Open questions from brainstorm §10 not yet resolved
8. `README.md`:
   - One-paragraph project description
   - Quick start (3 commands)
   - Repo layout (apps/, packages/, infra/)
   - Where to find docs
   - Origin (forked from segment-builder)
9. Final polish pass:
   - Scan for TODO comments in `apps/web/src/`; resolve or mark with issue ref
   - Verify all `<a href>` and `<Link to>` resolve to existing routes
   - Verify all PRD-named entities present in catalog (smoke test from P-3)
   - Run `pnpm typecheck && pnpm lint && pnpm build` — all green
10. Visual polish pass on canvas (04) and OpportunityCard:
    - Spacing consistency
    - Typography hierarchy holds at 1280px and 1920px
    - Pulse animations smooth
    - Sticky audience band doesn't jitter on scroll
11. Commit: `feat(docs): populate docs structure + readme; final polish pass`.

## Todo List
- [ ] Write `project-overview-pdr.md`
- [ ] Write `codebase-summary.md`
- [ ] Write `system-architecture.md`
- [ ] Write `design-guidelines.md`
- [ ] Write `code-standards.md`
- [ ] Write `deployment-guide.md`
- [ ] Write `project-roadmap.md`
- [ ] Finalise `demo-known-limitations.md`
- [ ] Write root `README.md`
- [ ] Final scan for TODO / placeholder strings
- [ ] Verify all routes + links resolve
- [ ] Visual polish pass on canvas + OpportunityCard
- [ ] Final `pnpm typecheck && pnpm lint && pnpm build` green
- [ ] Commit checkpoint

## Success Criteria
- [ ] All 7 mandated `docs/*.md` files present and non-empty
- [ ] `README.md` at root with quick-start commands
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm lint` exits 0 (or only warnings, no errors)
- [ ] `pnpm build` produces `apps/web/dist/`
- [ ] No TODO comments in `apps/web/src/` (or all reference issue numbers)
- [ ] No broken links in docs (manually verified)
- [ ] Acceptance criterion #25 met from brainstorm §5

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Docs writing sprawls past 3h budget | Time-box each file to 25 min; cap LOC per file at 400 |
| Final polish reveals new issues | Triage: critical → fix; cosmetic → log to known-limitations.md |
| Lint errors from earlier phases surface here | Allow `lint` warnings; fail only on errors |
| `pnpm build` fails with type errors that didn't show in dev | Run `tsc --noEmit` before `vite build` always |

## Security Considerations
- Verify no creds, tokens, or internal hostnames committed in docs (10.164.54.181 is OK — already in `.env.example` per Bedrock convention).
- Demo screenshots reviewed for player PII before commit.

## Next Steps
- May 12 alignment meeting.
- Post-May-12 SP-4: live integration plan kickoff.
