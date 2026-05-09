/**
 * Segment catalog — 13 segments (5 demo + 8 fictional, ≥1 agent-drafted).
 * Source: Hermes_Demo_Data.md Part 3 + Part 6 §6 + PRD_Hermes_Agentic.md §6.1
 *
 * Demo segments (5):
 *   seg-cfm-ss1-weapon-owners-2026            CFM-2 Voting Vũ Khí SS1
 *   seg-cfm-rfm-tier-1-2026 … tier-4-2026    CFM-11 year-end tier ladder
 *   seg-tf-returning-coaches-2026             TF-1 Football Hub seed
 *   seg-cfm-low-coin-vip-2026                 CFM-18 Low CF Coin
 *
 * Agent-drafted (1):
 *   seg-cfm-loss-streak-non-paying-2026-0508-a3f9  — created in demo step 5,
 *   anchors opportunity ag-op-1042
 *
 * Naming: seg-{game}-{purpose}-{year}[-hash] per Hermes_Demo_Data.md Part 4
 */
import type { HermesSegment } from '@hermes/contracts';

// ---------------------------------------------------------------------------
// Demo segment 1 — CFM-2 Voting Vũ Khí SS1
// ---------------------------------------------------------------------------
const segCfmSs1WeaponOwners2026: HermesSegment = {
  id: 'seg-cfm-ss1-weapon-owners-2026',
  displayName: 'CFM · SS1 Weapon Owners 2026',
  game: 'CFM',
  predicate: {
    groups: [
      {
        op: 'AND',
        conditions: [
          {
            feature: 'weapon_owned_lifetime',
            op: 'contains_any',
            value: ['w_ak47_ss1', 'w_m4a1_ss1', 'w_awm_ss1', 'w_desert_eagle_ss1'],
            latencyTier: '<1d',
            substrate: 'B',
          },
          {
            feature: 'account_age_days',
            op: '>=',
            value: 365,
            latencyTier: '<1d',
            substrate: 'B',
          },
        ],
      },
    ],
    exclusions: [
      { feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' },
    ],
  },
  goal4r: 'retain',
  owner: 'khoi.tn',
  lastBuildAt: '2026-06-29T06:00:00+07:00',
  audienceSize: 84200,
  lifecycleBreakdown: { nru: 0.04, mid: 0.31, veteran: 0.65 },
  spendTierBreakdown: { free: 0.22, low: 0.31, mid: 0.20, high: 0.17, whale: 0.10 },
  type: 'hand-built',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 1,
};

// ---------------------------------------------------------------------------
// Demo segments 2-5 — CFM-11 RFM tier ladder (mutually exclusive)
// ---------------------------------------------------------------------------
const segCfmRfmTier1_2026: HermesSegment = {
  id: 'seg-cfm-rfm-tier-1-2026',
  displayName: 'CFM · Year-End Tier 1 · NRU',
  game: 'CFM',
  predicate: {
    groups: [
      {
        op: 'AND',
        conditions: [
          { feature: 'account_age_days', op: '<=', value: 90, latencyTier: '<1d', substrate: 'B' },
          { feature: 'is_paying_user_lifetime', op: 'is_false', value: false, latencyTier: '<1h', substrate: 'B' },
        ],
      },
    ],
    exclusions: [
      { feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' },
    ],
  },
  goal4r: 'recruit',
  owner: 'khoi.tn',
  lastBuildAt: '2026-12-18T06:00:00+07:00',
  audienceSize: 480000,
  lifecycleBreakdown: { nru: 0.95, mid: 0.05, veteran: 0.00 },
  type: 'hand-built',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 1,
};

const segCfmRfmTier2_2026: HermesSegment = {
  id: 'seg-cfm-rfm-tier-2-2026',
  displayName: 'CFM · Year-End Tier 2 · Mid Spender',
  game: 'CFM',
  predicate: {
    groups: [
      {
        op: 'AND',
        conditions: [
          { feature: 'account_age_days', op: '>', value: 90, latencyTier: '<1d', substrate: 'B' },
          { feature: 'spend_tier_lifetime', op: 'in', value: ['low', 'mid'], latencyTier: '<1d', substrate: 'B' },
          { feature: 'ranked_match_count_30d', op: '>=', value: 10, latencyTier: '<1d', substrate: 'B' },
        ],
      },
    ],
    exclusions: [
      { feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' },
    ],
  },
  goal4r: 'revenue',
  owner: 'khoi.tn',
  lastBuildAt: '2026-12-18T06:00:00+07:00',
  audienceSize: 1200000,
  lifecycleBreakdown: { nru: 0.05, mid: 0.70, veteran: 0.25 },
  type: 'hand-built',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 1,
};

const segCfmRfmTier3_2026: HermesSegment = {
  id: 'seg-cfm-rfm-tier-3-2026',
  displayName: 'CFM · Year-End Tier 3 · High Spender',
  game: 'CFM',
  predicate: {
    groups: [
      {
        op: 'AND',
        conditions: [
          { feature: 'spend_tier_lifetime', op: '=', value: 'high', latencyTier: '<1d', substrate: 'B' },
          { feature: 'daily_login_streak_current', op: '>=', value: 7, latencyTier: '<1d', substrate: 'B' },
        ],
      },
    ],
    exclusions: [
      { feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' },
    ],
  },
  goal4r: 'retain',
  owner: 'khoi.tn',
  lastBuildAt: '2026-12-18T06:00:00+07:00',
  audienceSize: 145000,
  spendTierBreakdown: { free: 0, low: 0, mid: 0, high: 1.0, whale: 0 },
  type: 'hand-built',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 1,
};

const segCfmRfmTier4_2026: HermesSegment = {
  id: 'seg-cfm-rfm-tier-4-2026',
  displayName: 'CFM · Year-End Tier 4 · Whale',
  game: 'CFM',
  predicate: {
    groups: [
      {
        op: 'OR',
        conditions: [
          { feature: 'spend_tier_lifetime', op: '=', value: 'whale', latencyTier: '<1d', substrate: 'B' },
          { feature: 'annual_contribution_tier', op: '>=', value: 4, latencyTier: '<1d', substrate: 'B' },
        ],
      },
    ],
    exclusions: [
      { feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' },
    ],
  },
  goal4r: 'revenue',
  owner: 'khoi.tn',
  lastBuildAt: '2026-12-18T06:00:00+07:00',
  audienceSize: 22000,
  spendTierBreakdown: { free: 0, low: 0, mid: 0, high: 0.10, whale: 0.90 },
  type: 'hand-built',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 1,
};

// ---------------------------------------------------------------------------
// Demo segment 6 — TF-1 Football Hub returning coaches seed
// ---------------------------------------------------------------------------
const segTfReturningCoaches2026: HermesSegment = {
  id: 'seg-tf-returning-coaches-2026',
  displayName: 'TF · Returning Coaches 2026',
  game: 'TF',
  predicate: {
    groups: [
      {
        op: 'AND',
        conditions: [
          { feature: 'account_age_days', op: '>=', value: 90, latencyTier: '<1d', substrate: 'B' },
          { feature: 'last_login_days_ago', op: 'between', value: [30, 180], latencyTier: '<1d', substrate: 'B' },
          { feature: 'chapter_progress_max', op: '>=', value: 3, latencyTier: '<1d', substrate: 'B' },
          { feature: 'ranked_match_count_lifetime', op: '>=', value: 20, latencyTier: '<1h', substrate: 'B' },
        ],
      },
    ],
    exclusions: [
      { feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' },
    ],
  },
  goal4r: 'reactivate',
  owner: 'khoi.tn',
  lastBuildAt: '2026-09-01T00:00:00+07:00',
  audienceSize: 38000,
  lifecycleBreakdown: { nru: 0.00, mid: 0.15, veteran: 0.25, lapsed: 0.60 },
  type: 'hand-built',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 1,
};

// ---------------------------------------------------------------------------
// Demo segment 7 — CFM-18 Low CF Coin + VIP
// ---------------------------------------------------------------------------
const segCfmLowCoinVip2026: HermesSegment = {
  id: 'seg-cfm-low-coin-vip-2026',
  displayName: 'CFM · Low CF Coin · VIP',
  game: 'CFM',
  predicate: {
    groups: [
      {
        op: 'AND',
        conditions: [
          { feature: 'cf_coin_balance_current', op: 'between', value: [500, 900], latencyTier: '<1h', substrate: 'B' },
          { feature: 'vip_status', op: '!=', value: 'none', latencyTier: '<1h', substrate: 'B' },
          { feature: 'promoted_item_active_count', op: '>=', value: 1, latencyTier: '<1h', substrate: 'B' },
        ],
      },
    ],
    exclusions: [
      { feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' },
      { feature: 'iam_received_count_24h', op: '>=', value: 2, latencyTier: '<1h', substrate: 'B' },
    ],
  },
  goal4r: 'revenue',
  owner: 'khoi.tn',
  lastBuildAt: '2026-05-08T08:00:00+07:00',
  audienceSize: 7400,
  spendTierBreakdown: { free: 0, low: 0.10, mid: 0.40, high: 0.35, whale: 0.15 },
  type: 'hand-built',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 1,
};

// ---------------------------------------------------------------------------
// ANCHOR — Agent-drafted segment (demo step 5, opportunity ag-op-1042)
// ---------------------------------------------------------------------------
const segCfmLossStreakNonPaying: HermesSegment = {
  id: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9',
  displayName: 'CFM · Loss Streak · Non-Paying · Ranked',
  game: 'CFM',
  predicate: {
    groups: [
      {
        op: 'AND',
        conditions: [
          {
            feature: 'consecutive_ranked_losses_streak',
            op: '>=',
            value: 5,
            latencyTier: '<1h',
            substrate: 'B',
          },
          {
            feature: 'is_paying_user_lifetime',
            op: 'is_false',
            value: false,
            latencyTier: '<1h',
            substrate: 'B',
          },
        ],
      },
    ],
    exclusions: [
      { feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' },
    ],
  },
  goal4r: 'retain',
  owner: 'khoi.tn',
  lastBuildAt: '2026-05-08T06:14:42+07:00',
  audienceSize: 23890,
  lifecycleBreakdown: { nru: 0.08, mid: 0.52, veteran: 0.40 },
  spendTierBreakdown: { free: 1.0, low: 0, mid: 0, high: 0, whale: 0 },
  type: 'hand-built',
  author: 'agent-drafted',
  agentRef: 'ag-op-1042',
  drift: false,
  status: 'active',
  usedByCampaigns: 1,
};

// ---------------------------------------------------------------------------
// Fictional segments for library variety (8)
// ---------------------------------------------------------------------------
const segCfmVeteranPvp: HermesSegment = {
  id: 'seg-cfm-veteran-pvp-2026',
  displayName: 'CFM · Veteran PvP Core',
  game: 'CFM',
  predicate: {
    groups: [{
      op: 'AND',
      conditions: [
        { feature: 'player_lifecycle_stage', op: '=', value: 'veteran', latencyTier: '<1d', substrate: 'B' },
        { feature: 'ranked_match_count_30d', op: '>=', value: 25, latencyTier: '<1d', substrate: 'B' },
        { feature: 'pvp_engagement_score', op: '>=', value: 0.7, latencyTier: '<1d', substrate: 'B' },
      ],
    }],
    exclusions: [{ feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' }],
  },
  goal4r: 'retain',
  owner: 'linh.nt',
  lastBuildAt: '2026-05-01T06:00:00+07:00',
  audienceSize: 92400,
  type: 'hand-built',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 2,
};

const segCfmWhaleAtRisk: HermesSegment = {
  id: 'seg-cfm-whale-at-risk-2026',
  displayName: 'CFM · Whale At Risk',
  game: 'CFM',
  predicate: {
    groups: [{
      op: 'AND',
      conditions: [
        { feature: 'spend_tier_lifetime', op: '=', value: 'whale', latencyTier: '<1d', substrate: 'B' },
        { feature: 'last_login_days_ago', op: '>=', value: 7, latencyTier: '<1d', substrate: 'B' },
        { feature: 'session_count_7d', op: '<=', value: 2, latencyTier: '<1d', substrate: 'B' },
      ],
    }],
    exclusions: [{ feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' }],
  },
  goal4r: 'retain',
  owner: 'minh.pv',
  lastBuildAt: '2026-05-05T06:00:00+07:00',
  audienceSize: 4120,
  spendTierBreakdown: { free: 0, low: 0, mid: 0, high: 0, whale: 1.0 },
  type: 'hand-built',
  author: 'hand-built',
  drift: true,
  status: 'active',
  usedByCampaigns: 1,
};

const segCfmNewPlayerD2: HermesSegment = {
  id: 'seg-cfm-new-player-d2-2026',
  displayName: 'CFM · New Player D2 Nudge',
  game: 'CFM',
  predicate: {
    groups: [{
      op: 'AND',
      conditions: [
        { feature: 'is_new_user_d7', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' },
        { feature: 'account_age_days', op: 'between', value: [1, 2], latencyTier: '<1d', substrate: 'B' },
      ],
    }],
    exclusions: [{ feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' }],
  },
  goal4r: 'recruit',
  owner: 'linh.nt',
  lastBuildAt: '2026-05-08T06:00:00+07:00',
  audienceSize: 8900,
  lifecycleBreakdown: { nru: 1.0, mid: 0.0, veteran: 0.0 },
  type: 'hand-built',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 1,
};

const segCfmShopWindowShopper: HermesSegment = {
  id: 'seg-cfm-shop-window-shopper-2026',
  displayName: 'CFM · Shop Window Shopper',
  game: 'CFM',
  predicate: {
    groups: [{
      op: 'AND',
      conditions: [
        { feature: 'is_paying_user_lifetime', op: 'is_false', value: false, latencyTier: '<1h', substrate: 'B' },
        { feature: 'session_count_30d', op: '>=', value: 10, latencyTier: '<1d', substrate: 'B' },
        { feature: 'purchase_count_30d', op: '=', value: 0, latencyTier: '<1d', substrate: 'B' },
      ],
    }],
    exclusions: [{ feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' }],
  },
  goal4r: 'revenue',
  owner: 'minh.pv',
  lastBuildAt: '2026-04-28T06:00:00+07:00',
  audienceSize: 186000,
  spendTierBreakdown: { free: 1.0, low: 0, mid: 0, high: 0, whale: 0 },
  type: 'hand-built',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 0,
};

const segCfmLapsedMidSpender: HermesSegment = {
  id: 'seg-cfm-lapsed-mid-spender-2026',
  displayName: 'CFM · Lapsed Mid Spender',
  game: 'CFM',
  predicate: {
    groups: [{
      op: 'AND',
      conditions: [
        { feature: 'spend_tier_lifetime', op: 'in', value: ['low', 'mid'], latencyTier: '<1d', substrate: 'B' },
        { feature: 'last_login_days_ago', op: 'between', value: [14, 60], latencyTier: '<1d', substrate: 'B' },
        { feature: 'purchase_count_30d', op: '=', value: 0, latencyTier: '<1d', substrate: 'B' },
      ],
    }],
    exclusions: [{ feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' }],
  },
  goal4r: 'reactivate',
  owner: 'khoi.tn',
  lastBuildAt: '2026-04-15T06:00:00+07:00',
  audienceSize: 54300,
  lifecycleBreakdown: { nru: 0, mid: 0.30, veteran: 0.30, lapsed: 0.40 },
  type: 'hand-built',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 1,
};

const segNthWhaleAtRisk: HermesSegment = {
  id: 'seg-nth-whale-at-risk-2026',
  displayName: 'NTH · Whale At Risk · Login Drift',
  game: 'NTH',
  predicate: {
    groups: [{
      op: 'AND',
      conditions: [
        { feature: 'spend_tier_lifetime', op: '=', value: 'whale', latencyTier: '<1d', substrate: 'B' },
        { feature: 'last_login_days_ago', op: '>=', value: 5, latencyTier: '<1d', substrate: 'B' },
      ],
    }],
    exclusions: [{ feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' }],
  },
  goal4r: 'retain',
  owner: 'linh.nt',
  lastBuildAt: '2026-05-06T06:00:00+07:00',
  audienceSize: 3870,
  type: 'hand-built',
  author: 'agent-drafted',
  agentRef: 'ag-op-1043',
  drift: true,
  status: 'active',
  usedByCampaigns: 1,
};

const segCfmPassStuckVip: HermesSegment = {
  id: 'seg-cfm-pass-stuck-vip-2026',
  displayName: 'CFM · Pass Stuck · VIP Tier',
  game: 'CFM',
  predicate: {
    groups: [{
      op: 'AND',
      conditions: [
        { feature: 'pass_owned_current', op: 'is_true', value: true, latencyTier: '<1h', substrate: 'B' },
        { feature: 'pass_progress_current', op: '<=', value: 5, latencyTier: '<1h', substrate: 'B' },
        { feature: 'vip_status', op: '!=', value: 'none', latencyTier: '<1h', substrate: 'B' },
      ],
    }],
    exclusions: [{ feature: 'is_test_account', op: 'is_true', value: true, latencyTier: '<1d', substrate: 'B' }],
  },
  goal4r: 'retain',
  owner: 'khoi.tn',
  lastBuildAt: '2026-05-02T06:00:00+07:00',
  audienceSize: 11200,
  type: 'derived-from-journey',
  author: 'hand-built',
  status: 'active',
  usedByCampaigns: 1,
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export const allSegments: HermesSegment[] = [
  segCfmSs1WeaponOwners2026,
  segCfmRfmTier1_2026,
  segCfmRfmTier2_2026,
  segCfmRfmTier3_2026,
  segCfmRfmTier4_2026,
  segTfReturningCoaches2026,
  segCfmLowCoinVip2026,
  segCfmLossStreakNonPaying,   // ← anchor segment (agent-drafted, ag-op-1042)
  segCfmVeteranPvp,
  segCfmWhaleAtRisk,
  segCfmNewPlayerD2,
  segCfmShopWindowShopper,
  segCfmLapsedMidSpender,
  segNthWhaleAtRisk,
  segCfmPassStuckVip,
];

export {
  segCfmSs1WeaponOwners2026,
  segCfmRfmTier1_2026,
  segCfmRfmTier2_2026,
  segCfmRfmTier3_2026,
  segCfmRfmTier4_2026,
  segTfReturningCoaches2026,
  segCfmLowCoinVip2026,
  segCfmLossStreakNonPaying,
  segCfmVeteranPvp,
  segCfmWhaleAtRisk,
  segCfmNewPlayerD2,
  segCfmShopWindowShopper,
  segCfmLapsedMidSpender,
  segNthWhaleAtRisk,
  segCfmPassStuckVip,
};
