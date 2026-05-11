---
type: brainstorm
date: 2026-05-10
slug: chat-first-sidebar-ia
branch: actioneer
status: approved
related-prd: C:\Users\CPU12830-local\Downloads\actioneer_chat_prd_2.md
---

# Hermes — Chat-First Sidebar IA Redesign

**Outcome:** Hermes nav flips from top tabs to left sidebar. Chat becomes the primary interaction surface (research + create). Existing canvases preserved as peers. New concepts: Boards (pin widgets), Playbooks (stub), `/welcome` dashboard. `/agents` module deleted entirely.

---

## 1. Problem

Current Hermes shell:
- Top horizontal `Nav` with 5 numbered tabs (`01 Feature Store · 02 Explore · 03 Segments · 04 Campaign · 05 Agents`)
- No chat surface. Creation flows are click-driven canvases only.
- `/agents` module = static opportunity inbox with hardcoded recommendations — dead-feeling.
- Discovery friction: no recent-items, no global search, no AI-assisted authoring.

User intent (from session): match the Actioneer/Presto chat-centric pattern. Make chat the "action layer" — research, create segments, create campaigns, pin to boards, all conversational. Weave the 13-step demo flow into pre-seeded chat threads so the demo feels like a PM resuming work, not opening empty state.

---

## 2. Approaches considered

| Approach | Verdict |
|---|---|
| Chat REPLACES canvases | ❌ Rejected. Canvases are rich (AND-of-OR predicate composer, threshold playground). Demo asset, not legacy. |
| Chat as research-only, canvas remains creator | ❌ Rejected. Loses Presto-style "Create segment from chat" moment (PRD §4.5). |
| **Chat AND canvas as peers, user chooses** | ✅ **Selected.** Sidebar `+ New chat` = chat path. Library `+ New segment` = canvas path. "Refine" inside chat opens the corresponding canvas pre-filled. |
| Replace Hermes Agents with renamed Hermes module | ❌ Rejected mid-session in favor of next row. |
| **Delete Agents module entirely; opportunities → pre-seeded chat threads** | ✅ **Selected.** Cleaner IA, eliminates Hermes/Hermes naming collision concern, opportunity content recycled. |

---

## 3. Final Design

### 3.1 Layout shift

```
BEFORE                          AFTER
┌─────────────────────┐         ┌──────┬──────────────────┐
│ ☰ 01 02 03 04 05  K │         │      │ main content     │
├─────────────────────┤   →     │ side │            ┌───┐ │
│   main content      │         │ nav  │            │ ● │ │ ← Ask Hermes FAB
│                     │         │ 260px│            └───┘ │
└─────────────────────┘         └──────┴──────────────────┘
```

Sidebar: 260px fixed. Bg `#F9F6F2` (warm cream). Sticky full-height. No top header strip.

### 3.2 Sidebar tree (top → bottom)

| # | Item | Icon | Type | Behavior |
|---|---|---|---|---|
| 1 | `▦ Hermes ▾` | brand grid | Workspace pill | Click → `/welcome` |
| 2 | `+ New chat` | plus | Primary CTA | → `/` (clears thread state) |
| 3 | `⏱ All Chats ▾` | clock | Expandable | Date-grouped (Today / Yesterday / Last 7 days). 4 pre-seeded titles + `See all…` |
| 4 | `⌗ Feature Store ▾` | grid | Expandable | Recent features inline + `See all…` → `/feature-store` |
| 5 | `▦ Boards ▾` | layers | Expandable **(NEW)** | Recent boards + `See all…` → `/canvas` |
| 6 | `🗎 Playbooks ›` | docs | Flat stub **(NEW)** | → `/playbooks` empty list |
| 7 | `👤 Segments ▾` | users | Expandable | Recent segments inline + `See all…` |
| 8 | `⊻ Funnels ›` | filter | Flat stub **(NEW)** | Empty stub |
| 9 | `⥂ Retentions ›` | swap | Flat stub **(NEW)** | Empty stub |
| 10 | `✈ Campaigns ▾` | paper-plane | Expandable | Recent campaigns inline + `See all…` |
| 11 | `📖 Knowledge ›` | book | Flat stub **(NEW)** | Empty stub |
| — | divider | — | — | — |
| 12 | `🗄 Data` | database | Bottom row | Connectors page (latent) |
| 13 | `⚙ Settings` | gear | Bottom row | Settings page |
| 14 | `🅰 Account` | letter | Bottom row | Role-switcher dropup |

**Skipped per user direction:** Metrics (subset of Features).

**Numbered prefixes (`01`/`02`/...) and verb subtitles (`inventory`/`compose`/...) DELETED** — replaced by lucide icons matching reference images.

### 3.3 Routes

| Route | Status | Purpose |
|---|---|---|
| `/` | **CHANGED** | Chat landing (logo + tagline + 5 suggested prompts + Deep Research toggle) |
| `/welcome` | **NEW** | Current home moved here (KPI tiles + Active campaigns + Start something + Anomalies) |
| `/chat/:id` | **NEW** | Conversation thread view |
| `/canvas` | **NEW** | Boards list |
| `/canvas/:boardId` | **NEW** | Board detail with pinned widget cards |
| `/playbooks` | **NEW** | Empty stub list |
| `/funnels`, `/retentions`, `/knowledge` | **NEW** | Empty stubs |
| `/data`, `/settings`, `/account` | **NEW** | Thin stubs |
| `/feature-store/*` | unchanged | — |
| `/segments/*` | unchanged | — |
| `/campaigns/*` | unchanged | — |
| `/explore` | unchanged | Stays stub |
| `/agents/*` | **DELETED** | Redirect → `/` (chat) |

### 3.4 Chat surface (`/` and `/chat/:id`)

**Landing (`/`)** matches PRD §4.2:
- Centered Hermes brand mark (grid tile)
- Tagline: "Ask anything about your players, retention, segments, or campaigns."
- Input box with placeholder "What do you want to know?"
- Deep Research toggle (left, OFF default)
- Send button (circular dark, right)
- 5 suggested prompts below (Hermes-flavored — see §3.6)

**Thread view (`/chat/:id`)** matches PRD §4.3:
- H1 question header
- Response blocks with: Identity header (`▦ Hermes`) → narrative → H2 sections → widgets → bulleted insights → action bar → follow-ups
- Widgets: table / line / bar-funnel / scatter — each with `Pin to board` + `Data ▾` (Data table / Export CSV)
- Action bar: ↓ Download · ⧉ Copy · # Slack · ⚡N credits · 👍 👎
- Bottom input + `Stop Hermes` button during generation

**Action cards** (segment / campaign creation): clean response with `▦ ✓ Segment created — [name]  View ↗` — no widgets, no follow-ups inside the confirmation.

### 3.5 Floating "Ask Hermes" panel

- Position: fixed bottom-right, 24px margin, every page EXCEPT `/` and `/chat/*`
- Click → 380px right slide-in panel
- **Thread model:** resumes user's latest active thread by default. Panel header has its own `+ New chat` to start fresh (which also creates a new sidebar entry — symmetric with `/chat`)
- **Page-context chip:** dismissable bubble above input on first open per page (e.g. `Context: Organic Power Users segment`). Sent as system prefix to model.
- Action card `View ↗` navigates main content; panel stays open with same thread.

### 3.6 Pre-seeded chat threads (demo script woven in)

| # | Title | Maps to | Content type |
|---|---|---|---|
| 1 | "Does higher CPI actually produce higher LTV players? Show the correlation across channels" | Actioneer PRD UC1 | Narrative + table + scatter chart + 5 follow-ups |
| 2 | "What is the D7 retention for the Facebook channel?" | PRD UC2 | Narrative + line chart |
| 3 | "Players hitting consecutive ranked losses — what's the intervention pattern?" | **Hermes-native** (replaces `/agents/op/cfm-loss-streak`); leads into demo steps 2–8 (Feature Store → Segment → Campaign chain) | Multi-turn ending in `Create segment` action card |
| 4 | "Create a segment of users who spent over $50 in the last 30 days and are at high churn risk" | PRD UC4 | Action card → live POST → `/segments/:id` |

**Stretch (only if time):** thread 5 "is there anyway I can add more conditions to organic power users?" — multi-turn refinement (PRD UC3).

**Suggested prompts on landing (`/`)** (Hermes-flavored, NOT verbatim Actioneer):
1. "Does higher CPI actually produce higher LTV players? Show the correlation across channels"
2. "Which segments are drifting outside their expected envelope this week?"
3. "Show D7 retention for CFM 5-game-targeting cohort vs. control"
4. "What features predict churn for high-spend players?"
5. "Create a segment of users who spent over $50 in the last 30 days and are at high churn risk"

### 3.7 Action wiring (live)

- `Create segment` action → POST `/api/v1/segments` to catalog-api → returns `{id}` → navigate to `/segments/:id`
- `Create campaign` action → POST `/api/v1/campaigns` (latent endpoint — needs validation)
- `Pin to board` → POST `/api/v1/boards/:id/cards` OR `/api/v1/boards` for new board → toast notification
- Chat thread persistence: localStorage for v1 (per-tenant deferred). Threads auto-titled from first user message.

### 3.8 Selected secondary features (per user multi-select)

- ✅ Funnels / Retentions stubs (not Metrics — subset of Features)
- ✅ Playbooks + Knowledge stubs
- ✅ ⌘+K global search modal (date-grouped chats, ↑↓ + Enter + Esc keyboard nav, expand to full-page)
- ✅ Three-dot menu on chat sidebar items (Add to folder = stub toast / Convert to playbook = stub toast / Delete = working)

### 3.9 Visual / token alignment

- Reuse `T.brand` (#f05a22), `T.n*`, fonts (Inter / Mono / Serif italic / League Gothic)
- Sidebar bg = `#F9F6F2` (cream, matches Actioneer reference)
- Active item: semi-bold weight + 3px brand-tinted left bar (no box fill — Actioneer-style quiet treatment)
- Icons: `lucide-react` (16px sidebar, 18px action bar)
- Chat input: max-width 820px, border-radius 12px
- Toast: fixed bottom-right, dark bg, 4000ms auto-dismiss

---

## 4. What is preserved (scope guard)

- All existing Feature Store / Segment Canvas / Campaign Canvas / threshold playground / handoff modals — **untouched**
- Theme tokens (`apps/web/src/theme.tsx`) — preserved
- 13-step demo flow — continues working via canvas peers; chat additive
- Existing routes `/feature-store/*`, `/segments/*`, `/campaigns/*` — unchanged URLs

---

## 5. Implementation considerations

### 5.1 New components needed

- `apps/web/src/components/sidebar/sidebar.tsx` (replaces `nav.tsx`)
- `apps/web/src/components/sidebar/sidebar-section.tsx` (expandable)
- `apps/web/src/components/sidebar/recent-items.tsx`
- `apps/web/src/components/chat/chat-landing.tsx` (suggested prompts grid)
- `apps/web/src/components/chat/thread-view.tsx`
- `apps/web/src/components/chat/response-block.tsx`
- `apps/web/src/components/chat/widgets/{table,line,bar,scatter}.tsx`
- `apps/web/src/components/chat/action-card-segment.tsx`, `action-card-campaign.tsx`
- `apps/web/src/components/chat/action-bar.tsx`, `follow-ups.tsx`, `pin-to-board-popover.tsx`
- `apps/web/src/components/fab/ask-hermes-fab.tsx` + `ask-hermes-panel.tsx`
- `apps/web/src/components/global-search/cmd-k-modal.tsx`
- `apps/web/src/modules/welcome/page.tsx` (move existing `home/page.tsx` here)
- `apps/web/src/modules/chat/{landing,thread,new}-page.tsx`
- `apps/web/src/modules/canvas/{list,detail}-page.tsx` (Boards)
- `apps/web/src/modules/playbooks/list-page.tsx` (stub)
- `apps/web/src/modules/funnels/`, `retentions/`, `knowledge/`, `data/`, `settings/`, `account/` (stubs)

### 5.2 Backend (catalog-api) — verified inventory

**Verified existing controllers** (`apps/catalog-api/src/*`):
`/auth`, `/me`, `/me/pins`, `/health`, `/catalog`, `/audit`, `/connectors`, `/metrics`, `/features`, `/segments`, `/pipelines`.

| Capability | Status | Action |
|---|---|---|
| `POST /segments` | ✅ EXISTS (`segments.controller.ts:45`, full CRUD) | Wire chat action card directly. |
| `POST /campaigns` | ❌ **DOES NOT EXIST.** No campaigns controller; only counter columns in `db/schema.ts:97` | **Build new module:** `campaigns.controller`, `.module`, `.service`, drizzle table. Phase 5 dependency. |
| `GET/POST /boards`, `GET/PATCH/DELETE /boards/:id`, `POST /boards/:id/cards` | ❌ **DOES NOT EXIST** | **Build new module:** `boards.controller`, `.module`, `.service`, drizzle tables (`boards`, `board_cards`). Phase 6 dependency. |
| `/me/pins` | ⚠️ EXISTS but scoped to user-pinned segments, NOT board cards | Don't repurpose. Boards are independent. |
| Chat thread persistence | n/a | localStorage v1; Phase 2 backend deferred |

### 5.3 State management

- Pre-seeded thread fixtures in `apps/web/src/data/chat/threads/` (4 JSON files)
- Recent-items: `localStorage` keys `hermes.recent.{module}` (LRU, max 8, dedup)
- Panel state: `hermes.chat.panel.{open,threadId}`
- Section expand state: `hermes.sidebar.expand.{section}`

### 5.4 Estimated scope (rough)

| Phase | Work | Days |
|---|---|---|
| 1. Sidebar shell + routing | New nav, replace top header, route additions | 1 |
| 2. Chat landing + thread skeleton | Layout, suggested prompts, basic message rendering | 1 |
| 3. Response widgets (table/line/bar/scatter) | 4 widget types, Pin-to-board buttons | 1.5 |
| 4. Pre-seeded threads (content authoring) | 4 threads × narrative + data + follow-ups | 1 |
| 5. Action cards + live wiring | Segment POST (existing) + **NEW campaigns module** (controller/service/drizzle) + navigation/error states | 1.5 |
| 6. Boards (list + detail + Pin popover + +New) | Full UI + **NEW boards backend module** (controller/service/drizzle for `boards` + `board_cards`) | 1.5 |
| 7. FAB + panel | Slide-in, page-context chip, thread sync | 0.5 |
| 8. ⌘+K modal + three-dot menu | Global search, chat context menu | 0.5 |
| 9. Stubs (Playbooks/Funnels/Retentions/Knowledge/Data/Settings/Account) | Empty pages, sidebar links | 0.5 |
| 10. `/welcome` migration + redirect cleanup | Move home → /welcome, delete /agents/* | 0.5 |
| **Total** | | **~9.5 dev-days** (was 8.5; +1d for missing campaigns + boards backends) |

---

## 6. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Scope creep from new modules (Boards full impl + 6 stubs) | High | Hard cap: Boards is the only NEW module getting real impl. All others empty stubs. |
| Pre-seeded thread content authoring slow | Medium | 4 threads max for May 12; thread 3 (Hermes-native) reuses existing opportunity copy from `/agents/op/cfm-loss-streak`. |
| Live catalog-api segment/campaign POST endpoints incomplete | Medium | Validate endpoints first; if blocked, fall back to localStorage seed for action cards (still demo-passable). |
| `/agents/*` deletion breaks existing demo notes / deep links | Low | 301 redirect old `/agents/op/cfm-loss-streak` → `/chat/loss-streak-thread-id`. |
| Hermes-as-product vs Hermes-as-agent ambiguity | Low | FAB tooltip "Ask Hermes about this segment" disambiguates by context; chat identity header `▦ Hermes` is consistent. |
| Mobile (<768px) sidebar collapse | Low | Off-canvas drawer with hamburger toggle; defer to Phase 3 if not in May 12 scope (assumed out for now). |
| Cosmetic credits counter (⚡N) confuses users | Low | Tooltip "Demo metric, no billing in v1". |

---

## 7. Success criteria (May 12)

| # | Acceptance | Status |
|---|---|---|
| 1 | Land on `/`, see chat landing with 5 suggested prompts | ☐ |
| 2 | Click suggested prompt → submits → opens `/chat/:id` with rendered response (narrative + widget + follow-ups) | ☐ |
| 3 | Click follow-up → adds new response to same thread | ☐ |
| 4 | "Create segment..." prompt → action card → click View → arrives at `/segments/:id` with live-created segment | ☐ |
| 5 | Click `Pin to board` on widget → popover → `+ New board` → board created → toast → board visible at `/canvas` | ☐ |
| 6 | Sidebar All Chats shows 4 pre-seeded threads + working `+ New chat` | ☐ |
| 7 | FAB appears on `/segments/:id`, opens 380px panel with same thread state | ☐ |
| 8 | ⌘+K opens search modal with date-grouped threads | ☐ |
| 9 | `/agents/*` redirects to chat thread or `/` | ☐ |
| 10 | `/welcome` shows preserved current dashboard (KPI tiles + Active campaigns) | ☐ |

---

## 8. Next steps

1. User approves this brainstorm → invoke `/ck:plan` to generate detailed implementation plan with phases and TODO tasks
2. Plan dir: `plans/260510-0151-chat-first-sidebar-ia/`
3. Phase ordering should mirror §5.4 above
4. Confirm catalog-api segment/campaign POST endpoints exist before planning Phase 5

---

## 9. Unresolved questions

- **Mobile responsiveness scope:** assumed OUT for May 12 — confirm with user before plan phase
- ~~**Catalog-api POST endpoint readiness:** verified~~ → `POST /segments` ✅ ready; `POST /campaigns` and `/boards/*` need NEW backend modules (see §5.2). Plan must allocate backend phases for both.
- **Chat thread storage in Phase 2:** localStorage now, but where does thread persistence live longer-term? catalog-api or new chat-svc? Out of scope for May 12, flag for Phase 2 planning.
- **Credits / billing:** purely cosmetic for v1 — confirm we're not later expected to wire real metering
- **Slack share / CSV export / Download report:** all toast-only per PRD §8 — confirm
- **Theme toggle (Light/Dark/System):** SKIP — Hermes is light-only. Confirm.
