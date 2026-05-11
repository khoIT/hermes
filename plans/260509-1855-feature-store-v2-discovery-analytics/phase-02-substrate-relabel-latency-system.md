---
phase: 2
title: "Substrate Relabel + Latency System"
status: complete
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Substrate Relabel + Latency System

## Context Links

- Parent plan: [../plan.md](../plan.md)
- PRD baseline: `design-reference/Hermes/uploads/PRD_Hermes_Design (1).md` §10 ("Substrate badges on feature pills")
- Component: `apps/web/src/components/latency-badge.tsx`
- All callsites grep target: `<1s · A`, `<1h · B`, `<1d · B`, `Substrate A`, `Substrate B`

## Overview

Rename user-facing latency labels from `<1s · A` / `<1h · B` / `<1d · B` to **Realtime / Batch warm / Batch cold**. Keep `A` / `B` IDs only on engineer-facing surfaces — handoff modals (per PRD §8.7, §9.9 these are load-bearing for the May 12 alignment meeting), lineage diagrams, and the side-by-side definition pane (where the substrate is the whole point).

This is mostly a copy + component pass. No schema changes — the underlying `substrate: 'A' | 'B'` and `latencyTier: '<1s' | '<1h' | '<1d'` stay untouched. The mapping is computed at render time.

## Key Insights

- The user picked "Realtime / Batch warm / Batch cold" (3 labels, by tier) over "Realtime / Batch" (2 labels, by substrate). This means the badge label depends on `latencyTier`, not just `substrate` — `<1s` always Realtime, `<1h` Batch warm, `<1d` Batch cold.
- Dual-tier features (currently only some `stateful-streaks`) render two pills: `Realtime · Batch warm` (one of each).
- PRD §10 explicitly says "Engineering reviewers see them and recognize the architecture without copy explaining it." We preserve the architecture signal by retaining A/B IDs in two places: handoff modals (verbatim per PRD §8.7, §9.9 — non-negotiable) and the definition pane labels ("Substrate A · expr-lang" / "Substrate B · dbt SQL").
- Acceptance gate: a PM should never see an A/B in the picker, predicate row, or feature card. An engineer should see A/B in handoff modals + lineage. This is the two-audience compromise the original PRD §3 demands.

## Requirements

**Functional**
- `LatencyBadge` component renders new labels based on `latencyTier`:
  - `<1s` → "Realtime"
  - `<1h` → "Batch warm"
  - `<1d` → "Batch cold"
- Dual-tier badge stack renders two chips side-by-side.
- Handoff modals (`apps/web/src/modules/segments/handoff-modal.tsx` and campaign equivalents) keep `Substrate A · Apollo TEE + Temporal` / `Substrate B · Hatchet + Trino + Iceberg` verbatim.
- Definition side-by-side pane keeps `Substrate A · expr-lang` / `Substrate B · dbt SQL` headers.
- Filter rail latency-class filter labels update to "Realtime / Batch warm / Batch cold".

**Non-functional**
- Single source of truth for label mapping — a small `latency-labels.ts` helper, used by every consumer.
- No regression on visual hierarchy: badge sizes, paddings, color tokens stay identical (only string content changes).

## Architecture

### New helper

```ts
// apps/web/src/components/_logic/latency-labels.ts
import type { HermesLatencyTier, HermesSubstrate } from '@hermes/contracts';

export const TIER_LABEL: Record<HermesLatencyTier, string> = {
  '<1s': 'Realtime',
  '<1h': 'Batch warm',
  '<1d': 'Batch cold',
};

export const TIER_TONE: Record<HermesLatencyTier, 'realtime' | 'warm' | 'cold'> = {
  '<1s': 'realtime',   // green
  '<1h': 'warm',       // amber
  '<1d': 'cold',       // slate
};

/** Engineer-facing label retained in handoff modals + lineage. */
export const SUBSTRATE_LONG: Record<HermesSubstrate, string> = {
  A: 'Substrate A · Apollo TEE + Temporal',
  B: 'Substrate B · Hatchet + Trino + Iceberg',
};

/** Used only inside <DefinitionSideBySide> — pane header. */
export const SUBSTRATE_PANE_LABEL: Record<HermesSubstrate, string> = {
  A: 'Substrate A · expr-lang',
  B: 'Substrate B · dbt SQL',
};
```

### Component contract changes

```ts
// apps/web/src/components/latency-badge.tsx
// BEFORE
<LatencyBadge tier="<1h" substrate="B" />   // renders "<1h · B"

// AFTER
<LatencyBadge tier="<1h" substrate="B" />   // renders "Batch warm"
// substrate prop becomes optional/decorative — only used for color tone in dual-tier stacks.
```

### Audit map (every callsite)

| Surface | Before | After | Owner |
|---|---|---|---|
| Library card row | `<1h · B` | `Batch warm` | Phase 5 |
| Detail header chips | `<1h · B` | `Batch warm` | Phase 3 |
| Predicate row pill | `<1h · B` | `Batch warm` | Phase 6 |
| Filter rail | "Latency class · `<1h` warm" | "Latency · Batch warm" | Phase 5 |
| Handoff modal mono block | `Substrate B · Hatchet + Trino + Iceberg` | **unchanged** | — |
| Definition pane header | `Substrate B · dbt SQL` | **unchanged** | — |
| Lineage tab tier rows | `<1h · B` | `Batch warm` (toolbar) + `Substrate B` (engineer detail row) | Phase 3 |
| Library subtitle copy | "Substrate A (TEE real-time) and Substrate B (Hatchet/Iceberg batch)" | "Realtime path (Substrate A · Apollo TEE) and batch path (Substrate B · Hatchet + Iceberg)" — keep both audiences | Phase 5 |
| Stat strip | "127 features · 38 hot tier · 56 warm · 33 cold" | "127 features · 38 Realtime · 56 Batch warm · 33 Batch cold" | Phase 5 |

### Color tones

Token mapping in `theme.tsx` (no new tokens — reuse):

| Tone | Background | Foreground |
|---|---|---|
| Realtime | `#dcfce7` (green-100) | `T.green600` |
| Batch warm | `#fef3c7` (amber-100) | `T.amber600` |
| Batch cold | `#e2e8f0` (slate-200) | `T.n600` |

## Related Code Files

**Modify**
- `apps/web/src/components/latency-badge.tsx` — render labels via helper
- `apps/web/src/modules/feature-store/library.tsx` — subtitle copy
- `apps/web/src/modules/feature-store/_components/stat-strip.tsx` — counts copy
- `apps/web/src/modules/feature-store/_components/filter-rail.tsx` — latency filter labels
- `apps/web/src/modules/feature-store/_components/feature-row-card.tsx` — badge consumer
- `apps/web/src/modules/feature-store/_components/definition-side-by-side.tsx` — pane headers via SUBSTRATE_PANE_LABEL helper (refactor only, no copy change)
- `apps/web/src/modules/feature-store/_components/lineage-tab.tsx` — toolbar uses Realtime/Batch warm/Batch cold; engineer detail row keeps `Substrate A/B`
- `apps/web/src/modules/segments/handoff-modal.tsx` — uses SUBSTRATE_LONG (no copy change, just refactor)
- `apps/web/src/modules/campaigns/handoff-modal.tsx` (or equivalent) — same refactor
- Any predicate row component referencing `<1s · A` (e.g. `_composer/predicate-row.tsx`)

**Create**
- `apps/web/src/components/_logic/latency-labels.ts` — single source of truth

**No deletes.**

## Implementation Steps

1. **Grep audit.** Run grep for: `<1s · A`, `<1h · B`, `<1d · B`, `Substrate A`, `Substrate B`. Capture every hit. Cross-reference with audit table above; flag anything not in the table.
2. **Create helper.** `apps/web/src/components/_logic/latency-labels.ts` with TIER_LABEL, TIER_TONE, SUBSTRATE_LONG, SUBSTRATE_PANE_LABEL. Export.
3. **Refactor `LatencyBadge`.** Replace inline label/tone logic with helper lookups. Preserve component prop signature so callsites don't change.
4. **Refactor handoff modals.** Replace inline `Substrate A · Apollo TEE + Temporal` strings with `SUBSTRATE_LONG[s]`. Pure refactor — output identical. (This is the engineer-facing pane — copy stays verbatim per PRD §8.7.)
5. **Refactor definition pane.** Same — replace inline strings with `SUBSTRATE_PANE_LABEL[s]`.
6. **Update library subtitle + stat strip copy.** New strings per audit table.
7. **Update filter rail labels.** "Realtime / Batch warm / Batch cold". Keep filter values keyed by `<1s`/`<1h`/`<1d` underneath.
8. **Update lineage tab toolbar.** Toolbar shows new labels; the engineer-facing detail rows (where the actual workflow names appear) keep `Substrate A` / `Substrate B`.
9. **Typecheck + visual diff.** `pnpm typecheck`. Then open every screen in dev (FS library, FS detail, segment canvas, segment handoff, campaign canvas, campaign handoff). Verify: PM screens show new labels, handoff modals show A/B verbatim.

## Todo List

- [ ] Grep audit of all `<1s · A` / `<1h · B` / `<1d · B` / `Substrate A` / `Substrate B` callsites
- [ ] Create `latency-labels.ts` helper
- [ ] Refactor `LatencyBadge` to use helper
- [ ] Refactor handoff modals to use `SUBSTRATE_LONG` (no copy change)
- [ ] Refactor definition pane to use `SUBSTRATE_PANE_LABEL` (no copy change)
- [ ] Update library subtitle copy
- [ ] Update stat strip counts copy
- [ ] Update filter rail labels
- [ ] Update lineage tab toolbar labels
- [ ] `pnpm typecheck` clean
- [ ] Visual smoke test — PM screens vs engineer screens match audit

## Success Criteria

- [ ] No `<1s · A`, `<1h · B`, `<1d · B` strings remain on PM-facing surfaces (library, detail, predicate rows, pickers, filter rail)
- [ ] Handoff modals (segment + campaign) still show `Substrate A · Apollo TEE + Temporal` and `Substrate B · Hatchet + Trino + Iceberg` verbatim
- [ ] Definition side-by-side pane headers still show `Substrate A · expr-lang` and `Substrate B · dbt SQL`
- [ ] Lineage tab toolbar shows Realtime/Batch warm/Batch cold; lineage detail row preserves Substrate A/B
- [ ] Color tone palette matches: Realtime green, Batch warm amber, Batch cold slate
- [ ] `pnpm typecheck` and `pnpm build` clean

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Hidden hardcoded `<1h · B` strings in screens we forget | Grep audit step covers it. Add eslint pattern (post-phase nice-to-have) — `no-restricted-syntax` for raw substrate strings outside the helper. |
| Engineers complain that A/B is gone from card rows | They aren't gone — handoff modals + definition panes + lineage detail still carry them. PRD §10's "ambient signal" is preserved on the artifacts engineers actually look at. Document the rationale in helper file header. |
| Tone change confuses PMs (amber = anomaly per PRD §4) | Batch warm uses amber-100 background (lighter than anomaly amber). Verify in visual review — if too close, shift Batch warm to a yellow-tinted slate. |

## Security Considerations

None — purely presentational changes.

## Next Steps

Phase 3 redesigns the Detail page and consumes both the new schema (Phase 1 fields) and the new label system (this phase). Phases 4-6 follow the same pattern for Register page, Library, and Segment surfaces.
