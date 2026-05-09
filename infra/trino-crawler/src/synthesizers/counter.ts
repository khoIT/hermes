/**
 * Counter synthesizer — power-law distribution.
 * Models features like lifetime_login_count, consecutive_ranked_losses_streak.
 * Shape: heavy right tail, p99 >> p50, 28-bin histogram.
 */

import { makeRng } from './seeded-rng.js';

export type SynthHistogramBin = { binStart: number; binEnd: number; count: number };

export type CounterDistribution = {
  synthesised: true;
  source: string;
  computedAt: string;
  nTotal: number;
  histogram: SynthHistogramBin[];
  p50: number;
  p90: number;
  p99: number;
  sparkline7d: number[];
};

const SOURCE_TAG = 'P-4 synth · awaiting VPN/auth for cfm_vn pull';
const N_TOTAL = 2_000_000;
const BINS = 28;

/**
 * Generate a power-law sample via inverse CDF: x = x_min * (1 - u)^(-1/(alpha-1))
 * Clamped to [min, max].
 */
function powerLawSample(rng: () => number, min: number, max: number, alpha: number): number {
  const u = Math.max(rng(), 1e-9);
  const raw = min * Math.pow(u, -1 / (alpha - 1));
  return Math.min(Math.max(Math.round(raw), min), max);
}

export function synthCounter(
  featureName: string,
  opts: { min?: number; max?: number; alpha?: number } = {},
): CounterDistribution {
  const { min = 1, max = 5000, alpha = 2.2 } = opts;
  const rng = makeRng(featureName);

  // Sample ~10k points for percentile / histogram estimation
  const SAMPLE = 10_000;
  const values: number[] = [];
  for (let i = 0; i < SAMPLE; i++) {
    values.push(powerLawSample(rng, min, max, alpha));
  }
  values.sort((a, b) => a - b);

  const p50 = values[Math.floor(SAMPLE * 0.50)]!;
  const p90 = values[Math.floor(SAMPLE * 0.90)]!;
  const p99 = values[Math.floor(SAMPLE * 0.99)]!;

  // Build 28-bin histogram over [min, max] with log-spaced edges for power-law tail
  const logMin = Math.log(Math.max(min, 1));
  const logMax = Math.log(max);
  const step = (logMax - logMin) / BINS;

  const edges: number[] = Array.from({ length: BINS + 1 }, (_, k) =>
    Math.round(Math.exp(logMin + k * step)),
  );

  const histogram: SynthHistogramBin[] = [];
  for (let b = 0; b < BINS; b++) {
    const lo = edges[b]!;
    const hi = edges[b + 1]!;
    const cnt = values.filter((v) => v >= lo && (b === BINS - 1 ? v <= hi : v < hi)).length;
    histogram.push({ binStart: lo, binEnd: hi, count: Math.round((cnt / SAMPLE) * N_TOTAL) });
  }

  // 7-day sparkline: daily volume with ±5% noise around N_TOTAL/30
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
    p50,
    p90,
    p99,
    sparkline7d,
  };
}
