# Red-Team Review — Segment Detail Redesign

Plan: `plans/260510-1847-segment-detail-redesign/` (plan.md + 6 phases)
Reviewer stance: hostile / pre-mortem. Findings ranked; pleasantries skipped.

---

## CRITICAL — Phase 6 filters on a field that does not exist

`HermesCampaign` schema (`packages/contracts/src/hermes-campaign.ts:66`) has **`audienceRef: z.string().nullable().optional()`** — there is no `segmentId` field. Plan/phase-06 says `allCampaigns.filter(c => c.segmentId === id)` which will silently return `[]` for every segment, dropping the user into the empty-state CTA on every segment that actually has campaigns. The "mitigation" ("filter defensively, empty state shows when no matches") is not a mitigation — it is the bug.
**Fix:** filter on `c.audienceRef === id`. Update the `usedByCampaigns` cross-check too. Note the contract has `goal4r` and `triggerType`, not `type`.

## CRITICAL — `segments-client.update()` and `.rebuild()` do not exist

`apps/web/src/api/segments-client.ts` exports only `createSegment` (single function, ~40 LoC). Phase 5 says "verify `segments-client.update` exists; if not, add ≤20 LoC" and Phase 1 says "real `segments-client.rebuild()` wiring deferred unless trivially available." Neither exists, and the path Phase 5 lists (`api/segments-client.ts` under the segments module) is wrong — the real file is `apps/web/src/api/segments-client.ts`. Phase 5's Save flow is the pivotal user action; "20 LoC PATCH wrapper" handwaves over: backend route existence on NestJS catalog-api, request shape, optimistic state, refresh-after-save through `allSegments` (which is a static catalog import, not a store — `Save` will not change what `Overview` reads).
**Fix:** verify backend supports `PATCH /api/v1/segments/:id` before Phase 5 starts. Decide where the post-save segment lives (event bus + local override map) since `allSegments` is immutable. Budget +0.5d.

## HIGH — `/canvas` route collision will black-hole bookmarked deep links

`/canvas` is **already a top-level route** (`routes.tsx:72` → `CanvasListPage`, the Boards module). Phase 1's redirect targets the segment-nested `/segments/:id/canvas`, which is fine, but the brief mentions "existing chat thread links pointing to `/canvas?seedFeature=...`." Grep finds **zero** such links in this codebase, so that claim is wrong — but it raises a different live risk: any segment-canvas deep link in the wild that includes query params (e.g. a saved `?focus=…`) will be lost on `<Navigate>` because React Router v6 `Navigate` does not preserve `search` or `hash`. Same for `?edit=1` arriving via `/threshold` redirect.
**Fix:** use `<Navigate to={`../predicate${useLocation().search}`} replace />` (or a tiny redirect element). Verify with a `/segments/:id/canvas?seedFeature=foo` smoke link.

## HIGH — Effort estimate on Phase 5 is fiction

Phase 5 lists 0.75d for: AST read renderer (~80–180 LoC, new), edit toggle, beforeunload guard, dirty diff via `deepEqual` (no lib imported — needs to be added or written), keyboard shortcut with contenteditable guard, sticky save ribbon, popover primitive ("if exists in codebase, else inline absolute-positioned" — translation: build one), threshold extraction OR fallback to `inline-threshold-playground` (file existence not verified in plan), `segments-client.update` wire-up, composer prop addition, route swap, save-side state refresh of `allSegments`. Realistic: 1.5–2d. The plan even concedes Phase 5 has the most P0 verification items.
**Fix:** rebudget to 1.5d minimum, or descope: ship read-mode + Edit button that **navigates** to existing `/canvas` page, defer in-place edit + ribbon to follow-up. (This also dissolves the ribbon-vs-pill stacking risk.)

## HIGH — Synth determinism breaks across phases via shared mutable PRNG

Phases 2/3/4 all consume `mulberry32(hashSegmentId(id))`. PRNGs are stateful; if `synth-segment-detail-data.ts` uses a single module-level PRNG instance and any caller invokes `.next()` mid-render, downstream callers see shifted streams. `useMemo` mitigates only in-component reuse, not cross-call ordering. Phase 4 explicitly claims "Lifecycle / spendTier / device weighted draws aligned with Phase 3 generators" — this only holds if each generator instantiates a fresh PRNG seeded the same way. Plan does not say so.
**Fix:** every generator must call `mulberry32(hashSegmentId(id))` fresh and consume locally. Add a unit test that calls `getCountryBreakdown(id)` twice and asserts identical output. Otherwise demo screenshots will subtly diverge between reloads when components mount in different order.

## HIGH — Cross-plan integration risk on `detail-layout.tsx` understated

`detail-layout.tsx` today renders `<DetailTabs>` → conditional `SourceThreadPill` (top, padding `6px 24px 0`) → `<Outlet/>` → `<ContinueInChatPill>` (bottom). Phase 1 step 3 says "Remove the inline padding wrapper since header includes it." But the May-12 plan's Phase 2 may have *also* moved or wrapped the SourceThreadPill (it is "blocked-by", not yet merged when this plan was written). Two plans modifying the same conditional render in 48 hours = high merge-conflict + silent regression chance — the SourceThreadPill could land twice (once in header, once still inline) or zero times.
**Fix:** Phase 1 must do a `git diff` against the post-May-12 state of `detail-layout.tsx` before editing, and explicitly delete only the block that *currently exists* there. Add a manual verification: load a segment with `sourceThreadId` set + a segment without; both must render correctly with exactly one pill.

## MEDIUM — `e` shortcut footgun in non-input focused elements

Phase 5's guard skips when `activeElement.tagName ∈ {INPUT, TEXTAREA}` or `[contenteditable]`. Feature-pill autocomplete dropdowns (used in composer) are typically `<button role="combobox">` or `<div role="listbox">` with keyboard nav — **not** input elements. Pressing `e` to type into a search-as-you-type combobox would fire the toggle. Same for any `<select>` or radix-style menu in the action bar (Phase 1 overflow menu).
**Fix:** also skip when `document.activeElement?.closest('[role="combobox"], [role="listbox"], [role="menu"], [role="dialog"]')`. Better: scope shortcut to a `data-predicate-shortcut-root` container.

## MEDIUM — Demo silent-failure surface: lift values look real

Phase 6 row renders "observed lift `+X.X%` synth or contract value." `HermesCampaign` does not have a `lift` field in the schema — so all values will be synth, with no visual disclaimer. PMs reading the demo at the May-12 demo arc will read these as live numbers. Same risk on Phase 2's vs-All-Users `Diff` column, which is computed from synth and shown next to the segment's *real* `audienceSize`.
**Fix:** add a single small "synthetic" tag on cards/rows whose primary numerals are PRNG-derived. Or use `—` for unknown lift instead of generated. The cost is one Tooltip; the benefit is no demo-day "wait, where did 14.2% come from?" question.

## LOW — YAGNI: pin-to-board with placeholder widget

Phase 1 step 5 ships Pin-to-Board with "placeholder primary widget" because the popover requires one. That is shipping a broken control (it'll pin a meaningless card). Either ship without Pin (defer to Phase 7 polish) or pin a `segment-summary` widget type (which then must be defined in `pin-to-board-popover` widget registry — that's a separate plan). Same call applies to the SQL modal that just `JSON.stringify`s a PredicateAST — it's worse than not shipping the button.
**Fix:** drop Pin + SQL from Phase 1 scope. Keep the buttons disabled with a tooltip "Coming soon" if the visual slot matters. Saves ~45 min and removes two pseudo-features.

---

## Unresolved questions

1. Does the catalog-api NestJS service expose `PATCH /api/v1/segments/:id` for predicate updates? If not, Phase 5 Save is unimplementable as specified.
2. Is `inline-threshold-playground.tsx` actually present at the path Phase 5 assumes? Plan asserts existence but did not verify.
3. After Save, how does `Overview` re-fetch a segment that lives in a static `allSegments` import? Event bus alone will not mutate that array.
4. Is the Pin/SQL/Rebuild placeholder behavior acceptable for the "post-May-12" demo, or will the next demo arc rely on these working?
