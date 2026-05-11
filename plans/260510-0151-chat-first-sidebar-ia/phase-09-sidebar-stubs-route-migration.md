---
phase: 9
title: "Sidebar stubs + route migration"
status: pending
priority: P3
effort: "0.5d"
dependencies: [1]
---

# Phase 9: Sidebar stubs + route migration

## Overview

Build empty stub pages for sidebar items that won't get full implementations in May 12 scope: Playbooks, Funnels, Retentions, Knowledge, Data, Settings, Account. Each is a single-page "Coming soon" surface with module-relevant copy. Skip Metrics (per user direction — subset of Features).

## Requirements

- **Functional:** all sidebar links route to a real page (no 404s); each stub describes the module's future scope; Account opens role-switcher dropup matching existing role list
- **Non-functional:** no backend calls, all pages render <50ms

## Architecture

```
apps/web/src/modules/
├ playbooks/list-page.tsx        ← "Convert any chat to a playbook"
├ funnels/list-page.tsx          ← "Multi-step conversion analysis (coming soon)"
├ retentions/list-page.tsx       ← "Cohort retention curves (coming soon)"
├ knowledge/page.tsx             ← "Glossary + docs (coming soon)"
├ data/page.tsx                  ← "Data connectors — Trino, Postgres, etc."
├ settings/page.tsx              ← workspace settings
└ account/page.tsx               ← role switcher + sign out
```

Account page reuses role list from existing `nav.tsx` `RoleDropdown` (CFM PM, NTH PM, TF PM, GDS Admin) — port the dropup logic into a settings-style page.

## Related Code Files

**Create:**
- `apps/web/src/modules/playbooks/list-page.tsx`
- `apps/web/src/modules/funnels/list-page.tsx`
- `apps/web/src/modules/retentions/list-page.tsx`
- `apps/web/src/modules/knowledge/page.tsx`
- `apps/web/src/modules/data/page.tsx`
- `apps/web/src/modules/settings/page.tsx`
- `apps/web/src/modules/account/page.tsx`
- `apps/web/src/components/empty-state/coming-soon.tsx` — reusable "Coming soon" placeholder with title + body + icon

**Modify:**
- `apps/web/src/routes.tsx` — wire all 7 paths

## Implementation Steps

1. Build `coming-soon.tsx` reusable component: prop `{title, body, icon}` rendering a centered placeholder
2. Build each module page using `<ComingSoon>`:
   - Playbooks: "Convert any chat into a reusable automation. Coming Phase 2."
   - Funnels: "Multi-step conversion analysis with drop-off charts."
   - Retentions: "Cohort retention curves and DAU/MAU trends."
   - Knowledge: "Glossary, system docs, and shared playbooks."
   - Data: "Connector inventory — Trino, Postgres, Iceberg, mock fixtures."
3. Build `settings/page.tsx` — light layout with placeholder sections (Workspace, Notifications, Integrations) all "coming soon"
4. Build `account/page.tsx` — port role list from `nav.tsx:RoleDropdown` (CFM PM / NTH PM / TF PM / GDS Admin), add Sign out button (toast); show user pill `K · Khoi`
5. Wire all 7 routes in `routes.tsx`
6. Verify sidebar links from Phase 1 all land on real pages
7. `pnpm typecheck && pnpm --filter @hermes/web build`

## Success Criteria

- [ ] Clicking each sidebar item from Phase 9 list lands on a stub page
- [ ] No 404s in sidebar
- [ ] Account page shows current role + ability to "switch" (UI only, no real change)
- [ ] All stubs use shared `<ComingSoon>` component for visual consistency
- [ ] `pnpm typecheck` clean

## Risk Assessment

- **Visual inconsistency:** all 7 stubs MUST use the same component to avoid divergent placeholder treatments. Enforced by code review.
- **Account role switch:** if existing demo flows depend on the old `nav.tsx` RoleDropdown being in the header, those flows break. Audit `git grep RoleDropdown` and migrate any references to use the new `account/page.tsx` or sidebar bottom-row.
- **Bottom-row Account click vs visiting /account:** decide UX — sidebar Account row should navigate to /account (not open inline dropup) to keep sidebar simple. Confirm in Phase 1 design.
