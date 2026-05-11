---
phase: 4
title: "Register New Feature Page"
status: complete
priority: P2
effort: "5h"
dependencies: [1, 2]
---

# Phase 4: Register New Feature Page

## Context Links

- Parent plan: [../plan.md](../plan.md)
- PRD baseline: `design-reference/Hermes/uploads/PRD_Hermes_Design (1).md` §6.2 (CTA only) and §13 (NOT to design — superseded by user direction)
- New PRD addendum: `docs/feature-store-v2-prd.md` (written in Phase 7)
- Catalog loader: `apps/web/src/data/catalog/features/index.ts`

## Overview

Promote the "Register a new feature" entry-point CTA from a no-op (parent PRD §13) to a real form on a dedicated route. Submission flows the new feature into the in-memory catalog (no backend persistence — parent prototype is offline-only) and shows a handoff modal with the same shape as Segment/Campaign handoffs (engineer-facing IDs + substrate copy). On modal close, navigate to the freshly registered feature's detail page.

## Key Insights

- The parent prototype runs on hardcoded fixtures with no fetch. "Submission" = pushing onto the in-memory feature array exposed by `features/index.ts`. Persists only for the session — that's expected for the demo.
- Form is opinionated, not exhaustive. Required fields cover the schema deltas from Phase 1; advanced fields (e.g. custom drift thresholds) deferred.
- Definitions for both substrates required when applicable. The form generates **stubs** for `expr-lang` and `dbt SQL` based on selections — author pastes/edits inside, mirroring the side-by-side panel on the detail page.
- Handoff modal is deliberate — anchors the engineering audience (PRD §6.1 says Feature Store serves "engineering reviewers verifying that the registry is real and self-service"). The modal proves the registration touches both materializations.

## Requirements

**Functional**
- New route: `/feature-store/new`
- Entry points (CTAs that route here):
  - Library entry-points strip: "Register a new feature"
  - Detail page: "Register similar feature" (prefills `domain`, `games`, `latencyTier`)
- Form fields (grouped):
  - **Identity:** name (mono, snake_case validated), display name (serif preview)
  - **Classification:** domain (dropdown from existing 11 domains + "Add new"), type (enum), status (default `beta`)
  - **Latency & substrate:** primary tier (`Realtime` / `Batch warm` / `Batch cold`), dual-tier toggle (only valid for stateful features)
  - **Attribution:** games multi-select (CFM, PT, NTH, TF, COS, PG), Platform toggle (auto-checks Platform when ≥3 games selected as default, user can override)
  - **Propensity model** (visible only when Platform): family (pLTV / Churn / Reactivation / Monetization / Engagement), target metric, training window, AUC band, model version, refresh cadence
  - **Definition:** two code editors side-by-side (expr-lang for Realtime substrate, dbt SQL for Batch). Pre-filled with stubs from a template that uses name + type + tier.
  - **Description:** 2 short paragraphs (140 char limit each)
- Live preview pane on the right showing the would-be detail-page header (using Phase 3 components) so author sees how the feature will look
- Submit button: validates → on success, push onto catalog → open handoff modal → on close, navigate to `/feature-store/{name}`
- Cancel: routes back to library
- Validation: name uniqueness, snake_case regex, at least one game, dual-tier requires both substrate definitions filled

**Non-functional**
- All form state in component state — no Redux. Reset on unmount.
- Validation via Zod (reuse `HermesFeature` schema from Phase 1; loosened with optional `analytics` since new features have no history).
- Submission visible across the app for the rest of the session (i.e. library reflects the new count, segment picker shows the new feature, etc.).
- Form is desktop-first; minimum viable width 1100px.

## Architecture

### Layout

```
┌─ TOP BAR ────────────────────────────────────────────────────┐
│  ← Feature Store / Register new feature                       │
└───────────────────────────────────────────────────────────────┘

┌─ FORM (left, 7 cols) ────────────────┐ ┌─ PREVIEW (right, 5 cols) ─┐
│  ┌ Identity ─────────────────────┐  │ │                            │
│  │ name           __________     │  │ │  [Live preview of the     │
│  │ display name   __________     │  │ │   detail page header,     │
│  └────────────────────────────────┘  │ │   updating as form        │
│                                      │ │   changes]                 │
│  ┌ Classification ────────────────┐  │ │                            │
│  │ domain         ____   type ___ │  │ │  Mono name                 │
│  │ status         beta            │  │ │  Serif display name        │
│  └────────────────────────────────┘  │ │  Type chip · Latency       │
│                                      │ │  Games chip cluster        │
│  ┌ Latency & substrate ───────────┐  │ │  Platform · Propensity     │
│  │ primary tier   ◉ Realtime      │  │ │                            │
│  │                ○ Batch warm    │  │ │  ────                      │
│  │                ○ Batch cold    │  │ │                            │
│  │ dual-tier      [ ] Yes         │  │ │  Definition stubs preview  │
│  └────────────────────────────────┘  │ │                            │
│                                      │ │                            │
│  ┌ Attribution ───────────────────┐  │ │                            │
│  │ games  [CFM] [PT] [+]          │  │ │                            │
│  │ platform  [ ] (auto when ≥3)   │  │ │                            │
│  └────────────────────────────────┘  │ │                            │
│                                      │ │                            │
│  ┌ Propensity model (gated) ──────┐  │ │                            │
│  │ family · target · training ... │  │ │                            │
│  └────────────────────────────────┘  │ │                            │
│                                      │ │                            │
│  ┌ Definition ────────────────────┐  │ │                            │
│  │ Substrate A  Substrate B       │  │ │                            │
│  │ [code edit] [code edit]        │  │ │                            │
│  └────────────────────────────────┘  │ │                            │
│                                      │ │                            │
│  ┌ Description ───────────────────┐  │ │                            │
│  │ [textarea x2]                  │  │ │                            │
│  └────────────────────────────────┘  │ │                            │
└──────────────────────────────────────┘ └────────────────────────────┘

[ Cancel ]                          [ Save draft ]   [ Register feature → ]
```

### Submission flow

```
[Submit click]
    │
    ▼
[Validate via Zod] ── invalid ──► Inline errors + scroll to first
    │ valid
    ▼
[Push onto catalog]                           ← see catalog hot-reload below
    │
    ▼
[Handoff modal: Feature registered]
    │
    │  ✓ Feature registered
    │  FeatureID  feat-cfm-pltv_30d_score    [copy]
    │
    │  ── What happens next ──
    │  1. Definition compiled to expr-lang   · done
    │  2. Definition compiled to dbt SQL     · done
    │  3. Substrate A registers feature ID   · pending sync
    │  4. Substrate B writes Iceberg schema  · pending sync
    │
    │  Substrate A · Apollo TEE + Temporal
    │  Substrate B · Hatchet + Trino + Iceberg
    │
    │  [View feature]   [Register another]   [Done]
    │
    ▼
[Navigate to /feature-store/{name}]
```

### Catalog hot-reload

Existing `apps/web/src/data/catalog/features/index.ts` exports `allFeatures` as a frozen const. Refactor to:

```ts
// features/index.ts (refactor)
const builtinFeatures: HermesFeature[] = [
  ...identityLifecycle, ...monetization, /* ... */, ...platformPropensity,
];

const userFeatures: HermesFeature[] = [];   // mutable, session-scoped

export function getAllFeatures(): readonly HermesFeature[] {
  return [...builtinFeatures, ...userFeatures];
}

export function registerFeature(feature: HermesFeature): void {
  if (getAllFeatures().some(f => f.name === feature.name)) {
    throw new Error(`Feature ${feature.name} already exists`);
  }
  userFeatures.push(feature);
  notifyFeatureSubscribers();   // tiny pubsub for live re-render
}

// Backward compat — many callsites import allFeatures directly
export const allFeatures = new Proxy([] as HermesFeature[], {
  get(_, prop) {
    return Reflect.get(getAllFeatures(), prop);
  },
});
```

Subscribers (tiny pubsub):

```ts
const subs = new Set<() => void>();
export function subscribeFeatures(cb: () => void): () => void {
  subs.add(cb);
  return () => subs.delete(cb);
}
function notifyFeatureSubscribers() {
  subs.forEach(cb => cb());
}
```

Library + segment composer + detail page hook into `useSyncExternalStore(subscribeFeatures, getAllFeatures)`.

### Stub generators

```ts
// apps/web/src/modules/feature-store/_logic/definition-stubs.ts
export function exprLangStub(name: string, type: HermesFeatureType, tier: HermesLatencyTier): string {
  if (tier === '<1s') {
    return `# Substrate A — TEE online state at event arrival\n` +
           `WHEN event.uid IS NOT NULL\n` +
           `  THEN AGGREGATE(${name}, window='session')\n` +
           `ELSE @state.${name}`;
  }
  return `# Substrate A — read offline cache (batch feature)\n` +
         `@cache.offline_${name}`;
}

export function dbtSqlStub(name: string, type: HermesFeatureType, tier: HermesLatencyTier): string {
  const interval = tier === '<1d' ? '7' : '1';
  return `-- Substrate B — Hatchet/Trino warm tier refresh every <${tier === '<1s' ? '1m' : tier.slice(1)}>\n` +
         `SELECT\n` +
         `  uid,\n` +
         `  ${type === 'int' || type === 'numeric' ? `MAX(value) AS ${name}` : `LATEST_BY(value, ts) AS ${name}`}\n` +
         `FROM {{ ref("fct_user_events") }}\n` +
         `WHERE ds >= CURRENT_DATE - INTERVAL '${interval}' DAY\n` +
         `GROUP BY uid`;
}
```

## Related Code Files

**Modify**
- `apps/web/src/router.tsx` (or routes file) — add `/feature-store/new` route
- `apps/web/src/data/catalog/features/index.ts` — refactor to mutable + pubsub
- `apps/web/src/modules/feature-store/library.tsx` — wire entry-point CTA to navigate
- `apps/web/src/modules/feature-store/detail.tsx` — wire "Register similar" CTA with prefill query params

**Create** (in `apps/web/src/modules/feature-store/`)
- `register.tsx` — main page
- `_components/_register/identity-section.tsx`
- `_components/_register/classification-section.tsx`
- `_components/_register/latency-substrate-section.tsx`
- `_components/_register/attribution-section.tsx`
- `_components/_register/propensity-model-section.tsx`
- `_components/_register/definition-editor.tsx` — two-pane code-style textareas
- `_components/_register/description-section.tsx`
- `_components/_register/preview-pane.tsx` — live mini detail header
- `_components/_register/feature-registered-modal.tsx`
- `_logic/definition-stubs.ts` — stub generators
- `_logic/feature-form-validation.ts` — Zod-based form validation

**No deletes.**

## Implementation Steps

1. **Add route.** Wire `/feature-store/new` to a new `register.tsx` page component. Wire `Register a new feature` entry-point in library + `Register similar feature` in detail to navigate (with prefill query params for the latter).
2. **Refactor catalog loader.** Switch `features/index.ts` to mutable array + pubsub. Update existing consumers (library, detail, segment composer) to use `useSyncExternalStore` so live updates flow through.
3. **Build form sections.** One section component per group (Identity, Classification, Latency, Attribution, Propensity, Definition, Description). Each owns its slice of form state. Lift validation up to the page.
4. **Build PreviewPane.** Renders the would-be detail page header by composing Phase 3 components against the in-progress form state. Stub the Health snapshot card with "no data yet — 7d warm-up" copy.
5. **Definition editor.** Two textareas side-by-side, mono font, syntax-themed colors (no actual syntax highlighter — keep it light; just monospace + dark-on-light). "Reset to stub" button per pane.
6. **Form validation.** Zod schema based on `HermesFeature` minus `analytics`. Custom rules: name unique against `getAllFeatures()`, snake_case regex `/^[a-z][a-z0-9_]*$/`, at least one game, dual-tier requires both substrates filled.
7. **Submission.** On submit + valid → call `registerFeature(buildFeature(form))`. Synthesize empty `analytics` block (zeros + 180-bucket zero array, marked `lastBackfillAt: null`).
8. **Handoff modal.** Reuse the visual shape of the segment handoff modal (`apps/web/src/modules/segments/handoff-modal.tsx`) for consistency. Generate `feat-{game-prefix}-{name}` ID. Show 4-step "what happens next" list per architecture above.
9. **Modal CTAs.** "View feature" → navigate to `/feature-store/{name}`. "Register another" → reset form, stay on /new. "Done" → return to /feature-store.
10. **Smoke test.** Register `pltv_60d_score`. Verify: shows in library, opens its detail page, appears in segment picker.

## Todo List

- [ ] Add `/feature-store/new` route
- [ ] Refactor catalog loader to mutable + pubsub
- [ ] Update existing catalog consumers to subscribe
- [ ] Build 7 form sections
- [ ] Build PreviewPane reusing Phase 3 components
- [ ] Build definition editor with stub generators
- [ ] Wire Zod-based validation
- [ ] Build feature-registered handoff modal
- [ ] Wire entry-point CTAs in library + detail (with prefill on detail)
- [ ] Smoke test: register, view detail, use in segment
- [ ] `pnpm typecheck` clean
- [ ] `pnpm build` clean

## Success Criteria

- [ ] `/feature-store/new` route reachable from library entry-point and detail "Register similar" CTA
- [ ] Form validates name uniqueness, snake_case, games ≥1, propensity gate logic, dual-tier requires both definitions
- [ ] Live preview pane updates as form fields change
- [ ] On submit, feature is added to in-memory catalog and visible in library
- [ ] Handoff modal renders with engineer-facing copy (Substrate A, Substrate B verbatim)
- [ ] Detail page for newly-registered feature opens correctly with empty-state Analytics ("7-day warm-up")
- [ ] Newly-registered feature appears in Segment composer pickers
- [ ] Cancel returns to /feature-store without modifying catalog

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Catalog hot-reload via Proxy + pubsub is finicky | Alternative: lift `allFeatures` into a context. Pick whichever ships in 30 min. Prefer pubsub for minimal churn at callsites. |
| Form-state complexity bloats register.tsx past 200 lines | Each section is its own component owning its slice; page only orchestrates and validates. |
| User registers a feature with same name as an existing one | Validation blocks at form level. Server-side `registerFeature` also throws — second line of defence. |
| Definition stubs don't match user's intent | Stubs are starting points, "Reset to stub" button. Author always edits. Document this in the form copy. |
| Empty analytics on new feature breaks Phase 3 panels | Phase 3 explicitly handles `analytics === undefined` / zero values with a "warm-up" empty state. Confirm in unit smoke. |

## Security Considerations

- Form input sanitization: reject script-injection in description and display name (basic angle-bracket strip; no markdown rendering).
- Catalog mutation is in-memory and session-scoped — no persistence path, so no XSS-via-stored-feature risk.
- Validate `name` with strict regex before pushing — prevents URL injection (since name lands in `/feature-store/{name}`).

## Next Steps

Phase 5 (Library) wires the entry-point CTA active state and reflects the new feature count. Phase 6 (Segment) consumers automatically pick up newly-registered features via pubsub.
