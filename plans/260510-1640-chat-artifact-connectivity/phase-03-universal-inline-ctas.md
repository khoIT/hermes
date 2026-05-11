---
phase: 3
title: "Universal Inline CTAs"
status: completed
priority: P0
effort: "1–1.5d"
dependencies: [2]
---

# Phase 3: Universal Inline CTAs

## Overview

Add a footer row of three CTAs to every `<AssistantResponse>` — 🎯 Save as segment · 📊 Pin to board · 📣 Build campaign — so any narrative response can become an artifact, not only those whose payload happens to include `action_card_*`. This is the single highest-leverage add for "ask question -> actionable artifact" UX.

## Requirements

**Functional:**
- Every assistant response gets a `<UniversalCtaRow>` rendered above `<ResponseActionBar>`.
- Each CTA opens a lightweight composer/dialog pre-filled from the response narrative + features mentioned in widgets.
- "Save as segment" -> opens a mini composer dialog (not full `/segments/new` route) — name, predicate seed, audience preview, Save button -> POST -> nav to `/segments/{id}`.
- "Pin to board" -> opens existing `<PinToBoardPopover>` with the response's primary widget pre-selected.
- "Build campaign" -> opens a mini composer dialog — name, type picker (realtime/scheduled/onetime), seedSegment dropdown -> POST -> nav to `/campaigns/{id}`.
- Smart-hide: if response payload already includes `action_card_segment`, hide the "Save as segment" CTA. Same for campaign and pin.
- **Suppression flag (red-team mitigation):** if response sets `suppressUniversalCtas: true`, hide the entire row regardless of payload. Used by Phase 4's demo thread so curated chips remain the singular forward path.
- **All-hidden edge case:** if all three CTAs are hidden (e.g., a response with all three action cards present, or `suppressUniversalCtas: true`), do not render the row container at all (no empty padding/border).
- Pre-fill logic extracts feature names mentioned in widget series/columns + narrative bullets; infers 4R goal from keywords.

**Non-functional:**
- `<UniversalCtaRow>` ≤120 LOC; pre-fill logic ≤80 LOC in separate utility.
- No new heavy dependencies.
- Must not regress thread fixtures' visual rhythm.

## Architecture

```
<AssistantResponse>
  ├── header (VG Hermes badge)
  ├── sections (narrative / widget / chips / pin-to-board / action_card_*)
  ├── <UniversalCtaRow>            <-- NEW
  │     ├── 🎯 Save as segment      [conditional: hide if action_card_segment present]
  │     ├── 📊 Pin to board         [conditional: hide if pin_to_board section present]
  │     └── 📣 Build campaign       [conditional: hide if action_card_campaign present]
  └── <ResponseActionBar> (download/copy/slack/credits/feedback)
```

Pre-fill flow:
```
response sections
        |
        v
extractPrefillContext(response) -> {
  features: string[],          // names found in widget series/columns/narrative
  narrative: string,           // first 280 chars for description
  goal4r: 'retain'|'revenue'|'reactivate'|'recruit'|null,
  primaryWidget: DataWidget|null,  // first chart/table to pin
  hintedSegmentId: string|null,    // if narrative mentions "seg-..." or known displayName
}
        |
        v
CTA click -> composer dialog opens with these seeds
```

## Related Code Files

- **Modify:**
  - `apps/web/src/components/chat/assistant-response.tsx` — mount `<UniversalCtaRow>` after sections, before `<ResponseActionBar>`. Pass response payload + computed `hiddenCtas` mask.

- **Create:**
  - `apps/web/src/components/chat/universal-cta-row.tsx` — three-button footer
  - `apps/web/src/components/chat/quick-segment-dialog.tsx` — mini segment composer
  - `apps/web/src/components/chat/quick-campaign-dialog.tsx` — mini campaign composer
  - `apps/web/src/utils/response-prefill.ts` — `extractPrefillContext(response)` helper
  - `apps/web/src/utils/four-r-inference.ts` — keyword-based 4R goal classifier (small lookup table)

- **Delete:** none

## Implementation Steps

1. **`response-prefill.ts`** (45 min)
   - Implement `extractPrefillContext(response: AssistantMessage): PrefillContext`.
   - Walk `response.sections`: for `widget` sections, scan series names + table column keys for known feature names (cross-ref `allFeatures` from `data/catalog/features`).
   - For `narrative` / `bullet` sections, run keyword regex for feature names + segment-id pattern (`seg-[a-z0-9-]+`).
   - First 280 chars of concatenated narrative -> `narrative`.
   - First widget section -> `primaryWidget`.

2. **`four-r-inference.ts`** (15 min)
   - Map: { retain: ['churn', 'retention', 'lapsed', 'dormant'], revenue: ['arpdau', 'spend', 'whale', 'monetiz'], reactivate: ['reactivat', 'comeback', 'win-back'], recruit: ['onboard', 'ftue', 'first-time'] }.
   - Function: `inferGoal4R(text: string): Goal4R | null` — returns highest-frequency match, null on tie/zero.

3. **`<QuickSegmentDialog>`** (1.5h)
   - Modal/popover dialog. Fields: name (defaulted from narrative first sentence), predicate seed (single condition with hinted feature if present, otherwise empty), goal4r (chip selector seeded from inference).
   - Audience-count preview via `/api/v1/audience/count` POST as user edits.
   - Save button -> `segments-client.create({ name, predicate, goal4r, sourceThreadId })` -> nav to `/segments/{id}`.
   - "Open full composer" link as escape hatch -> navigates to `/segments/new?seedFeature=…&from=chat`.

4. **`<QuickCampaignDialog>`** (1h)
   - Fields: name (defaulted from narrative first sentence), type picker (3 chips: realtime/scheduled/onetime), seedSegment dropdown (lists existing segments + suggests `hintedSegmentId` if present).
   - Save button -> `campaigns-client.create({ name, type, segmentId, sourceThreadId })` -> nav to `/campaigns/{id}`.

5. **`<UniversalCtaRow>`** (45 min)
   - Three buttons in a horizontal row, light borderless style.
   - Props: `response: AssistantMessage`, `hiddenCtas: Set<'segment' | 'board' | 'campaign'>`.
   - On Save-segment click -> open `<QuickSegmentDialog>` with seeded prefill.
   - On Pin-to-board click -> open existing `<PinToBoardPopover>` with `response.primaryWidget`.
   - On Build-campaign click -> open `<QuickCampaignDialog>` with seeded prefill.
   - Hide individual CTAs based on `hiddenCtas` mask.

6. **Mount in `<AssistantResponse>`** (20 min)
   - Compute `hiddenCtas` by inspecting response sections: presence of `action_card_segment` -> add 'segment', presence of `pin_to_board` -> add 'board', presence of `action_card_campaign` -> add 'campaign'.
   - Mount `<UniversalCtaRow response={msg} hiddenCtas={…} />` between sections and `<ResponseActionBar>`.

7. **Verification:**
   - Open thread-007 (loss-streak) — verify Save-segment CTA is HIDDEN on T3 (action_card_segment present), but VISIBLE on T1 (narrative-only).
   - Open thread-005 (PT gem-burn) — verify Pin-to-board CTA is HIDDEN on T3 (pin_to_board section present), VISIBLE on T1 + T2.
   - Click Save-segment on a narrative response — dialog opens with prefilled name + features.
   - Save -> lands on `/segments/{id}` with sourceThreadId set (Phase 2 dependency check).
   - `pnpm typecheck` clean.

## Success Criteria

- [x] `<UniversalCtaRow>` renders on every assistant response.
- [x] CTAs smart-hide when redundant action cards/sections are already in payload.
- [x] Quick segment dialog creates a real segment with correct sourceThreadId + features.
- [x] Quick campaign dialog creates a real campaign with correct sourceThreadId + type.
- [x] Pin-to-board reuses existing popover with primary widget pre-selected.
- [x] Pre-fill correctly extracts ≥1 feature name from any thread fixture's response.
- [x] No regression on thread-005..008 visual layout.
- [x] Typecheck clean.

## Risk Assessment

- **Risk:** Universal CTA row clutters responses where only narrative makes sense (e.g., "yes/no" answers).
  - **Mitigation:** If response has only a single narrative section ≤80 chars, hide the row.
- **Risk:** Pre-fill misidentifies feature names for short narratives.
  - **Mitigation:** Empty prefill is fine — dialog still functional with manual input.
- **Risk:** Mini-dialog UX feels like a half-baked composer; users prefer full route.
  - **Mitigation:** "Open full composer" escape hatch link in every dialog.
- **Risk:** `<PinToBoardPopover>` doesn't currently accept a forced widget prop.
  - **Mitigation:** Inspect popover API; if needed, add optional `forceWidget?: DataWidget` prop. Trivial change.
