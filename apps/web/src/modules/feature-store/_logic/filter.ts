/**
 * Feature Store filter predicate factory (Phase 5 v2).
 * AND semantics between categories; OR within each multi-select category.
 *
 * v2 changes:
 *   - Removed `owners` filter (replaced by games attribution)
 *   - Added `games` multi-select + `platformOnly` toggle
 */
import type { HermesFeature, HermesGame, HermesLatencyTier } from '@hermes/contracts';

export interface FilterState {
  /** Selected feature types — empty means "all" */
  types: string[];
  /** Selected latency tiers — empty means "all" */
  latencyTiers: HermesLatencyTier[];
  /** Selected statuses — empty means "all" */
  statuses: string[];
  /** Selected games — empty means "all" */
  games: HermesGame[];
  /** Restrict to platform features only */
  platformOnly: boolean;
  /** Restrict to features with drift score >= 0.4 (Drift detected entry-point) */
  driftedOnly: boolean;
  /** Restrict by analytics provenance — empty = all */
  sources: ('real' | 'hybrid' | 'synth')[];
  /** Text search query */
  query: string;
}

export const EMPTY_FILTER: FilterState = {
  types: [],
  latencyTiers: [],
  statuses: [],
  games: [],
  platformOnly: false,
  driftedOnly: false,
  sources: [],
  query: '',
};

/** Returns true if no filters are active */
export function isFilterEmpty(state: FilterState): boolean {
  return (
    state.types.length === 0 &&
    state.latencyTiers.length === 0 &&
    state.statuses.length === 0 &&
    state.games.length === 0 &&
    !state.platformOnly &&
    !state.driftedOnly &&
    state.sources.length === 0 &&
    state.query.trim() === ''
  );
}

export function buildFilterPredicate(
  state: FilterState,
): (feature: HermesFeature) => boolean {
  const query = state.query.trim().toLowerCase();

  return (feature: HermesFeature): boolean => {
    if (state.types.length > 0 && !state.types.includes(feature.type)) return false;

    if (state.latencyTiers.length > 0) {
      const featureTiers = feature.dualTier
        ? [feature.latencyTier, '<1h' as HermesLatencyTier]
        : [feature.latencyTier];
      if (!featureTiers.some((t) => state.latencyTiers.includes(t))) return false;
    }

    if (state.statuses.length > 0 && !state.statuses.includes(feature.status)) return false;

    if (state.platformOnly && !feature.platform) return false;

    if (state.games.length > 0) {
      if (!state.games.some((g) => feature.games.includes(g))) return false;
    }

    if (state.driftedOnly && feature.analytics.driftScore < 0.4) return false;

    if (state.sources.length > 0) {
      const src = (feature.analytics as unknown as { source?: 'real' | 'hybrid' | 'synth' }).source ?? 'synth';
      if (!state.sources.includes(src)) return false;
    }

    if (query) {
      const nameMatch = feature.name.toLowerCase().includes(query);
      const displayMatch = feature.displayName.toLowerCase().includes(query);
      const domainMatch = feature.domain.toLowerCase().includes(query);
      if (!nameMatch && !displayMatch && !domainMatch) return false;
    }

    return true;
  };
}

export function applyFilter(features: HermesFeature[], state: FilterState): HermesFeature[] {
  if (isFilterEmpty(state)) return features;
  const predicate = buildFilterPredicate(state);
  return features.filter(predicate);
}
