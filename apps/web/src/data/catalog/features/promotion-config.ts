/**
 * Feature domain: Promotion / Config — 3 features
 * Source: Hermes_Demo_Data.md Part 1 §Promotion / config
 * Substrate B · refresh on config push (<1h)
 */
import type { HermesFeatureSource } from '@hermes/contracts';

export const promotionConfigFeatures: HermesFeatureSource[] = [
  {
    name: 'promoted_weapon_list',
    displayName: 'Promoted Weapon List',
    type: 'array<string>',
    latencyTier: '<1h',
    substrate: 'B',
    domain: 'promotion-config',
    games: ['cfm'],
    owner: 'gds-cfm',
    status: 'active',
    addedAt: '2025-02-01',
    sparklineKey: 'spk-promoted-weapon-list',
    usedBySegments: 1,
    usedByCampaigns: 2,
  },
  {
    name: 'promoted_item_active_count',
    displayName: 'Promoted Item Active Count',
    type: 'int',
    latencyTier: '<1h',
    substrate: 'B',
    domain: 'promotion-config',
    games: ['cfm', 'pt', 'nth', 'tf', 'cos', 'ptg'],
    owner: 'gds-cfm',
    status: 'active',
    addedAt: '2025-02-01',
    sparklineKey: 'spk-promoted-item-active-count',
    usedBySegments: 1,
    usedByCampaigns: 2,
  },
  {
    name: 'weapon_promotion_active_count',
    displayName: 'Weapon Promotion Active Count',
    type: 'int',
    latencyTier: '<1h',
    substrate: 'B',
    domain: 'promotion-config',
    games: ['cfm'],
    owner: 'gds-cfm',
    status: 'active',
    addedAt: '2025-02-01',
    sparklineKey: 'spk-weapon-promotion-active-count',
    usedBySegments: 1,
    usedByCampaigns: 1,
  },
];
