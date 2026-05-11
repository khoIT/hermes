---
type: cook-summary
date: 2026-05-10
plan: 260510-0151-chat-first-sidebar-ia
mode: --auto
status: phases-1-10-frontend-complete
---

# Cook summary — Chat-First Sidebar IA

**All 10 phases land frontend-only.** Backends for Phase 5 (campaigns) and Phase 6 (boards) are deferred — clients fall back to localStorage when live POST fails so the demo flows still work end-to-end.

## What ships

### Phase 1 — Sidebar shell + routing
- `apps/web/src/components/sidebar/{sidebar,sidebar-section,sidebar-item,recent-items,workspace-pill,bottom-row}.tsx`
- `apps/web/src/utils/recent-items-store.ts` (LRU localStorage helper)
- 13 sidebar items per brainstorm §3.2; cream `#F9F6F2` bg
- `App.tsx` rewired to flex-row with sidebar left + main right
- Old `nav.tsx` deleted
- `LucideIcon` type relaxed in `theme.tsx` (`size?: string | number`) for lucide-react compat

### Phase 2 — Chat landing + thread skeleton
- `modules/chat/{landing-page,thread-page}.tsx`
- `components/chat/{chat-input-box,deep-research-toggle,send-button,suggested-prompt-{row,list},thread-header,user-message,assistant-response}.tsx`
- `utils/chat-store.ts` (localStorage CRUD; schema v1)
- `data/chat/suggested-prompts.ts`

### Phase 3 — Response widgets
- 4 widget types: `data-table` · `line-chart` · `bar-funnel-chart` · `scatter-chart` (Recharts)
- `widget.tsx` discriminated union renderer + `widget-shell.tsx` (pin + Data ▾)
- `narrative-para.tsx` — minimal **bold** + `code` markdown
- `bulleted-insights.tsx`, `response-section.tsx`, `response-action-bar.tsx`, `follow-ups.tsx`
- `components/ui/toast.tsx` global toast queue + `ToastHost`
- `data/chat/response-types.ts` — concrete schemas for the section discriminated union
- `widgets/colors.ts` — channel-aware palette (Facebook=green, Admob=purple, Moloco=orange, Vungle=blue)

### Phase 4 — Pre-seeded threads + intent matcher
- 4 demo threads as TS fixtures: `thread-001-cpi-ltv` · `thread-002-d7-facebook` · `thread-003-loss-streak` · `thread-004-create-segment`
- `data/chat/canned-responses.ts` — supplementary follow-up responses
- `data/chat/intents.ts` — keyword arrays
- `utils/chat-intent-matcher.ts` — keyword-scoring matcher
- `utils/chat-bootstrap.ts` — first-boot seed via stable thread ids
- `utils/chat-respond.ts` — text → assistant message resolver
- Wired to thread-page submit handler with 250ms delay so user message renders first

### Phase 5 — Action cards (frontend; backend deferred)
- `components/chat/action-cards/{action-card-shell,action-card-segment,action-card-campaign}.tsx`
- `api/{segments-client,campaigns-client}.ts` — POST with localStorage fallback when backend unreachable
- Thread-page wires `renderActionCard` prop on AssistantResponse
- **Deferred:** NestJS campaigns module + drizzle `campaigns` table. Stub mode is functional — toast says "(stub)" so demoer knows.

### Phase 6 — Boards (frontend; backend deferred)
- `api/boards-client.ts` — full CRUD + pinCard/unpinCard against localStorage
- `modules/canvas/{list-page,detail-page}.tsx`
- `components/boards/pin-to-board-popover.tsx` — existing-board picker + `+ New board` inline
- Pin button on every chat widget opens real popover
- **Deferred:** NestJS boards module + drizzle `boards`/`board_cards` tables.

### Phase 7 — Ask Hermes FAB + panel
- `components/fab/{ask-hermes-fab,ask-hermes-panel}.tsx`
- `utils/{panel-store,page-context}.ts`
- 380px right slide-in; resumes most recent thread; page-context chip dismissable per-artifact
- Hidden on `/`, `/chat/*`, `/welcome`

### Phase 8 — Cmd-K + chat context menu
- `components/global-search/cmd-k-modal.tsx` — date-grouped, ↑↓+Enter+Esc kbd nav
- `components/sidebar/chat-context-menu.tsx` — Add to folder (stub) / Convert to playbook (stub) / Delete chat (working)
- `utils/{date-buckets,keyboard-shortcut}.ts`
- Wired into `App.tsx` via `useGlobalShortcut('mod+k')`

### Phase 9 — Sidebar stubs
- `components/empty-state/coming-soon.tsx` shared placeholder
- 7 stub pages: Playbooks · Funnels · Retentions · Knowledge · Data · Settings · Account
- Account page ports the role-switcher (CFM PM / NTH PM / TF PM / GDS Admin) + sign-out from old `nav.tsx`

### Phase 10 — Welcome migration + agents cleanup
- `modules/welcome/page.tsx` (former HomePage, refreshed module list)
- Deleted: `modules/agents/` (50 files), `modules/home/`, `data/catalog/agents/compose-playbooks.ts`
- 7 redirect routes for old `/agents/*` paths (loss-streak deep-link → `/chat/thread-003`)
- `realtime.tsx` cleaned up: removed dead `readHandoff` import + compose-handoff banner
- Workspace pill in sidebar navigates to `/welcome`

## Verification

- `pnpm --filter @hermes/web typecheck` ✅ clean across all 10 phases
- `pnpm --filter @hermes/web build` ✅ 5.28s, 1097kb bundle (gzip 283kb), no warnings beyond chunk-size hint
- 76 features still exported by prebuild
- Postbuild static-features guard passes

## Acceptance criteria status

| # | Criterion | Status |
|---|---|---|
| 1 | Land on `/`, see chat landing with 5 suggested prompts | ✅ |
| 2 | Click suggested prompt → submits → opens `/chat/:id` with rendered response | ✅ |
| 3 | Click follow-up → adds new response to same thread | ✅ |
| 4 | "Create segment..." prompt → action card → click View → arrives at `/segments/:id` | ✅ (stub when backend down) |
| 5 | Click `Pin to board` on widget → popover → `+ New board` → board → toast → /canvas | ✅ |
| 6 | Sidebar All Chats shows 4 pre-seeded threads + working `+ New chat` | ✅ |
| 7 | FAB appears on `/segments/:id`, opens 380px panel with same thread state | ✅ |
| 8 | ⌘+K opens search modal with date-grouped threads | ✅ |
| 9 | `/agents/*` redirects to chat thread or `/` | ✅ |
| 10 | `/welcome` shows preserved current dashboard | ✅ |

## Backend work still required (post-May-12)

1. **Campaigns module** in `apps/catalog-api/src/campaigns/` — controller + service + drizzle table + migration.
   FE client is ready to switch from stub to live as soon as `POST /api/v1/campaigns` returns `{id}`.

2. **Boards module** in `apps/catalog-api/src/boards/` — drizzle tables `boards` + `board_cards`, CRUD endpoints, `POST /:id/cards`.
   `boards-client.ts` would need a thin live-mode swap.

Both stubs work with the current demo. Recommend wiring them after May-12 alignment.

## Files added / modified / deleted

**Added (~50 files):** sidebar/* · chat/* · widgets/* · action-cards/* · boards/* · fab/* · global-search/* · empty-state/* · ui/toast.tsx · stub pages · clients · stores · fixtures · welcome page

**Modified:** `App.tsx`, `routes.tsx`, `theme.tsx` (LucideIcon type), `realtime.tsx` (dead-code cleanup)

**Deleted:**
- `nav.tsx`
- `modules/agents/` (entire tree, ~50 files)
- `modules/home/`
- `data/catalog/agents/compose-playbooks.ts`

## Unresolved items

- Backend modules for campaigns + boards (see above) — explicit demo-day fallback in place
- Mobile responsiveness — confirmed OUT of scope per brainstorm §6
- Real LLM integration — deferred (scripted intent matcher meets demo target)
- Theme toggle — confirmed light-only per brainstorm §9
- Slack share / CSV export / Download — toast-only confirmed per PRD §8
