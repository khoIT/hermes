---
title: Hermes Chat ↔ Artifact Connectivity
type: brainstorm
date: 2026-05-10
slug: chat-artifact-connectivity
status: agreed
---

# Hermes — Chat ↔ Artifact Connectivity

## Problem

Hermes promises a centralized chatbot agent that lets LiveOps PMs ask plain-language questions and produce one of three actionable artifacts: **Boards** (pinned analysis), **Segments** (configurable + exportable predicates), **Campaigns** (rules + activate). Today the forward edges work but the surface is thin and the reverse edges are missing — so the prototype reads as three loosely-connected modules with a shared chat surface, not a cohesive agent experience.

**May-12 demo target**: walk all three artifact terminuses in one 90s arc, mostly scripted with some free-text tolerance.

## State of the world (verified)

| Edge | Status | File |
|---|---|---|
| Chat → Board (pin) | ✅ works | `apps/web/src/components/chat/sections/pin-to-board-section.tsx` |
| Chat → Segment | ✅ works | `apps/web/src/components/chat/action-cards/action-card-segment.tsx` |
| Chat → Campaign | ⚠️ POSTs but doesn't navigate; activate is mock-only | `apps/web/src/components/chat/action-cards/action-card-campaign.tsx` |
| Compose canvas (Q→Segment→Campaign) | ❌ **plan-marked-completed but zero code; route redirects to `/`** | `apps/web/src/routes.tsx:122` |
| Board → Source thread | ❌ `sourceThreadId` stored, no UI link | — |
| Segment → Chat (any reverse) | ❌ no entry point | — |
| Campaign → Chat (any reverse) | ❌ no entry point | — |
| Inline "save as artifact" on narrative responses | ❌ only when payload includes `action_card_*` | — |
| Free-text registry fallback | ⚠️ exact-text keyed — ad-libbed Qs break multi-turn | `apps/web/src/data/chat/multi-turn-registry.ts` |

**The "thread without user question" was a perception issue** — first user message is intentionally rendered as H1 hero in `<ThreadHeader>`, follow-ups as H2 in `<UserMessage>`. Visually identical to section headers. Worth a tiny "Q:" / icon prefix so questions read as questions.

## Approaches evaluated

### A. Tighten existing flows, defer Compose
- Polish the 7 fixture threads + reverse edges + demo arc.
- Compose stays deferred.
- **Pro**: zero risk, all components exist. **Con**: misses the contextual-chat-panel vision.

### B. Build Compose-Lite (one playbook) for demo, defer side-panel
- Single-track Compose canvas (loss-streak only), no swap drawer, no 4R.
- **Pro**: showcases the agent canvas. **Con**: half-built feel; doesn't match the screenshots' contextual-panel vision.

### C. Contextual side-panel on artifacts + universal CTAs + reverse edges (recommended)
- Right-rail chat panel on artifact detail pages (Images 1–3): resizable, context-aware, refinement-suggesting with one-click apply.
- Universal inline CTAs on every assistant response.
- Reverse navigation badges.
- Compose canvas tracks separately as post-demo work.
- **Pro**: matches the screenshots; demonstrates the agent as connective tissue across modules. **Con**: substantial new surface — must scope tightly to segments-only for May-12.

## Final agreed solution — Approach C with phased rollout

### New plan: `Chat ↔ Artifact Connectivity`
Five tracks, phased by demo-criticality:

**Phase 1 · Demo polish quick wins (P0, 0.5d)**
- Wire `action_card_campaign` Confirm → navigate to `/campaigns/{id}`
- Activate flow lands on monitoring with banner "Activated · Source: {thread title}"
- Free-text fallback response in registry (graceful degradation)
- Q-marker on user H2 sub-headings (small icon or "Q:" prefix)

**Phase 2 · Reverse navigation badges (P0, 0.5d)**
- Persist `sourceThreadId` on segment + campaign POST payloads
- Board card: "💬 from {thread title}" pill → `/chat/{id}` (data already there)
- Segment detail header: "💬 Last asked: …" pill
- Campaign detail header: same pattern

**Phase 3 · Universal inline CTAs (P0, 0.5–1d)**
- Footer row on every `<AssistantResponse>`: 🎯 Save as segment · 📊 Pin to board · 📣 Build campaign
- Each opens a lightweight composer/dialog pre-filled from response narrative + mentioned features
- Smart context: if response already contains `action_card_*`, hide the matching CTA to avoid duplication

**Phase 4 · Guided demo arc (P0, 1d)**
- Pre-seeded thread `thread-demo-livops-2026` chains all three terminuses in order
- T1: chart-response → pin to board (1 click) → board page
- T2 (auto-suggested chip): segment proposal → confirm → `/segments/{id}`
- T3 (auto-suggested chip): campaign action card → activate → monitoring
- "← Continue in chat" pill on each detail page returns to thread

**Phase 5 · Contextual chat side-panel — segments only (P1 stretch, 1–1.5d)**
Per Images 1–3:
- Right-rail mountable panel, default width 380px, resizable via left-edge drag handle (persist in localStorage)
- Mounted on `/segments/:id` detail with auto-open trigger when `?ask=true` query param OR explicit user open
- Context bound to segment (id + displayName + predicate). Placeholder: "What do you want to know?" with context chip "Segments"
- Scripted refinement playbook (3–5 keyword-keyed convos):
  - "can you change this segment" / "refine" → suggests 3–4 predicate clauses with one-click **Apply** buttons
  - "increase engagement floor to 10+" → narrows audience, recomputes count, shows delta
  - "side-by-side iOS vs Android" → renders comparison chart inline
  - "filter to Tier-1 markets" → adds country_code IN clause
- One-click apply mutates the live predicate via existing segments-client.update()
- Toolbar parity with main chat (pin/copy/share/credits/feedback)
- Conversation persists to thread store; visible in sidebar Recent Chats

**Phase 6 · Contextual chat side-panel — board/campaign/feature (P3 post-demo, 2–3d)**
Same pattern, different scripted playbooks per artifact type. Out of May-12 scope.

### Existing plan fix: `260510-0045-agents-compose-canvas`
- Revert frontmatter `status: completed` → `status: pending`
- Add note in plan.md: "Code not yet implemented; deferred post-May-12 demo"
- Phase 1+2 (intent input + features stage) eligible as post-demo first deliverable

## Implementation considerations

### Reuse expectations
- `<AssistantResponse>` footer hooks for universal CTAs
- Existing `respondToText()` intent matcher for side-panel keyword routing
- `pushRecent()` instrumentation already wired — side-panel threads inherit free
- `segments-client.ts` already exposes the surface needed for one-click apply
- Audience-count APIs (`/api/v1/audience/count` on :3002) for predicate delta on apply

### New surfaces
- `apps/web/src/components/chat-panel/` — resizable side-panel shell, mount provider
- `apps/web/src/components/chat-panel/contextual-chat-panel.tsx` — main component
- `apps/web/src/components/chat-panel/refinement-action.tsx` — Apply-button row pattern
- `apps/web/src/data/chat/contextual-playbooks.ts` — keyword-keyed scripted refinement convos
- `apps/web/src/components/chat/universal-cta-row.tsx` — footer for `<AssistantResponse>`
- `apps/web/src/data/chat/threads/thread-demo-livops-2026.ts` — guided arc thread
- `apps/web/src/utils/chat-panel-store.ts` — width persistence + open-state

### Risks
1. **Side-panel resize collision with sidebar** — `<aside>` is sticky-left, panel is sticky-right; main content needs `min-width: 0` and flex behavior to compress gracefully
2. **One-click apply mutates predicate** — must surface undo (toast with "Undo" button or revert chip) to avoid demo accidents
3. **Scripted refinement coverage** — need ~5 hardcoded convos per artifact type; if PM ad-libs outside the keyword set, we degrade to "Let me explore this — here's a related angle" generic
4. **Ambiguous CTA hierarchy** — universal CTAs + existing chips + action_card_* may stack; design hides duplicates and ranks Confirm > universal > chip
5. **Recent threads sidebar pollution** — every contextual chat creates a thread; need to mark "scoped to segment X" so they don't crowd general "All Chats"

## Success metrics

- **Demo completes in ≤90s end-to-end** with no dead-ends
- **Reverse-edge audit**: from any artifact detail, user can reach the originating chat thread in ≤2 clicks
- **Side-panel refinement loop**: user types refine question → gets ≥3 actionable suggestions → one-click apply mutates predicate → audience count updates within 800ms
- **No 500/network errors during demo flow** (test with `pnpm dev` cold-start + 60s warmup)

## Validation criteria

- E2E walkthrough: type → board → pin → reverse to thread → new Q → segment → side-panel refine → apply → campaign → activate → monitoring banner
- Free-text robustness: 3 ad-libbed PM-style questions per stage, none dead-end
- Resize: drag side-panel from 280→520px, content reflows, no overflow
- Apply-undo: every refinement apply has visible undo for ≥5s

## Next steps & dependencies

- Lock plan via `/ck:plan` invocation immediately after this report
- Phase 1–4 are May-12 critical; Phase 5 is stretch; Phase 6 + Compose are post-demo
- Compose canvas plan needs frontmatter status fix as part of Phase 0 housekeeping
- Need to verify `query-svc` :3002 audience-count is online during demo (current journal flagged unbounded retry tail)

## Unresolved questions

1. **Side-panel mount strategy** — global app shell with route-aware visibility, or per-route mount? Global is more reusable; per-route gives finer control over auto-open triggers.
2. **One-click apply persistence** — does it call segments PATCH immediately, or stage a draft until "Save changes"? Demo cleaner with immediate apply + undo, but production-realistic is staged.
3. **Recent threads filtering** — should contextual-panel threads show in sidebar "All Chats" or live in a separate "Pinned conversations" list per artifact?
4. **Compose canvas dependency** — does post-demo plan integrate Compose's stage-stepper into the contextual panel (i.e., side-panel becomes the Compose surface), or stay separate?
