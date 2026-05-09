/**
 * Feature domain: Currency Snapshots — 3 features
 * Source: Hermes_Demo_Data.md Part 1 §Currency snapshots
 * Substrate B · refresh hourly (<1h)
 */
import type { HermesFeature } from '@hermes/contracts';

export const currencyFeatures: HermesFeature[] = [
  {
    name: 'gem_balance_current',
    displayName: 'Gem Balance (Current)',
    type: 'int',
    latencyTier: '<1h',
    substrate: 'B',
    domain: 'currency',
    owner: 'gds-monetization',
    status: 'active',
    addedAt: '2025-01-10',
    sparklineKey: 'spk-gem-balance-current',
    usedBySegments: 3,
    usedByCampaigns: 2,
  },
  {
    name: 'cf_coin_balance_current',
    displayName: 'CF Coin Balance (Current)',
    type: 'int',
    latencyTier: '<1h',
    substrate: 'B',
    domain: 'currency',
    owner: 'gds-cfm',
    status: 'active',
    addedAt: '2025-01-10',
    sparklineKey: 'spk-cf-coin-balance-current',
    usedBySegments: 2,
    usedByCampaigns: 2,
  },
  {
    name: 'premium_currency_balance',
    displayName: 'Premium Currency Balance',
    type: 'int',
    latencyTier: '<1h',
    substrate: 'B',
    domain: 'currency',
    owner: 'gds-monetization',
    status: 'active',
    addedAt: '2025-01-10',
    sparklineKey: 'spk-premium-currency-balance',
    usedBySegments: 2,
    usedByCampaigns: 2,
  },
];
