/**
 * Feature domain: Campaign Engagement & Anti-Fatigue — 4 features
 * Source: Hermes_Demo_Data.md Part 1 §Campaign engagement & anti-fatigue
 * Substrate B · refresh hourly (<1h)
 * Used in anti-fatigue clauses (CFM-13, CFM-18) and attribution tracking.
 */
import type { HermesFeatureSource } from '@hermes/contracts';

export const campaignEngagementFeatures: HermesFeatureSource[] = [
  {
    name: 'last_iam_received_ts',
    displayName: 'Last IAM Received (Timestamp)',
    type: 'timestamp',
    latencyTier: '<1h',
    substrate: 'B',
    domain: 'campaign-engagement',
    games: ['cfm', 'pt', 'nth', 'tf', 'cos', 'ptg'],
    owner: 'gds-platform',
    status: 'active',
    addedAt: '2025-01-10',
    sparklineKey: 'spk-last-iam-received-ts',
    usedBySegments: 2,
    usedByCampaigns: 5,
  },
  {
    name: 'iam_received_count_24h',
    displayName: 'IAM Received Count (24h)',
    type: 'int',
    latencyTier: '<1h',
    substrate: 'B',
    domain: 'campaign-engagement',
    games: ['cfm', 'pt', 'nth', 'tf', 'cos', 'ptg'],
    owner: 'gds-platform',
    status: 'active',
    addedAt: '2025-01-10',
    sparklineKey: 'spk-iam-received-count-24h',
    usedBySegments: 1,
    usedByCampaigns: 6,
  },
  {
    name: 'iam_received_count_7d',
    displayName: 'IAM Received Count (7d)',
    type: 'int',
    latencyTier: '<1h',
    substrate: 'B',
    domain: 'campaign-engagement',
    games: ['cfm', 'pt', 'nth', 'tf', 'cos', 'ptg'],
    owner: 'gds-platform',
    status: 'active',
    addedAt: '2025-01-10',
    sparklineKey: 'spk-iam-received-count-7d',
    usedBySegments: 1,
    usedByCampaigns: 3,
  },
  {
    name: 'last_campaign_id_received',
    displayName: 'Last Campaign ID Received',
    type: 'string',
    latencyTier: '<1h',
    substrate: 'B',
    domain: 'campaign-engagement',
    games: ['cfm', 'pt', 'nth', 'tf', 'cos', 'ptg'],
    owner: 'gds-platform',
    status: 'active',
    addedAt: '2025-01-10',
    sparklineKey: 'spk-last-campaign-id-received',
    usedBySegments: 0,
    usedByCampaigns: 2,
  },
];
