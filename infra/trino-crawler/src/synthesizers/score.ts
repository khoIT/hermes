/**
 * Score synthesizer — normal / log-normal distribution.
 * Models features like social_engagement_score, pvp_engagement_score.
 * Centered around 50-70 range, 28-bin histogram.
 */

import { makeRng, normalVariate } from './seeded-rng.js';
import type { SynthHistogramBin } from './counter.js';

export type ScoreDistribution = {
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

export function synthScore(
  featureName: string,
  opts: { mu?: number; sigma?: number; min?: number; max?: number; logNormal?: boolean } = {},
): ScoreDistribution {
  const { mu = 58, sigma = 18, min = 0, max = 100, logNormal = false } = opts;
  const rng = makeRng(featureName);

  const SAMPLE = 10_000;
  const values: number[] = [];

  for (let i = 0; i < SAMPLE; i++) {
    let v: number;
    if (logNormal) {
      // log-normal: exponentiate normal then rescale to [min,max]
      const z = normalVariate(rng, 0, 1);
      v = Math.exp(z * (sigma / 30) + Math.log(mu));
    } else {
      v = normalVariate(rng, mu, sigma);
    }
    values.push(Math.min(Math.max(Math.round(v * 10) / 10, min), max));
  }
  values.sort((a, b) => a - b);

  const p50 = values[Math.floor(SAMPLE * 0.50)]!;
  const p90 = values[Math.floor(SAMPLE * 0.90)]!;
  const p99 = values[Math.floor(SAMPLE * 0.99)]!;

  const step = (max - min) / BINS;
  const histogram: SynthHistogramBin[] = Array.from({ length: BINS }, (_, b) => {
    const lo = min + b * step;
    const hi = lo + step;
    const cnt = values.filter((v) => v >= lo && (b === BINS - 1 ? v <= hi : v < hi)).length;
    return {
      binStart: Math.round(lo * 10) / 10,
      binEnd: Math.round(hi * 10) / 10,
      count: Math.round((cnt / SAMPLE) * N_TOTAL),
    };
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
    p50,
    p90,
    p99,
    sparkline7d,
  };
}
