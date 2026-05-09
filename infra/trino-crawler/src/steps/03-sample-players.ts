/**
 * Step 03 — Sample players (synth-only path).
 *
 * Generates 50 anonymised player UID rows per feature with a plausible
 * feature value. UIDs are format uid-{6-hex-chars}, derived deterministically
 * from a seeded hash — no raw VNG IDs committed.
 *
 * Output: apps/web/src/data/crawled/sample-players.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRng } from '../synthesizers/seeded-rng.js';
import { writeCrawledJson } from '../outputs.js';

const _dirname: string =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const COVERAGE_PATH = path.resolve(_dirname, '../../derivation-coverage.json');
const SOURCE_TAG = 'P-4 synth · awaiting VPN/auth for cfm_vn pull';
const SAMPLES_PER_FEATURE = 50;
const HEX = '0123456789abcdef';

/** Produce a uid-{6-hex} string deterministically from rng. */
function synthUid(rng: () => number): string {
  let hex = '';
  for (let i = 0; i < 6; i++) hex += HEX[Math.floor(rng() * 16)];
  return `uid-${hex}`;
}

/** Generate a plausible numeric value for a feature based on its domain. */
function synthValue(
  feature: string,
  domain: string,
  rng: () => number,
): string | number | boolean {
  // Bool features
  const boolFeatures = new Set([
    'is_paying_user_lifetime', 'is_new_user_d7', 'is_returning_after_lapse',
    'is_in_demotion_zone', 'pass_owned_current', 'specific_pack_owned',
    'is_test_account', 'is_internal_user', 'marketing_consent_flag',
  ]);
  if (boolFeatures.has(feature)) return rng() > 0.5;

  // Enum features
  const enumValues: Record<string, string[]> = {
    player_lifecycle_stage: ['nru', 'mid', 'veteran', 'lapsed'],
    region_code: ['VN', 'TH', 'ID', 'PH', 'Other'],
    character_gender: ['male', 'female'],
    spend_tier_lifetime: ['free', 'low', 'mid', 'high', 'whale'],
    vip_status: ['none', 'vip1', 'vip2', 'vip3', 'vip_max'],
    dominant_playstyle: ['pvp', 'pve', 'housing', 'fishing', 'social'],
    guild_role: ['member', 'officer', 'leader'],
    cs_flag: ['none', 'support_open', 'banned_temp', 'vip_watch'],
  };
  if (feature in enumValues) {
    const opts = enumValues[feature]!;
    return opts[Math.floor(rng() * opts.length)]!;
  }

  // Array/tuple features
  const weaponPool = ['w_ak47_ss1', 'w_m4a1_ss1', 'w_awm_ss1', 'w_mp5', 'w_knife_default'];
  if (feature === 'weapon_owned_lifetime') {
    return weaponPool.filter(() => rng() > 0.4).join(',');
  }
  if (feature === 'housing_items_owned') {
    return ['h_sofa_basic', 'h_table_wood', 'h_plant_small'].filter(() => rng() > 0.4).join(',');
  }
  if (feature === 'char_skins_owned') {
    return ['skin_default', 'skin_military_basic', 'skin_ninja'].filter(() => rng() > 0.5).join(',');
  }
  if (feature === 'promoted_weapon_list') {
    return ['w_ak47_promo', 'w_m4a1_promo'].filter(() => rng() > 0.6).join(',');
  }

  // Timestamp features
  if (feature === 'account_first_login_ts' || feature === 'last_iam_received_ts') {
    const daysAgo = Math.floor(rng() * 1000);
    const d = new Date(Date.now() - daysAgo * 86400_000);
    return d.toISOString().slice(0, 10);
  }
  if (feature === 'account_first_login_mmdd') {
    const mm = String(Math.floor(rng() * 12) + 1).padStart(2, '0');
    const dd = String(Math.floor(rng() * 28) + 1).padStart(2, '0');
    return `${mm}-${dd}`;
  }
  if (feature === 'last_campaign_id_received') {
    return `cmp-cfm-${Math.floor(rng() * 500 + 100)}`;
  }
  if (feature === 'guild_id') {
    return `guild-${Math.floor(rng() * 50000 + 1)}`;
  }

  // Numeric — domain-based ranges
  const ranges: Record<string, [number, number]> = {
    account_age_days: [1, 2000], days_since_install: [1, 2000],
    lifetime_login_count: [1, 5000], last_login_days_ago: [0, 365],
    last_purchase_days_ago: [0, 730], lifetime_purchase_count: [0, 200],
    lifetime_revenue_local: [0, 5_000_000], session_count_30d: [0, 90],
    session_count_7d: [0, 21], session_count_1d: [0, 6],
    ranked_match_count_lifetime: [0, 5000], ranked_match_count_30d: [0, 200],
    ranked_win_rate_30d: [0, 1], ranked_win_rate_7d: [0, 1],
    mmr_current: [800, 3500], mmr_drift_7d: [-200, 200],
    rank_points_current: [0, 3500], rank_tier_current: [1, 10],
    demotion_threshold_distance: [0, 200],
    consecutive_ranked_losses_streak: [0, 15],
    consecutive_ranked_wins_streak: [0, 15],
    daily_login_streak_current: [0, 180], daily_login_streak_max: [1, 365],
    gem_balance_current: [0, 30000], cf_coin_balance_current: [0, 5000],
    premium_currency_balance: [0, 30000],
    avg_purchase_amount_30d: [0, 500000], avg_session_duration_30d: [5, 120],
    purchase_count_30d: [0, 30], purchase_count_7d: [0, 10],
    mission_completion_rate_30d: [0, 1], mission_completion_count_7d: [0, 30],
    chapter_progress_max: [1, 25], guild_contribution_30d: [0, 3000],
    weapon_count_owned: [1, 50], pass_progress_current: [0, 100],
    annual_contribution_tier: [1, 5], pvp_engagement_score: [0, 100],
    social_engagement_score: [0, 100], ugc_creator_score: [0, 100],
    ugc_voter_score: [0, 100], mong_hoa_luc_popularity_score: [0, 100],
    anti_fraud_trust_score: [60, 100], iam_received_count_24h: [0, 5],
    iam_received_count_7d: [0, 15], promoted_item_active_count: [0, 5],
    weapon_promotion_active_count: [0, 5],
  };

  const [lo, hi] = ranges[feature] ?? (domain === 'monetization' ? [0, 10000] : [0, 100]);
  const raw = lo + rng() * (hi - lo);
  // Return integer for most features, float for rate/score features
  const floatFeatures = new Set([
    'ranked_win_rate_30d', 'ranked_win_rate_7d', 'mission_completion_rate_30d',
    'avg_session_duration_30d', 'pvp_engagement_score', 'social_engagement_score',
    'ugc_creator_score', 'ugc_voter_score', 'mong_hoa_luc_popularity_score',
    'anti_fraud_trust_score', 'avg_purchase_amount_30d',
  ]);
  return floatFeatures.has(feature) ? Math.round(raw * 100) / 100 : Math.round(raw);
}

export async function runSamplePlayers(): Promise<void> {
  console.log('[step-03] Generating sample players (synth-only mode)...');

  const rawJson = fs.readFileSync(COVERAGE_PATH, 'utf-8');
  const coverage = JSON.parse(rawJson) as { feature: string; domain: string }[];

  const output: Record<string, unknown> = {};

  for (const entry of coverage) {
    const rng = makeRng(`samples-${entry.feature}`);

    // Generate SAMPLES_PER_FEATURE unique UIDs with values
    const seen = new Set<string>();
    const rows: { uid: string; value: string | number | boolean }[] = [];

    while (rows.length < SAMPLES_PER_FEATURE) {
      const uid = synthUid(rng);
      if (seen.has(uid)) continue;
      seen.add(uid);
      rows.push({ uid, value: synthValue(entry.feature, entry.domain, rng) });
    }

    output[entry.feature] = {
      synthesised: true,
      source: SOURCE_TAG,
      computedAt: new Date().toISOString(),
      sampleCount: rows.length,
      rows,
    };
  }

  writeCrawledJson('sample-players.json', output);
  console.log(`[step-03] Done — ${coverage.length} features × ${SAMPLES_PER_FEATURE} rows.`);
}
