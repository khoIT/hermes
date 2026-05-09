/**
 * Feature domain: Predictive — Platform propensity models — 3 features
 * Source: Phase 1 v2 schema delta. These are GDS-owned, cross-game ML
 * features served from the offline cache (Substrate B · Iceberg).
 *
 * Each platform feature carries:
 *   - games[] = all 6 games (cross-game by definition)
 *   - platform: true
 *   - propensityModel: { family, target, trainingWindow, AUC band, version, cadence }
 *
 * The detail page Overview tab renders these via <PropensityModelCard />.
 * The library + Segment surfaces render the Platform · Propensity chip.
 */
import type { HermesFeatureSource } from '@hermes/contracts';

const ALL_GAMES = ['cfm', 'pt', 'nth', 'tf', 'cos', 'ptg'] as const;

export const platformPropensityFeatures: HermesFeatureSource[] = [
  {
    name: 'pltv_30d_score',
    displayName: 'Predicted 30-Day LTV',
    type: 'numeric',
    latencyTier: '<1d',
    substrate: 'B',
    domain: 'predictive',
    games: [...ALL_GAMES],
    platform: true,
    propensityModel: {
      family: 'pltv',
      target: '30d_revenue',
      trainingWindowDays: 90,
      aucBand: '0.78-0.82',
      modelVersion: 'v3.2',
      refreshCadence: 'daily',
    },
    owner: 'gds-ml-platform',
    status: 'active',
    addedAt: '2026-02-15',
    sparklineKey: 'spk-pltv-30d-score',
    usedBySegments: 12,
    usedByCampaigns: 18,
    definition: {
      exprLang: [
        '# Substrate B — served from offline cache; not computed at TEE',
        '# Real-time evaluation reads the last refreshed value (≤24h staleness).',
        '@features.pltv_30d_score',
      ].join('\n'),
      dbtSql: [
        '-- Substrate B — materialized by GDS ML pipeline (ml/pltv_30d.py).',
        '-- Refresh cadence: daily at 06:00 ICT after batch features land.',
        'SELECT',
        '  uid,',
        '  score AS pltv_30d_score',
        'FROM {{ source("ml", "pltv_30d_predictions") }}',
        'WHERE ds = CURRENT_DATE',
      ].join('\n'),
    },
  },
  {
    name: 'churn_7d_propensity',
    displayName: 'Churn-in-7-Days Propensity',
    type: 'numeric',
    latencyTier: '<1d',
    substrate: 'B',
    domain: 'predictive',
    games: [...ALL_GAMES],
    platform: true,
    propensityModel: {
      family: 'churn',
      target: '7d_churn',
      trainingWindowDays: 60,
      aucBand: '0.81-0.85',
      modelVersion: 'v2.4',
      refreshCadence: 'daily',
    },
    owner: 'gds-ml-platform',
    status: 'active',
    addedAt: '2026-01-20',
    sparklineKey: 'spk-churn-7d-propensity',
    usedBySegments: 9,
    usedByCampaigns: 14,
    definition: {
      exprLang: [
        '# Substrate B — XGBoost classifier output, cached daily',
        '@features.churn_7d_propensity',
      ].join('\n'),
      dbtSql: [
        '-- Substrate B — last 60 days of session/spend signals fed into',
        '-- the churn classifier. Score range [0, 1]; higher = more likely to churn.',
        'SELECT',
        '  uid,',
        '  score AS churn_7d_propensity',
        'FROM {{ source("ml", "churn_7d_predictions") }}',
        'WHERE ds = CURRENT_DATE',
      ].join('\n'),
    },
  },
  {
    name: 'reactivation_propensity',
    displayName: 'Reactivation Propensity',
    type: 'numeric',
    latencyTier: '<1d',
    substrate: 'B',
    domain: 'predictive',
    games: [...ALL_GAMES],
    platform: true,
    propensityModel: {
      family: 'reactivation',
      target: '14d_return',
      trainingWindowDays: 180,
      aucBand: '0.72-0.76',
      modelVersion: 'v1.7',
      refreshCadence: 'weekly',
    },
    owner: 'gds-ml-platform',
    status: 'active',
    addedAt: '2026-03-05',
    sparklineKey: 'spk-reactivation-propensity',
    usedBySegments: 6,
    usedByCampaigns: 9,
    definition: {
      exprLang: [
        '# Substrate B — win-back probability; refreshed weekly',
        '@features.reactivation_propensity',
      ].join('\n'),
      dbtSql: [
        '-- Substrate B — for users in lapsed/churned lifecycle stage,',
        '-- predict P(return within 14 days). Trained on 180d rolling window.',
        'SELECT',
        '  uid,',
        '  score AS reactivation_propensity',
        'FROM {{ source("ml", "reactivation_predictions") }}',
        "WHERE ds = DATE_TRUNC('week', CURRENT_DATE)",
      ].join('\n'),
    },
  },
];
