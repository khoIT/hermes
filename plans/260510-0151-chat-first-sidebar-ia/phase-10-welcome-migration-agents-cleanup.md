---
phase: 10
title: "Welcome migration + agents cleanup"
status: pending
priority: P1
effort: "0.5d"
dependencies: [1, 2, 4]
---

# Phase 10: Welcome migration + agents cleanup

## Overview

Final cutover: move the existing `HomePage` (KPI tiles + Active campaigns + Start something + Anomalies) from `/` to `/welcome`, leaving `/` as the chat landing from Phase 2. Delete the entire `/agents/*` route tree and module folder. Add 301-style redirects from old agents URLs to either chat threads or `/`. Update README and any docs that reference deleted paths.

**MUST run last.** Touches root route + deletes a major module.

## Requirements

- **Functional:** `/` shows chat landing (Phase 2), `/welcome` shows migrated dashboard, all `/agents/*` paths redirect to a sensible target, no broken links anywhere in the app
- **Non-functional:** zero 404s on existing demo deep-links, all redirects use replace navigation (no back-button trap)

## Architecture

```
BEFORE                          AFTER
GET /         HomePage          GET /         ChatLandingPage (Phase 2)
GET /agents   AgentsInbox       GET /welcome  HomePage (moved)
GET /agents/*  ...              GET /agents/*  → Navigate replace to mapped target
```

Redirect map:
- `/agents` → `/` (chat landing)
- `/agents/drafts` → `/`
- `/agents/activity` → `/`
- `/agents/settings` → `/account`
- `/agents/op/cfm-loss-streak` → `/chat/thread-003-loss-streak-intervention`
- `/agents/op/:id` → `/`
- `/agents/compose` → `/` (entire compose module deleted)

## Related Code Files

**Move:**
- `apps/web/src/modules/home/page.tsx` → `apps/web/src/modules/welcome/page.tsx` (rename, update imports)

**Create:**
- `apps/web/src/modules/agents-redirects.tsx` — single component containing all redirect rules using react-router-dom `<Navigate replace>`

**Delete:**
- `apps/web/src/modules/home/` directory (after move)
- `apps/web/src/modules/agents/` directory entirely (inbox, opportunity-detail, drafts, activity, settings, compose/)
- `apps/web/src/data/agents/` if exists (opportunity fixtures)

**Modify:**
- `apps/web/src/routes.tsx` — root `/` to `<ChatLandingPage />`, add `/welcome` route, replace all `/agents/*` route declarations with redirect routes
- `apps/web/src/components/sidebar/workspace-pill.tsx` — Hermes logo click → `/welcome` (not `/`)
- `README.md` — update demo flow Step 10/11/12/13 references (Agents module removed; flow now via chat threads)
- `docs/codebase-summary.md` — remove Agents module entry
- `docs/project-overview-pdr.md` — update screen ID list (delete 18-22)

## Implementation Steps

1. Move `modules/home/page.tsx` → `modules/welcome/page.tsx`; update default export name; fix imports in test fixtures if any
2. Update `routes.tsx`:
   - `GET /` → `<ChatLandingPage />`
   - `GET /welcome` → `<WelcomePage />`
   - `GET /agents` → `<Navigate to="/" replace />`
   - `GET /agents/op/cfm-loss-streak` → `<Navigate to="/chat/thread-003-loss-streak-intervention" replace />`
   - `GET /agents/op/:id` → `<Navigate to="/" replace />`
   - `GET /agents/drafts` → `<Navigate to="/" replace />`
   - `GET /agents/activity` → `<Navigate to="/" replace />`
   - `GET /agents/settings` → `<Navigate to="/account" replace />`
   - `GET /agents/compose` → `<Navigate to="/" replace />`
3. Delete imports of agents pages from `routes.tsx`
4. Delete `apps/web/src/modules/agents/` directory entirely
5. Delete `apps/web/src/modules/home/` directory after move verified
6. Update `workspace-pill.tsx` to navigate to `/welcome` on click (Hermes logo as home)
7. Update `README.md`:
   - Modules table: remove "Agents" row; rename screen count from 23 → 18 (or actual after additions)
   - Demo flow: replace steps 10-13 (Click Agents module / Open opportunity / Approve & draft / Build) with chat-driven equivalents
8. Update `docs/codebase-summary.md` — remove Agents module entry, add Chat + Boards
9. Update `docs/project-overview-pdr.md` — screen ID inventory updated
10. `pnpm typecheck` and `pnpm --filter @hermes/web build` — must pass
11. Manual smoke test:
    - Visit `/` → chat landing renders
    - Visit `/welcome` → dashboard renders
    - Visit `/agents` → redirects to `/`
    - Visit `/agents/op/cfm-loss-streak` → redirects to thread-003 chat
    - Click Hermes logo in sidebar → routes to `/welcome`
    - Sidebar `+ New chat` → routes to `/`
12. Walk full demo flow end-to-end:
    - Open `/` → click suggested prompt → response renders
    - Click any pre-seeded thread → renders
    - Trigger segment-from-chat → action card → Confirm → live segment created
    - Pin widget → board created → toast → /canvas → board visible
    - Open `/segments/:id` → FAB visible → click → panel slides in with thread continuing
    - ⌘+K → modal opens → search → Enter → opens thread
    - Three-dot on chat → Delete → confirm → thread removed

## Success Criteria

- [ ] `/` is chat landing, `/welcome` is dashboard
- [ ] All `/agents/*` paths redirect (no 404)
- [ ] Hermes sidebar logo → `/welcome`
- [ ] `apps/web/src/modules/agents/` directory deleted (no orphan files)
- [ ] `apps/web/src/modules/home/` directory deleted
- [ ] README + codebase-summary + project-overview-pdr updated
- [ ] All 10 plan acceptance criteria pass (see plan.md)
- [ ] `pnpm typecheck` clean across all packages
- [ ] `pnpm build` succeeds for web + catalog-api
- [ ] Full demo walkthrough end-to-end with no dead ends

## Risk Assessment

- **Hidden imports of HomePage / Agents pages** in tests, fixtures, demo notes: do `git grep -i "modules/home\|modules/agents"` before delete; fix every reference.
- **Demo notes / Phase reports reference /agents URLs:** acceptable to leave historical references; only fix live-path references.
- **Browser bookmark breakage:** redirects handle this. Test back-button after redirect doesn't trap user (use `replace` not `push`).
- **README screen count drift:** update to actual final count (was 23 with /agents/*; new count should be calculated, likely 23 - 6 agents + ~10 new chat/canvas/stubs).
- **Phase ordering:** Phase 10 MUST be last because it deletes /agents which Phase 7 FAB might still reference if context detection includes it. Verify Phase 7 doesn't include `/agents/*` in page-context.ts before deletion.
