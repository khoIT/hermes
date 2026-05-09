/**
 * Enum synthesizer — categorical distribution with realistic proportions.
 * Models features like player_lifecycle_stage, region_code, spend_tier_lifetime, rank_tier_current.
 * Output: one bin per category, proportions sum to 1, rendered as 28-bin histogram
 * (bins beyond category count are zero-padded).
 */

import { makeRng } from './seeded-rng.js';
import type { SynthHistogramBin } from './counter.js';

export type EnumCategory = { label: string; weight: number };

export type EnumDistribution = {
  synthesised: true;
  source: string;
  computedAt: string;
  nTotal: number;
  histogram: SynthHistogramBin[];
  categories: { label: string; count: number; pct: number }[];
  p50: string;
  p90: string;
  p99: string;
  sparkline7d: number[];
};

const SOURCE_TAG = 'P-4 synth · awaiting VPN/auth for cfm_vn pull';
const N_TOTAL = 2_000_000;
const BINS = 28;

export function synthEnum(
  featureName: string,
  categories: EnumCategory[],
): EnumDistribution {
  const rng = makeRng(featureName);

  // Normalize weights
  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);
  const normalized = categories.map((c) => ({ ...c, weight: c.weight / totalWeight }));

  // Add small jitter per category so repeated calls with same weights aren't identical
  const jittered = normalized.map((c) => ({
    ...c,
    weight: Math.max(c.weight + (rng() - 0.5) * 0.02, 0.001),
  }));
  const jitterTotal = jittered.reduce((s, c) => s + c.weight, 0);
  const final = jittered.map((c) => ({ ...c, weight: c.weight / jitterTotal }));

  // Assign counts (last gets remainder to ensure sum = N_TOTAL)
  let remaining = N_TOTAL;
  const cats = final.map((c, i) => {
    const count = i === final.length - 1 ? remaining : Math.round(c.weight * N_TOTAL);
    remaining -= count;
    return { label: c.label, count, pct: 0 };
  });
  cats.forEach((c) => { c.pct = Math.round((c.count / N_TOTAL) * 1000) / 1000; });

  // Build 28-bin histogram (one bin per category, rest zero-padded)
  const histogram: SynthHistogramBin[] = Array.from({ length: BINS }, (_, b) => {
    if (b < cats.length) {
      return { binStart: b, binEnd: b + 1, count: cats[b]!.count };
    }
    return { binStart: b, binEnd: b + 1, count: 0 };
  });

  // Cumulative for p50/p90/p99 (label of the bin at that percentile)
  const sortedByCount = [...cats].sort((a, b) => b.count - a.count);
  let cum = 0;
  let p50 = cats[0]!.label;
  let p90 = cats[0]!.label;
  let p99 = cats[0]!.label;
  for (const c of sortedByCount) {
    cum += c.count;
    if (cum / N_TOTAL >= 0.50 && p50 === cats[0]!.label) p50 = c.label;
    if (cum / N_TOTAL >= 0.90 && p90 === cats[0]!.label) p90 = c.label;
    if (cum / N_TOTAL >= 0.99 && p99 === cats[0]!.label) p99 = c.label;
  }

  const dailyBase = Math.round(N_TOTAL / 30);
  const sparkline7d: number[] = Array.from({ length: 7 }, () =>
    Math.round(dailyBase * (0.95 + rng() * 0.10)),
  );

  return {
    synthesised: true,
    source: SOURCE_TAG,
    computedAt: new Date().toISOString(),
    nTotal: N_TOTAL,
    histogram,
    categories: cats,
    p50,
    p90,
    p99,
    sparkline7d,
  };
}
