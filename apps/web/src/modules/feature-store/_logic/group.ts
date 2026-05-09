/**
 * Feature Store groupBy logic — pure functions for grouping features.
 * Supports 5 strategies: domain | tier | owner | usedInProd | none
 */
import type { HermesFeature } from '@hermes/contracts';

export type GroupByStrategy = 'domain' | 'tier' | 'owner' | 'usedInProd' | 'none';

export interface FeatureGroup {
  groupName: string;
  features: HermesFeature[];
}

/** Domain display labels — human readable from snake-case domain key */
const DOMAIN_LABEL: Record<string, string> = {
  'identity-lifecycle': 'Identity & Lifecycle',
  'monetization': 'Monetization',
  'currency': 'Currency',
  'engagement': 'Engagement',
  'gameplay-cfm': 'Gameplay · CFM',
  'stateful-streaks': 'Stateful Streaks',
  'inventory': 'Inventory',
  'promotion-config': 'Promotion Config',
  'social-playstyle': 'Social & Playstyle',
  'test-system': 'Test System',
  'campaign-engagement': 'Campaign Engagement',
};

/** Tier display labels */
const TIER_LABEL: Record<string, string> = {
  '<1s': 'Hot · <1s (Substrate A)',
  '<1h': 'Warm · <1h (Substrate B)',
  '<1d': 'Cold · <1d (Substrate B)',
};

/** Tier sort order for consistent display */
const TIER_ORDER = ['<1s', '<1h', '<1d'];

function groupByKey(
  features: HermesFeature[],
  keyFn: (f: HermesFeature) => string[],
  labelFn: (key: string) => string,
  sortOrder?: string[],
): FeatureGroup[] {
  const map = new Map<string, HermesFeature[]>();

  for (const feature of features) {
    const keys = keyFn(feature);
    for (const key of keys) {
      const existing = map.get(key) ?? [];
      existing.push(feature);
      map.set(key, existing);
    }
  }

  let entries = Array.from(map.entries());

  if (sortOrder) {
    entries.sort(([a], [b]) => {
      const ai = sortOrder.indexOf(a);
      const bi = sortOrder.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  } else {
    entries.sort(([a], [b]) => a.localeCompare(b));
  }

  return entries.map(([key, feats]) => ({
    groupName: labelFn(key),
    features: feats,
  }));
}

/** Group features by the given strategy */
export function groupFeatures(
  features: HermesFeature[],
  strategy: GroupByStrategy,
): FeatureGroup[] {
  switch (strategy) {
    case 'domain':
      return groupByKey(
        features,
        (f) => [f.domain],
        (k) => DOMAIN_LABEL[k] ?? k,
      );

    case 'tier':
      // Dual-tier features appear in both tier buckets
      return groupByKey(
        features,
        (f) => {
          if (f.dualTier) return ['<1s', '<1h'];
          return [f.latencyTier];
        },
        (k) => TIER_LABEL[k] ?? k,
        TIER_ORDER,
      );

    case 'owner':
      return groupByKey(
        features,
        (f) => [f.owner],
        (k) => k,
      );

    case 'usedInProd':
      return groupByKey(
        features,
        (f) => {
          const count = (f.usedBySegments ?? 0) + (f.usedByCampaigns ?? 0);
          return [count > 0 ? 'Used in production' : 'Not in production'];
        },
        (k) => k,
        ['Used in production', 'Not in production'],
      );

    case 'none':
      return [{ groupName: 'All Features', features }];

    default:
      return [{ groupName: 'All Features', features }];
  }
}
