# Feature Store v2 — PRD Addendum

> Addendum to `design-reference/Hermes/uploads/PRD_Hermes_Design (1).md` §6 + §10.
> Captures the v2 redesign (May 2026) layered on top of the v1 prototype.

## Context

Phase 1 prototype shipped Feature Store as a thin inventory (library + detail with
overview / lineage / used-by tabs). This v2 turns it into the discovery + analytics
surface for the platform — the screen LiveOps PMs land on first when shopping for a
feature, and the screen GDS analysts use to monitor health.

What is superseded vs the parent PRD:

| Parent PRD §  | v2 supersedes                                                     |
|---------------|-------------------------------------------------------------------|
| §6.2 Library  | Stat strip + filters + group-by + sort (new)                      |
| §6.3 Detail   | 4-tab layout (Analytics added); owner avatar replaced; new chips  |
| §10           | Substrate label policy (PM-facing copy + engineer-facing IDs)     |
| §13           | "Register a new feature" CTA is now wired (not a no-op)           |

What stands unchanged:

- Two-audience contract (PMs see plain English, engineers see substrate IDs)
- Semantic Management Layer one-definition-two-materializations pitch
- Handoff modal copy verbatim (Substrate A · Apollo TEE + Temporal / Substrate B · Hatchet + Trino + Iceberg)
- Definition pane headers (Substrate A · expr-lang / Substrate B · dbt SQL)

## Two-audience contract (restated)

| Surface                              | Audience  | Label policy                                     |
|--------------------------------------|-----------|--------------------------------------------------|
| Library row card · latency badge     | PM        | Realtime / Batch warm / Batch cold               |
| Detail header · latency badge        | PM        | Realtime / Batch warm / Batch cold               |
| Picker / swap / predicate row        | PM        | Realtime / Batch warm / Batch cold               |
| Filter rail · latency section        | PM        | Realtime / Batch warm / Batch cold               |
| Stat strip · tier counts             | PM        | realtime / batch warm / batch cold               |
| Handoff modal · substrate line       | Engineer  | Substrate A · Apollo TEE + Temporal (verbatim)   |
| Definition pane · headers            | Engineer  | Substrate A · expr-lang / Substrate B · dbt SQL  |
| Lineage tab · source-table sublabels | Engineer  | Kafka · Substrate A / Iceberg · Substrate B      |

Single source of truth: `apps/web/src/components/_logic/latency-labels.ts`.

## Schema deltas (v2)

```ts
// packages/contracts/src/hermes-feature.ts (excerpt)

export const HermesGame = z.enum(['cfm', 'ptg', 'nth', 'tf', 'cos', 'pt']);

export const PropensityModelMeta = z.object({
  family: z.enum(['pltv', 'churn', 'reactivation', 'monetization', 'engagement']),
  target: z.string(),                     // "30d_revenue"
  trainingWindowDays: z.number().int(),
  aucBand: z.string(),                    // "0.78-0.82"
  modelVersion: z.string(),               // "v3.2"
  refreshCadence: z.enum(['daily', 'weekly']),
});

export const FeatureAnalytics180d = z.object({
  usageCount180d: z.number().int(),
  driftScore: z.number().min(0).max(1),
  driftEventDates: z.array(z.string()),
  freshnessSlaMet: z.number().min(0).max(1),
  nullRate: z.number().min(0).max(1),
  distinctValuesP50: z.number().int(),
  topConsumingCampaigns: z.array(/* {campaignId, game, fires180d} */).max(3),
  requestRateSparkline: z.array(z.number()).length(180),
  lastBackfillAt: z.string().nullable(),  // null for newly-registered
  // Optional ergonomics: p99LookupLatencyMs, coverageOfMau, medianLagMinutes, lastSlaMissAt
});

export const HermesFeature = z.object({
  // ... v1 fields preserved
  games: z.array(HermesGame).min(1),         // NEW · required
  platform: z.boolean().optional(),          // NEW · cross-game GDS propensity flag
  propensityModel: PropensityModelMeta.optional(),
  analytics: FeatureAnalytics180d,           // NEW · required
});
```

Source files use `HermesFeatureSource = Omit<HermesFeature, 'analytics'>`; the catalog
loader (`apps/web/src/data/catalog/features/index.ts`) merges analytics from the
generated JSON fixture at module load.

## Detail page contract (Phase 3)

**Header:**
- Mono name + serif italic display name (preserve)
- Type chip
- Latency badge stack — Realtime / Batch warm / Batch cold (Phase 2)
- Games chip cluster (replaces owner avatar)
- Platform · Propensity chip when `feature.platform === true`
- Status badge + domain
- CTAs: Edit definition (no-op per PRD §13) + Register similar feature (Phase 4)

**Tabs:** Overview · Analytics · Lineage · Used By
- Deep link: `?tab=analytics` opens the dashboard directly (used by Library
  drift-detected entry-point and Health snapshot card in the right rail).

**Overview tab:**
- PropensityModelCard (when applicable)
- DescriptionBlock
- DefinitionSideBySide
- Storage row

**Analytics tab — 6 panels in a 2-col grid:**
1. Health snapshot (drift score + trend + last drift event)
2. Freshness vs SLA (% meeting + last miss + median lag)
3. Value distribution over time (4 small histograms: 180d / 90d / 30d / today + drift events)
4. Top consuming campaigns (top 3 by fire count, grouped by game)
5. Online request rate (180d sparkline + peak callout + p99 latency)
6. Data quality (null rate + distinct values + coverage + last backfill)

**Right rail:**
- Use in segment / Investigate in Explore (preserve)
- Health snapshot card (drift / fresh / null + "Open Analytics" jump)
- Related features list
- Usage stats

## Register page contract (Phase 4)

Route `/feature-store/new`. Entry points:
- Library entry-points strip "Register a new feature"
- Detail page "Register similar feature" CTA — prefills `domain`, `games`, `latency`
  via query params

**Form sections:**
1. Identity & Classification (name, displayName, domain, type, status)
2. Latency & substrate (Realtime / Batch warm / Batch cold + dual-tier toggle)
3. Attribution (games multi-select; auto-suggest Platform when ≥3 games)
4. Propensity model (gated on Platform — family, target, AUC, version, cadence)
5. Definition editor (two-pane code blocks with stub generators)
6. Description (≤280 chars plain prose)

**Validation rules:**
- `name`: snake_case `/^[a-z][a-z0-9_]*$/`, min 3 chars, unique against catalog
- `games`: at least one
- Dual-tier: requires both substrate definitions filled
- Platform: requires propensity target / AUC / version

**Submission flow:**
- `registerFeature()` pushes onto in-memory catalog (no backend persistence — session only)
- Newly-registered features carry zeroed analytics (`lastBackfillAt: null`); UI panels
  render "no data yet · 7-day warm-up" empty state
- Handoff modal mirrors segment / campaign handoffs: FeatureID, 4-step "what happens
  next", verbatim Substrate A/B copy
- Modal CTAs: View feature · Register another · Done

## Library contract (Phase 5)

**Stat strip:** total · platform · realtime · batch warm · batch cold · added this month · drift detected
- Platform count rendered in deep-red brand color
- Drift count computed live from `analytics.driftScore >= 0.4`

**Entry-points strip:** Browse by domain (active state) · Register a new feature · Recently added · Drift detected
- Drift detected click applies `driftedOnly: true` filter + `most-drifted` sort
- Recently added click applies `recently-added` sort

**Filter rail:** Type · Latency · Games (multi-select) · Platform · Status
- Owner removed
- Games chips tinted per-game color; Platform single toggle

**Group-by:** Domain (default) · Game · Tier · Status · Platform · In-prod · None
- Owner removed
- Game uses multi-pin: a feature with `games=[cfm,pt]` appears in BOTH groups

**Sort:** Default A-Z · Most used · Most drifted · Recently added

**Row card:**
- Mono name + serif italic display
- Type chip + Latency badge
- 7-day sparkline + Used-by counts + Freshness % (from `analytics.freshnessSlaMet`)
- Games chip cluster (sm) + optional Platform chip — replaces owner avatar
- Status badge for non-active

## Segment wiring contract (Phase 6)

Five surfaces consume the v2 chips:

1. **Pickers** (condition / exclusion / or-row): each card shows games chips +
   platform chip + DriftBadge (when score ≥ 0.4)
2. **Inline swap popover**: candidates ranked by game-overlap with current feature,
   then domain match, then usage. Cards same shape as pickers.
3. **Features-in-use right rail**: each row gets xs games chip (or single deep-red `P`
   for platform features) + freshness % on hover
4. **Predicate row pill**: xs game chip (or `P`) sits between feature pill and
   latency badge — replaces the v1 owner avatar
5. **Segment library group-by**: deferred to follow-on (additive only — no regression)

## Acceptance criteria (12)

1. ✓ Substrate copy: PM surfaces show Realtime / Batch warm / Batch cold; handoff
   modals + lineage detail show Substrate A/B verbatim
2. ✓ Owner avatar removed from FS detail header, library row card, picker card,
   swap popover, features-in-use rail
3. ✓ Games chip cluster visible on every surface where features surface
4. ✓ Platform · Propensity chip on cross-game features (3 platform features minimum)
5. ✓ Propensity Model card renders on detail page Overview tab when applicable
6. ✓ Detail page Analytics tab renders 6 panels
7. ✓ Health snapshot card visible on detail right rail across all tabs
8. ✓ Library filter rail has Games + Platform-only; group-by has Game + Platform;
   sort has 4 strategies
9. ✓ Register page (`/feature-store/new`) reachable, validates, submits, opens
   handoff modal, navigates to detail
10. ✓ Segment composer: pickers + swap + features-in-use + predicate row show games
    attribution
11. ✓ Original 13-step demo flow walks end-to-end (verified by Phase 7 smoke pass)
12. ✓ `pnpm typecheck && pnpm build` clean

## Open questions (carry forward)

- Live drift monitoring service — synth scores today; real values pending parity
  monitoring service from PRD §10 follow-ups
- Per-substrate parity test panel — surfaced via drift score only; dedicated panel
  deferred
- Segment library group-by `byGameOfFeatures` — additive feature, deferred to
  follow-on (filter rail + main flow already tested)
- Edit Definition CTA on detail page remains no-op per parent PRD §13
