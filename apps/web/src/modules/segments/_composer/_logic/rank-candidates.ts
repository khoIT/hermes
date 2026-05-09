/**
 * Phase 6 v2: rank candidate features for picker / inline-swap by overlap
 * with the segment's existing feature attribution.
 *
 * Sort key (desc):
 *   1. Game-overlap count vs the authoring context's games
 *   2. Domain match (same domain as the feature being swapped)
 *   3. Usage count over 180 days
 */
import type { HermesFeature, HermesFeatureDomain, HermesGame } from '@hermes/contracts';

export interface RankContext {
  /** Games the authoring segment is targeting (union over its predicate features). */
  games: HermesGame[];
  /** Optional: domain of the feature being swapped. */
  domain?: HermesFeatureDomain;
}

export function rankByGameOverlap(
  candidates: readonly HermesFeature[],
  context: RankContext,
): HermesFeature[] {
  return [...candidates].sort((a, b) => {
    const aOverlap = a.games.filter((g) => context.games.includes(g)).length;
    const bOverlap = b.games.filter((g) => context.games.includes(g)).length;
    if (aOverlap !== bOverlap) return bOverlap - aOverlap;

    if (context.domain) {
      const aMatch = a.domain === context.domain ? 1 : 0;
      const bMatch = b.domain === context.domain ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
    }

    return (b.analytics.usageCount180d ?? 0) - (a.analytics.usageCount180d ?? 0);
  });
}
