/**
 * Audience lookup — given a Predicate AST, return an AudienceLookup.
 * Priority:
 *  1. Threshold-grid hit for the cfm-13 loss-streak anchor predicate
 *  2. Threshold-grid interpolation for any other single-feature numeric row
 *  3. Min-cardinality fallback estimate (marks `estimated: true`)
 *
 * Imports crawled JSON statically — Vite resolves JSON at build time.
 * Both files are confirmed present from P-4; imports are typed loosely so
 * the module still compiles if shapes change.
 */
import type { Predicate, Row, AudienceLookup } from './predicate-types';
import rawAudienceCounts from '../../../data/crawled/audience-counts.json';
import rawDistributions from '../../../data/crawled/distributions.json';

// ---------------------------------------------------------------------------
// Type narrowing over the imported JSON
// ---------------------------------------------------------------------------
interface ThresholdEntry { threshold?: number | string; count: number }

interface AudienceEntry {
  canonicalCount?: number;
  thresholdGrid?: ThresholdEntry[];
  breakdownAtCanonical?: {
    lifecycle?: Record<string, number>;
    spend_tier?: Record<string, number>;
  };
}

type AudienceCountsFile  = Record<string, AudienceEntry>;
type DistributionsBinRaw = { binStart?: number; binEnd?: number; count: number };
type DistributionsFile   = Record<string, { histogram?: DistributionsBinRaw[] }>;

const audienceCounts = rawAudienceCounts as unknown as AudienceCountsFile;
const distributions  = rawDistributions  as unknown as DistributionsFile;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOTAL_MAU    = 1_250_000;
const TOTAL_SUBPOP =   290_000; // CFM ranked active

/** Known single-feature audience baselines for min-cardinality fallback */
const FEATURE_BASELINE: Record<string, number> = {
  consecutive_ranked_losses_streak: 47_210,
  is_paying_user_lifetime:       1_200_000,
  account_age_days:              2_000_000,
  last_login_days_ago:           1_500_000,
  spend_tier_lifetime:             400_000,
  session_count_30d:             1_800_000,
  daily_login_streak_current:      300_000,
  mmr_drift_7d:                    250_000,
  purchase_count_30d:            1_000_000,
  cf_coin_balance_current:         150_000,
  vip_status:                      100_000,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBreakdown(entry?: AudienceEntry): AudienceLookup['breakdown'] {
  const bd = entry?.breakdownAtCanonical;
  if (!bd) return undefined;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    lifecycle: bd.lifecycle
      ? Object.entries(bd.lifecycle).map(([k, v]) => ({ label: cap(k), fraction: v }))
      : [],
    spendTier: bd.spend_tier
      ? Object.entries(bd.spend_tier).map(([k, v]) => ({ label: cap(k), fraction: v }))
      : [],
  };
}

/** Numeric threshold grid sorted ascending by threshold */
function numericGrid(entry: AudienceEntry) {
  return (entry.thresholdGrid ?? [])
    .filter(g => typeof g.threshold === 'number')
    .map(g => ({ t: g.threshold as number, c: g.count }))
    .sort((a, b) => a.t - b.t);
}

/** Interpolate count from sorted grid for a >= / > query value */
function interpolateGrid(grid: { t: number; c: number }[], v: number): number | null {
  if (!grid.length) return null;
  const exact = grid.find(g => g.t === v);
  if (exact) return exact.c;
  const lo = [...grid].reverse().find(g => g.t <= v);
  const hi = grid.find(g => g.t > v);
  if (lo && hi) {
    const frac = (v - lo.t) / (hi.t - lo.t);
    return Math.round(lo.c + frac * (hi.c - lo.c));
  }
  return lo?.c ?? hi?.c ?? null;
}

/** Try threshold-grid lookup for a single numeric row across all entries */
function lookupSingleRow(row: Row): { count: number; entry: AudienceEntry } | null {
  if (typeof row.value !== 'number') return null;
  const featureLower = row.feature.toLowerCase();
  for (const entry of Object.values(audienceCounts)) {
    if (!JSON.stringify(entry).toLowerCase().includes(featureLower)) continue;
    const grid = numericGrid(entry);
    if (!grid.length) continue;
    const op = row.operator;
    if (op === '>=' || op === '>') {
      const count = interpolateGrid(grid, row.value as number);
      if (count !== null) return { count, entry };
    } else if (entry.canonicalCount != null) {
      return { count: entry.canonicalCount, entry };
    }
  }
  return null;
}

/** Min-cardinality estimate for arbitrary multi-condition predicates */
function estimateCount(predicate: Predicate): number {
  if (!predicate.groups.length) return 0;
  let total = 0;
  for (const group of predicate.groups) {
    if (!group.rows.length) continue;
    // OR within group → max of individual row estimates
    let groupCount = 0;
    for (const row of group.rows) {
      const base = FEATURE_BASELINE[row.feature] ?? 500_000;
      let scale = 0.5;
      const v = row.value;
      if (typeof v === 'number') {
        if ((row.operator === '>=' || row.operator === '>') && v > 5)  scale = 0.2;
        if ((row.operator === '>=' || row.operator === '>') && v > 20) scale = 0.05;
        if ((row.operator === '<=' || row.operator === '<') && v < 10) scale = 0.03;
      }
      if (row.operator === 'is_true')  scale = 0.4;
      if (row.operator === 'is_false') scale = 0.6;
      groupCount = Math.max(groupCount, Math.round(base * scale));
    }
    // AND across groups → multiply by fraction of MAU
    total = total === 0 ? groupCount : Math.round(total * (groupCount / TOTAL_MAU));
  }
  const exDiscount = Math.max(0, 1 - predicate.exclusions.length * 0.05);
  return Math.max(100, Math.round(total * exDiscount));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Synchronous lookup — called on every canvas state change.
 * Returns audience count, % MAU, % subpop, breakdown, and estimated flag.
 */
export function lookupAudience(predicate: Predicate): AudienceLookup {
  if (!predicate.groups.length) {
    return { count: 0, percentMau: 0, percentSubpop: 0, subpopLabel: 'CFM ranked active', estimated: false };
  }

  // Fast path: single-group single-row → threshold grid
  if (predicate.groups.length === 1 && predicate.groups[0]!.rows.length === 1) {
    const row0 = predicate.groups[0]!.rows[0]!;
    const result = lookupSingleRow(row0);
    if (result) {
      const { count, entry } = result;
      return {
        count,
        percentMau:    +((count / TOTAL_MAU)    * 100).toFixed(1),
        percentSubpop: +((count / TOTAL_SUBPOP) * 100).toFixed(1),
        subpopLabel: 'CFM ranked active',
        estimated: false,
        breakdown: makeBreakdown(entry),
      };
    }
  }

  // Anchor: recognise consecutive_ranked_losses_streak across any predicate
  const cfm13 = audienceCounts['cfm-13-pass-stuck'];
  if (cfm13) {
    for (const group of predicate.groups) {
      for (const row of group.rows) {
        if (row.feature === 'consecutive_ranked_losses_streak' && typeof row.value === 'number') {
          const grid = numericGrid(cfm13);
          const count = interpolateGrid(grid, row.value as number) ?? cfm13.canonicalCount ?? 23_890;
          return {
            count,
            percentMau:    +((count / TOTAL_MAU)    * 100).toFixed(1),
            percentSubpop: +((count / TOTAL_SUBPOP) * 100).toFixed(1),
            subpopLabel: 'CFM ranked active',
            estimated: false,
            breakdown: makeBreakdown(cfm13),
          };
        }
      }
    }
  }

  // Fallback estimate
  const count = estimateCount(predicate);
  return {
    count,
    percentMau:    +((count / TOTAL_MAU)    * 100).toFixed(1),
    percentSubpop: +((count / TOTAL_SUBPOP) * 100).toFixed(1),
    subpopLabel: 'active players',
    estimated: true,
  };
}

/**
 * Raw histogram bin counts for a feature from distributions.json.
 * Returns null when not present — Histogram component uses its own synth fallback.
 */
export function getDistributionBins(featureName: string): number[] | null {
  if (!featureName) return null;
  const entry = distributions[featureName];
  if (!entry?.histogram?.length) return null;
  return entry.histogram.map(b => b.count);
}

/**
 * Sorted numeric threshold grid for the sensitivity hint text below the slider.
 * Falls back to synthesised cfm-13-shape entries when feature not found.
 */
export function getThresholdGrid(featureName: string): Array<{ threshold: number; count: number }> {
  const featureLower = featureName.toLowerCase();
  for (const entry of Object.values(audienceCounts)) {
    if (!JSON.stringify(entry).toLowerCase().includes(featureLower)) continue;
    const numeric = (entry.thresholdGrid ?? [])
      .filter(g => typeof g.threshold === 'number')
      .map(g => ({ threshold: g.threshold as number, count: g.count }))
      .sort((a, b) => a.threshold - b.threshold);
    if (numeric.length >= 2) return numeric;
  }
  return [
    { threshold: 3, count: 47_210 },
    { threshold: 4, count: 31_120 },
    { threshold: 5, count: 23_890 },
    { threshold: 6, count: 14_512 },
    { threshold: 7, count:  8_420 },
  ];
}
