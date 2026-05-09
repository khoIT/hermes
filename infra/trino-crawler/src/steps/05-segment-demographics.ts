/**
 * Step 05 — Segment demographics (synth-only path).
 *
 * Generates lifecycle / region / spend-tier breakdowns for all 15 segments in
 * the Hermes segment catalog (apps/web/src/data/catalog/segments.ts).
 *
 * Where the catalog already specifies breakdowns (lifecycleBreakdown,
 * spendTierBreakdown), those values are used as the canonical source and
 * jittered slightly for the "region" dimension. Unknown dimensions are fully
 * synthesised via seeded rng.
 *
 * Output: apps/web/src/data/crawled/segment-demographics.json
 */

import { makeRng } from '../synthesizers/seeded-rng.js';
import { writeCrawledJson } from '../outputs.js';

const SOURCE_TAG = 'P-4 synth · awaiting VPN/auth for cfm_vn pull';

type LifecycleBreakdown = { nru: number; mid: number; veteran: number; lapsed?: number };
type SpendBreakdown = { free: number; low: number; mid: number; high: number; whale: number };
type RegionBreakdown = { VN: number; TH: number; ID: number; PH: number; Other: number };

type SegmentSpec = {
  displayName: string;
  game: string;
  audienceSize: number;
  lifecycle?: LifecycleBreakdown;
  spendTier?: SpendBreakdown;
};

// All 15 segments from catalog/segments.ts — inline the known breakdowns.
const SEGMENT_SPECS: Record<string, SegmentSpec> = {
  'seg-cfm-ss1-weapon-owners-2026': {
    displayName: 'CFM · SS1 Weapon Owners 2026',
    game: 'CFM',
    audienceSize: 84200,
    lifecycle: { nru: 0.04, mid: 0.31, veteran: 0.65 },
    spendTier: { free: 0.22, low: 0.31, mid: 0.20, high: 0.17, whale: 0.10 },
  },
  'seg-cfm-rfm-tier-1-2026': {
    displayName: 'CFM · Year-End Tier 1 · NRU',
    game: 'CFM',
    audienceSize: 480000,
    lifecycle: { nru: 0.95, mid: 0.05, veteran: 0.00 },
    spendTier: { free: 1.00, low: 0.00, mid: 0.00, high: 0.00, whale: 0.00 },
  },
  'seg-cfm-rfm-tier-2-2026': {
    displayName: 'CFM · Year-End Tier 2 · Mid Spender',
    game: 'CFM',
    audienceSize: 1200000,
    lifecycle: { nru: 0.05, mid: 0.70, veteran: 0.25 },
    spendTier: { free: 0.00, low: 0.60, mid: 0.40, high: 0.00, whale: 0.00 },
  },
  'seg-cfm-rfm-tier-3-2026': {
    displayName: 'CFM · Year-End Tier 3 · High Spender',
    game: 'CFM',
    audienceSize: 145000,
    lifecycle: { nru: 0.00, mid: 0.25, veteran: 0.75 },
    spendTier: { free: 0.00, low: 0.00, mid: 0.00, high: 1.00, whale: 0.00 },
  },
  'seg-cfm-rfm-tier-4-2026': {
    displayName: 'CFM · Year-End Tier 4 · Whale',
    game: 'CFM',
    audienceSize: 22000,
    lifecycle: { nru: 0.00, mid: 0.10, veteran: 0.70, lapsed: 0.20 },
    spendTier: { free: 0.00, low: 0.00, mid: 0.00, high: 0.10, whale: 0.90 },
  },
  'seg-tf-returning-coaches-2026': {
    displayName: 'TF · Returning Coaches 2026',
    game: 'TF',
    audienceSize: 38000,
    lifecycle: { nru: 0.00, mid: 0.15, veteran: 0.25, lapsed: 0.60 },
    spendTier: { free: 0.45, low: 0.30, mid: 0.15, high: 0.07, whale: 0.03 },
  },
  'seg-cfm-low-coin-vip-2026': {
    displayName: 'CFM · Low CF Coin · VIP',
    game: 'CFM',
    audienceSize: 7400,
    lifecycle: { nru: 0.05, mid: 0.45, veteran: 0.50 },
    spendTier: { free: 0.00, low: 0.10, mid: 0.40, high: 0.35, whale: 0.15 },
  },
  'seg-cfm-loss-streak-non-paying-2026-0508-a3f9': {
    displayName: 'CFM · Loss Streak · Non-Paying · Ranked',
    game: 'CFM',
    audienceSize: 23890,
    lifecycle: { nru: 0.08, mid: 0.52, veteran: 0.40 },
    spendTier: { free: 1.00, low: 0.00, mid: 0.00, high: 0.00, whale: 0.00 },
  },
  'seg-cfm-veteran-pvp-2026': {
    displayName: 'CFM · Veteran PvP Core',
    game: 'CFM',
    audienceSize: 92400,
    lifecycle: { nru: 0.00, mid: 0.10, veteran: 0.90 },
    spendTier: { free: 0.20, low: 0.35, mid: 0.28, high: 0.12, whale: 0.05 },
  },
  'seg-cfm-whale-at-risk-2026': {
    displayName: 'CFM · Whale At Risk',
    game: 'CFM',
    audienceSize: 4120,
    lifecycle: { nru: 0.00, mid: 0.05, veteran: 0.65, lapsed: 0.30 },
    spendTier: { free: 0.00, low: 0.00, mid: 0.00, high: 0.00, whale: 1.00 },
  },
  'seg-cfm-new-player-d2-2026': {
    displayName: 'CFM · New Player D2 Nudge',
    game: 'CFM',
    audienceSize: 8900,
    lifecycle: { nru: 1.00, mid: 0.00, veteran: 0.00 },
    spendTier: { free: 0.95, low: 0.05, mid: 0.00, high: 0.00, whale: 0.00 },
  },
  'seg-cfm-shop-window-shopper-2026': {
    displayName: 'CFM · Shop Window Shopper',
    game: 'CFM',
    audienceSize: 186000,
    lifecycle: { nru: 0.12, mid: 0.60, veteran: 0.28 },
    spendTier: { free: 1.00, low: 0.00, mid: 0.00, high: 0.00, whale: 0.00 },
  },
  'seg-cfm-lapsed-mid-spender-2026': {
    displayName: 'CFM · Lapsed Mid Spender',
    game: 'CFM',
    audienceSize: 54300,
    lifecycle: { nru: 0.00, mid: 0.30, veteran: 0.30, lapsed: 0.40 },
    spendTier: { free: 0.00, low: 0.55, mid: 0.45, high: 0.00, whale: 0.00 },
  },
  'seg-nth-whale-at-risk-2026': {
    displayName: 'NTH · Whale At Risk · Login Drift',
    game: 'NTH',
    audienceSize: 3870,
    lifecycle: { nru: 0.00, mid: 0.08, veteran: 0.60, lapsed: 0.32 },
    spendTier: { free: 0.00, low: 0.00, mid: 0.00, high: 0.05, whale: 0.95 },
  },
  'seg-cfm-pass-stuck-vip-2026': {
    displayName: 'CFM · Pass Stuck · VIP Tier',
    game: 'CFM',
    audienceSize: 11200,
    lifecycle: { nru: 0.02, mid: 0.45, veteran: 0.53 },
    spendTier: { free: 0.00, low: 0.05, mid: 0.35, high: 0.45, whale: 0.15 },
  },
};

/** Synthesise a region breakdown biased toward game's primary market. */
function synthRegion(_segId: string, game: string, rng: () => number): RegionBreakdown {
  // Base weights per game
  const base: RegionBreakdown =
    game === 'NTH'
      ? { VN: 0.70, TH: 0.10, ID: 0.08, PH: 0.06, Other: 0.06 }
      : game === 'TF'
      ? { VN: 0.50, TH: 0.20, ID: 0.15, PH: 0.10, Other: 0.05 }
      : { VN: 0.55, TH: 0.18, ID: 0.12, PH: 0.09, Other: 0.06 };

  // Jitter each weight by ±3%
  const keys = Object.keys(base) as (keyof RegionBreakdown)[];
  const jittered: RegionBreakdown = { VN: 0, TH: 0, ID: 0, PH: 0, Other: 0 };
  keys.forEach((k) => {
    jittered[k] = Math.max(base[k] + (rng() - 0.5) * 0.06, 0.01);
  });
  // Normalise
  const total = keys.reduce((s, k) => s + jittered[k], 0);
  keys.forEach((k) => { jittered[k] = Math.round((jittered[k] / total) * 1000) / 1000; });
  // Fix rounding on last key
  const sum = keys.slice(0, -1).reduce((s, k) => s + jittered[k], 0);
  jittered.Other = Math.round((1 - sum) * 1000) / 1000;
  return jittered;
}

export async function runSegmentDemographics(): Promise<void> {
  console.log('[step-05] Generating segment demographics (synth-only mode)...');

  const output: Record<string, unknown> = {};

  for (const [segId, spec] of Object.entries(SEGMENT_SPECS)) {
    const rng = makeRng(`seg-demo-${segId}`);
    const region = synthRegion(segId, spec.game, rng);

    output[segId] = {
      synthesised: true,
      source: SOURCE_TAG,
      computedAt: new Date().toISOString(),
      segmentId: segId,
      displayName: spec.displayName,
      game: spec.game,
      audienceSize: spec.audienceSize,
      breakdowns: {
        lifecycle: spec.lifecycle ?? null,
        region,
        spendTier: spec.spendTier ?? null,
      },
    };
  }

  writeCrawledJson('segment-demographics.json', output);
  console.log(`[step-05] Done — ${Object.keys(output).length} segments synthesised.`);
}
