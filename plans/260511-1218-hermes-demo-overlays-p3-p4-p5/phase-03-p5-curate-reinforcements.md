---
phase: 3
title: "P5 Curate Reinforcements"
status: pending
priority: P2
effort: "2-3h"
dependencies: [1]
---

# Phase 3: P5 Curate Reinforcements

## Overview

Small, high-visibility additions so the **curate-not-author** posture is
unmistakable from second 0 of the demo. Three items: timestamp + Apollo avatar
on every action card; inbox count badge in chat-rail header; drift chip on
monitoring + one scripted drift turn in the livops thread.

P5 is already "OK" per Khoi — this phase just makes it loud.

## Requirements

- **Functional:**
  - Every action-card (campaign + segment, regardless of status) shows
    `Proposed by Apollo · Xm ago` attribution row.
  - Chat-rail header carries an inbox count badge:
    `3 proposals · 1 drift · 2 awaiting review`.
  - `monitoring.tsx` shows a drift chip on one Live campaign — "fire rate ↓42%
    vs last 7d · Apollo flagged" — clickable, expanding Apollo's reasoning.
  - `thread-demo-agent-livops-2026` gets one new scripted turn at the start
    where Apollo flags the drift, with Approve / Investigate / Dismiss CTAs.
- **Non-functional:**
  - Reuse `agent-attribution.tsx`, `drift-badge.tsx`, `agent-reasoning-panel.tsx`.
  - Inbox badge numbers come from a single fixture (re-use existing
    `data/catalog/agents/activity.ts` or extend it).

## Architecture

```
chat/action-cards/action-card-shell.tsx     ← add attribution row at top
chat-rail/chat-rail-header.tsx              ← add inbox count badge slot
campaigns/monitoring.tsx                    ← drift chip on one campaign row
data/chat/threads/thread-demo-agent-livops-2026.ts  ← prepend drift turn
data/catalog/agents/activity.ts             ← extend with inbox counts struct
```

No new files required (or at most one tiny `inbox-count-badge.tsx` helper).

## Related Code Files

**Modify:**
- `apps/web/src/components/chat/action-cards/action-card-shell.tsx` — render `<AgentAttribution agent="apollo" at={…} />` row above kind/name.
- `apps/web/src/components/chat-rail/chat-rail-header.tsx` — accept optional `inboxCounts?: { proposals: number; drift: number; awaiting: number }` prop, render below subtitle as a single inline badge.
- `apps/web/src/components/chat-rail/chat-rail.tsx` (caller) — pass counts from fixture.
- `apps/web/src/modules/campaigns/monitoring.tsx` — render `<DriftBadge>` on one row + click handler expanding reasoning.
- `apps/web/src/data/chat/threads/thread-demo-agent-livops-2026.ts` — prepend drift-flag assistant turn at thread start.
- `apps/web/src/data/catalog/agents/activity.ts` — add `inboxCounts` export.

**Create (only if attribution row needs custom wrapper):**
- `apps/web/src/components/chat-rail/inbox-count-badge.tsx` — visual badge.

## Implementation Steps

1. **Add attribution row to `ActionCardShell`.**
   Always render a top row inside the card:
   `<AgentAttribution agent="apollo" at={ISO timestamp} />` showing avatar
   + "Proposed by Apollo · 14m ago". `at` defaults to "now - 14m" for demo
   if not provided. Hidden when status === 'confirmed' (already has its own
   confirmation row).

2. **Extend `activity.ts` with inbox counts.**
   ```ts
   export const HERMES_INBOX_COUNTS = {
     proposals: 3,
     drift: 1,
     awaiting: 2,
   };
   ```

3. **Render badge in `ChatRailHeader`.**
   Add optional `inboxCounts` prop. When set, render a small badge below the
   subtitle row: `3 proposals · 1 drift · 2 awaiting`. Use `T.fMono` numbers,
   color drift in `T.amber` or `T.red`. Pass via `chat-rail.tsx` from the
   fixture import.

4. **Drift chip on monitoring.**
   Pick one campaign row in `monitoring.tsx` fixtures (the CFM Pass Stuck if
   present, else any live one). Render `<DriftBadge severity="warn">fire rate
   ↓42% vs 7d</DriftBadge>` inline with the campaign row. Click → expand a
   reasoning panel under the row citing Apollo's analysis (1–2 sentences).

5. **Prepend drift turn to livops thread.**
   In `thread-demo-agent-livops-2026.ts`, add a new first assistant turn:
   "Apollo here — I noticed CFM Pass Stuck fire rate dropped 42% in the last 7
   days vs prior period. Want me to dig in?" with three CTAs: Approve / Investigate / Dismiss. Investigate routes to the next existing turn (no logic change downstream).

6. **Smoke run.**
   Walk choreography steps 1, 2, 3 — confirm:
   - Inbox badge shows `3 proposals · 1 drift · 2 awaiting` on chat-rail open.
   - Drift item exists somewhere visible (consider also wiring it into
     `HermesNoticedPanel` if a slot is free, but not required).
   - Clicking drift opens livops thread with Apollo's drift turn first.
   - Every action card across both demo threads shows `Proposed by Apollo · Xm ago`.

## Success Criteria (visually verifiable)

- [ ] Inbox count badge visible in chat-rail header on every page.
- [ ] Every action-card (preview state) shows Apollo attribution row at top.
- [ ] Monitoring page shows at least one drift chip; click reveals reasoning.
- [ ] `thread-demo-agent-livops-2026` opens with a drift-flag turn from Apollo.
- [ ] No regressions on existing thread auto-play or scripted flows.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Attribution row makes action cards too tall on narrow chat-rail | Use minimal height (24px), single line, avatar 16px. |
| Inbox badge numbers feel static across demo run | Counts can stay static — they describe state, not changes. Acceptable. |
| Drift turn change breaks existing auto-play timing | Insert as turn 0 (prepend), keep rest unchanged; replay existing arc after Investigate click. |
| Drift on monitoring conflicts with a real production metric badge | Demo is fixture-driven; no real metric source to conflict with. |
