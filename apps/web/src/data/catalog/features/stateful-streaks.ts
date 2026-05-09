/**
 * Feature domain: Stateful Streaks — 2 dual-tier features
 * Source: Hermes_Demo_Data.md Part 1 §Stateful streaks + Part 5 §1
 *
 * These features have TWO materializations:
 *   - Substrate A (<1s): TEE online state store — used in real-time trigger predicates
 *   - Substrate B (<1h): Hatchet warm tier — used in segment predicates
 *
 * The Feature Store treats them as ONE feature with dual latency badge
 * '<1s · A' / '<1h · B'. dualTier=true signals this to the UI.
 *
 * `consecutive_ranked_losses_streak` is the SHOWCASE feature:
 *   - Demo step 2 (Feature Store detail with dual-target definition)
 *   - Canonical demo campaign CFM-13 Pass Stuck Rescue
 *   - Opportunity ag-op-1042 evidence row
 *   - Full definition.exprLang + definition.dbtSql required per phase spec
 */
import type { HermesFeatureSource } from '@hermes/contracts';

export const statefulStreaksFeatures: HermesFeatureSource[] = [
  {
    name: 'consecutive_ranked_losses_streak',
    displayName: 'Consecutive Ranked Losses Streak',
    type: 'int',
    /** Primary tier is the hot realtime tier — the batch warm tier is secondary */
    latencyTier: '<1s',
    substrate: 'A',
    domain: 'stateful-streaks',
    games: ['cfm'],
    owner: 'gds-cfm',
    status: 'active',
    dualTier: true,
    addedAt: '2025-03-01',
    sparklineKey: 'spk-consecutive-ranked-losses-streak',
    usedBySegments: 3,
    usedByCampaigns: 2,
    /**
     * Semantic Management Layer definition — one definition compiles to both substrates.
     * This is the "one definition, two materializations" pitch (PRD §6.3).
     *
     * exprLang: Substrate A (Apollo TEE) — evaluates at event_match_end arrival
     * dbtSql:   Substrate B (Hatchet/Trino/Iceberg) — warm batch refresh <1h
     */
    definition: {
      exprLang: [
        '# Substrate A — TEE online state evaluation at event_match_end',
        'WHEN event_match_end.outcome = "lose"',
        '  THEN @state.consecutive_ranked_losses_streak + 1',
        'WHEN event_match_end.outcome = "win"',
        '  THEN 0',
        'ELSE @state.consecutive_ranked_losses_streak',
      ].join('\n'),
      dbtSql: [
        '-- Substrate B — Hatchet/Trino warm tier refresh every <1h',
        '-- Counts consecutive ranked losses from ranked match history,',
        '-- resetting to 0 on any win. CDC-synced from TEE state store.',
        'WITH ranked_matches AS (',
        '  SELECT',
        '    uid,',
        '    match_ts,',
        '    outcome,',
        '    ROW_NUMBER() OVER (PARTITION BY uid ORDER BY match_ts DESC) AS rn',
        '  FROM {{ ref("fct_cfm_ranked_match_results") }}',
        '  WHERE match_mode = \'ranked\'',
        '),',
        'loss_runs AS (',
        '  SELECT',
        '    uid,',
        '    match_ts,',
        '    outcome,',
        '    rn,',
        '    SUM(CASE WHEN outcome = \'win\' THEN 1 ELSE 0 END)',
        '      OVER (PARTITION BY uid ORDER BY rn) AS win_reset_group',
        '  FROM ranked_matches',
        ')',
        'SELECT',
        '  uid,',
        '  COUNT(*) AS consecutive_ranked_losses_streak',
        'FROM loss_runs',
        'WHERE outcome = \'lose\'',
        '  AND win_reset_group = (',
        '    SELECT MIN(win_reset_group)',
        '    FROM loss_runs lr2',
        '    WHERE lr2.uid = loss_runs.uid',
        '  )',
        'GROUP BY uid',
      ].join('\n'),
    },
  },
  {
    name: 'consecutive_ranked_wins_streak',
    displayName: 'Consecutive Ranked Wins Streak',
    type: 'int',
    latencyTier: '<1s',
    substrate: 'A',
    domain: 'stateful-streaks',
    games: ['cfm'],
    owner: 'gds-cfm',
    status: 'active',
    dualTier: true,
    addedAt: '2025-03-01',
    sparklineKey: 'spk-consecutive-ranked-wins-streak',
    usedBySegments: 1,
    usedByCampaigns: 1,
    definition: {
      exprLang: [
        '# Substrate A — TEE online state evaluation at event_match_end',
        'WHEN event_match_end.outcome = "win"',
        '  THEN @state.consecutive_ranked_wins_streak + 1',
        'WHEN event_match_end.outcome = "lose"',
        '  THEN 0',
        'ELSE @state.consecutive_ranked_wins_streak',
      ].join('\n'),
      dbtSql: [
        '-- Substrate B — inverse of consecutive_ranked_losses_streak',
        'WITH ranked_matches AS (',
        '  SELECT uid, match_ts, outcome,',
        '    ROW_NUMBER() OVER (PARTITION BY uid ORDER BY match_ts DESC) AS rn',
        '  FROM {{ ref("fct_cfm_ranked_match_results") }}',
        '  WHERE match_mode = \'ranked\'',
        '),',
        'win_runs AS (',
        '  SELECT uid, match_ts, outcome, rn,',
        '    SUM(CASE WHEN outcome = \'lose\' THEN 1 ELSE 0 END)',
        '      OVER (PARTITION BY uid ORDER BY rn) AS loss_reset_group',
        '  FROM ranked_matches',
        ')',
        'SELECT uid, COUNT(*) AS consecutive_ranked_wins_streak',
        'FROM win_runs',
        'WHERE outcome = \'win\'',
        '  AND loss_reset_group = (',
        '    SELECT MIN(loss_reset_group) FROM win_runs wr2 WHERE wr2.uid = win_runs.uid',
        '  )',
        'GROUP BY uid',
      ].join('\n'),
    },
  },
];
