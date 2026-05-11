---
phase: 6
title: "Boards full module + backend"
status: pending
priority: P1
effort: "1.5d"
dependencies: [3]
---

# Phase 6: Boards full module + backend

## Overview

Build the Boards module end-to-end: drizzle tables (`boards`, `board_cards`), backend controller (CRUD + pin endpoint), frontend list (`/canvas`), detail (`/canvas/:boardId`), and Pin-to-Board popover with `+ New board` inline. This is the only fully-built NEW module in the plan (everything else is a stub).

## Requirements

- **Functional:** create board, list boards, view board with pinned widgets, pin widget from chat with create-new-inline support, delete board, expand/collapse sections in board detail
- **Non-functional:** board detail renders <300ms with up to 20 cards, Pin popover opens <100ms, optimistic add-to-board UI

## Architecture

```
apps/catalog-api/
└ src/boards/
    ├ boards.controller.ts       GET /, GET :id, POST, PATCH :id, DELETE :id
    │                            POST /:id/cards (pin widget), DELETE /:id/cards/:cardId
    ├ boards.service.ts
    └ boards.module.ts

DB:
  boards          (id, name, sections jsonb, created_by, created_at, updated_at)
  board_cards     (id, board_id FK, section_id, widget jsonb, source_thread_id, pinned_at)

apps/web/src/modules/canvas/
├ list-page.tsx                /canvas
└ detail-page.tsx              /canvas/:boardId

apps/web/src/components/boards/
├ board-card.tsx               (list item: title, count, updated)
├ pinned-widget-card.tsx       (renders DataWidget from Phase 3 widgets)
├ pin-to-board-popover.tsx     (existing-board list with ✓ + create inline)
└ section-collapse.tsx         (expand/collapse chevron + section title)
```

## Related Code Files

**Backend create:**
- `apps/catalog-api/src/boards/boards.controller.ts`
- `apps/catalog-api/src/boards/boards.service.ts`
- `apps/catalog-api/src/boards/boards.module.ts`
- `apps/catalog-api/src/db/schema-boards.ts` — drizzle table defs
- `apps/catalog-api/drizzle/migrations/NNNN_create_boards.sql` — generated
- `packages/contracts/src/board.ts` — Zod schemas: `Board`, `BoardSection`, `PinnedCard`, `DataWidget` (or share with chat widget)

**Frontend create:**
- `apps/web/src/modules/canvas/list-page.tsx`
- `apps/web/src/modules/canvas/detail-page.tsx`
- `apps/web/src/components/boards/board-card.tsx`
- `apps/web/src/components/boards/pinned-widget-card.tsx`
- `apps/web/src/components/boards/section-collapse.tsx`
- `apps/web/src/components/boards/pin-to-board-popover.tsx`
- `apps/web/src/components/boards/new-board-inline-input.tsx`
- `apps/web/src/api/boards-client.ts` — listBoards, getBoard, createBoard, pinCard, deleteBoard

**Modify:**
- `apps/catalog-api/src/app.module.ts` — register `BoardsModule`
- `apps/web/src/components/chat/widgets/widget-shell.tsx` — replace pin button toast-stub with real `pinToBoard` flow opening `<PinToBoardPopover>`
- `apps/web/src/components/sidebar/recent-items.tsx` — wire Boards section to load recent from `/boards`

## Implementation Steps

**Backend:**

1. Define `db/schema-boards.ts`: `boards` table (id uuid PK, name text, sections jsonb default `[{id:"pinned",title:"Pinned",isExpanded:true,cards:[]}]`, ...) and `board_cards` (id, board_id FK, section_id text, widget jsonb, source_thread_id text, pinned_at)
2. `pnpm --filter @hermes/catalog-api drizzle-kit generate` → migration; commit
3. `pnpm migrate` to apply
4. `boards.service.ts` methods: `list()`, `get(id)` (joins board_cards into sections), `create({name})`, `update(id, patch)`, `remove(id)`, `pinCard(boardId, sectionId, widget, sourceThreadId)`, `unpinCard(boardId, cardId)`
5. `boards.controller.ts`: GET / GET :id POST PATCH :id DELETE :id POST :id/cards DELETE :id/cards/:cardId
6. Register module
7. Smoke test: `curl POST /api/v1/boards -d '{"name":"UA Performance"}'`, `curl POST /api/v1/boards/:id/cards -d '{"widget":{...}}'`

**Frontend:**

8. Build `boards-client.ts` typed fetchers
9. Build `pinned-widget-card.tsx` — wraps `Widget` from Phase 3 with delete (✕) on hover
10. Build `section-collapse.tsx` — chevron toggle + section title
11. Build `detail-page.tsx` — fetches board, renders title + delete button + sections (collapsible) with pinned cards + `+ Add card` per section + `+ Add section` at bottom
12. Build `board-card.tsx` for list (title + "N cards · Updated [date]")
13. Build `list-page.tsx` — fetches boards list + `+ New Board` button (creates inline)
14. Build `new-board-inline-input.tsx` — text input + Create button
15. Build `pin-to-board-popover.tsx`:
    - Anchored to widget Pin button
    - Lists existing boards with ✓ for already-pinned
    - "+ New board" button → toggles inline input
    - On Create → POST /boards → POST /boards/:id/cards → toast "Pinned to [Board] — [Widget]" with View link
16. Wire `widget-shell.tsx` Pin button to open popover, pass current widget JSON
17. Wire sidebar Boards recent-items to read from `/boards` (push to recent on pin or board open)
18. Test: chat thread-001 → click Pin to board on CPI table → popover → New board "UA Performance" → Create → toast → navigate to /canvas → see "UA Performance — 1 card"; click → see table card

## Success Criteria

- [ ] Migrations apply cleanly; tables exist
- [ ] `curl` CRUD smoke tests pass for /boards
- [ ] Pin widget from chat → popover opens → existing boards listed (with ✓ for pinned)
- [ ] `+ New board` inline → type name → Create → board created + widget pinned in same flow
- [ ] Toast "Pinned to [Board] — [Widget]" appears with working View link
- [ ] `/canvas` lists boards with card count + last-updated
- [ ] `/canvas/:boardId` renders title, sections (collapsible), pinned widget cards
- [ ] Delete board on detail → confirm → returns to list
- [ ] Sidebar Boards expandable shows recent boards
- [ ] `pnpm typecheck` clean

## Risk Assessment

- **DataWidget JSON in DB:** stored as jsonb. Don't store raw chart computation; store the input data so re-render is deterministic.
- **Sections data model:** sections live on board (jsonb array of `{id, title, isExpanded}`); cards live in `board_cards` table with `section_id` FK-by-string. Trade-off accepts: simpler queries, harder section-rename. Acceptable for May 12.
- **Pin popover positioning:** must clip to viewport on small screens. Use floating-ui or compute manually.
- **Widget "freezes" data at pin time:** if source widget changes, board doesn't auto-update. This is correct (snapshot semantics) — confirm with user before May 12 if they expected live updates.
- **Concurrent pin to same board:** last-write-wins; no IfMatch on pinCard. Acceptable.
