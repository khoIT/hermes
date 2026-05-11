---
phase: 2
title: "P4 Learn from Portfolio"
status: pending
priority: P1
effort: "3-4h"
dependencies: [1]
---

# Phase 2: P4 Learn from Portfolio

## Overview

Make cross-game pattern learning **passive** — surfaced where Studios already
look, not on a separate Patterns page. Four overlays: portfolio rail under
every assistant draft, portfolio chip on segment match-bar, "Forked from"
attribution on campaign archetype-card, 5-game lift mini-bar on pattern-card
hover.

Reuses fixture file from Phase 1; pattern → game-lift map added.

## Requirements

- **Functional:**
  - Every assistant draft (in chat) shows a `Similar in portfolio` rail with
    2–3 mini pattern cards underneath the action card.
  - Each mini card has a `Fork →` action that forks the pattern into the
    current draft (open campaign canvas pre-populated; for demo, just navigate).
  - Segment `match-bar` row shows a chip "matches pattern: <name>" when applicable.
  - Campaign `archetype-card` shows "Forked from <pattern>" attribution when applicable.
  - Hovering a `pattern-card` reveals a 5-game lift mini-bar
    (PTG / CFM / NTH / TF / COS with lift% each).
- **Non-functional:**
  - Reuse existing `pattern-card.tsx`, `materials-shelf.tsx` (similar pattern), `archetype-card.tsx`.
  - One new fixture: `data/catalog/portfolio-patterns.ts` with 4–6 patterns + per-game lifts.

## Architecture

```
data/catalog/portfolio-patterns.ts    ← NEW: pattern definitions + per-game lifts
   │  Pattern { id, name, sourceGame, lifts: Record<Game, number>, summary, … }
   ▼
components/portfolio/                 ← NEW directory
  similar-in-portfolio-rail.tsx       ← shelf of 2-3 mini pattern cards under chat draft
  pattern-card-lifts-popover.tsx      ← 5-game mini-bar shown on hover
  forked-from-tag.tsx                 ← inline attribution line

mounted in:
  - chat/assistant-response.tsx             (rail appears after action card)
  - segments/_components/match-bar.tsx      (portfolio chip)
  - segments/_components/pattern-card.tsx   (hover lifts mini-bar)
  - campaigns/_components/archetype-card.tsx (forked-from tag)
```

## Related Code Files

**Create:**
- `apps/web/src/data/catalog/portfolio-patterns.ts` — pattern fixtures.
- `apps/web/src/components/portfolio/similar-in-portfolio-rail.tsx`
- `apps/web/src/components/portfolio/pattern-card-lifts-popover.tsx`
- `apps/web/src/components/portfolio/forked-from-tag.tsx`
- `apps/web/src/components/portfolio/index.ts`

**Modify:**
- `apps/web/src/components/chat/assistant-response.tsx` — append rail under action-card.
- `apps/web/src/modules/segments/_components/match-bar.tsx` — render portfolio chip when match.
- `apps/web/src/modules/segments/_components/pattern-card.tsx` — wire hover → lifts popover.
- `apps/web/src/modules/campaigns/_components/archetype-card.tsx` — render forked-from tag.

**Optional thread update:**
- One of the two demo threads (`thread-demo-agent-livops-2026` preferred) gets a "Fork from CFM Rank Protection" beat to make the rail interactive during demo.

## Implementation Steps

1. **Define `portfolio-patterns.ts`.**
   ```ts
   export type Game = 'PTG' | 'CFM' | 'NTH' | 'TF' | 'COS';
   export interface PortfolioPattern {
     id: string;
     name: string;                          // "CFM Rank Protection"
     sourceGame: Game;
     summary: string;                       // 1-line description
     lifts: Partial<Record<Game, number>>;  // % lift per game shipped
     usCount: number;                       // total uses across portfolio
   }
   export const PORTFOLIO_PATTERNS: PortfolioPattern[] = [ /* 4–6 entries */ ];
   ```
   Seed: `CFM Rank Protection`, `Cookie Run Comeback Bundle`, `PTG Anniversary IAM`,
   `NTH Whale Reactivation`, `TF Newbie Onboarding Loop`.

2. **Build `SimilarInPortfolioRail`.**
   Props: `{ relatedTo: string }` (segment / campaign id; for the demo we hand-pick which patterns appear). Renders 2–3 mini cards in a horizontal scroll. Each card: pattern name, source game, "+14% lift" headline, `Fork →` button.

3. **Mount rail under assistant draft.**
   In `assistant-response.tsx`, after the action-card block, if the response has a `relatedPatternIds?: string[]` field on the assistant message fixture, render `<SimilarInPortfolioRail …/>`. Update one or two existing thread fixtures to populate `relatedPatternIds` so it shows live.

4. **Portfolio chip in `match-bar`.**
   Extend match-bar to optionally show a small pill next to the count: "matches: CFM Rank Protection". Wire via an optional `matchedPatternId` prop on `match-bar.tsx`; populate from segment fixture for one demo segment.

5. **`PatternCardLiftsPopover` on hover.**
   Wrap `pattern-card.tsx` hover in a small popover showing the 5-game lift mini-bar (use simple inline bars, no chart lib needed; `T.fMono` numbers). Bars share a common max-width scaled to highest lift in the set.

6. **`ForkedFromTag` on `archetype-card`.**
   When campaign was forked from a pattern (fixture flag), render an inline line "Forked from CFM Rank Protection · adapted by Apollo for PTG" under the title. Tiny, italic, `T.n500`.

7. **Smoke run.**
   Walk choreography steps 5, 6 — confirm rail appears under the assistant proposal, click Fork → land on canvas with "Forked from …" tag; hover the pattern card → 5-game mini-bar appears.

## Success Criteria (visually verifiable)

- [ ] Assistant draft in `thread-demo-agent-livops-2026` shows `Similar in portfolio` rail with 2–3 mini cards.
- [ ] Clicking `Fork →` navigates to the corresponding campaign canvas; canvas shows "Forked from …" tag.
- [ ] One demo segment shows portfolio chip in its match-bar row.
- [ ] Hover any pattern card → 5-game lift mini-bar visible.
- [ ] No layout regression in chat thread scroll (rail must not push CTA off-screen).

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Rail competes with action card for attention | Visually subordinate: smaller cards, lighter background, below action card not beside. |
| Hover popover causes flicker | Use simple CSS `:hover` + small delay; no react-popper needed. |
| "Forked from" tag adds visual noise on cards that aren't forked | Conditional render: only show when fixture flag set. |
| Per-game lifts feel made up | Vary numbers across patterns; some patterns missing data on some games (realistic). |
