---
phase: 2
title: "Multi-turn registry + 4 scripted flows"
status: pending
priority: P1
effort: "6h"
dependencies: [1]
---

# Phase 2: Multi-turn registry + 4 scripted flows

## Overview

Replace 5 generic landing prompts with 4 categorized scripted prompts (2 research, 2 segment). Build a guided multi-turn experience: each prompt plays in 3 turns advanced via follow-up chips. Terminal artifacts: research → `pin_to_board` (auto-create board); segment → `action_card_segment` → navigate to `/segments/:id`. Hybrid plumbing: `<FeatureChip>` calls real `catalog-api /api/v1/features/:name` with hardcoded fallback on 5xx.

## Requirements

**Functional:**
- 4 thread fixtures, 3 turns each:
  - **thread-005-pt6-gem-burn-research** (research → Board): PT-6 vs PT-10 gem-burn comparison → drill into hoarder → Pin to "PT Liveops Board"
  - **thread-006-cfm-tier-roi-research** (research → Board): CFM-11 year-end tier ROI → YoY comparison → Pin to "CFM Liveops Board"
  - **thread-007-cfm-loss-streak-multi** (features → Segment, supersedes thread-003): consecutive ranked losses → 3 FeatureChips → Build segment ~52,600 UIDs
  - **thread-008-pt-whale-recall** (features → Segment): at-risk PT whales → 3 FeatureChips → Build segment ~1,840 UIDs
- Multi-turn registry: `Map<(threadId, lastUserMessageText), AssistantMessage>` lookup table; clicking a follow-up chip appends user msg + next pre-baked assistant msg.
- New section types: `feature_chip`, `pin_to_board`, `soft_hint`.
- `<FeatureChip name>`: fetches `/api/v1/features/:name` from catalog-api; loading skeleton → success card OR fallback hardcoded card from `data/catalog/features/index.ts` on 5xx; click → `navigate('/feature-store/:name')`.
- `<PinToBoardSection boardName widgetSnapshotId>`: thin wrapper over existing `pin-to-board-popover`; auto-creates board if name doesn't exist; persists in board store; renders "Saved to {boardName}" with link to `/canvas/{boardId}`.
- `<SoftHint text>`: inline message rendered when free-text mid-flow doesn't match registry; falls through to existing intent matcher.
- `SUGGESTED_PROMPTS` reduced to 4 entries with `category: 'research' | 'segment'` field.
- Existing `thread-003-loss-streak.ts` deleted (superseded by thread-007).

**Non-functional:**
- FeatureChip: 80×32 skeleton during fetch; 240×88 card on success/fallback; click → same-tab navigate.
- Pin-to-board: `T.brand` accent on success message; link styled as inline anchor.
- Soft hint: muted text (`T.n500`), inline above the input, dismisses on next assistant message.
- Multi-turn click-to-render <200ms (canned data, synchronous lookup).
- Registry keying: `(threadId, lastUserMessageText)` — simpler than step-index bookkeeping.
- catalog-api fallback path NEVER throws — fetch wrapped in try/catch; 5xx OR network error both trigger hardcoded fallback.

## Architecture

### Multi-turn registry

```ts
// data/chat/multi-turn-registry.ts
import type { AssistantMessage } from '../../utils/chat-store';

type RegistryKey = string; // `${threadId}::${lastUserMessageText}`
type RegistryValue = { assistantMsg: AssistantMessage; isTerminal?: boolean };

const REGISTRY = new Map<RegistryKey, RegistryValue>([
  // thread-005 PT-6 gem-burn
  [`thread-005::Drill into hoarder segment`, { assistantMsg: pt6Turn2Hoarder }],
  [`thread-005::Compare F2P vs hoarder`,     { assistantMsg: pt6Turn2F2PVsHoarder }],
  [`thread-005::Show drop-table parity audit`, { assistantMsg: pt6Turn2Parity }],
  [`thread-005::Pin to PT Liveops Board`,    { assistantMsg: pt6Turn3Pin, isTerminal: true }],
  // thread-006, 007, 008 ...
]);

export function lookupNextTurn(threadId: string, userText: string): RegistryValue | null {
  return REGISTRY.get(`${threadId}::${userText}`) ?? null;
}
```

Each user-message follow-up chip in turn N maps to one or more pre-baked turn N+1 assistant messages. Branching is supported by registering multiple keys per (threadId, possible-user-text).

### Section type extensions

```ts
// data/chat/response-types.ts (add to existing union)

export interface FeatureChipPayload {
  featureName: string;
}
export interface PinToBoardPayload {
  boardName: string;          // 'PT Liveops Board' | 'CFM Liveops Board'
  widgetSnapshotId: string;   // references the prior widget in this thread to pin
}
export interface SoftHintPayload {
  text: string;               // 'Try one of the follow-ups above — I'm running pre-scripted demos for now'
}

// Append to Section discriminated union:
//   | { type: 'feature_chip'; payload: FeatureChipPayload }
//   | { type: 'pin_to_board'; payload: PinToBoardPayload }
//   | { type: 'soft_hint';    payload: SoftHintPayload }
```

### FeatureChip widget

```tsx
// components/chat/widgets/feature-chip.tsx
export function FeatureChip({ name }: { name: string }) {
  const [state, setState] = useState<'loading' | 'success' | 'fallback'>('loading');
  const [data, setData] = useState<HermesFeature | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/features/${name}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(json => { if (!cancelled) { setData(json); setState('success'); } })
      .catch(() => {
        if (cancelled) return;
        const fallback = ALL_FEATURES.find(f => f.name === name);
        if (fallback) { setData(fallback); setState('fallback'); }
      });
    return () => { cancelled = true; };
  }, [name]);

  if (state === 'loading') return <Skeleton width={240} height={88} />;
  if (!data) return null;
  return (
    <button onClick={() => navigate(`/feature-store/${name}`)} style={{ ... }}>
      <DomainBadge domain={data.domainGroup ?? data.domain} />
      <span>{data.name}</span>
      <LatencyBadge latency={data.latency} />
      <p>{data.description}</p>
      {state === 'fallback' && <span style={{ fontSize: 10, color: T.n500 }}>· cached</span>}
    </button>
  );
}
```

### Pin-to-board section

```tsx
// components/chat/sections/pin-to-board-section.tsx
export function PinToBoardSection({ boardName, widgetSnapshotId }: PinToBoardPayload) {
  const [state, setState] = useState<'idle' | 'pinned'>('idle');
  const [boardId, setBoardId] = useState<string | null>(null);

  const onPin = () => {
    let board = findBoardByName(boardName);
    if (!board) board = createBoard({ name: boardName });
    pinWidgetToBoard(board.id, widgetSnapshotId);
    setBoardId(board.id);
    setState('pinned');
  };

  if (state === 'idle') {
    return (
      <button onClick={onPin} style={{ ... }}>
        Pin to {boardName} →
      </button>
    );
  }
  return (
    <div>
      Saved to <a href={`/canvas/${boardId}`}>{boardName}</a>
    </div>
  );
}
```

### Updated chat-respond flow

```ts
// utils/chat-respond.ts (extended)
export function respondToText(text: string, threadId?: string): AssistantMessage {
  // 1. Multi-turn registry lookup (if threadId provided)
  if (threadId) {
    const next = lookupNextTurn(threadId, text);
    if (next) return next.assistantMsg;
  }

  // 2. Existing intent matcher (handles initial prompts: thread-005..008 + legacy)
  const intentMatch = matchIntent(text);
  if (intentMatch) return intentMatch.assistantMsg;

  // 3. Soft hint fallthrough
  return {
    id: nanoid(),
    role: 'assistant',
    createdAt: new Date().toISOString(),
    sections: [{
      type: 'soft_hint',
      payload: { text: "Try one of the follow-ups above — I'm running pre-scripted demos for now" },
    }],
  };
}
```

### 4 scripted flows (script outlines)

**thread-005-pt6-gem-burn-research** (research → PT Liveops Board)

| Turn | User text | Assistant sections |
|---|---|---|
| T1 | "Compare PT-6 vs PT-10 gem-burn — did the hoarder branch drain stockpiles?" | narrative + h2 + bar widget (Avg gem-balance Δ before/after by VIP segment) + insights (3) + followUps: ["Drill into hoarder segment", "Compare F2P vs hoarder", "Show drop-table parity audit"] |
| T2a | "Drill into hoarder segment" | narrative + line widget (Hoarder gem-balance trajectory · 30d bracketing PT-6) + insights (2) + followUps: ["Pin to PT Liveops Board"] |
| T3 | "Pin to PT Liveops Board" | narrative + pin_to_board section (boardName: "PT Liveops Board", widgetSnapshotId: ref to T2 line chart) |

**thread-006-cfm-tier-roi-research** (research → CFM Liveops Board)

| Turn | User text | Assistant sections |
|---|---|---|
| T1 | "How are CFM-11 year-end tiers performing on reward-cost vs retention?" | narrative + h2 + bar widget (Reward cost · ARPDAU · D14 retention by tier — stacked) + insights (3) + followUps: ["Compare to last year", "Show tier population shift", "Drill into NRU tier"] |
| T2 | "Compare to last year" | narrative + line widget (YoY tier × retention · Dec 2025 vs Dec 2026) + insights (2) + followUps: ["Pin to CFM Liveops Board"] |
| T3 | "Pin to CFM Liveops Board" | narrative + pin_to_board section (boardName: "CFM Liveops Board") |

**thread-007-cfm-loss-streak-multi** (features → Segment, supersedes thread-003)

| Turn | User text | Assistant sections |
|---|---|---|
| T1 | "Players hitting consecutive ranked losses — how to intervene?" | narrative + h2 + bar widget (Streak distribution last 14d) + insights (3) + followUps: ["Show me the features", "Filter by non-paying tenure ≥ 7d", "Past A/B results"] |
| T2 | "Show me the features" | narrative + 3× feature_chip (consecutive_ranked_losses_streak, is_paying_user_lifetime, iam_received_count_24h) + narrative on combining them + followUps: ["Build segment from these features"] |
| T3 | "Build segment from these features" | narrative + action_card_segment (name: "CFM · 5+ Loss Streak · Non-paying · 24h cooldown", description: "consecutive_ranked_losses_streak ≥ 5 AND is_paying_user_lifetime = false AND iam_received_count_24h < 1", audienceSize: 52600) |

**thread-008-pt-whale-recall** (features → Segment)

| Turn | User text | Assistant sections |
|---|---|---|
| T1 | "Find at-risk PT whales who haven't logged in this week" | narrative + h2 + bar widget (Whale-tier login distribution last 30d) + insights (3) + followUps: ["Show me the features", "Tighten cohort", "Compare to active whales"] |
| T2 | "Show me the features" | narrative + 3× feature_chip (spend_tier_lifetime, last_login_days_ago, lifetime_revenue_local) + narrative + followUps: ["Build at-risk whale segment"] |
| T3 | "Build at-risk whale segment" | narrative + action_card_segment (name: "PT · At-risk Whales · last login 7-14d", audienceSize: 1840) |

### SUGGESTED_PROMPTS replacement

```ts
// data/chat/suggested-prompts.ts
export type PromptCategory = 'research' | 'segment';
export interface SuggestedPrompt {
  id: string;
  text: string;
  category: PromptCategory;
  threadId: string; // maps to thread-005..008
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: 'pt6-gem-burn',  category: 'research', threadId: 'thread-005',
    text: 'Compare PT-6 vs PT-10 gem-burn — did the hoarder branch drain stockpiles?' },
  { id: 'cfm-tier-roi',  category: 'research', threadId: 'thread-006',
    text: 'How are CFM-11 year-end tiers performing on reward-cost vs retention?' },
  { id: 'cfm-loss-streak', category: 'segment', threadId: 'thread-007',
    text: 'Players hitting consecutive ranked losses — how to intervene?' },
  { id: 'pt-whale-recall', category: 'segment', threadId: 'thread-008',
    text: 'Find at-risk PT whales who haven\'t logged in this week' },
];
```

## Related Code Files

**Create:**
- `apps/web/src/data/chat/threads/thread-005-pt6-gem-burn-research.ts`
- `apps/web/src/data/chat/threads/thread-006-cfm-tier-roi-research.ts`
- `apps/web/src/data/chat/threads/thread-007-cfm-loss-streak-multi.ts`
- `apps/web/src/data/chat/threads/thread-008-pt-whale-recall.ts`
- `apps/web/src/data/chat/multi-turn-registry.ts`
- `apps/web/src/components/chat/widgets/feature-chip.tsx`
- `apps/web/src/components/chat/sections/pin-to-board-section.tsx`
- `apps/web/src/components/chat/sections/soft-hint.tsx`

**Modify:**
- `apps/web/src/data/chat/suggested-prompts.ts` — replace 5 entries with 4 categorized + `category` + `threadId` fields
- `apps/web/src/data/chat/response-types.ts` — add `feature_chip`, `pin_to_board`, `soft_hint` to Section union
- `apps/web/src/utils/chat-respond.ts` — route via multi-turn registry first, then intent matcher, then soft-hint fallback
- `apps/web/src/components/chat/assistant-response.tsx` — render new section types
- `apps/web/src/data/chat/intents.ts` — extend matcher for the 4 new initial prompts (thread-005..008 entry triggers)

**Delete:**
- `apps/web/src/data/chat/threads/thread-003-loss-streak.ts` — superseded by thread-007

## Implementation Steps

1. **Section types** — extend `response-types.ts` union with `feature_chip`, `pin_to_board`, `soft_hint`. Add payload interfaces.
2. **FeatureChip widget** — `widgets/feature-chip.tsx`. Fetch with try/catch fallback to `ALL_FEATURES`. Loading skeleton + success/fallback card. Click → navigate.
3. **PinToBoardSection** — `sections/pin-to-board-section.tsx`. Auto-create board if name not found. Show "Saved to {boardName}" + link after pin. Reuse existing `pin-to-board-popover` internals if helpful, or implement directly via board store.
4. **SoftHint** — `sections/soft-hint.tsx`. Muted inline message; T.n500 color; small bottom margin.
5. **AssistantResponse** — render branches for new section types.
6. **Multi-turn registry** — `multi-turn-registry.ts` with `lookupNextTurn(threadId, userText)`. Imports the 4 thread fixtures and registers all (threadId, followUpText) → next-turn entries.
7. **Thread fixtures** — write all 4 thread fixtures with full T1/T2/T3 content per script outline. Each fixture exports: initial Conversation (T1 only) + named exports for each subsequent turn (used by registry).
8. **chat-respond.ts** — extend to accept optional `threadId` param. Order: registry → intent matcher → soft-hint.
9. **suggested-prompts.ts** — replace with 4 categorized entries.
10. **intents.ts** — register matchers for the 4 new initial prompt texts mapping to thread-005..008.
11. **Delete thread-003-loss-streak.ts** — and any imports referencing it.
12. **Verify** — manually walk every flow: click each prompt → T1 renders → click follow-up → T2 renders → click final → T3 terminal artifact reached. Confirm catalog-api FeatureChip renders. Disable network → confirm fallback card shows. Type free-text mid-flow → soft-hint appears.

## Success Criteria

- [ ] 4 prompts in `SUGGESTED_PROMPTS` with `category` and `threadId` fields
- [ ] thread-003-loss-streak.ts deleted; no broken imports
- [ ] thread-005..008 fixtures present with 3 turns each
- [ ] Multi-turn registry resolves every (threadId, followUpText) → next assistant message
- [ ] Each scripted flow reaches its terminal artifact in 3 turns
- [ ] Both research flows produce a chart pinned to a Board, viewable at `/canvas/:id` (auto-created if missing)
- [ ] Both segment flows produce an `action_card_segment` confirmable to `/segments/:id`
- [ ] FeatureChip fetches from real catalog-api when available; falls back to hardcoded card on 5xx (test by killing catalog-api)
- [ ] Each segment flow shows ≥3 real catalog-api FeatureChips on T2
- [ ] Free-text mid-flow renders soft-hint then falls through to existing matcher
- [ ] Multi-turn click-to-render <200ms per turn
- [ ] `pnpm typecheck` passes for `apps/web`
- [ ] No regression on thread-001, thread-002, thread-004

## Risk Assessment

| Risk | Mitigation |
|---|---|
| catalog-api 5xx flakes (recurring HTTP 500) | FeatureChip wraps fetch in try/catch; falls back to hardcoded card from `ALL_FEATURES`. Demo never breaks. |
| User clicks a follow-up that maps to multiple branches | Registry uses exact-text match; if multiple entries needed for branching, register multiple unique follow-up texts. |
| Free-text input hits a phrase that accidentally matches a registered registry key | Registry keys are scripted follow-ups (full-sentence); collision unlikely. If discovered, prefix registry keys with `→` marker invisible to user. |
| Pin-to-board auto-creates duplicate boards on retry | `findBoardByName` first; only create if missing. Idempotent. |
| Pin-to-board ties widget to a snapshot ID that doesn't exist | The widgetSnapshotId references the previous widget in same thread; resolved at pin time from the active conversation. Hardcode the snapshot for each thread fixture if needed. |
| Action_card_segment Confirm flow already proven (thread-004) | Reuse existing path verbatim — no new failure mode. |
| Multi-turn registry maintenance burden | 4 threads × 3 turns × ~3 chip variations = up to 36 entries. Acceptable for v1. Group by thread for legibility. |
| thread-003 deletion breaks recent-items store | Existing recent-items entries with `id: thread-003` will dangle. On store load, filter out missing thread IDs. |
| FeatureChip card click navigates away from rail context | Page-context chip auto-updates to new feature (rail follows). Verified in P1 spec. |
| Streaming/loading flicker on FeatureChip | 240×88 skeleton matches success card dimensions; no layout shift. |
| User clicks "Build segment" twice → 2 segments created | Disable button after first click; idempotent action. |
