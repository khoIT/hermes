/**
 * Per-table 7d aggregate SQL builders for the Trino crawler.
 *
 * Each builder emits a `GROUP BY <uid>, <event_date>` query that pulls
 * only the fields needed by Phase 04 derivations referenced in
 * `derivation-coverage.json`. We never SELECT *; output stays small.
 *
 * All queries are bounded by:
 *   - WHERE <date_col> >= current_date - INTERVAL '<days>' DAY
 *   - LIMIT <capRows>  (defaults to 500_000 unique uid×day pairs)
 *
 * Row shape (constant across all builders):
 *   uid (varchar) · event_date (date) · row_count (bigint) ·
 *   numeric_sum (double) · numeric_max (double) · numeric_min (double) ·
 *   last_value (varchar — JSON-encoded payload of trailing fields)
 */

export type AggregateBuilder = (days: number, capRows: number) => string;

export type SourceTable =
  | 'etl_login'
  | 'etl_logout'
  | 'etl_game_detail'
  | 'etl_recharge'
  | 'etl_moneyflow'
  | 'etl_appsflyer_installs_datalocker'
  | 'std_master_user_profile';

const FQN = (table: SourceTable): string => `iceberg.cfm_vn.${table}`;

// ── etl_login ─────────────────────────────────────────────────────────
// Per-uid daily session count; numeric_max/min carry epoch seconds of
// first/last login on that date. last_value JSON encodes country (proxy
// for region), platid (platform).
export const etl_login: AggregateBuilder = (days, cap) => `
SELECT
  vopenid AS uid,
  CAST(dteventtime AS DATE) AS event_date,
  COUNT(*) AS row_count,
  CAST(NULL AS DOUBLE) AS numeric_sum,
  to_unixtime(MAX(dteventtime)) AS numeric_max,
  to_unixtime(MIN(dteventtime)) AS numeric_min,
  json_format(CAST(MAP(ARRAY['platid'], ARRAY[ARBITRARY(platid)]) AS JSON)) AS last_value
FROM ${FQN('etl_login')}
WHERE dteventtime >= current_date - INTERVAL '${days}' DAY
  AND vopenid IS NOT NULL
GROUP BY vopenid, CAST(dteventtime AS DATE)
LIMIT ${cap}
`;

// ── etl_logout ────────────────────────────────────────────────────────
// onlinetime is varchar — TRY_CAST to int (seconds), null on garbage.
// numeric_sum = total session-duration seconds for that uid×date.
export const etl_logout: AggregateBuilder = (days, cap) => `
SELECT
  vopenid AS uid,
  CAST(dteventtime AS DATE) AS event_date,
  COUNT(*) AS row_count,
  CAST(SUM(TRY_CAST(onlinetime AS BIGINT)) AS DOUBLE) AS numeric_sum,
  CAST(MAX(TRY_CAST(onlinetime AS BIGINT)) AS DOUBLE) AS numeric_max,
  CAST(MIN(TRY_CAST(onlinetime AS BIGINT)) AS DOUBLE) AS numeric_min,
  CAST(NULL AS VARCHAR) AS last_value
FROM ${FQN('etl_logout')}
WHERE dteventtime >= current_date - INTERVAL '${days}' DAY
  AND vopenid IS NOT NULL
GROUP BY vopenid, CAST(dteventtime AS DATE)
LIMIT ${cap}
`;

// ── etl_game_detail ───────────────────────────────────────────────────
// Per-match table — uses playerid (NOT vopenid). row_count = matches/day.
// numeric_sum = sum of totalladderscore (score attained that day).
// numeric_max = max ladder score that day. last_value carries gameresult
// counts as JSON: {win:n, lose:n, draw:n}.
export const etl_game_detail: AggregateBuilder = (days, cap) => `
SELECT
  playerid AS uid,
  CAST(dteventtime AS DATE) AS event_date,
  COUNT(*) AS row_count,
  CAST(SUM(TRY_CAST(totalladderscore AS BIGINT)) AS DOUBLE) AS numeric_sum,
  CAST(MAX(TRY_CAST(totalladderscore AS BIGINT)) AS DOUBLE) AS numeric_max,
  CAST(MIN(TRY_CAST(totalladderscore AS BIGINT)) AS DOUBLE) AS numeric_min,
  json_format(CAST(MAP(
    ARRAY['wins', 'losses', 'gameduration_sum'],
    ARRAY[
      CAST(SUM(CASE WHEN gameresult = '1' THEN 1 ELSE 0 END) AS DOUBLE),
      CAST(SUM(CASE WHEN gameresult = '0' THEN 1 ELSE 0 END) AS DOUBLE),
      CAST(SUM(TRY_CAST(gameduration AS BIGINT)) AS DOUBLE)
    ]
  ) AS JSON)) AS last_value
FROM ${FQN('etl_game_detail')}
WHERE dteventtime >= current_date - INTERVAL '${days}' DAY
  AND playerid IS NOT NULL
GROUP BY playerid, CAST(dteventtime AS DATE)
LIMIT ${cap}
`;

// ── etl_recharge ──────────────────────────────────────────────────────
// Real-money purchases. numeric_sum = imoney_us total (USD).
// numeric_max = largest single purchase USD.
export const etl_recharge: AggregateBuilder = (days, cap) => `
SELECT
  vopenid AS uid,
  CAST(dteventtime AS DATE) AS event_date,
  COUNT(*) AS row_count,
  SUM(imoney_us) AS numeric_sum,
  MAX(imoney_us) AS numeric_max,
  MIN(imoney_us) AS numeric_min,
  json_format(CAST(MAP(ARRAY['currencies'], ARRAY[CAST(COUNT(DISTINCT currency) AS DOUBLE)]) AS JSON)) AS last_value
FROM ${FQN('etl_recharge')}
WHERE dteventtime >= current_date - INTERVAL '${days}' DAY
  AND vopenid IS NOT NULL
GROUP BY vopenid, CAST(dteventtime AS DATE)
LIMIT ${cap}
`;

// ── etl_moneyflow ─────────────────────────────────────────────────────
// Currency events. Massive volume. Per uid×date: row_count = events,
// numeric_sum = aggregate balance delta, numeric_max = latest balance.
// We aggregate across all imoneytype (gem, cf_coin, etc.) — Phase 04
// derivations split by imoneytype using last_value JSON.
export const etl_moneyflow: AggregateBuilder = (days, cap) => `
SELECT
  vopenid AS uid,
  CAST(dteventtime AS DATE) AS event_date,
  COUNT(*) AS row_count,
  SUM(delta) AS numeric_sum,
  MAX(balance) AS numeric_max,
  MIN(balance) AS numeric_min,
  json_format(CAST(MAP(ARRAY['types'], ARRAY[CAST(COUNT(DISTINCT imoneytype) AS DOUBLE)]) AS JSON)) AS last_value
FROM ${FQN('etl_moneyflow')}
WHERE dteventtime >= current_date - INTERVAL '${days}' DAY
  AND vopenid IS NOT NULL
GROUP BY vopenid, CAST(dteventtime AS DATE)
LIMIT ${cap}
`;

// ── etl_appsflyer_installs_datalocker ─────────────────────────────────
// Install attribution. uid here is appsflyer_id (no vopenid linkage in
// this table). event_date = install_date. numeric_max = epoch of install.
// last_value = {media_source}.
export const etl_appsflyer_installs_datalocker: AggregateBuilder = (days, cap) => `
SELECT
  appsflyer_id AS uid,
  install_date AS event_date,
  COUNT(*) AS row_count,
  CAST(NULL AS DOUBLE) AS numeric_sum,
  to_unixtime(MAX(install_time)) AS numeric_max,
  to_unixtime(MIN(install_time)) AS numeric_min,
  json_format(CAST(MAP(ARRAY['media_source'], ARRAY[ARBITRARY(media_source)]) AS JSON)) AS last_value
FROM ${FQN('etl_appsflyer_installs_datalocker')}
WHERE install_time >= current_date - INTERVAL '${days}' DAY
  AND appsflyer_id IS NOT NULL
GROUP BY appsflyer_id, install_date
LIMIT ${cap}
`;

// ── std_master_user_profile ───────────────────────────────────────────
// Master user profile snapshot. We treat each user's last_login_time as
// the event_date for change-detection. numeric_sum = total_rev,
// numeric_max = epoch of last_login_time, numeric_min = epoch of
// first_login_time. last_value JSON carries country + media_source.
export const std_master_user_profile: AggregateBuilder = (days, cap) => `
SELECT
  vopenid AS uid,
  CAST(last_login_time AS DATE) AS event_date,
  COUNT(*) AS row_count,
  CAST(SUM(total_rev) AS DOUBLE) AS numeric_sum,
  to_unixtime(MAX(last_login_time)) AS numeric_max,
  to_unixtime(MIN(first_login_time)) AS numeric_min,
  json_format(CAST(MAP(
    ARRAY['country', 'media_source', 'first_login_epoch'],
    ARRAY[
      CAST(ARBITRARY(last_country_code) AS VARCHAR),
      CAST(ARBITRARY(media_source) AS VARCHAR),
      CAST(to_unixtime(MAX(first_login_time)) AS VARCHAR)
    ]
  ) AS JSON)) AS last_value
FROM ${FQN('std_master_user_profile')}
WHERE last_login_time >= current_date - INTERVAL '${days}' DAY
  AND vopenid IS NOT NULL
GROUP BY vopenid, CAST(last_login_time AS DATE)
LIMIT ${cap}
`;

// ── Builder registry ──────────────────────────────────────────────────
export const AGGREGATE_BUILDERS: Record<SourceTable, AggregateBuilder> = {
  etl_login,
  etl_logout,
  etl_game_detail,
  etl_recharge,
  etl_moneyflow,
  etl_appsflyer_installs_datalocker,
  std_master_user_profile,
};

export const SOURCE_TABLES: readonly SourceTable[] = [
  'etl_login',
  'etl_logout',
  'etl_game_detail',
  'etl_recharge',
  'etl_moneyflow',
  'etl_appsflyer_installs_datalocker',
  'std_master_user_profile',
] as const;
