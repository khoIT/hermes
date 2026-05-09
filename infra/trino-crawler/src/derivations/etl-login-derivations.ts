/**
 * Derivations sourced from raw_event_aggregates rows where
 * source_table = 'etl_login'.
 *
 * Each row carries: row_count = sessions on that date,
 * numeric_max = epoch of latest login on that date,
 * numeric_min = epoch of earliest login on that date,
 * last_value = { platid: 'ios' | 'android' | ... }.
 */

import type { Derivation } from './derivation-types.js';
import { rowsWithinDays, readLast } from './derivation-types.js';

const SECS_PER_DAY = 86_400;

/** account_age_days — DATEDIFF(today, MIN(login_epoch_seconds)) */
const accountAgeDays: Derivation = {
  feature: 'account_age_days',
  sourceTables: ['etl_login'],
  compute: (rows, today) => {
    if (rows.length === 0) return null;
    const minEpoch = rows.reduce<number>(
      (m, r) => (r.numericMin !== null && r.numericMin < m ? r.numericMin : m),
      Number.POSITIVE_INFINITY,
    );
    if (!Number.isFinite(minEpoch)) return null;
    const days = Math.max(0, Math.round((today.getTime() / 1000 - minEpoch) / SECS_PER_DAY));
    return { uid: rows[0].uid, valueText: String(days), valueNumeric: days };
  },
};

/** lifetime_login_count — SUM(row_count) over 30d window (proxy for lifetime). */
const lifetimeLoginCount: Derivation = {
  feature: 'lifetime_login_count',
  sourceTables: ['etl_login'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    const total = rows.reduce((s, r) => s + r.rowCount, 0);
    return { uid: rows[0].uid, valueText: String(total), valueNumeric: total };
  },
};

const sessionCountFactory = (windowDays: number): Derivation['compute'] => (rows, today) => {
  const windowed = rowsWithinDays(rows, today, windowDays);
  if (windowed.length === 0 && rows.length === 0) return null;
  const total = windowed.reduce((s, r) => s + r.rowCount, 0);
  return { uid: rows[0]?.uid ?? '', valueText: String(total), valueNumeric: total };
};

const sessionCount30d: Derivation = {
  feature: 'session_count_30d', sourceTables: ['etl_login'], compute: sessionCountFactory(30),
};
const sessionCount7d: Derivation = {
  feature: 'session_count_7d', sourceTables: ['etl_login'], compute: sessionCountFactory(7),
};
const sessionCount1d: Derivation = {
  feature: 'session_count_1d', sourceTables: ['etl_login'], compute: sessionCountFactory(1),
};

/** daily_login_streak_current — count of consecutive days ending yesterday with ≥1 login. */
const dailyLoginStreakCurrent: Derivation = {
  feature: 'daily_login_streak_current',
  sourceTables: ['etl_login'],
  compute: (rows, today) => {
    if (rows.length === 0) return null;
    const dates = new Set(rows.filter((r) => r.rowCount > 0).map((r) => r.eventDate));
    let streak = 0;
    const cursor = new Date(today);
    cursor.setUTCDate(cursor.getUTCDate() - 1); // start at yesterday
    for (let i = 0; i < 365; i++) {
      const iso = cursor.toISOString().slice(0, 10);
      if (!dates.has(iso)) break;
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return { uid: rows[0].uid, valueText: String(streak), valueNumeric: streak };
  },
};

/** daily_login_streak_max — longest consecutive run of login-days in window. */
const dailyLoginStreakMax: Derivation = {
  feature: 'daily_login_streak_max',
  sourceTables: ['etl_login'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    const sortedDates = [...new Set(rows.filter((r) => r.rowCount > 0).map((r) => r.eventDate))].sort();
    let best = 0;
    let run = 0;
    let prev: string | null = null;
    for (const d of sortedDates) {
      if (prev) {
        const gap = (Date.parse(d) - Date.parse(prev)) / (SECS_PER_DAY * 1000);
        run = gap === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      if (run > best) best = run;
      prev = d;
    }
    return { uid: rows[0].uid, valueText: String(best), valueNumeric: best };
  },
};

/** is_returning_after_lapse — true when there's a ≥30-day gap in login dates. */
const isReturningAfterLapse: Derivation = {
  feature: 'is_returning_after_lapse',
  sourceTables: ['etl_login'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    const dates = [...new Set(rows.map((r) => r.eventDate))].sort();
    let lapsed = false;
    for (let i = 1; i < dates.length; i++) {
      const gap = (Date.parse(dates[i]) - Date.parse(dates[i - 1])) / (SECS_PER_DAY * 1000);
      if (gap >= 30) { lapsed = true; break; }
    }
    return {
      uid: rows[0].uid,
      valueText: lapsed ? 'true' : 'false',
      valueNumeric: lapsed ? 1 : 0,
    };
  },
};

/** region_code — proxy via etl_login last_value.platid (no region column in table). */
const regionCode: Derivation = {
  feature: 'region_code',
  sourceTables: ['etl_login'],
  compute: (rows) => {
    const last = readLast<{ platid?: string }>(rows);
    if (!last?.platid) return null;
    // platid maps to a region proxy: 0 = VN, 1 = TH, 2 = ID, 3 = PH, else 'Other'.
    const map: Record<string, string> = { '0': 'VN', '1': 'TH', '2': 'ID', '3': 'PH' };
    const code = map[String(last.platid)] ?? 'Other';
    return { uid: rows[0].uid, valueText: code, valueNumeric: null };
  },
};

export const etlLoginDerivations: Derivation[] = [
  accountAgeDays,
  lifetimeLoginCount,
  sessionCount30d,
  sessionCount7d,
  sessionCount1d,
  dailyLoginStreakCurrent,
  dailyLoginStreakMax,
  isReturningAfterLapse,
  regionCode,
];
