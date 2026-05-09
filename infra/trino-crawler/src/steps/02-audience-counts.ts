/**
 * Step 02 — Audience counts (synth-only path).
 *
 * Produces threshold grids and demographic breakdowns for the 5 demo predicates
 * from Hermes_Demo_Data.md Part 3:
 *
 *   cfm-2-ss1-weapon-owners   — single canonical count ~84,200
 *   cfm-11-rfm-tiers          — 4 sibling tier counts (480k/1.2M/145k/22k)
 *   cfm-13-pass-stuck         — threshold grid [3..10] + breakdownAtCanonical
 *   cfm-18-low-cf-coin        — range grid [(300,500)..(500,1000)]
 *   tf-1-returning-coaches    — single canonical count ~38,000
 *
 * Output: apps/web/src/data/crawled/audience-counts.json
 */

import { writeCrawledJson } from '../outputs.js';

const SOURCE_TAG = 'P-4 synth · awaiting VPN/auth for cfm_vn pull';

function now(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// CFM-2: SS1 Weapon Owners — single canonical predicate
// ---------------------------------------------------------------------------
const cfm2SsWeaponOwners = {
  predicateId: 'cfm-2-ss1-weapon-owners',
  displayName: 'CFM-2 Voting Vũ Khí SS1',
  synthesised: true,
  source: SOURCE_TAG,
  computedAt: now(),
  predicate:
    'weapon_owned_lifetime CONTAINS_ANY [w_ak47_ss1, w_m4a1_ss1, w_awm_ss1, w_desert_eagle_ss1]' +
    ' AND account_age_days >= 365 AND NOT is_test_account',
  canonicalCount: 84200,
  thresholdGrid: [{ threshold: 'canonical', count: 84200 }],
  breakdownAtCanonical: {
    lifecycle: { nru: 0.04, mid: 0.31, veteran: 0.65 },
    spend_tier: { free: 0.22, low: 0.31, mid: 0.20, high: 0.17, whale: 0.10 },
  },
};

// ---------------------------------------------------------------------------
// CFM-11: RFM tier ladder — 4 sibling segments (mutually exclusive)
// ---------------------------------------------------------------------------
const cfm11RfmTiers = {
  predicateId: 'cfm-11-rfm-tiers',
  displayName: 'CFM-11 Lễ Hội Cuối Năm — RFM Tier Ladder',
  synthesised: true,
  source: SOURCE_TAG,
  computedAt: now(),
  predicate: 'Four mutually-exclusive RFM tier segments (see thresholdGrid)',
  thresholdGrid: [
    {
      tier: 'nru',
      label: 'Tier 1 · NRU',
      predicate: 'account_age_days <= 90 AND is_paying_user_lifetime = false',
      count: 480000,
      breakdownAtCanonical: {
        lifecycle: { nru: 0.95, mid: 0.05, veteran: 0.00, lapsed: 0.00 },
        spend_tier: { free: 1.00, low: 0.00, mid: 0.00, high: 0.00, whale: 0.00 },
      },
    },
    {
      tier: 'mid',
      label: 'Tier 2 · Mid Spender',
      predicate:
        'account_age_days > 90 AND spend_tier_lifetime IN [low, mid] AND ranked_match_count_30d >= 10',
      count: 1200000,
      breakdownAtCanonical: {
        lifecycle: { nru: 0.05, mid: 0.70, veteran: 0.25, lapsed: 0.00 },
        spend_tier: { free: 0.00, low: 0.60, mid: 0.40, high: 0.00, whale: 0.00 },
      },
    },
    {
      tier: 'high',
      label: 'Tier 3 · High Spender',
      predicate: 'spend_tier_lifetime = high AND daily_login_streak_current >= 7',
      count: 145000,
      breakdownAtCanonical: {
        lifecycle: { nru: 0.00, mid: 0.25, veteran: 0.75, lapsed: 0.00 },
        spend_tier: { free: 0.00, low: 0.00, mid: 0.00, high: 1.00, whale: 0.00 },
      },
    },
    {
      tier: 'whale',
      label: 'Tier 4 · Whale',
      predicate: 'spend_tier_lifetime = whale OR annual_contribution_tier >= 4',
      count: 22000,
      breakdownAtCanonical: {
        lifecycle: { nru: 0.00, mid: 0.10, veteran: 0.70, lapsed: 0.20 },
        spend_tier: { free: 0.00, low: 0.00, mid: 0.00, high: 0.10, whale: 0.90 },
      },
    },
  ],
  canonicalCount: 1847000, // sum of all tiers
};

// ---------------------------------------------------------------------------
// CFM-13: Pass Stuck — threshold grid over consecutive_ranked_losses_streak
// ---------------------------------------------------------------------------
const cfm13PassStuck = {
  predicateId: 'cfm-13-pass-stuck',
  displayName: 'CFM-13 Pass Stuck Rescue',
  synthesised: true,
  source: SOURCE_TAG,
  computedAt: now(),
  predicate:
    'event_match_end.outcome = lose' +
    ' AND consecutive_ranked_losses_streak >= {threshold}' +
    ' AND is_paying_user_lifetime = false' +
    ' AND mmr_drift_7d < -30' +
    ' AND NOT is_test_account',
  canonicalThreshold: 5,
  canonicalCount: 23890,
  thresholdGrid: [
    { threshold: 3, count: 47210 },
    { threshold: 4, count: 31120 },
    { threshold: 5, count: 23890 },
    { threshold: 6, count: 14512 },
    { threshold: 7, count: 8420 },
    { threshold: 8, count: 4100 },
    { threshold: 10, count: 850 },
  ],
  breakdownAtCanonical: {
    lifecycle: { nru: 0.04, mid: 0.31, veteran: 0.65 },
    spend_tier: { free: 0.91, low: 0.06, mid: 0.02, high: 0.01, whale: 0.00 },
  },
};

// ---------------------------------------------------------------------------
// CFM-18: Low CF Coin — range grid over cf_coin_balance_current
// ---------------------------------------------------------------------------
const cfm18LowCfCoin = {
  predicateId: 'cfm-18-low-cf-coin',
  displayName: 'CFM-18 Low CF Coin + Promoted Item',
  synthesised: true,
  source: SOURCE_TAG,
  computedAt: now(),
  predicate:
    'cf_coin_balance_current BETWEEN {lo} AND {hi}' +
    ' AND vip_status != none' +
    ' AND promoted_item_active_count >= 1' +
    ' AND NOT is_test_account' +
    ' AND iam_received_count_24h < 2',
  canonicalThreshold: { lo: 500, hi: 900 },
  canonicalCount: 7400,
  thresholdGrid: [
    { range: { lo: 300, hi: 500 }, count: 12800 },
    { range: { lo: 400, hi: 700 }, count: 10200 },
    { range: { lo: 500, hi: 900 }, count: 7400 },
    { range: { lo: 500, hi: 1000 }, count: 9100 },
  ],
  breakdownAtCanonical: {
    lifecycle: { nru: 0.05, mid: 0.45, veteran: 0.50, lapsed: 0.00 },
    spend_tier: { free: 0.00, low: 0.10, mid: 0.40, high: 0.35, whale: 0.15 },
  },
};

// ---------------------------------------------------------------------------
// TF-1: Returning Coaches — single canonical
// ---------------------------------------------------------------------------
const tf1ReturningCoaches = {
  predicateId: 'tf-1-returning-coaches',
  displayName: 'TF-1 Football Hub · Returning Coaches',
  synthesised: true,
  source: SOURCE_TAG,
  computedAt: now(),
  predicate:
    'account_age_days >= 90' +
    ' AND last_login_days_ago BETWEEN 30 AND 180' +
    ' AND chapter_progress_max >= 3' +
    ' AND ranked_match_count_lifetime >= 20' +
    ' AND NOT is_test_account',
  canonicalCount: 38000,
  thresholdGrid: [{ threshold: 'canonical', count: 38000 }],
  breakdownAtCanonical: {
    lifecycle: { nru: 0.00, mid: 0.15, veteran: 0.25, lapsed: 0.60 },
    spend_tier: { free: 0.45, low: 0.30, mid: 0.15, high: 0.07, whale: 0.03 },
  },
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export async function runAudienceCounts(): Promise<void> {
  console.log('[step-02] Generating audience counts (synth-only mode)...');

  const output: Record<string, unknown> = {
    'cfm-2-ss1-weapon-owners': cfm2SsWeaponOwners,
    'cfm-11-rfm-tiers': cfm11RfmTiers,
    'cfm-13-pass-stuck': cfm13PassStuck,
    'cfm-18-low-cf-coin': cfm18LowCfCoin,
    'tf-1-returning-coaches': tf1ReturningCoaches,
  };

  writeCrawledJson('audience-counts.json', output);

  const totalPredicates = Object.keys(output).length;
  // Count threshold grid entries across all predicates
  const totalEntries = [
    cfm2SsWeaponOwners,
    cfm11RfmTiers,
    cfm13PassStuck,
    cfm18LowCfCoin,
    tf1ReturningCoaches,
  ].reduce((sum, p) => sum + (p.thresholdGrid?.length ?? 0), 0);

  console.log(
    `[step-02] Done — ${totalPredicates} predicates, ${totalEntries} threshold entries.`,
  );
}
