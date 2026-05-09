/**
 * Feature Store filter predicate factory.
 * All active filters compose with AND semantics between categories.
 * Within a category (e.g. multiple type chips), OR semantics apply.
 */
import type { HermesFeature, HermesLatencyTier } from '@hermes/contracts';

export interface FilterState {
  /** Selected feature types — empty means "all" */
  types: string[];
  /** Selected latency tiers — empty means "all" */
  latencyTiers: HermesLatencyTier[];
  /** Selected statuses — empty means "all" */
  statuses: string[];
  /** Selected owners — empty means "all" */
  owners: string[];
  /** Text search query */
  query: string;
}

export const EMPTY_FILTER: FilterState = {
  types: [],
  latencyTiers: [],
  statuses: [],
  owners: [],
  query: '',
};

/** Returns true if no filters are active */
export function isFilterEmpty(state: FilterState): boolean {
  return (
    state.types.length === 0 &&
    state.latencyTiers.length === 0 &&
    state.statuses.length === 0 &&
    state.owners.length === 0 &&
    state.query.trim() === ''
  );
}

/**
 * Factory: returns a predicate function that tests a single HermesFeature
 * against the given FilterState. Filters compose with AND between categories.
 */
export function buildFilterPredicate(
  state: FilterState,
): (feature: HermesFeature) => boolean {
  const query = state.query.trim().toLowerCase();

  return (feature: HermesFeature): boolean => {
    // Type filter (OR within category)
    if (state.types.length > 0 && !state.types.includes(feature.type)) {
      return false;
    }

    // Latency tier filter — dual-tier features match if either tier matches
    if (state.latencyTiers.length > 0) {
      const featureTiers = feature.dualTier
        ? [feature.latencyTier, '<1h' as HermesLatencyTier]
        : [feature.latencyTier];
      const matches = featureTiers.some((t) => state.latencyTiers.includes(t));
      if (!matches) return false;
    }

    // Status filter (OR within category)
    if (state.statuses.length > 0 && !state.statuses.includes(feature.status)) {
      return false;
    }

    // Owner filter (OR within category)
    if (state.owners.length > 0 && !state.owners.includes(feature.owner)) {
      return false;
    }

    // Text search — matches name or displayName
    if (query) {
      const nameMatch = feature.name.toLowerCase().includes(query);
      const displayMatch = feature.displayName.toLowerCase().includes(query);
      const domainMatch = feature.domain.toLowerCase().includes(query);
      if (!nameMatch && !displayMatch && !domainMatch) return false;
    }

    return true;
  };
}

/** Apply filter to a features array */
export function applyFilter(
  features: HermesFeature[],
  state: FilterState,
): HermesFeature[] {
  if (isFilterEmpty(state)) return features;
  const predicate = buildFilterPredicate(state);
  return features.filter(predicate);
}
