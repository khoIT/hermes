---
phase: 1
title: Layout & Inbox Extension
status: completed
priority: P2
effort: 1.5h
dependencies: []
---

# Phase 1: Layout & Inbox Extension

## Overview

Promote `HermesNoticedPanel` from the `/welcome` right rail to a full-width row above `ActiveCampaignsPanel`. Extend `CARDS[]` from 1 → 3 entries (existing ARPDAU + two new placeholders that will route to thread B and C). Staggered detection timestamps. Add new i18n keys for B and C headlines/bodies. No new threads yet — they ship in phases 2/3; this phase just wires the inbox panel to expect them.

## Context links

- Brainstorm: `plans/reports/brainstorm-260511-1122-welcome-inbox-promote-plus-flows.md`
- Existing panel: `apps/web/src/modules/welcome/hermes-noticed-panel.tsx`
- Existing welcome layout: `apps/web/src/modules/welcome/page.tsx`
- i18n dictionary: `apps/web/src/i18n/dictionary.ts` (lines 74-80, 204-210 for hermesNoticed)

## Requirements

**Functional**
- Inbox renders 3 stacked rows in full-width row above `ActiveCampaignsPanel`
- Detection timestamps staggered: A=`'06:14 today'` · B=`'yesterday 14:20'` · C=`'2d ago, ongoing'`
- Each row shows agent identity, timestamp, headline, body, CTA chevron — current row markup preserved
- Card B and C `threadId` references match phase-2/3 thread fixture IDs (`thread-demo-agent-d7-fb-cohort-2026`, `thread-demo-agent-whale-recall-2026`)
- Clicking card B or C navigates to `/chat/<id>` — works even before threads exist (404-style or empty thread is acceptable interim state until phase 4 seeds them)
- Vietnamese parity for all 3 cards' headline + body

**Non-functional**
- Row height ≤ 72px (down from 80px) to mitigate vertical-space cost (brainstorm R3)
- No CSS regression on `ActiveCampaignsPanel`, `StartSomethingPanel`, `RecentThreadsPanel`
- Existing `data-hermes-surface="card"` attribute preserved for visual smoke

## Architecture

### Layout change (page.tsx)

Before:
```tsx
<HeroStrip />
<KpiStrip />
<grid 2fr:1fr>
  <ActiveCampaignsPanel />
  <stack>
    <StartSomethingPanel />
    <HermesNoticedPanel />  ← here
    <RecentThreadsPanel />
  </stack>
</grid>
```

After:
```tsx
<HeroStrip />
<KpiStrip />
<HermesNoticedPanel />  ← promoted, full-width
<grid 2fr:1fr>
  <ActiveCampaignsPanel />
  <stack>
    <StartSomethingPanel />
    <RecentThreadsPanel />
  </stack>
</grid>
```

`HermesNoticedPanel` retains `T.surface` + `T.n200` border + `borderRadius: 10` so it looks consistent. Add `marginBottom: 20` to the panel wrapper (matches inter-section spacing).

### Inbox card data shape

Existing `NoticedCard` interface widens to include semantic-keyed copy (per-card i18n keys instead of one shared key):

```ts
interface NoticedCard {
  detectedAt: string;                      // staggered per card
  headlineKey: keyof Dictionary;           // per-card key
  bodyKey: keyof Dictionary;               // per-card key
  ctaKey: 'welcome.hermesNoticed.cta';     // shared
  threadId: string;
}
```

`CARDS[]` becomes 3 entries with rotated i18n key namespaces:

| # | detectedAt | headlineKey | bodyKey | threadId |
|---|---|---|---|---|
| A | `'06:14 today'` | `welcome.hermesNoticed.cardArpdauHeadline` | `welcome.hermesNoticed.cardArpdauBody` | `thread-demo-agent-livops-2026` |
| B | `'yesterday 14:20'` | `welcome.hermesNoticed.cardD7Headline` | `welcome.hermesNoticed.cardD7Body` | `thread-demo-agent-d7-fb-cohort-2026` |
| C | `'2d ago, ongoing'` | `welcome.hermesNoticed.cardWhaleHeadline` | `welcome.hermesNoticed.cardWhaleBody` | `thread-demo-agent-whale-recall-2026` |

### i18n key changes (dictionary.ts)

**Rename** (back-compat not needed — only `hermes-noticed-panel.tsx` consumes these):
- `welcome.hermesNoticed.cardHeadline` → `welcome.hermesNoticed.cardArpdauHeadline`
- `welcome.hermesNoticed.cardBody` → `welcome.hermesNoticed.cardArpdauBody`

**Add (en + vi)**:
- `welcome.hermesNoticed.cardD7Headline`
- `welcome.hermesNoticed.cardD7Body`
- `welcome.hermesNoticed.cardWhaleHeadline`
- `welcome.hermesNoticed.cardWhaleBody`

**Proposed copy (en)**:
- D7 headline: `'D7 retention dropped 4pp for FB-acquired May cohort.'`
- D7 body: `'Drop concentrated in users who saw the legacy onboarding tutorial. Blended D7 = 22.4%, FB cohort = 18.2%. Ranked-tutorial completion correlates with the gap.'`
- Whale headline: `'Top-1% spender 30-day recall fell from 52% → 38%.'`
- Whale body: `'Traced to 4 named whales going dormant after the Apr-21 ranked-season reset. Estimated $14k MRR at risk if pattern persists into May ranked-end.'`

**Proposed copy (vi)** — concise renderings:
- D7 headline vi: `'D7 retention giảm 4pp ở cohort FB tháng 5.'`
- D7 body vi: `'Tập trung ở người dùng xem onboarding cũ. D7 chung 22.4%, cohort FB 18.2%. Liên quan đến tỉ lệ hoàn thành tutorial ranked.'`
- Whale headline vi: `'Recall 30 ngày của top-1% spender giảm từ 52% → 38%.'`
- Whale body vi: `'4 whale dormant sau reset season ranked 21/4. Khoảng $14k MRR rủi ro nếu kéo dài qua cuối tháng 5.'`

## Related code files

**Modify**
- `apps/web/src/modules/welcome/page.tsx` — restructure layout
- `apps/web/src/modules/welcome/hermes-noticed-panel.tsx` — extend CARDS, tighten row height
- `apps/web/src/i18n/dictionary.ts` — rename A keys, add 4 new keys × 2 locales = 8 entries

## Implementation steps

1. **Update dictionary** (`apps/web/src/i18n/dictionary.ts`):
   - Rename existing `cardHeadline` / `cardBody` to `cardArpdauHeadline` / `cardArpdauBody` (both `en` and `vi`)
   - Add 4 new keys × 2 locales (8 entries total) using proposed copy above
2. **Extend `hermes-noticed-panel.tsx`**:
   - Update `NoticedCard.headlineKey` and `bodyKey` types to accept the new key union (or use `keyof Dictionary` if a type alias exists)
   - Replace single-entry `CARDS[]` with 3-entry array (table above)
   - Tighten row vertical padding from `'12px 12px'` → `'10px 12px'` (R3 mitigation)
3. **Restructure `page.tsx`**:
   - Lift `HermesNoticedPanel` out of right-column stack
   - Render it between `KpiStrip` wrapper and the `grid` div, wrapped in `<div style={{ marginBottom: 20 }}>`
   - Remove `<HermesNoticedPanel />` from inside the right-column stack
4. **Visual smoke locally**:
   - `pnpm --filter @hermes/web dev`
   - Navigate to `/`, confirm 3 stacked rows render above Active Campaigns
   - Toggle EN/VI in settings, confirm all 3 cards localize
   - Click B and C → routes to `/chat/<id>` (interim 404/empty is OK; threads land in phases 2/3)
5. **Typecheck**:
   - `pnpm typecheck` — must pass (catches any missed i18n key references)

## Todo list

- [ ] Rename `cardHeadline`/`cardBody` → `cardArpdauHeadline`/`cardArpdauBody` (en+vi)
- [ ] Add `cardD7Headline`, `cardD7Body`, `cardWhaleHeadline`, `cardWhaleBody` (en+vi)
- [ ] Update `NoticedCard` interface types in `hermes-noticed-panel.tsx`
- [ ] Replace `CARDS[]` with 3 entries (A=ARPDAU, B=D7, C=Whale)
- [ ] Tighten row padding 12→10px vertical
- [ ] Restructure `page.tsx` — hoist `HermesNoticedPanel` above grid
- [ ] Visual smoke: 3 rows visible, no regression, EN/VI parity
- [ ] `pnpm typecheck` passes

## Success criteria

- [ ] `/welcome` shows full-width inbox panel above `ActiveCampaignsPanel` *(deferred to user for visual smoke)*
- [ ] Inbox lists 3 rows with staggered timestamps in correct order (A, B, C) *(deferred to user for visual smoke)*
- [ ] EN + VI render correctly for all 3 card headlines and bodies *(deferred to user for visual smoke)*
- [ ] Clicking each row navigates to expected `threadId` route *(deferred to user for demo dry-run)*
- [ ] No layout regression on `ActiveCampaignsPanel`, `StartSomethingPanel`, `RecentThreadsPanel` *(verified: code-review structural check green)*
- [x] `pnpm typecheck` passes *(verified: clean, 0 new errors)*
- [x] `pnpm build` passes *(verified: 2679 modules clean)*

## Risk assessment

| Risk | Mitigation |
|---|---|
| Renaming `cardHeadline` breaks an unknown consumer | Repo-wide grep for `cardHeadline` / `cardBody` before renaming — only `hermes-noticed-panel.tsx` should reference them |
| Vertical space pushes Active Campaigns below fold on 13" laptops | Row padding tightened to 10px; total height ~64-70px per row × 3 = ~210px panel |
| Vietnamese phrasing reviewed by no native speaker | Use concise renderings; verify with user/`khoitn` if VI quality is critical for May-12 |
