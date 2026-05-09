/**
 * Derivation Coverage Builder
 *
 * Maps all 67 PRD features (Hermes_Demo_Data.md Part 1) to a derivation tier
 * and source table/columns using a heuristic based on the trino-mock JSONL
 * bedrock schemas.
 *
 * Tiers:
 *   T1 — column exists directly in std_master_user_profile
 *   T2 — simple COUNT/SUM aggregate over a discovered event table
 *   T3 — window function (LAG/ROW_NUMBER) requiring event timestamp
 *   T4 — join across two or more discovered tables
 *   T5 — no cfm_vn source maps; must be synthesised in P-4
 *
 * When VPN is connected and the real schema is loaded, source_table /
 * source_columns get confirmed or upgraded. Until then, heuristic values
 * from the bedrock are used.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SchemaDiscoveryResult } from './steps/00-schema-discovery.js';

// tsx runs as CJS; import.meta.dirname may be undefined — fall back to __dirname.
const _dirname: string =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export type DerivationTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export type FeatureCoverage = {
  feature: string;
  domain: string;
  tier: DerivationTier;
  source_table: string | null;
  source_columns: string[] | null;
  notes: string;
};

const OUTPUT_FILE = path.resolve(_dirname, '../derivation-coverage.json');

// ── Static PRD feature catalog (67 entries) ───────────────────────────────────
// Each entry: [feature, domain, heuristic_tier, source_table_hint, source_cols_hint, notes]
type FeatureSpec = [
  feature: string,
  domain: string,
  tier: DerivationTier,
  sourceTable: string | null,
  sourceCols: string[] | null,
  notes: string,
];

const FEATURE_CATALOG: FeatureSpec[] = [
  // ── Identity & lifecycle (11) ───────────────────────────────────────────
  [
    'account_age_days', 'identity_lifecycle', 'T2',
    'etl_login', ['dteventtime', 'vopenid'],
    'DATEDIFF(NOW(), MIN(dteventtime)) over etl_login; or first_login_time in std_master_user_profile',
  ],
  [
    'account_first_login_ts', 'identity_lifecycle', 'T1',
    'std_master_user_profile', ['first_login_time'],
    'Direct column first_login_time in std_master_user_profile',
  ],
  [
    'account_first_login_mmdd', 'identity_lifecycle', 'T2',
    'std_master_user_profile', ['first_login_time'],
    "FORMAT_DATETIME(first_login_time, 'MM-dd') — derived from T1 source",
  ],
  [
    'days_since_install', 'identity_lifecycle', 'T2',
    'etl_appsflyer_installs_datalocker', ['install_time'],
    'DATEDIFF(NOW(), install_time) from AppsFlyer installs table; cross-ref std_master_user_profile.install_time',
  ],
  [
    'lifetime_login_count', 'identity_lifecycle', 'T2',
    'etl_login', ['vopenid', 'dteventtime'],
    'COUNT(*) GROUP BY vopenid over etl_login',
  ],
  [
    'last_login_days_ago', 'identity_lifecycle', 'T2',
    'std_master_user_profile', ['last_login_time'],
    'DATEDIFF(NOW(), last_login_time) — direct from std_master_user_profile',
  ],
  [
    'player_lifecycle_stage', 'identity_lifecycle', 'T3',
    'std_master_user_profile', ['first_login_time', 'last_login_time'],
    'Derived enum: nru/mid/veteran/lapsed from account_age_days + last_login_days_ago; requires window logic',
  ],
  [
    'is_new_user_d7', 'identity_lifecycle', 'T2',
    'std_master_user_profile', ['first_login_time'],
    'CASE WHEN account_age_days <= 7 THEN true — depends on account_age_days (T2)',
  ],
  [
    'is_returning_after_lapse', 'identity_lifecycle', 'T3',
    'etl_login', ['vopenid', 'dteventtime'],
    'LAG(dteventtime) OVER (PARTITION BY vopenid ORDER BY dteventtime) — gap >= 30d',
  ],
  [
    'region_code', 'identity_lifecycle', 'T1',
    'etl_login', ['country'],
    'country column in etl_login mapped to VN/TH/ID/PH/Other enum; also last_country_code in std_master_user_profile',
  ],
  [
    'character_gender', 'identity_lifecycle', 'T5',
    null, null,
    'NTH only — no cfm_vn source table; synthesise in P-4 or ingest from NTH game API',
  ],

  // ── Monetization (12) ───────────────────────────────────────────────────
  [
    'is_paying_user_lifetime', 'monetization', 'T2',
    'etl_recharge', ['vopenid', 'iamount'],
    'EXISTS(SELECT 1 FROM etl_recharge WHERE vopenid=? AND iamount>0)',
  ],
  [
    'lifetime_purchase_count', 'monetization', 'T2',
    'etl_recharge', ['vopenid', 'iamount'],
    'COUNT(*) WHERE iamount>0 GROUP BY vopenid',
  ],
  [
    'lifetime_revenue_local', 'monetization', 'T2',
    'etl_recharge', ['vopenid', 'iamount'],
    'SUM(iamount) GROUP BY vopenid — local currency (VND)',
  ],
  [
    'last_purchase_days_ago', 'monetization', 'T2',
    'std_master_user_profile', ['last_charge_time'],
    'DATEDIFF(NOW(), last_charge_time) — direct from std_master_user_profile',
  ],
  [
    'spend_tier_lifetime', 'monetization', 'T3',
    'etl_recharge', ['vopenid', 'iamount'],
    'NTILE or CASE over SUM(iamount): free/low/mid/high/whale — window bucketing on lifetime_revenue_local',
  ],
  [
    'vip_status', 'monetization', 'T2',
    'etl_login', ['vopenid', 'viplevel'],
    'MAX(viplevel) per vopenid in etl_login; also viplevel in etl_game_detail',
  ],
  [
    'pass_owned_current', 'monetization', 'T5',
    null, null,
    'No battle-pass ownership table in cfm_vn bedrock; synthesise or ingest from game inventory API in P-4',
  ],
  [
    'pass_progress_current', 'monetization', 'T5',
    null, null,
    'No battle-pass progress table in cfm_vn bedrock; synthesise in P-4',
  ],
  [
    'annual_contribution_tier', 'monetization', 'T3',
    'etl_recharge', ['vopenid', 'iamount', 'dteventtime'],
    'NTILE(5) OVER (ORDER BY SUM(iamount)) for last 365d — RFM tier 1-5',
  ],
  [
    'avg_purchase_amount_30d', 'monetization', 'T2',
    'etl_recharge', ['vopenid', 'iamount', 'dteventtime'],
    'AVG(iamount) WHERE dteventtime >= NOW()-30d GROUP BY vopenid',
  ],
  [
    'purchase_count_30d', 'monetization', 'T2',
    'etl_recharge', ['vopenid', 'dteventtime'],
    'COUNT(*) WHERE dteventtime >= NOW()-30d GROUP BY vopenid',
  ],
  [
    'purchase_count_7d', 'monetization', 'T2',
    'etl_recharge', ['vopenid', 'dteventtime'],
    'COUNT(*) WHERE dteventtime >= NOW()-7d GROUP BY vopenid',
  ],

  // ── Currency snapshots (3) ────────────────────────────────────────────────
  [
    'gem_balance_current', 'currency_snapshot', 'T3',
    'etl_moneyflow', ['vopenid', 'imoneytype', 'balance', 'dteventtime'],
    'LAST_VALUE(balance) OVER (PARTITION BY vopenid ORDER BY dteventtime) WHERE imoneytype=gem',
  ],
  [
    'cf_coin_balance_current', 'currency_snapshot', 'T3',
    'etl_moneyflow', ['vopenid', 'imoneytype', 'balance', 'dteventtime'],
    'LAST_VALUE(balance) OVER (PARTITION BY vopenid ORDER BY dteventtime) WHERE imoneytype=cf_coin',
  ],
  [
    'premium_currency_balance', 'currency_snapshot', 'T3',
    'etl_moneyflow', ['vopenid', 'imoneytype', 'balance', 'dteventtime'],
    'LAST_VALUE(balance) per per-game premium currency type; same pattern as gem_balance_current',
  ],

  // ── Engagement (9) ────────────────────────────────────────────────────────
  [
    'session_count_30d', 'engagement', 'T2',
    'etl_login', ['vopenid', 'dteventtime'],
    'COUNT(*) WHERE dteventtime >= NOW()-30d GROUP BY vopenid',
  ],
  [
    'session_count_7d', 'engagement', 'T2',
    'etl_login', ['vopenid', 'dteventtime'],
    'COUNT(*) WHERE dteventtime >= NOW()-7d GROUP BY vopenid',
  ],
  [
    'session_count_1d', 'engagement', 'T2',
    'etl_login', ['vopenid', 'dteventtime'],
    'COUNT(*) WHERE dteventtime >= CURRENT_DATE GROUP BY vopenid',
  ],
  [
    'avg_session_duration_30d', 'engagement', 'T4',
    'etl_logout', ['vopenid', 'onlinetime', 'dteventtime'],
    'AVG(onlinetime) WHERE dteventtime >= NOW()-30d; join etl_login/etl_logout on vopenid+session',
  ],
  [
    'daily_login_streak_current', 'engagement', 'T3',
    'etl_login', ['vopenid', 'dteventtime'],
    'Consecutive-day window: DATE_TRUNC(day, dteventtime), ROW_NUMBER gaps — streak logic',
  ],
  [
    'daily_login_streak_max', 'engagement', 'T3',
    'etl_login', ['vopenid', 'dteventtime'],
    'MAX of all consecutive-day run lengths over lifetime; same window pattern as current streak',
  ],
  [
    'mission_completion_rate_30d', 'engagement', 'T5',
    null, null,
    'No mission/quest table in cfm_vn bedrock; synthesise in P-4 or ingest from quest system',
  ],
  [
    'mission_completion_count_7d', 'engagement', 'T5',
    null, null,
    'Same as mission_completion_rate_30d — no source table; synthesise in P-4',
  ],
  [
    'chapter_progress_max', 'engagement', 'T2',
    'etl_game_detail', ['vopenid', 'chapterid'],
    'MAX(CAST(chapterid AS int)) GROUP BY vopenid — TF-1 dependency',
  ],

  // ── Gameplay — CFM specific (10) ──────────────────────────────────────────
  [
    'ranked_match_count_lifetime', 'gameplay_cfm', 'T2',
    'etl_game_detail', ['vopenid', 'matchmodule', 'gameresult'],
    'COUNT(*) WHERE matchmodule=ranked GROUP BY vopenid',
  ],
  [
    'ranked_match_count_30d', 'gameplay_cfm', 'T2',
    'etl_game_detail', ['vopenid', 'matchmodule', 'dteventtime'],
    'COUNT(*) WHERE matchmodule=ranked AND dteventtime >= NOW()-30d GROUP BY vopenid',
  ],
  [
    'ranked_win_rate_30d', 'gameplay_cfm', 'T2',
    'etl_game_detail', ['vopenid', 'matchmodule', 'gameresult', 'dteventtime'],
    'SUM(gameresult=win)/COUNT(*) WHERE matchmodule=ranked AND dteventtime >= NOW()-30d',
  ],
  [
    'ranked_win_rate_7d', 'gameplay_cfm', 'T2',
    'etl_game_detail', ['vopenid', 'matchmodule', 'gameresult', 'dteventtime'],
    'Same as ranked_win_rate_30d with 7d window',
  ],
  [
    'mmr_current', 'gameplay_cfm', 'T3',
    'etl_game_detail', ['vopenid', 'totalladderscore', 'dteventtime'],
    'LAST_VALUE(totalladderscore) OVER (PARTITION BY vopenid ORDER BY dteventtime) — latest ladder score',
  ],
  [
    'mmr_drift_7d', 'gameplay_cfm', 'T3',
    'etl_game_detail', ['vopenid', 'totalladderscore', 'dteventtime'],
    'mmr_current − mmr_7d_ago; LAG(totalladderscore, N) OVER time window — Derived from mmr_current',
  ],
  [
    'rank_points_current', 'gameplay_cfm', 'T3',
    'etl_game_detail', ['vopenid', 'gainedladderscore', 'totalladderscore', 'dteventtime'],
    'LAST_VALUE(totalladderscore) OVER (PARTITION BY vopenid ORDER BY dteventtime)',
  ],
  [
    'rank_tier_current', 'gameplay_cfm', 'T3',
    'etl_game_detail', ['vopenid', 'ladderlevel', 'dteventtime'],
    'LAST_VALUE(ladderlevel) OVER (PARTITION BY vopenid ORDER BY dteventtime)',
  ],
  [
    'demotion_threshold_distance', 'gameplay_cfm', 'T3',
    'etl_game_detail', ['vopenid', 'totalladderscore', 'ladderlevel', 'dteventtime'],
    'Derived: rank_points_current − tier_floor_score; requires tier floor lookup table',
  ],
  [
    'is_in_demotion_zone', 'gameplay_cfm', 'T3',
    'etl_game_detail', ['vopenid', 'totalladderscore', 'ladderlevel', 'dteventtime'],
    'Derived: demotion_threshold_distance <= 10 — boolean from T3 source',
  ],

  // ── Stateful streaks (2) ──────────────────────────────────────────────────
  [
    'consecutive_ranked_losses_streak', 'stateful_streaks', 'T3',
    'etl_game_detail', ['vopenid', 'matchmodule', 'gameresult', 'dteventtime'],
    'Window streak: ROW_NUMBER gaps on consecutive losses in ranked mode — resets on win. Dual-tier: also TEE online state',
  ],
  [
    'consecutive_ranked_wins_streak', 'stateful_streaks', 'T3',
    'etl_game_detail', ['vopenid', 'matchmodule', 'gameresult', 'dteventtime'],
    'Inverse of consecutive_ranked_losses_streak — resets on loss. Dual-tier: also TEE online state',
  ],

  // ── Inventory & items (5) ─────────────────────────────────────────────────
  [
    'weapon_owned_lifetime', 'inventory_items', 'T5',
    null, null,
    'No weapon inventory table in cfm_vn bedrock; synthesise array from item-unlock events in P-4 or ingest from game store API',
  ],
  [
    'weapon_count_owned', 'inventory_items', 'T5',
    null, null,
    'LENGTH(weapon_owned_lifetime) — depends on weapon_owned_lifetime (T5)',
  ],
  [
    'housing_items_owned', 'inventory_items', 'T5',
    null, null,
    'NTH only — no housing inventory in cfm_vn bedrock; synthesise in P-4',
  ],
  [
    'char_skins_owned', 'inventory_items', 'T5',
    null, null,
    'No cosmetics inventory table in cfm_vn bedrock; synthesise in P-4',
  ],
  [
    'specific_pack_owned', 'inventory_items', 'T4',
    'etl_moneyflow', ['vopenid', 'reason', 'subreason', 'imoneytype'],
    'JOIN etl_recharge + etl_moneyflow on vopenid; filter by productid/SKU — requires SKU mapping config',
  ],

  // ── Promotion / config (3) ────────────────────────────────────────────────
  [
    'promoted_weapon_list', 'promotion_config', 'T5',
    null, null,
    'Config push from promotion system — no cfm_vn source; ingest via external API or config store in P-4',
  ],
  [
    'promoted_item_active_count', 'promotion_config', 'T5',
    null, null,
    'LENGTH(promoted_weapon_list) — depends on promoted_weapon_list (T5)',
  ],
  [
    'weapon_promotion_active_count', 'promotion_config', 'T5',
    null, null,
    'Same as promoted_item_active_count — from promotion config; no cfm_vn table; synthesise in P-4',
  ],

  // ── Social, playstyle & external (12) ─────────────────────────────────────
  [
    'guild_id', 'social_playstyle', 'T2',
    'etl_game_detail', ['vopenid', 'clanid'],
    'LAST_VALUE(clanid) per vopenid — clanid maps to guild_id',
  ],
  [
    'guild_role', 'social_playstyle', 'T5',
    null, null,
    'No guild-role table in cfm_vn bedrock; synthesise or ingest from clan system API in P-4',
  ],
  [
    'guild_contribution_30d', 'social_playstyle', 'T2',
    'etl_game_detail', ['vopenid', 'gainclanactivity', 'dteventtime'],
    'SUM(gainclanactivity) WHERE dteventtime >= NOW()-30d GROUP BY vopenid',
  ],
  [
    'dominant_playstyle', 'social_playstyle', 'T3',
    'etl_game_detail', ['vopenid', 'gamemode', 'gametype', 'dteventtime'],
    'Most frequent gamemode/gametype bucket per vopenid over rolling 30d window — pvp/pve/etc.',
  ],
  [
    'pvp_engagement_score', 'social_playstyle', 'T3',
    'etl_game_detail', ['vopenid', 'gamemode', 'timeskill', 'dteventtime'],
    'Composite score from ranked match count + KD metrics over 30d; multi-column window aggregate',
  ],
  [
    'social_engagement_score', 'social_playstyle', 'T4',
    'etl_game_detail', ['vopenid', 'gainclanactivity', 'isteam'],
    'Join etl_game_detail (clan/team activity) + etl_login (friend count) — cross-table composite',
  ],
  [
    'ugc_creator_score', 'social_playstyle', 'T5',
    null, null,
    'NTH UGC system — no cfm_vn source; synthesise in P-4 or ingest from NTH UGC API',
  ],
  [
    'ugc_voter_score', 'social_playstyle', 'T5',
    null, null,
    'NTH UGC votes — no cfm_vn source; synthesise in P-4',
  ],
  [
    'mong_hoa_luc_popularity_score', 'social_playstyle', 'T5',
    null, null,
    'NTH-9 — pushed via external API; no cfm_vn table; ingest via external signal API in P-4',
  ],
  [
    'anti_fraud_trust_score', 'social_playstyle', 'T5',
    null, null,
    'NTH-6 — pushed by anti-fraud system; no cfm_vn source; external signal ingestion required',
  ],
  [
    'cs_flag', 'social_playstyle', 'T5',
    null, null,
    'Customer service tags — no cfm_vn source; synthesise from CS ticketing system in P-4',
  ],
  [
    'marketing_consent_flag', 'social_playstyle', 'T5',
    null, null,
    'Consent management — no cfm_vn source; synthesise from consent platform in P-4',
  ],

  // ── Test & system (2) ─────────────────────────────────────────────────────
  [
    'is_test_account', 'test_system', 'T5',
    null, null,
    'Test account list managed by QA — no cfm_vn source; inject as static allowlist in P-4',
  ],
  [
    'is_internal_user', 'test_system', 'T5',
    null, null,
    'Employee/QA list — no cfm_vn source; inject as static allowlist in P-4',
  ],

  // ── Campaign engagement & anti-fatigue (4) ────────────────────────────────
  [
    'last_iam_received_ts', 'campaign_engagement', 'T5',
    null, null,
    'Anti-fatigue: set by Apollo IAM delivery system — no cfm_vn source; synthesise from Hermes IAM event log in P-4',
  ],
  [
    'iam_received_count_24h', 'campaign_engagement', 'T5',
    null, null,
    'COUNT of IAM events in last 24h — no cfm_vn source; synthesise from Hermes IAM event log in P-4',
  ],
  [
    'iam_received_count_7d', 'campaign_engagement', 'T5',
    null, null,
    'COUNT of IAM events in last 7d — no cfm_vn source; synthesise from Hermes IAM event log in P-4',
  ],
  [
    'last_campaign_id_received', 'campaign_engagement', 'T5',
    null, null,
    'LAST campaign_id from IAM delivery system — no cfm_vn source; synthesise from Hermes IAM event log in P-4',
  ],
];

// ── Builder ───────────────────────────────────────────────────────────────────

/**
 * Build derivation coverage manifest.
 * When discovery result is provided (real schema), upgrades T5 to confirmed
 * tier if the source table actually exists in the discovered schema.
 * In stub mode, heuristic tiers are used as-is.
 */
export function buildDerivationCoverage(
  discoveryResult: SchemaDiscoveryResult,
): FeatureCoverage[] {
  const discoveredTables = new Set(discoveryResult.tables.map((t) => t.table));

  const coverage: FeatureCoverage[] = FEATURE_CATALOG.map(
    ([feature, domain, tier, sourceTable, sourceCols, notes]) => {
      let resolvedTier = tier;

      // In stub mode all heuristics stand. In real mode, if a feature is T5
      // but we discover its source_table actually exists, promote to T2 minimum
      // so downstream SQL can be written against it.
      if (!discoveryResult.isStub && tier === 'T5' && sourceTable !== null) {
        if (discoveredTables.has(sourceTable)) {
          resolvedTier = 'T2';
        }
      }

      // If non-stub and source table is claimed but NOT present, demote to T5.
      if (!discoveryResult.isStub && tier !== 'T5' && sourceTable !== null) {
        if (!discoveredTables.has(sourceTable)) {
          resolvedTier = 'T5';
          notes = `[schema-mismatch] Expected source ${sourceTable} not found in discovered schema. Original: ${notes}`;
        }
      }

      return {
        feature,
        domain,
        tier: resolvedTier,
        source_table: sourceTable,
        source_columns: sourceCols,
        notes,
      };
    },
  );

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(coverage, null, 2), 'utf-8');
  return coverage;
}

/** Print tier distribution summary to stdout. */
export function printTierSummary(coverage: FeatureCoverage[]): void {
  const counts: Record<DerivationTier, number> = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 };
  for (const f of coverage) counts[f.tier]++;
  console.log('');
  console.log('Tier distribution:');
  for (const [tier, count] of Object.entries(counts)) {
    const bar = '█'.repeat(count);
    console.log(`  ${tier}  ${String(count).padStart(2)}  ${bar}`);
  }
  console.log(`  Total: ${coverage.length}`);
}
