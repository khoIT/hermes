/**
 * Feature Store groupBy logic (Phase 5 v2).
 * Strategies: domain (default) · game · tier · status · platform · usedInProd · none
 *
 * v2 changes:
 *   - Removed `owner` strategy (replaced by game attribution)
 *   - Added `game` (multi-pin: a feature with games=[cfm,pt] appears in BOTH groups)
 *   - Added `platform` (Platform · cross-game vs Game-specific)
 *   - Added `status`
 *   - 'predictive' domain label added
 */
import type { HermesFeature, HermesGame } from '@hermes/contracts';
import { GAME_ORDER, GAME_TINT } from '../../../components/_logic/game-colors';

export type GroupByStrategy =
  | 'domain'
  | 'game'
  | 'tier'
  | 'status'
  | 'platform'
  | 'usedInProd'
  | 'none';

export interface FeatureGroup {
  groupName: string;
  features: HermesFeature[];
}

const DOMAIN_LABEL: Record<string, string> = {
  'identity-lifecycle': 'Identity & Lifecycle',
  monetization: 'Monetization',
  currency: 'Currency',
  engagement: 'Engagement',
  'gameplay-cfm': 'Gameplay · CFM',
  'stateful-streaks': 'Stateful Streaks',
  inventory: 'Inventory',
  'promotion-config': 'Promotion Config',
  'social-playstyle': 'Social & Playstyle',
  'test-system': 'Test System',
  'campaign-engagement': 'Campaign Engagement',
  predictive: 'Platform · Predictive',
};

const TIER_LABEL: Record<string, string> = {
  '<1s': 'Realtime',
  '<1h': 'Batch warm',
  '<1d': 'Batch cold',
};

const TIER_ORDER = ['<1s', '<1h', '<1d'];

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  beta: 'Beta',
  deprecated: 'Deprecated',
};
const STATUS_ORDER = ['active', 'beta', 'deprecated'];

function groupByKey(
  features: HermesFeature[],
  keyFn: (f: HermesFeature) => string[],
  labelFn: (key: string) => string,
  sortOrder?: string[],
): FeatureGroup[] {
  const map = new Map<string, HermesFeature[]>();
  for (const feature of features) {
    for (const key of keyFn(feature)) {
      const existing = map.get(key) ?? [];
      existing.push(feature);
      map.set(key, existing);
    }
  }

  const entries = Array.from(map.entries());
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
  return entries.map(([key, feats]) => ({ groupName: labelFn(key), features: feats }));
}

export function groupFeatures(
  features: HermesFeature[],
  strategy: GroupByStrategy,
): FeatureGroup[] {
  switch (strategy) {
    case 'domain':
      return groupByKey(features, (f) => [f.domain], (k) => DOMAIN_LABEL[k] ?? k);

    case 'game': {
      // Platform features land in their own pinned group; game-specific features
      // multi-pin into every game they touch (CFM-author looking for CFM features
      // wants to see them all even if cross-game).
      const platformGroup: HermesFeature[] = [];
      const byGame = new Map<HermesGame, HermesFeature[]>();
      for (const f of features) {
        if (f.platform) {
          platformGroup.push(f);
          continue;
        }
        for (const g of f.games) {
          const arr = byGame.get(g) ?? [];
          arr.push(f);
          byGame.set(g, arr);
        }
      }
      const out: FeatureGroup[] = [];
      if (platformGroup.length > 0) {
        out.push({ groupName: 'Platform · Cross-game', features: platformGroup });
      }
      for (const g of GAME_ORDER) {
        const arr = byGame.get(g);
        if (arr && arr.length > 0) {
          out.push({ groupName: GAME_TINT[g].fullName, features: arr });
        }
      }
      return out;
    }

    case 'tier':
      return groupByKey(
        features,
        (f) => (f.dualTier ? ['<1s', '<1h'] : [f.latencyTier]),
        (k) => TIER_LABEL[k] ?? k,
        TIER_ORDER,
      );

    case 'status':
      return groupByKey(features, (f) => [f.status], (k) => STATUS_LABEL[k] ?? k, STATUS_ORDER);

    case 'platform':
      return [
        {
          groupName: 'Platform · Cross-game',
          features: features.filter((f) => f.platform),
        },
        {
          groupName: 'Game-specific',
          features: features.filter((f) => !f.platform),
        },
      ].filter((g) => g.features.length > 0);

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
