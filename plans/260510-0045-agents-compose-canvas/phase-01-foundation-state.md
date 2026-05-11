---
phase: 1
title: "Foundation & State"
status: pending
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: Foundation & State

## Overview

Type system, scripted-playbook data file, and the pure-reducer state machine that drives the whole Compose canvas. No UI — phases 2–5 mount on top of this. Getting this shape right de-risks every later phase.

## Requirements

- **Functional:**
  - Define `ComposeSession` shape covering intent, all 3 stage states, chat log, 4R tag, staleness flags
  - Provide a pure reducer with actions: `INTENT_SUBMIT`, `FEATURE_APPROVE`, `FEATURE_SWAP`, `FEATURE_DROP`, `STAGE_ADVANCE`, `STAGE_REOPEN`, `SEGMENT_DECISION`, `CAMPAIGN_REFINE`, `CHAT_USER_REPLY`
  - Author 5 typed playbook objects (loss-streak canonical + 4 others) keyed by keywords
  - Keyword matcher resolving free-text intent → playbook ID (or `null` for fallback)
  - 4R inference function deriving the auto-tag from playbook + keywords
- **Non-functional:**
  - Pure functions only (no React, no effects). Unit-testable.
  - File ≤ 200 lines each; if a single file exceeds, split by concern.
  - Strict TypeScript; no `any` in public types.

## Architecture

```
apps/web/src/modules/agents/compose/
  _state/
    compose-types.ts           ← types only (~120 lines)
    compose-reducer.ts         ← pure reducer (~180 lines)
    keyword-matcher.ts         ← intent → playbook (~80 lines)
    four-r-inference.ts        ← playbook + intent → 4R tag (~50 lines)

apps/web/src/data/catalog/agents/
  compose-playbooks.ts         ← 5 typed playbook objects (~400 lines, exempted from 200 LOC rule as data file)
```

### `ComposeSession` shape (canonical)

```ts
export interface ComposeSession {
  id: string;                          // sa-2026-0510-{nanoid}
  intent: string;                      // raw user text
  matchedPlaybook: PlaybookId | null;  // null when fallback
  fourR: { tag: '4r-retain' | '4r-revenue' | '4r-reactivate' | '4r-recruit'; alignment: number } | null;
  activeStage: 'features' | 'segment' | 'campaign';
  stages: {
    features: StageFeatures;
    segment:  StageSegment;
    campaign: StageCampaign;
  };
  chatLog: ChatEntry[];
  startedAt: string;                   // ISO
}

interface StageFeatures {
  status: 'idle' | 'proposing' | 'reviewing' | 'approved' | 'stale';
  proposed: ProposedFeatureRow[];
  approved: ApprovedFeatureRow[];
}

interface StageSegment {
  status: 'idle' | 'computing' | 'reviewing' | 'approved' | 'stale';
  predicate: PredicateGroup[] | null;
  audienceCount: number | null;
  matchedExistingSegmentId: string | null;
  decision: 'new-draft' | 'use-existing' | 'manual-edit' | null;
}

interface StageCampaign {
  status: 'idle' | 'reviewing' | 'approved' | 'stale';
  template: CampaignTemplate | null;
  refinements: string[];           // user free-text refinements applied
}
```

### Playbook shape

```ts
export interface Playbook {
  id: PlaybookId;                       // 'loss-streak' | 'whale-dormancy' | …
  keywords: string[];                   // matched against intent (case-insensitive)
  patternName: string;                  // "frustration-rescue" — flavor text only
  fourR: { tag: FourRTag; alignment: number };
  proposedFeatures: ProposedFeatureRow[];
  segmentMatch: { existingId: string | null; threshold: { feature: string; op: string; value: number } };
  campaignTemplate: CampaignTemplate;
  scriptedReplies: { trigger: string /* keyword */; agent: string /* response */ }[];
}
```

## Related Code Files

- **Create:**
  - `apps/web/src/modules/agents/compose/_state/compose-types.ts`
  - `apps/web/src/modules/agents/compose/_state/compose-reducer.ts`
  - `apps/web/src/modules/agents/compose/_state/keyword-matcher.ts`
  - `apps/web/src/modules/agents/compose/_state/four-r-inference.ts`
  - `apps/web/src/data/catalog/agents/compose-playbooks.ts`
  - `apps/web/src/modules/agents/compose/_state/compose-reducer.test.ts` (optional but cheap insurance)
- **Modify:**
  - `apps/web/src/data/catalog/agents/index.ts` — export playbooks
- **Reuse:**
  - `apps/web/src/data/catalog/segments.ts` — `seg-cfm-loss-streak-non-paying-2026-0508-a3f9` referenced by canonical playbook

## Implementation Steps

1. Write `compose-types.ts` with the canonical session shape above. Export every interface.
2. Write `compose-playbooks.ts` with the loss-streak playbook fully populated (all real feature IDs, real segment ID, scripted replies for `generous`/`payer`/`don't spam` triggers). Stub the other 4 playbooks with `keywords` + `patternName` + minimal proposed features (Phase 7 fills them out).
3. Write `keyword-matcher.ts`: lowercase intent, match against each playbook's keyword list, return first hit or `null`. Tie-break by keyword count.
4. Write `four-r-inference.ts`: trivial — read from `playbook.fourR`. Fallback heuristic for null playbook (default `4r-retain`).
5. Write `compose-reducer.ts`. Each action returns a new session. Mark downstream stages `stale` whenever an upstream stage changes after first approval. Append to `chatLog` on user actions per spec in decision #9.
6. Write 3–4 unit tests for the reducer covering: initial intent submit, feature approve → stage advance, hop-back marks downstream stale, swap during stale auto-recomputes.
7. Run `pnpm typecheck` from repo root. Resolve any errors.

## Success Criteria

- [ ] All 5 type files compile with `pnpm typecheck`
- [ ] `compose-playbooks.ts` has 1 fully-populated playbook (loss-streak) and 4 keyword-only stubs
- [ ] Reducer unit tests pass: initial submit, approve flow, hop-back staleness, swap-during-stale
- [ ] `keyword-matcher.ts` returns `'loss-streak'` for input `"players are losing 5+ ranked matches in a row"`
- [ ] No file exceeds 200 LOC except `compose-playbooks.ts` (data file)
- [ ] Exports wired through `apps/web/src/data/catalog/agents/index.ts`

## Risk Assessment

- **Risk:** State shape decisions made now constrain phases 2–5. **Mitigation:** review `ComposeSession` shape in this phase before writing reducer; iterate on it once with a sketched stage component to validate.
- **Risk:** Keyword matcher too greedy or too narrow. **Mitigation:** unit-test against 5–10 sample intents; refine keyword sets per playbook.
- **Risk:** `compose-playbooks.ts` becomes a 400+ line monster hard to reason about. **Mitigation:** acceptable for a typed data file; if it grows past ~600 lines, split per playbook into `_playbooks/{id}.ts`.

## Notes for Phase 2+

- Phase 2 mounts the reducer via `React.useReducer` inside `compose-page.tsx`
- Phase 2's intent submit calls `keywordMatcher(intent)` then dispatches `INTENT_SUBMIT`
- Phases 3/4/5 each consume one stage's slice; never read other stages directly
