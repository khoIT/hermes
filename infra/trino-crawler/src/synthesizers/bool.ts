/**
 * Bool synthesizer — Bernoulli distribution.
 * Models features like is_paying_user_lifetime, is_new_user_d7, marketing_consent_flag.
 * Output: 28-bin histogram with spikes at 0 (false) and 27 (true), zeros in between.
 */

import { makeRng } from './seeded-rng.js';
import type { SynthHistogramBin } from './counter.js';

export type BoolDistribution = {
  synthesised: true;
  source: string;
  computedAt: string;
  nTotal: number;
  histogram: SynthHistogramBin[];
  p50: number;
  p90: number;
  p99: number;
  sparkline7d: number[];
  trueRate: number;
};

const SOURCE_TAG = 'P-4 synth · awaiting VPN/auth for cfm_vn pull';
const N_TOTAL = 2_000_000;
const BINS = 28;

export function synthBool(
  featureName: string,
  opts: { trueRate?: number } = {},
): BoolDistribution {
  const { trueRate = 0.35 } = opts;
  const rng = makeRng(featureName);

  // Add slight deterministic jitter so each feature is unique
  const jitter = (rng() - 0.5) * 0.04;
  const actualRate = Math.min(Math.max(trueRate + jitter, 0.01), 0.99);

  const falseCount = Math.round(N_TOTAL * (1 - actualRate));
  const trueCount = N_TOTAL - falseCount;

  // 28-bin histogram: bin 0 = false spike, bin 27 = true spike, rest near-zero
  const histogram: SynthHistogramBin[] = Array.from({ length: BINS }, (_, b) => {
    if (b === 0) return { binStart: 0, binEnd: 0, count: falseCount };
    if (b === BINS - 1) return { binStart: 1, binEnd: 1, count: trueCount };
    return { binStart: b / (BINS - 1), binEnd: (b + 1) / (BINS - 1), count: 0 };
  });

  // For bool: p50 = 0 if trueRate < 0.5, else 1
  const p50 = actualRate >= 0.5 ? 1 : 0;
  const p90 = actualRate >= 0.10 ? 1 : 0;
  const p99 = actualRate >= 0.01 ? 1 : 0;

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
    trueRate: Math.round(actualRate * 1000) / 1000,
  };
}
