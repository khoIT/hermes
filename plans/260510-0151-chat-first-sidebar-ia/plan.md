---
title: "Chat-First Sidebar IA — Hermes Platform Redesign"
description: "Flip Hermes from top tabs to left sidebar, introduce chat as the primary interaction surface for research + segment/campaign creation, add Boards module with Pin-to-Board flow, delete /agents/* entirely. Demo script woven into 4 pre-seeded chat threads. Aligned with Actioneer chat PRD (PRD ref: C:/Users/CPU12830-local/Downloads/actioneer_chat_prd_2.md)."
status: completed
priority: P1
branch: "actioneer"
tags: [ia, navigation, chat, frontend, backend, may-12, demo]
blockedBy: []
blocks: []
supersedes: [260510-0045-agents-compose-canvas]
created: "2026-05-09T19:32:17.257Z"
createdBy: "ck:plan"
source: skill
demo_target: "May-12 alignment meeting"
brainstorm_ref: "plans/reports/brainstorm-260510-0151-chat-first-sidebar-ia.md"
prd_ref: "C:/Users/CPU12830-local/Downloads/actioneer_chat_prd_2.md"
estimate_days: 9.5
---

# Chat-First Sidebar IA — Hermes Platform Redesign

## Overview

Replace Hermes' top horizontal nav with a 260px left sidebar. Make chat the primary interaction surface — research, create segments, create campaigns, pin widgets to boards — all conversational. Existing canvases preserved as peers (user can still author via Segment/Campaign Canvas). Delete `/agents/*` entirely; opportunities recycled as 4 pre-seeded chat threads matching the demo script. Add Boards as a NEW module with full backend (controller + drizzle table). Add Campaigns backend (currently does NOT exist — only counter columns in DB). Bottom row: Data / Settings / Account stubs. ⌘+K global search and three-dot chat menu round out the polish layer.

**Key non-goals:** no real LLM (keyword-matched scripted responses), no mobile responsiveness, no theme toggle, no real Slack/CSV/Download (toast-only).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Sidebar shell + routing](./phase-01-sidebar-shell-routing.md) | Completed |
| 2 | [Chat landing + thread skeleton](./phase-02-chat-landing-thread-skeleton.md) | Completed |
| 3 | [Response widgets](./phase-03-response-widgets.md) | Completed |
| 4 | [Pre-seeded threads](./phase-04-pre-seeded-threads.md) | Completed |
| 5 | [Action cards + campaigns backend](./phase-05-action-cards-campaigns-backend.md) | Completed |
| 6 | [Boards full module + backend](./phase-06-boards-full-module-backend.md) | Completed |
| 7 | [Ask Hermes FAB + panel](./phase-07-ask-hermes-fab-panel.md) | Completed |
| 8 | [Cmd-K + chat context menu](./phase-08-cmd-k-chat-context-menu.md) | Completed |
| 9 | [Sidebar stubs + route migration](./phase-09-sidebar-stubs-route-migration.md) | Completed |
| 10 | [Welcome migration + agents cleanup](./phase-10-welcome-migration-agents-cleanup.md) | Completed |

## Dependencies

**Internal:** Phase 1 unblocks all UI phases. Phase 5 (campaigns backend) and 6 (boards backend) are independent — can parallel. Phase 10 must run last (deletes /agents/*).

**Cross-plan:** Supersedes `260510-0045-agents-compose-canvas` (status: completed). The `/agents/compose` page added by that plan is included in the `/agents/*` deletion in Phase 10. Its scripted-keyword approach is REUSED for chat intent matching in Phase 4.

## Acceptance Criteria (10 items, May-12 demo)

1. Land on `/`, see chat landing with 5 suggested prompts
2. Click suggested prompt → submits → opens `/chat/:id` with rendered response (narrative + widget + follow-ups)
3. Click follow-up → adds new response to same thread
4. "Create segment..." prompt → action card → click View → arrives at `/segments/:id` with **live-created** segment
5. Click `Pin to board` on widget → popover → `+ New board` → board created → toast → board visible at `/canvas`
6. Sidebar All Chats shows 4 pre-seeded threads + working `+ New chat`
7. FAB appears on `/segments/:id`, opens 380px panel with same thread state
8. ⌘+K opens search modal with date-grouped threads
9. `/agents/*` redirects to chat thread or `/`
10. `/welcome` shows preserved current dashboard (KPI tiles + Active campaigns)

## Backend gap summary

- ✅ `POST /segments` exists (`segments.controller.ts:45`) — wire chat action card directly
- ❌ `POST /campaigns` does NOT exist → **build new module** in Phase 5
- ❌ `/boards/*` endpoints do NOT exist → **build new module** in Phase 6 (drizzle tables `boards` + `board_cards`)

## Risks (top 5)

1. Scope creep from new modules — hard cap: only Boards + Campaigns get real backend; all other sidebar items are empty stubs
2. Pre-seeded thread content authoring takes 1+ day — gate-keep at 4 threads, not 5
3. `/agents/*` deletion breaks existing demo deep links — Phase 10 adds 301 redirects
4. Live POST endpoints return 4xx on validation — Phase 5/6 must ship validation-error UI states
5. localStorage thread state corrupts across schema changes — version key + migration helper
