/**
 * Feature Store sort strategies (Phase 5 v2).
 * Applied after filter, before group.
 *
 * Strategies:
 *   - default       — alphabetical by name
 *   - most-used     — by total campaign+segment count desc
 *   - most-drifted  — by analytics.driftScore desc
 *   - recently-added — by addedAt desc
 */
import type { HermesFeature } from '@hermes/contracts';
import type { FeatureUsage } from './usage-count';

export type SortStrategy = 'default' | 'most-used' | 'most-drifted' | 'recently-added';

export const SORT_LABEL: Record<SortStrategy, string> = {
  default: 'Default · A-Z',
  'most-used': 'Most used',
  'most-drifted': 'Most drifted',
  'recently-added': 'Recently added',
};

export function sortFeatures(
  features: HermesFeature[],
  sort: SortStrategy,
  usageMap: Map<string, FeatureUsage>,
): HermesFeature[] {
  const arr = [...features];
  switch (sort) {
    case 'most-used':
      arr.sort((a, b) => {
        const ua = usageMap.get(a.name);
        const ub = usageMap.get(b.name);
        const ca = (ua?.segmentCount ?? 0) + (ua?.campaignCount ?? 0);
        const cb = (ub?.segmentCount ?? 0) + (ub?.campaignCount ?? 0);
        return cb - ca || a.name.localeCompare(b.name);
      });
      break;
    case 'most-drifted':
      arr.sort(
        (a, b) => b.analytics.driftScore - a.analytics.driftScore || a.name.localeCompare(b.name),
      );
      break;
    case 'recently-added':
      arr.sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? '') || a.name.localeCompare(b.name));
      break;
    default:
      arr.sort((a, b) => a.name.localeCompare(b.name));
  }
  return arr;
}
