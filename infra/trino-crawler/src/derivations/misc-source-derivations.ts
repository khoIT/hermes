/**
 * Derivations from the smaller source tables: etl_logout, etl_appsflyer,
 * std_master_user_profile. Combined into one file because each has only
 * 1-5 features.
 */

import type { Derivation } from './derivation-types.js';
import { rowsWithinDays, readLast } from './derivation-types.js';

const SECS_PER_DAY = 86_400;

// ── etl_logout ──────────────────────────────────────────────────────
// numeric_sum = total session-duration seconds for that uid×date.

/** avg_session_duration_30d — T4 proxy: total duration / sessions in 30d window. */
const avgSessionDuration30d: Derivation = {
  feature: 'avg_session_duration_30d',
  sourceTables: ['etl_logout'],
  approximate: true,
  compute: (rows, today) => {
    const within = rowsWithinDays(rows, today, 30);
    if (within.length === 0) return null;
    const totalSeconds = within.reduce((s, r) => s + (r.numericSum ?? 0), 0);
    const sessionCount = within.reduce((s, r) => s + r.rowCount, 0);
    if (sessionCount === 0) return null;
    const avgMin = Math.max(1, Math.min(180, totalSeconds / sessionCount / 60));
    return { uid: rows[0]?.uid ?? '', valueText: avgMin.toFixed(1), valueNumeric: avgMin };
  },
};

// ── etl_appsflyer_installs_datalocker ──────────────────────────────
// numeric_max = epoch of install_time. uid here is appsflyer_id (not vopenid).

/** days_since_install — DATEDIFF from MIN(install_time). */
const daysSinceInstall: Derivation = {
  feature: 'days_since_install',
  sourceTables: ['etl_appsflyer_installs_datalocker'],
  compute: (rows, today) => {
    if (rows.length === 0) return null;
    const minEpoch = rows.reduce<number>(
      (m, r) => (r.numericMin !== null && r.numericMin < m ? r.numericMin : m),
      Number.POSITIVE_INFINITY,
    );
    if (!Number.isFinite(minEpoch)) return null;
    const days = Math.max(0, Math.round(today.getTime() / 1000 / SECS_PER_DAY - minEpoch / SECS_PER_DAY));
    return { uid: rows[0].uid, valueText: String(days), valueNumeric: days };
  },
};

// ── std_master_user_profile ─────────────────────────────────────────
// numeric_max = epoch of last_login_time, numeric_min = epoch of
// first_login_time, numeric_sum = total_rev (USD).
// last_value = { country, media_source, first_login_epoch }.

const accountFirstLoginTs: Derivation = {
  feature: 'account_first_login_ts',
  sourceTables: ['std_master_user_profile'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    const minEpoch = rows.reduce<number>(
      (m, r) => (r.numericMin !== null && r.numericMin < m ? r.numericMin : m),
      Number.POSITIVE_INFINITY,
    );
    if (!Number.isFinite(minEpoch)) return null;
    return { uid: rows[0].uid, valueText: String(Math.round(minEpoch)), valueNumeric: minEpoch };
  },
};

const accountFirstLoginMmdd: Derivation = {
  feature: 'account_first_login_mmdd',
  sourceTables: ['std_master_user_profile'],
  compute: (rows) => {
    const r = accountFirstLoginTs.compute(rows, new Date());
    if (!r || r.valueNumeric === null) return null;
    const d = new Date(r.valueNumeric * 1000);
    const mmdd = (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    return { uid: r.uid, valueText: String(mmdd), valueNumeric: mmdd };
  },
};

const lastLoginDaysAgo: Derivation = {
  feature: 'last_login_days_ago',
  sourceTables: ['std_master_user_profile'],
  compute: (rows, today) => {
    if (rows.length === 0) return null;
    const maxEpoch = rows.reduce<number>(
      (m, r) => (r.numericMax !== null && r.numericMax > m ? r.numericMax : m),
      0,
    );
    if (maxEpoch === 0) return null;
    const days = Math.max(0, Math.round(today.getTime() / 1000 / SECS_PER_DAY - maxEpoch / SECS_PER_DAY));
    return { uid: rows[0].uid, valueText: String(days), valueNumeric: days };
  },
};

const isNewUserD7: Derivation = {
  feature: 'is_new_user_d7',
  sourceTables: ['std_master_user_profile'],
  compute: (rows, today) => {
    const r = accountFirstLoginTs.compute(rows, today);
    if (!r || r.valueNumeric === null) return null;
    const days = today.getTime() / 1000 / SECS_PER_DAY - r.valueNumeric / SECS_PER_DAY;
    const fresh = days <= 7;
    return { uid: r.uid, valueText: fresh ? 'true' : 'false', valueNumeric: fresh ? 1 : 0 };
  },
};

const playerLifecycleStage: Derivation = {
  feature: 'player_lifecycle_stage',
  sourceTables: ['std_master_user_profile'],
  compute: (rows, today) => {
    const first = accountFirstLoginTs.compute(rows, today);
    const last  = lastLoginDaysAgo.compute(rows, today);
    if (!first || !last) return null;
    const ageDays = (today.getTime() / 1000 - (first.valueNumeric ?? 0)) / SECS_PER_DAY;
    const lastDays = last.valueNumeric ?? 0;
    let stage = 'mid';
    if (lastDays > 30)        stage = 'lapsed';
    else if (ageDays <= 7)    stage = 'nru';
    else if (ageDays > 180)   stage = 'veteran';
    return { uid: first.uid, valueText: stage, valueNumeric: null };
  },
};

/** vip_status — proxy from total_rev tier. */
const vipStatus: Derivation = {
  feature: 'vip_status',
  sourceTables: ['std_master_user_profile'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    const usd = rows.reduce<number>((m, r) => Math.max(m, r.numericSum ?? 0), 0);
    let tier = 'none';
    if (usd >= 1000)     tier = 'vip_max';
    else if (usd >= 250) tier = 'vip3';
    else if (usd >= 50)  tier = 'vip2';
    else if (usd > 0)    tier = 'vip1';
    return { uid: rows[0].uid, valueText: tier, valueNumeric: null };
  },
};

export const etlLogoutDerivations: Derivation[] = [avgSessionDuration30d];
export const etlAppsflyerDerivations: Derivation[] = [daysSinceInstall];
export const stdMasterUserProfileDerivations: Derivation[] = [
  accountFirstLoginTs,
  accountFirstLoginMmdd,
  lastLoginDaysAgo,
  isNewUserD7,
  playerLifecycleStage,
  vipStatus,
];

// readLast helper kept exported via re-import in case derivations grow:
export { readLast };
