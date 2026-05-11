---
phase: 4
title: "Pre-seeded threads"
status: pending
priority: P1
effort: "1d"
dependencies: [3]
---

# Phase 4: Pre-seeded threads

## Overview

Author 4 hand-crafted demo chat threads matching the demo script. Each thread = JSON fixture with full structured response (narrative + sections + widgets + follow-ups). Loaded into chat-store on first launch (or on /reset). Includes intent-matching engine (keyword-based, no LLM) for follow-ups and free-form prompts that map to canned responses.

## Requirements

- **Functional:** 4 fixtures load on first app boot, render correctly via Phase 3 components, follow-ups + free-form prompts trigger correct responses via intent matcher
- **Non-functional:** fixtures pure JSON (no code), data realistic (matches Hermes' game/segment naming), narrative copy under 200 words per response

## Architecture

```
data/chat/
├ threads/
│   ├ thread-001-cpi-ltv-correlation.json     ← PRD UC1
│   ├ thread-002-d7-retention-facebook.json   ← PRD UC2
│   ├ thread-003-loss-streak-intervention.json ← Hermes-native
│   └ thread-004-create-segment-churn.json    ← PRD UC4
├ intents.ts        ← keyword → response-id mapping
└ canned-responses/ ← additional response fixtures triggered by follow-ups
```

Bootstrapping: `chat-store.ts` (from Phase 2) checks if `hermes.chat.v1.threads` is empty; if so, loads all `threads/*.json` and writes to localStorage.

Intent matching reuses pattern from completed plan `260510-0045-agents-compose-canvas` (keyword-matched scripted playbooks).

## Related Code Files

**Create:**
- `apps/web/src/data/chat/threads/thread-001-cpi-ltv-correlation.json`
- `apps/web/src/data/chat/threads/thread-002-d7-retention-facebook.json`
- `apps/web/src/data/chat/threads/thread-003-loss-streak-intervention.json`
- `apps/web/src/data/chat/threads/thread-004-create-segment-churn.json`
- `apps/web/src/data/chat/canned-responses/*.json` — supplementary responses for follow-ups
- `apps/web/src/data/chat/intents.ts` — keyword-array → response-id map (see PRD §7.2)
- `apps/web/src/utils/chat-bootstrap.ts` — first-boot seeding logic
- `apps/web/src/utils/chat-intent-matcher.ts` — given user text, returns response fixture id

**Modify:**
- `apps/web/src/utils/chat-store.ts` — call `bootstrapIfEmpty()` on init
- `apps/web/src/modules/chat/thread-page.tsx` — on user message submit, call `matchIntent()` → append assistant response from fixture

## Implementation Steps

1. Author `thread-001-cpi-ltv-correlation.json`:
   - User: "Does higher CPI actually produce higher LTV players? Show the correlation across channels"
   - Assistant: narrative paragraph + section "CPI vs. LTV Correlation" with 4-row table (Facebook/Admob/Moloco/Vungle) + scatter chart + section "Critical Performance Warnings" + 5 follow-ups
   - Use exact data from PRD §5.1 (`avg_cpi`, `d90_ltv`, `d90_roas`)
   - Credits: 3
2. Author `thread-002-d7-retention-facebook.json`:
   - User: "What is the D7 retention for the Facebook channel?"
   - Assistant: narrative + section "Facebook D7 Retention Performance" + line chart (months Aug'25–Feb'26) + 3 follow-ups
   - Use exact data from PRD §5.2 (`d7_retention_pct` array)
   - Credits: 3
3. Author `thread-003-loss-streak-intervention.json`:
   - User: "Players hitting consecutive ranked losses — what's the intervention pattern?"
   - Multi-turn: turn 1 = narrative + bar chart of loss-streak distribution from CFM data + follow-ups
   - Turn 2 = follow-up clicked "Show segment of high-streak players"
   - Turn 3 = action card "Create segment" → links to /segments/new pre-filled OR action card
   - Reuse copy from existing `/agents/op/cfm-loss-streak` opportunity-detail.tsx
4. Author `thread-004-create-segment-churn.json`:
   - User: "Create a segment of users who spent over $50 in the last 30 days and are at high churn risk"
   - Assistant: action card (clean ✓ "Segment created — Spent Over $50 In The Last 30 Days And Are At High Churn Risk") with View link
   - This thread's action card is the live POST trigger from Phase 5
5. Build `intents.ts`:
   - Mirror PRD §7.2 schema: `{keywords: string[], responseId: string, credits: number, action?: 'create_segment' | 'create_campaign'}`
   - Add intents for: CPI/LTV correlation, D7 retention, organic power users, net_revenue + last_active_day filters, create segment, create campaign, ranked losses, +5 generic fallbacks
6. Build `chat-intent-matcher.ts` — lowercase + tokenize user text, score against intent keyword arrays, return highest-scoring (tie-break: most-keywords-matched). Fallback: generic "I'd need more context — try one of the suggested prompts" response.
7. Build `chat-bootstrap.ts` — on first boot, load thread-*.json files via Vite `import.meta.glob`, write to localStorage with auto-generated ids
8. Wire `thread-page.tsx` user-message submit handler to `matchIntent → append response from canned-responses store`
9. Verify all 4 threads appear in sidebar `All Chats` after first boot
10. Test free-form prompt matching: type "How does CPI compare across channels?" → matches thread-001's intent → shows same response

## Success Criteria

- [ ] First app boot seeds 4 threads into localStorage
- [ ] Sidebar `All Chats` (Phase 1) shows 4 thread titles
- [ ] Click each thread → renders full response correctly via Phase 3 widgets
- [ ] Click follow-up in thread-001 (e.g. "Compare D30 across all channels") → appends new response
- [ ] Free-form prompt with similar keywords matches correct intent
- [ ] Unmatched prompt shows fallback "Try a suggested prompt" response
- [ ] Reload preserves all threads + appended turns
- [ ] `pnpm typecheck` clean

## Risk Assessment

- **Content authoring is data-work, not code:** allocate full 0.5d for copywriting. Skip thread-005 stretch goal if running over.
- **Intent matcher false positives:** if user says "create segment of churners" intends thread-004 but matches thread-003's broader "segment" keyword, ranking by keyword count helps. Test 10 paraphrases per intent.
- **Bootstrap idempotency:** must not duplicate threads if user clears localStorage selectively. Check by stable ids in fixtures (`id: "thread-001"` not random uuid).
- **Bundle size from JSON imports:** ~50kb of fixtures, acceptable.
- **Hardcoded data drift:** PRD §5 data is fictional; Hermes will eventually wire to live cfm_vn metrics. Phase 2 follow-up — flag in §9 of brainstorm.
