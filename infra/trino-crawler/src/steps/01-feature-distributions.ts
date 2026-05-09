/**
 * Step 01 — Feature distributions (synth-only path).
 *
 * For every feature in derivation-coverage.json, synthesises a plausible
 * distribution based on the feature type:
 *   counter → power-law histogram
 *   score   → normal/log-normal histogram
 *   bool    → bernoulli two-spike histogram
 *   enum    → categorical histogram
 *   tuple   → array-length histogram + item membership
 *
 * All outputs tagged synthesised:true, source: "P-4 synth · awaiting VPN/auth".
 * Output: apps/web/src/data/crawled/distributions.json (keyed by feature name).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeCrawledJson } from '../outputs.js';
import { synthCounter } from '../synthesizers/counter.js';
import { synthScore } from '../synthesizers/score.js';
import { synthBool } from '../synthesizers/bool.js';
import { synthEnum } from '../synthesizers/enum.js';
import { synthTuple } from '../synthesizers/tuple.js';

const _dirname: string =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const COVERAGE_PATH = path.resolve(_dirname, '../../derivation-coverage.json');

// ---------------------------------------------------------------------------
// Feature-type metadata: maps feature name → synth function + params
// ---------------------------------------------------------------------------

type SynthSpec =
  | { kind: 'counter'; min?: number; max?: number; alpha?: number }
  | { kind: 'score'; mu?: number; sigma?: number; min?: number; max?: number; logNormal?: boolean }
  | { kind: 'bool'; trueRate?: number }
  | { kind: 'enum'; categories: { label: string; weight: number }[] }
  | { kind: 'tuple'; items: { id: string; ownershipRate: number }[] };

// Explicit overrides for non-obvious shapes. Unlisted features fall back to
// domain-based heuristics below.
const FEATURE_SPEC_OVERRIDES: Record<string, SynthSpec> = {
  account_age_days:         { kind: 'counter', min: 1, max: 2000, alpha: 1.8 },
  days_since_install:       { kind: 'counter', min: 1, max: 2000, alpha: 1.8 },
  lifetime_login_count:     { kind: 'counter', min: 1, max: 8000, alpha: 2.2 },
  last_login_days_ago:      { kind: 'counter', min: 0, max: 365, alpha: 2.5 },
  last_purchase_days_ago:   { kind: 'counter', min: 0, max: 730, alpha: 2.0 },
  lifetime_purchase_count:  { kind: 'counter', min: 1, max: 500, alpha: 2.4 },
  lifetime_revenue_local:   { kind: 'counter', min: 10000, max: 50_000_000, alpha: 1.7 },
  session_count_30d:        { kind: 'counter', min: 1, max: 120, alpha: 2.1 },
  session_count_7d:         { kind: 'counter', min: 0, max: 30, alpha: 2.3 },
  session_count_1d:         { kind: 'counter', min: 0, max: 8, alpha: 2.5 },
  ranked_match_count_lifetime: { kind: 'counter', min: 1, max: 10000, alpha: 2.0 },
  ranked_match_count_30d:   { kind: 'counter', min: 0, max: 300, alpha: 2.2 },
  daily_login_streak_current: { kind: 'counter', min: 0, max: 365, alpha: 2.8 },
  daily_login_streak_max:   { kind: 'counter', min: 1, max: 365, alpha: 2.5 },
  consecutive_ranked_losses_streak: { kind: 'counter', min: 0, max: 20, alpha: 3.0 },
  consecutive_ranked_wins_streak:   { kind: 'counter', min: 0, max: 20, alpha: 3.0 },
  mmr_current:              { kind: 'counter', min: 800, max: 3500, alpha: 1.6 },
  mmr_drift_7d:             { kind: 'score', mu: 0, sigma: 80, min: -300, max: 300 },
  rank_points_current:      { kind: 'counter', min: 0, max: 3500, alpha: 1.7 },
  rank_tier_current:        { kind: 'counter', min: 1, max: 10, alpha: 1.9 },
  demotion_threshold_distance: { kind: 'counter', min: 0, max: 200, alpha: 2.2 },
  chapter_progress_max:     { kind: 'counter', min: 1, max: 30, alpha: 2.0 },
  gem_balance_current:      { kind: 'counter', min: 0, max: 50000, alpha: 2.1 },
  cf_coin_balance_current:  { kind: 'counter', min: 0, max: 5000, alpha: 2.3 },
  premium_currency_balance: { kind: 'counter', min: 0, max: 50000, alpha: 2.1 },
  avg_purchase_amount_30d:  { kind: 'score', mu: 120000, sigma: 80000, min: 0, max: 2000000, logNormal: true },
  avg_session_duration_30d: { kind: 'score', mu: 35, sigma: 20, min: 1, max: 180 },
  purchase_count_30d:       { kind: 'counter', min: 0, max: 50, alpha: 2.6 },
  purchase_count_7d:        { kind: 'counter', min: 0, max: 15, alpha: 2.8 },
  mission_completion_count_7d: { kind: 'counter', min: 0, max: 50, alpha: 2.2 },
  mission_completion_rate_30d: { kind: 'score', mu: 0.55, sigma: 0.25, min: 0, max: 1 },
  guild_contribution_30d:   { kind: 'counter', min: 0, max: 5000, alpha: 2.4 },
  weapon_count_owned:       { kind: 'counter', min: 1, max: 80, alpha: 2.0 },
  pass_progress_current:    { kind: 'counter', min: 0, max: 100, alpha: 2.2 },
  annual_contribution_tier: { kind: 'counter', min: 1, max: 5, alpha: 1.5 },
  iam_received_count_24h:   { kind: 'counter', min: 0, max: 5, alpha: 3.0 },
  iam_received_count_7d:    { kind: 'counter', min: 0, max: 20, alpha: 2.8 },
  promoted_item_active_count: { kind: 'counter', min: 0, max: 10, alpha: 2.0 },
  weapon_promotion_active_count: { kind: 'counter', min: 0, max: 10, alpha: 2.0 },

  // Bool features
  is_paying_user_lifetime:   { kind: 'bool', trueRate: 0.32 },
  is_new_user_d7:            { kind: 'bool', trueRate: 0.08 },
  is_returning_after_lapse:  { kind: 'bool', trueRate: 0.14 },
  is_in_demotion_zone:       { kind: 'bool', trueRate: 0.21 },
  pass_owned_current:        { kind: 'bool', trueRate: 0.28 },
  specific_pack_owned:       { kind: 'bool', trueRate: 0.19 },
  is_test_account:           { kind: 'bool', trueRate: 0.002 },
  is_internal_user:          { kind: 'bool', trueRate: 0.001 },
  marketing_consent_flag:    { kind: 'bool', trueRate: 0.76 },

  // Enum features
  player_lifecycle_stage: {
    kind: 'enum',
    categories: [
      { label: 'nru', weight: 0.15 },
      { label: 'mid', weight: 0.42 },
      { label: 'veteran', weight: 0.30 },
      { label: 'lapsed', weight: 0.13 },
    ],
  },
  region_code: {
    kind: 'enum',
    categories: [
      { label: 'VN', weight: 0.55 },
      { label: 'TH', weight: 0.18 },
      { label: 'ID', weight: 0.12 },
      { label: 'PH', weight: 0.09 },
      { label: 'Other', weight: 0.06 },
    ],
  },
  character_gender: {
    kind: 'enum',
    categories: [
      { label: 'male', weight: 0.68 },
      { label: 'female', weight: 0.32 },
    ],
  },
  spend_tier_lifetime: {
    kind: 'enum',
    categories: [
      { label: 'free', weight: 0.58 },
      { label: 'low', weight: 0.22 },
      { label: 'mid', weight: 0.12 },
      { label: 'high', weight: 0.06 },
      { label: 'whale', weight: 0.02 },
    ],
  },
  vip_status: {
    kind: 'enum',
    categories: [
      { label: 'none', weight: 0.55 },
      { label: 'vip1', weight: 0.22 },
      { label: 'vip2', weight: 0.13 },
      { label: 'vip3', weight: 0.07 },
      { label: 'vip_max', weight: 0.03 },
    ],
  },
  dominant_playstyle: {
    kind: 'enum',
    categories: [
      { label: 'pvp', weight: 0.52 },
      { label: 'pve', weight: 0.18 },
      { label: 'housing', weight: 0.12 },
      { label: 'fishing', weight: 0.10 },
      { label: 'social', weight: 0.08 },
    ],
  },
  guild_role: {
    kind: 'enum',
    categories: [
      { label: 'member', weight: 0.82 },
      { label: 'officer', weight: 0.12 },
      { label: 'leader', weight: 0.06 },
    ],
  },
  cs_flag: {
    kind: 'enum',
    categories: [
      { label: 'none', weight: 0.88 },
      { label: 'support_open', weight: 0.07 },
      { label: 'banned_temp', weight: 0.03 },
      { label: 'vip_watch', weight: 0.02 },
    ],
  },

  // Score features
  pvp_engagement_score:   { kind: 'score', mu: 55, sigma: 22, min: 0, max: 100 },
  social_engagement_score: { kind: 'score', mu: 48, sigma: 20, min: 0, max: 100 },
  ugc_creator_score:      { kind: 'score', mu: 30, sigma: 25, min: 0, max: 100, logNormal: true },
  ugc_voter_score:        { kind: 'score', mu: 40, sigma: 28, min: 0, max: 100 },
  mong_hoa_luc_popularity_score: { kind: 'score', mu: 50, sigma: 30, min: 0, max: 100 },
  anti_fraud_trust_score: { kind: 'score', mu: 85, sigma: 12, min: 0, max: 100 },
  ranked_win_rate_30d:    { kind: 'score', mu: 0.48, sigma: 0.15, min: 0, max: 1 },
  ranked_win_rate_7d:     { kind: 'score', mu: 0.48, sigma: 0.17, min: 0, max: 1 },

  // Tuple features
  weapon_owned_lifetime: {
    kind: 'tuple',
    items: [
      { id: 'w_ak47_ss1', ownershipRate: 0.62 },
      { id: 'w_m4a1_ss1', ownershipRate: 0.55 },
      { id: 'w_awm_ss1', ownershipRate: 0.41 },
      { id: 'w_desert_eagle_ss1', ownershipRate: 0.35 },
      { id: 'w_mp5', ownershipRate: 0.78 },
      { id: 'w_knife_default', ownershipRate: 0.95 },
      { id: 'w_grenade_default', ownershipRate: 0.91 },
      { id: 'w_sniper_basic', ownershipRate: 0.52 },
    ],
  },
  housing_items_owned: {
    kind: 'tuple',
    items: [
      { id: 'h_sofa_basic', ownershipRate: 0.55 },
      { id: 'h_table_wood', ownershipRate: 0.48 },
      { id: 'h_plant_small', ownershipRate: 0.62 },
      { id: 'h_lamp_floor', ownershipRate: 0.40 },
      { id: 'h_rug_default', ownershipRate: 0.35 },
    ],
  },
  char_skins_owned: {
    kind: 'tuple',
    items: [
      { id: 'skin_default', ownershipRate: 0.99 },
      { id: 'skin_military_basic', ownershipRate: 0.45 },
      { id: 'skin_ninja', ownershipRate: 0.28 },
      { id: 'skin_limited_lunar', ownershipRate: 0.12 },
    ],
  },
  promoted_weapon_list: {
    kind: 'tuple',
    items: [
      { id: 'w_ak47_promo', ownershipRate: 0.08 },
      { id: 'w_m4a1_promo', ownershipRate: 0.06 },
      { id: 'w_sniper_promo', ownershipRate: 0.05 },
    ],
  },

  // Timestamp features — model as counter (days since epoch)
  account_first_login_ts: { kind: 'counter', min: 365, max: 3000, alpha: 1.8 },
  last_iam_received_ts:   { kind: 'counter', min: 0, max: 30, alpha: 2.5 },
  account_first_login_mmdd: { kind: 'counter', min: 1, max: 365, alpha: 1.2 },

  // String-id features — model as score (cardinality distribution)
  guild_id: { kind: 'counter', min: 1, max: 100000, alpha: 2.0 },
  last_campaign_id_received: { kind: 'counter', min: 1, max: 500, alpha: 1.5 },
};

/** Heuristic spec by domain when no explicit override exists. */
function domainFallback(domain: string): SynthSpec {
  if (domain === 'monetization') return { kind: 'score', mu: 50, sigma: 25, min: 0, max: 100 };
  if (domain === 'engagement') return { kind: 'counter', min: 0, max: 100, alpha: 2.2 };
  if (domain === 'social_playstyle') return { kind: 'score', mu: 50, sigma: 20, min: 0, max: 100 };
  if (domain === 'campaign_engagement') return { kind: 'counter', min: 0, max: 10, alpha: 2.8 };
  return { kind: 'score', mu: 50, sigma: 20, min: 0, max: 100 };
}

function synthesiseFeature(feature: string, domain: string): Record<string, unknown> {
  const spec = FEATURE_SPEC_OVERRIDES[feature] ?? domainFallback(domain);
  switch (spec.kind) {
    case 'counter': return synthCounter(feature, spec) as unknown as Record<string, unknown>;
    case 'score':   return synthScore(feature, spec) as unknown as Record<string, unknown>;
    case 'bool':    return synthBool(feature, spec) as unknown as Record<string, unknown>;
    case 'enum':    return synthEnum(feature, spec.categories) as unknown as Record<string, unknown>;
    case 'tuple':   return synthTuple(feature, spec.items) as unknown as Record<string, unknown>;
  }
}

// ---------------------------------------------------------------------------
// Main step runner
// ---------------------------------------------------------------------------

export async function runFeatureDistributions(): Promise<void> {
  console.log('[step-01] Generating feature distributions (synth-only mode)...');

  const rawJson = fs.readFileSync(COVERAGE_PATH, 'utf-8');
  const coverage = JSON.parse(rawJson) as { feature: string; domain: string; tier: string }[];

  const distributions: Record<string, unknown> = {};

  for (const entry of coverage) {
    const dist = synthesiseFeature(entry.feature, entry.domain);
    distributions[entry.feature] = { ...dist, tier: entry.tier, domain: entry.domain };
  }

  writeCrawledJson('distributions.json', distributions);
  console.log(`[step-01] Done — ${coverage.length} features synthesised.`);
}
