/**
 * Feature domain: Test & System — 2 features
 * Source: Hermes_Demo_Data.md Part 1 §Test & system
 * Substrate B · latency <1d
 * Note: is_test_account is always excluded from production segments by convention.
 */
import type { HermesFeature } from '@hermes/contracts';

export const testSystemFeatures: HermesFeature[] = [
  {
    name: 'is_test_account',
    displayName: 'Is Test Account',
    type: 'bool',
    latencyTier: '<1d',
    substrate: 'B',
    domain: 'test-system',
    owner: 'gds-platform',
    status: 'active',
    addedAt: '2025-01-10',
    sparklineKey: 'spk-is-test-account',
    usedBySegments: 13,
    usedByCampaigns: 7,
  },
  {
    name: 'is_internal_user',
    displayName: 'Is Internal User',
    type: 'bool',
    latencyTier: '<1d',
    substrate: 'B',
    domain: 'test-system',
    owner: 'gds-platform',
    status: 'active',
    addedAt: '2025-01-10',
    sparklineKey: 'spk-is-internal-user',
    usedBySegments: 8,
    usedByCampaigns: 5,
  },
];
