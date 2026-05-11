---
phase: 1
title: "P3 Show the Math"
status: pending
priority: P1
effort: "6-8h"
dependencies: []
---

# Phase 1: P3 Show the Math

## Overview

Build a single persistent **math strip** that travels with every Campaign /
Segment artifact across chat action cards, segment detail header, campaign
canvas / prelaunch / monitoring. Same numbers, same labels, every surface.
Numbers read from one fixture file (single source of truth, DRY).

This phase is the **foundation** — P4 and P5 reuse the strip and the fixture
file. Ship this first.

## Requirements

- **Functional:**
  - Strip renders 4 chips on narrow surfaces (chat action card), 5–6 on full pages.
  - Strip uses identical chip order + labels every surface.
  - Hover/click `Audience` or `Expected lift` chip → "Why this number?" popover
    showing the features that ground the metric.
  - Sparkline (14d trend) next to `Audience` chip when in full-page mode.
  - "Illustrative" pill always visible on the strip (non-dismissible).
- **Non-functional:**
  - Reuse `sparkline.tsx`, `agent-reasoning-panel.tsx`, theme tokens (`T.*`).
  - KISS: one strip component, one fixture map, no per-surface duplication.
  - Strip must accept `compact?: boolean` to swap between narrow / full layouts.

## Architecture

```
data/catalog/demo-numbers.ts        ← NEW: single source of truth
   │  Map<campaignOrSegmentId, MathStripNumbers>
   ▼
components/math-strip/math-strip.tsx           ← NEW: presentational
components/math-strip/why-this-number-popover.tsx ← NEW: reasoning popover

mounted in:
  - chat/action-cards/action-card-shell.tsx           (compact, above content)
  - segments/_components/detail-header.tsx            (full)
  - campaigns/canvas/...                              (full)
  - campaigns/prelaunch.tsx                           (full)
  - campaigns/monitoring.tsx                          (full)
```

**Chip metric set:**
`Audience` (+sparkline in full mode) · `Fire rate` · `Cost/day` ·
`Expected lift (CI)` · `Goal: <4R>` · `Illustrative` pill.

Compact (chat card) = first 3 chips + Illustrative pill, no sparkline.

## Related Code Files

**Create:**
- `apps/web/src/data/catalog/demo-numbers.ts` — fixture map keyed by id.
- `apps/web/src/components/math-strip/math-strip.tsx` — strip component.
- `apps/web/src/components/math-strip/why-this-number-popover.tsx` — popover.
- `apps/web/src/components/math-strip/index.ts` — barrel.

**Modify:**
- `apps/web/src/components/chat/action-cards/action-card-shell.tsx` — render compact strip above content (kind === 'campaign' | 'segment').
- `apps/web/src/modules/segments/_components/detail-header.tsx` — render full strip below title.
- `apps/web/src/modules/campaigns/canvas/...` (locate top-level canvas page file) — render strip above canvas blocks.
- `apps/web/src/modules/campaigns/prelaunch.tsx` — render strip in header band.
- `apps/web/src/modules/campaigns/monitoring.tsx` — render strip in header band, plus 14d uplift sparkline alongside.

## Implementation Steps

1. **Define the fixture shape and seed it.**
   `demo-numbers.ts` exports a `Map<string, MathStripNumbers>` where the shape is:
   ```ts
   interface MathStripNumbers {
     audience: number;                    // 12_400
     audienceSpark: number[];             // 14 values
     fireRatePerMin?: number;             // 38
     costPerDay?: number;                 // 4.20
     liftPct?: number;                    // 6.2
     liftCiPct?: number;                  // 90  (CI level)
     goal: 'Retain' | 'Revenue' | 'Reactivate' | 'Recruit';
     // Grounding for "Why this number?" popover
     audienceGrounding: { feature: string; op: string; value: string }[];
     liftGrounding?: string;              // freeform reasoning text
   }
   ```
   Seed entries for every campaign / segment id referenced by:
   - `thread-demo-agent-livops-2026` (CFM Pass Stuck flow)
   - `thread-demo-agent-whale-recall-2026`
   - `thread-demo-agent-d7-fb-cohort-2026`
   - Any segments / campaigns linked from `HermesNoticedPanel` inbox cards.

2. **Build `MathStrip` component.**
   Props: `{ id: string; compact?: boolean; className?: string }`. Reads from
   `demo-numbers.ts`. Renders chips horizontally with `T.fMono` numeric labels,
   `T.fSans` chip headers. Includes a non-dismissible "Illustrative" pill at
   the right edge using `T.amber` background. If `id` missing → render nothing
   (graceful no-op, so the strip won't crash if attached to a non-demo artifact).

3. **Add `WhyThisNumberPopover`.**
   Trigger: clicking `Audience` or `Expected lift` chip. Body: short
   markdown-style block listing the grounding features (e.g.
   `consecutive_losses_streak ≥ 3 AND rank_tier ∈ {Gold, Plat}`).
   Reuse `agent-reasoning-panel.tsx` visual treatment so it feels native.

4. **Mount in chat action cards (compact mode).**
   Pass a `mathStripId?: string` prop through `ActionCardShell`. When provided,
   render `<MathStrip id={mathStripId} compact />` ABOVE the `New {kind}` /
   name block. Wire ids through `action-card-campaign.tsx` /
   `action-card-segment.tsx`.

5. **Mount in segment detail header (full mode).**
   In `detail-header.tsx`, render `<MathStrip id={segment.id} />` directly under
   the title row. Sparkline appears next to Audience automatically.

6. **Mount in campaign surfaces.**
   - `canvas/...`: above the canvas blocks.
   - `prelaunch.tsx`: header band.
   - `monitoring.tsx`: header band + a separate 14d uplift sparkline below the
     strip using the existing `sparkline.tsx`.

7. **Smoke run.**
   `pnpm -F web dev` → walk choreography steps 1, 3, 4, 6, 8. Confirm:
   - Same Audience number in chat card and segment / campaign detail.
   - "Illustrative" pill visible on every mount.
   - Hover Audience → popover renders, lists features.

## Success Criteria (visually verifiable)

- [ ] Math strip renders identically across: chat action-card (campaign + segment), segment detail header, campaign canvas, prelaunch, monitoring.
- [ ] Numbers match for the same artifact id across all surfaces (no drift).
- [ ] "Illustrative" pill visible on every render.
- [ ] Sparkline appears next to Audience on full-page mounts (not chat compact).
- [ ] Hover/click `Audience` opens popover citing grounding features.
- [ ] No console warnings; no theme token regressions in dark mode.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Number drift between surfaces if engineers hand-edit fixtures | Single fixture file, no inline numbers anywhere — code review enforced. |
| Strip layout breaks at narrow chat-rail width | `compact` mode drops to 3 chips + Illustrative; tested at chat-rail min width. |
| Popover blocks click-through on action card buttons | Anchor popover on chip, not card; close on outside click. |
| Demo numbers feel implausible to a senior data eng | Pick ranges sanity-checked against `state_user_segments` typical sizes (1k–50k). |
