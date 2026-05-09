/**
 * Tuple/array synthesizer — membership counts for array-typed features.
 * Models features like weapon_owned_lifetime, housing_items_owned, char_skins_owned.
 * Each element gets a Bernoulli ownership probability; output is a histogram of
 * "how many distinct items does a player own" (array length distribution).
 */

import { makeRng } from './seeded-rng.js';
import type { SynthHistogramBin } from './counter.js';

export type TupleItem = { id: string; ownershipRate: number };

export type TupleDistribution = {
  synthesised: true;
  source: string;
  computedAt: string;
  nTotal: number;
  histogram: SynthHistogramBin[];
  itemMembership: { itemId: string; ownerCount: number; ownerPct: number }[];
  p50: number;
  p90: number;
  p99: number;
  sparkline7d: number[];
};

const SOURCE_TAG = 'P-4 synth · awaiting VPN/auth for cfm_vn pull';
const N_TOTAL = 2_000_000;
const BINS = 28;

export function synthTuple(
  featureName: string,
  items: TupleItem[],
): TupleDistribution {
  const rng = makeRng(featureName);

  // Per-item owner counts with jitter
  const itemMembership = items.map((item) => {
    const jitter = (rng() - 0.5) * 0.05;
    const rate = Math.min(Math.max(item.ownershipRate + jitter, 0.01), 0.99);
    const ownerCount = Math.round(rate * N_TOTAL);
    return { itemId: item.id, ownerCount, ownerPct: Math.round(rate * 1000) / 1000 };
  });

  // Simulate array-length distribution: each player owns items independently.
  // Use expected value approach for efficiency (no per-player simulation).
  // Expected length per player = sum of rates. Variance = sum of rate*(1-rate).
  // Model as Normal with those params, clamped to [0, items.length].
  const mu = items.reduce((s, it) => s + it.ownershipRate, 0);
  const variance = items.reduce((s, it) => s + it.ownershipRate * (1 - it.ownershipRate), 0);
  const sigma = Math.sqrt(Math.max(variance, 0.01));

  const SAMPLE = 10_000;
  const lengths: number[] = [];
  for (let i = 0; i < SAMPLE; i++) {
    const u1 = Math.max(rng(), 1e-10);
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const len = Math.round(mu + sigma * z);
    lengths.push(Math.min(Math.max(len, 0), items.length));
  }
  lengths.sort((a, b) => a - b);

  const p50 = lengths[Math.floor(SAMPLE * 0.50)]!;
  const p90 = lengths[Math.floor(SAMPLE * 0.90)]!;
  const p99 = lengths[Math.floor(SAMPLE * 0.99)]!;

  const maxLen = items.length;
  const binWidth = Math.max(1, Math.ceil(maxLen / BINS));
  const histogram: SynthHistogramBin[] = Array.from({ length: BINS }, (_, b) => {
    const lo = b * binWidth;
    const hi = lo + binWidth;
    const cnt = lengths.filter((l) => l >= lo && (b === BINS - 1 ? l <= hi : l < hi)).length;
    return { binStart: lo, binEnd: hi, count: Math.round((cnt / SAMPLE) * N_TOTAL) };
  });

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
    itemMembership,
    p50,
    p90,
    p99,
    sparkline7d,
  };
}
