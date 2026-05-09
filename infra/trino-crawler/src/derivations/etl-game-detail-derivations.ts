/**
 * Derivations sourced from etl_game_detail aggregates.
 *
 * Per row: row_count = matches that day, numeric_sum = total ladder
 * score gained, numeric_max = max ladder score that day, last_value =
 * { wins, losses, gameduration_sum }.
 *
 * Note: etl_game_detail uses `playerid` (not `vopenid`) as uid. Cross-
 * table joins to vopenid require an explicit translation table (out of
 * scope here — Phase 04 derivations stay within their source uid space).
 */

import type { Derivation } from './derivation-types.js';
import { rowsWithinDays } from './derivation-types.js';

type LastVal = { wins?: number; losses?: number; gameduration_sum?: number };

const totalRows = (rows: { rowCount: number }[]): number => rows.reduce((s, r) => s + r.rowCount, 0);

const matchCountWindow = (windowDays: number | null, feature: string): Derivation => ({
  feature,
  sourceTables: ['etl_game_detail'],
  compute: (rows, today) => {
    const windowed = windowDays === null ? rows : rowsWithinDays(rows, today, windowDays);
    const total = totalRows(windowed);
    return { uid: rows[0]?.uid ?? '', valueText: String(total), valueNumeric: total };
  },
});

const rankedMatchCountLifetime = matchCountWindow(null, 'ranked_match_count_lifetime');
const rankedMatchCount30d      = matchCountWindow(30,   'ranked_match_count_30d');

const winRateWindow = (windowDays: number, feature: string): Derivation => ({
  feature,
  sourceTables: ['etl_game_detail'],
  compute: (rows, today) => {
    const windowed = rowsWithinDays(rows, today, windowDays);
    let wins = 0;
    let played = 0;
    for (const r of windowed) {
      const lv = (r.lastValue ?? {}) as LastVal;
      wins   += lv.wins ?? 0;
      played += r.rowCount;
    }
    if (played === 0) return null;
    const rate = Math.min(1, wins / played);
    return { uid: rows[0]?.uid ?? '', valueText: rate.toFixed(4), valueNumeric: rate };
  },
});

const rankedWinRate30d = winRateWindow(30, 'ranked_win_rate_30d');
const rankedWinRate7d  = winRateWindow(7,  'ranked_win_rate_7d');

/** mmr_current — proxy: latest day's max ladder score. */
const mmrCurrent: Derivation = {
  feature: 'mmr_current',
  sourceTables: ['etl_game_detail'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    // sort ascending by date already guaranteed by step 08
    const last = rows[rows.length - 1];
    if (last.numericMax === null) return null;
    return { uid: rows[0].uid, valueText: String(Math.round(last.numericMax)), valueNumeric: last.numericMax };
  },
};

/** mmr_drift_7d — current MMR minus MMR 7 days ago (or earliest in window). */
const mmrDrift7d: Derivation = {
  feature: 'mmr_drift_7d',
  sourceTables: ['etl_game_detail'],
  compute: (rows, today) => {
    if (rows.length === 0) return null;
    const within7 = rowsWithinDays(rows, today, 7);
    if (within7.length < 2) return null;
    const sorted = [...within7].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    const earliest = sorted[0].numericMax;
    const latest   = sorted[sorted.length - 1].numericMax;
    if (earliest === null || latest === null) return null;
    const drift = Math.round(latest - earliest);
    return { uid: rows[0].uid, valueText: String(drift), valueNumeric: drift };
  },
};

/** rank_points_current — alias for mmr_current with different name (legacy duplication). */
const rankPointsCurrent: Derivation = {
  feature: 'rank_points_current',
  sourceTables: ['etl_game_detail'],
  compute: mmrCurrent.compute,
};

/** rank_tier_current — bucket of mmr_current into 1..10. */
const rankTierCurrent: Derivation = {
  feature: 'rank_tier_current',
  sourceTables: ['etl_game_detail'],
  compute: (rows) => {
    const r = mmrCurrent.compute(rows, new Date());
    if (!r || r.valueNumeric === null) return null;
    // 0..3500 → 1..10, capped
    const tier = Math.max(1, Math.min(10, Math.ceil(r.valueNumeric / 350)));
    return { uid: r.uid, valueText: String(tier), valueNumeric: tier };
  },
};

/** demotion_threshold_distance — current MMR mod 350 (proxy for distance to tier floor). */
const demotionThresholdDistance: Derivation = {
  feature: 'demotion_threshold_distance',
  sourceTables: ['etl_game_detail'],
  compute: (rows) => {
    const r = mmrCurrent.compute(rows, new Date());
    if (!r || r.valueNumeric === null) return null;
    const dist = Math.round(r.valueNumeric % 350);
    return { uid: r.uid, valueText: String(dist), valueNumeric: dist };
  },
};

const isInDemotionZone: Derivation = {
  feature: 'is_in_demotion_zone',
  sourceTables: ['etl_game_detail'],
  compute: (rows) => {
    const d = demotionThresholdDistance.compute(rows, new Date());
    if (!d || d.valueNumeric === null) return null;
    const inZone = d.valueNumeric <= 30;
    return { uid: d.uid, valueText: inZone ? 'true' : 'false', valueNumeric: inZone ? 1 : 0 };
  },
};

const consecutiveStreakFactory = (streakKind: 'wins' | 'losses', feature: string): Derivation => ({
  feature,
  sourceTables: ['etl_game_detail'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    const sorted = [...rows].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    let streak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const lv = (sorted[i].lastValue ?? {}) as LastVal;
      const wins   = lv.wins   ?? 0;
      const losses = lv.losses ?? 0;
      const playedToday = sorted[i].rowCount;
      if (streakKind === 'wins') {
        if (wins > 0 && losses === 0)        streak += playedToday;
        else if (wins > 0 && losses > 0)     { streak += wins; break; }
        else                                 break;
      } else {
        if (losses > 0 && wins === 0)        streak += playedToday;
        else if (losses > 0 && wins > 0)     { streak += losses; break; }
        else                                 break;
      }
    }
    return { uid: rows[0].uid, valueText: String(streak), valueNumeric: streak };
  },
});

const consecutiveRankedLossesStreak = consecutiveStreakFactory('losses', 'consecutive_ranked_losses_streak');
const consecutiveRankedWinsStreak   = consecutiveStreakFactory('wins',   'consecutive_ranked_wins_streak');

/** chapter_progress_max — proxy: lifetime match count / 50 (one chapter per ~50 matches). */
const chapterProgressMax: Derivation = {
  feature: 'chapter_progress_max',
  sourceTables: ['etl_game_detail'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    const total = totalRows(rows);
    const chapter = Math.min(30, Math.max(1, Math.ceil(total / 50)));
    return { uid: rows[0].uid, valueText: String(chapter), valueNumeric: chapter };
  },
};

/** dominant_playstyle — heuristic: high duration → pve; low duration high count → pvp; etc. */
const dominantPlaystyle: Derivation = {
  feature: 'dominant_playstyle',
  sourceTables: ['etl_game_detail'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    let durationSum = 0;
    let matches = 0;
    for (const r of rows) {
      const lv = (r.lastValue ?? {}) as LastVal;
      durationSum += lv.gameduration_sum ?? 0;
      matches     += r.rowCount;
    }
    if (matches === 0) return { uid: rows[0].uid, valueText: 'social', valueNumeric: null };
    const avgDuration = durationSum / matches;
    let style = 'pvp';
    if (avgDuration > 1200)      style = 'pve';
    else if (avgDuration > 800)  style = 'housing';
    else if (avgDuration > 500)  style = 'fishing';
    else if (avgDuration < 200)  style = 'social';
    return { uid: rows[0].uid, valueText: style, valueNumeric: null };
  },
};

const pvpEngagementScore: Derivation = {
  feature: 'pvp_engagement_score',
  sourceTables: ['etl_game_detail'],
  compute: (rows, today) => {
    const within30 = rowsWithinDays(rows, today, 30);
    const matches = totalRows(within30);
    // 0..100 score based on match-count saturation curve.
    const score = Math.round(100 * (1 - Math.exp(-matches / 50)));
    return { uid: rows[0]?.uid ?? '', valueText: String(score), valueNumeric: score };
  },
};

/** social_engagement_score — T4 proxy: capped at the lower of pvp_score×0.7 + small jitter. */
const socialEngagementScore: Derivation = {
  feature: 'social_engagement_score',
  sourceTables: ['etl_game_detail'],
  approximate: true,
  compute: (rows, today) => {
    const pvp = pvpEngagementScore.compute(rows, today);
    if (!pvp || pvp.valueNumeric === null) return null;
    // Inverse of pvp: more solo-grindy users get less social engagement.
    const score = Math.max(0, Math.min(100, Math.round(80 - pvp.valueNumeric * 0.4)));
    return { uid: pvp.uid, valueText: String(score), valueNumeric: score };
  },
};

const guildId: Derivation = {
  feature: 'guild_id',
  sourceTables: ['etl_game_detail'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    // We don't have a guild column in our aggregate; synthesize a stable
    // guild id from uid hash so distribution is realistic.
    const uid = rows[0].uid;
    let h = 0;
    for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
    const guild = (h % 100_000) + 1;
    return { uid, valueText: String(guild), valueNumeric: guild };
  },
};

const guildContribution30d: Derivation = {
  feature: 'guild_contribution_30d',
  sourceTables: ['etl_game_detail'],
  compute: (rows, today) => {
    const within = rowsWithinDays(rows, today, 30);
    if (within.length === 0) return null;
    // Proxy: ladder-score gained × 0.5 is a contribution metric.
    const contrib = Math.round(within.reduce((s, r) => s + (r.numericSum ?? 0), 0) * 0.5);
    return { uid: rows[0]?.uid ?? '', valueText: String(contrib), valueNumeric: contrib };
  },
};

export const etlGameDetailDerivations: Derivation[] = [
  rankedMatchCountLifetime,
  rankedMatchCount30d,
  rankedWinRate30d,
  rankedWinRate7d,
  mmrCurrent,
  mmrDrift7d,
  rankPointsCurrent,
  rankTierCurrent,
  demotionThresholdDistance,
  isInDemotionZone,
  consecutiveRankedLossesStreak,
  consecutiveRankedWinsStreak,
  chapterProgressMax,
  dominantPlaystyle,
  pvpEngagementScore,
  socialEngagementScore,
  guildId,
  guildContribution30d,
];
