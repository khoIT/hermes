---
phase: 1
title: "Schema & Game Attribution"
status: complete
priority: P1
effort: "6h"
dependencies: []
---

# Phase 1: Schema & Game Attribution

## Context Links

- Parent plan: [../plan.md](../plan.md)
- PRD source: `design-reference/Hermes/uploads/liveops_2026_campaign_requirements.md` — 47 campaigns × games × User Stage metrics
- Existing schema: `packages/contracts/src/hermes-feature.ts`
- Existing catalog: `apps/web/src/data/catalog/features/*.ts` (73 features across 11 domain files)

## Overview

Foundation phase. Three deliverables: (1) schema extension for games + propensity + 180d analytics; (2) game ↔ feature mapping derived from `liveops_2026_campaign_requirements.md`; (3) seed 2-3 platform propensity features. No UI changes — purely data + types.

## Key Insights

- Campaign-requirements doc already names games per campaign (CFM, TF, COS, NTH, PT) and the User Stage metrics each reads. We extract a `feature → Set<game>` mapping by joining "User Stage metrics" rows in §1-§6 with the game prefix on the campaign code.
- Only CFM has real `iceberg.cfm_vn` Trino fixtures (parent plan Phase 4). Other games' 180-day metrics are synthesised — must look real (smooth trends, plausible cardinality, drift events that line up with the campaign calendar).
- Existing 73 features lack a `games[]` field. Migration is mechanical: feature appears in CFM-13 trigger predicate → `games: ['cfm']`. Features used by 3+ games OR by the Predictive domain → tagged `platform: true`.
- "Platform feature" ≠ owner change. It's a discoverability concept: this feature is owned by GDS, available to all games, typically a propensity model trained on cross-game data.

## Requirements

**Functional**
- Every feature has `games: HermesGame[]` (non-empty; `[]` reserved for unwired features → must error in build).
- Platform features carry `platform: true` and an optional `propensityModel?: PropensityModelMeta` (model family, target metric, training window, AUC band).
- Every feature has `analytics: FeatureAnalytics180d` — usage count, drift score, freshness, null rate, distinct values, top-3 consuming campaigns, daily request-rate sparkline (180 buckets).
- Synthesised data is deterministic (seeded) so re-runs produce identical fixtures.

**Non-functional**
- Schema changes are additive — existing 73 features keep working without modification (defaults applied).
- Synth generator is a script, not hand-written JSON. Reproducible from `liveops_2026_campaign_requirements.md` + seed.
- Platform feature definitions match the same `expr-lang + dbt SQL` semantic-layer shape as the rest.

## Architecture

```
liveops_2026_campaign_requirements.md
        │
        ▼
[parse-campaign-requirements.ts]   ← new infra script
        │ extract: campaign, game, User Stage metrics[]
        ▼
        feature → games[]  mapping JSON
        │
        ▼
[migrate-features.ts]              ← new infra script
        │ reads existing 73 features + mapping
        │ writes: games[], platform?, propensityModel?
        ▼
        apps/web/src/data/catalog/features/*.ts (rewritten)
        │
        ▼
[generate-feature-analytics-180d.ts] ← new infra script
        │ deterministic synth: usage/drift/freshness/cardinality/null
        │ for CFM features: anchor to real cfm_vn metrics from Phase 4 fixture
        │ for PTG/NTH/TF/COS/PT: synth with plausible curves
        ▼
        apps/web/src/data/catalog/feature-analytics-180d.json
```

### Schema deltas

```ts
// packages/contracts/src/hermes-feature.ts

export const HermesGame = z.enum(['cfm', 'ptg', 'nth', 'tf', 'cos', 'pt']);
export type HermesGame = z.infer<typeof HermesGame>;

export const PropensityModelFamily = z.enum([
  'pltv',          // predicted lifetime value
  'churn',         // churn risk
  'reactivation',  // win-back probability
  'monetization',  // first-payment / next-payment propensity
  'engagement',    // session-likelihood
]);

export const PropensityModelMeta = z.object({
  family: PropensityModelFamily,
  target: z.string(),                 // e.g. "30d_revenue", "7d_churn"
  trainingWindowDays: z.number().int().positive(),
  aucBand: z.string(),                // e.g. "0.78-0.82"
  modelVersion: z.string(),           // e.g. "v3.2"
  refreshCadence: z.enum(['daily', 'weekly']),
});

export const FeatureAnalytics180d = z.object({
  usageCount180d: z.number().int().nonnegative(),
  driftScore: z.number().min(0).max(1),         // 0 = stable, 1 = severe drift
  driftEventDates: z.array(z.string()),         // ISO dates flagged
  freshnessSlaMet: z.number().min(0).max(1),    // % buckets meeting SLA
  nullRate: z.number().min(0).max(1),
  distinctValuesP50: z.number().int().nonnegative(),
  topConsumingCampaigns: z.array(z.object({
    campaignId: z.string(),
    game: HermesGame,
    fires180d: z.number().int().nonnegative(),
  })).max(3),
  requestRateSparkline: z.array(z.number()).length(180),  // daily req count
  lastBackfillAt: z.string(),                   // ISO timestamp
});

// Extend HermesFeature
export const HermesFeature = z.object({
  // ... existing fields
  games: z.array(HermesGame).min(1),
  platform: z.boolean().optional(),
  propensityModel: PropensityModelMeta.optional(),
  analytics: FeatureAnalytics180d,                // required after migration
});
```

### Game ↔ feature mapping (illustrative, derived from campaign requirements doc)

| Feature | Games (derived) | Platform? | Notes |
|---|---|---|---|
| `consecutive_ranked_losses_streak` | cfm | no | CFM-13 only |
| `account_age_days` | cfm, tf, cos, nth, pt | no | NRU + Retention universal — but per-game owner |
| `last_login_at` | cfm, tf, nth, pt | no | Retention universal |
| `lifetime_spend_total` | cos, pt, cfm | no | COS-3, PT-6/10 — multi-game |
| `current_gem_balance` | cfm, pt | no | CFM-9, PT-6/10 — event-time shared |
| `purchased_pack_ids` | cos | no | COS-3 only |
| `mong_hoa_luc_popularity_score` | nth | no | NTH-9 — external signal |
| **NEW** `pltv_30d_score` | cfm, ptg, nth, tf, cos, pt | **yes** | Platform propensity, all games |
| **NEW** `churn_7d_propensity` | cfm, ptg, nth, tf, cos, pt | **yes** | Platform propensity |
| **NEW** `reactivation_propensity` | cfm, ptg, nth, tf, cos, pt | **yes** | Platform propensity |

Platform features added to a new file `apps/web/src/data/catalog/features/platform-propensity.ts`.

### Seed propensity feature spec (one example)

```ts
// platform-propensity.ts
{
  name: 'pltv_30d_score',
  displayName: 'Predicted 30-Day LTV',
  type: 'numeric',
  latencyTier: '<1d',
  substrate: 'B',
  domain: 'predictive',          // existing domain, rebrand path
  status: 'active',
  games: ['cfm', 'ptg', 'nth', 'tf', 'cos', 'pt'],
  platform: true,
  propensityModel: {
    family: 'pltv',
    target: '30d_revenue',
    trainingWindowDays: 90,
    aucBand: '0.78-0.82',
    modelVersion: 'v3.2',
    refreshCadence: 'daily',
  },
  definition: {
    exprLang: '@features.pltv_30d_score  -- served from offline cache; not computed at TEE',
    dbtSql: '-- materialized by GDS ML pipeline; see ml/pltv_30d.py\nSELECT uid, score AS pltv_30d_score FROM ml.pltv_30d_predictions WHERE ds = CURRENT_DATE',
  },
  // owner field DEPRECATED but kept for back-compat during migration
  owner: 'gds-ml-platform',
  // analytics injected by generator
}
```

## Related Code Files

**Modify**
- `packages/contracts/src/hermes-feature.ts` — add games/platform/propensityModel/analytics
- `packages/contracts/src/index.ts` — export new types
- `apps/web/src/data/catalog/features/identity-lifecycle.ts` — add `games` per feature
- `apps/web/src/data/catalog/features/monetization.ts` — add `games`
- `apps/web/src/data/catalog/features/currency.ts` — add `games`
- `apps/web/src/data/catalog/features/engagement.ts` — add `games`
- `apps/web/src/data/catalog/features/gameplay-cfm.ts` — set `games: ['cfm']`
- `apps/web/src/data/catalog/features/stateful-streaks.ts` — add `games`
- `apps/web/src/data/catalog/features/inventory.ts` — add `games`
- `apps/web/src/data/catalog/features/promotion-config.ts` — add `games`
- `apps/web/src/data/catalog/features/social-playstyle.ts` — add `games`
- `apps/web/src/data/catalog/features/test-system.ts` — add `games`
- `apps/web/src/data/catalog/features/campaign-engagement.ts` — add `games`
- `apps/web/src/data/catalog/features/index.ts` — wire new platform-propensity file + analytics loader

**Create**
- `apps/web/src/data/catalog/features/platform-propensity.ts` — 3 platform features
- `apps/web/src/data/catalog/feature-analytics-180d.json` — synth analytics, deterministic
- `infra/feature-tools/parse-campaign-requirements.ts` — extracts game↔feature mapping
- `infra/feature-tools/migrate-features.ts` — applies mapping to existing features
- `infra/feature-tools/generate-feature-analytics-180d.ts` — deterministic synth generator
- `infra/feature-tools/lib/synth-curves.ts` — shared curve generators (sine, ramp, drift-event)

**No deletes.**

## Implementation Steps

1. **Read source-of-truth doc.** `liveops_2026_campaign_requirements.md` §1-§6 — extract every `User Stage metrics` cell, tag with the campaign's game prefix (`CFM-x` → `cfm`, `TF-x` → `tf`, etc.).
2. **Build mapping JSON.** Output: `infra/feature-tools/output/feature-game-map.json` keyed by feature name → `string[]` of games. Hand-edit corrections allowed for ambiguous cases (e.g. baseline metrics like `account_age_days` get all games).
3. **Extend schema.** Add `HermesGame`, `PropensityModelFamily`, `PropensityModelMeta`, `FeatureAnalytics180d` to `hermes-feature.ts`. Make `games`, `analytics` required; `platform`, `propensityModel` optional.
4. **Migrate 73 features.** Run `migrate-features.ts` against the catalog files. Auto-applies `games[]` from mapping. Marks Predictive-domain features with `platform: true`. Hand-review the diff for any mismatches.
5. **Author 3 platform features.** New file `platform-propensity.ts`: `pltv_30d_score`, `churn_7d_propensity`, `reactivation_propensity`. Each with full propensityModel meta.
6. **Generate analytics.** `generate-feature-analytics-180d.ts` — deterministic seeded curves. CFM features: anchor request-rate sparkline to real `iceberg.cfm_vn` query counts where available. Other games: synth (peak-on-weekend pattern, drift events tied to campaign launch dates from the 2026 calendar).
7. **Wire analytics loader.** `apps/web/src/data/catalog/features/index.ts` — at module load, inject `analytics` into each feature from the JSON. Throw if any feature lacks an entry (catches drift between schema + data).
8. **Typecheck.** `pnpm typecheck` — 0 errors expected. Schema is the gate; if anything red, fix before moving on.
9. **Smoke test.** Open existing FS library — should still render (UI unchanged this phase). 76 features visible (73 + 3 platform).

## Todo List

- [ ] Read `liveops_2026_campaign_requirements.md` end-to-end and extract User Stage metric → campaign mapping
- [ ] Write `parse-campaign-requirements.ts` to produce `feature-game-map.json`
- [ ] Hand-review and patch baseline features (account_age_days, last_login_at) → all games
- [ ] Extend `hermes-feature.ts` schema (HermesGame, PropensityModelMeta, FeatureAnalytics180d)
- [ ] Run `migrate-features.ts` to add `games[]` to all 73 catalog features
- [ ] Tag Predictive-domain features as `platform: true`
- [ ] Create `platform-propensity.ts` with 3 propensity features
- [ ] Build `generate-feature-analytics-180d.ts` deterministic generator
- [ ] Generate `feature-analytics-180d.json` (76 features × 180 daily buckets)
- [ ] Wire analytics loader in `features/index.ts`
- [ ] `pnpm typecheck` clean
- [ ] FS library smoke test renders 76 features

## Success Criteria

- [ ] Schema additions in `hermes-feature.ts` typecheck and pass Zod parse for every feature
- [ ] Every existing feature has non-empty `games[]` after migration
- [ ] Platform-propensity features (3) load and parse with full `propensityModel` meta
- [ ] `feature-analytics-180d.json` has 180 daily buckets per feature × 76 features = 13,680 entries
- [ ] Synth generator is deterministic (re-run produces identical JSON)
- [ ] CFM features' analytics anchored to real cfm_vn data where available; others synth with realistic curves (no flat lines)
- [ ] Existing FS library still renders without runtime errors

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Mapping doc ambiguity (which game owns `account_age_days`?) | Treat baseline metrics as `all games`. Document the rule in script header. |
| Synth curves look fake (linear, no noise) | Use composed curves (trend × seasonality × drift events × noise). Anchor weekends/holidays to real calendar. |
| Schema migration breaks existing tests | Defaults at schema level; existing tests use existing fields. Add Zod parse smoke test. |
| Platform feature definitions can't be evaluated by Apollo TEE (model lives offline) | Document it explicitly in the dbt SQL block. Substrate B only for these — never TEE. |

## Security Considerations

- Synthesised data must not include real player UIDs or PII. Use `synth-uid-{n}` placeholders.
- `feature-analytics-180d.json` is committed to git — keep file <500 KB by quantizing sparkline values.

## Next Steps

Phase 2 (Substrate Relabel) consumes the new schema unchanged but updates the latency badge component and copy across the app. Phase 3 (Detail Redesign) is the first phase that visually consumes the new fields.
