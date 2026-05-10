/**
 * Build-time exporter: reads all TS feature catalog files in
 * apps/web/src/data/catalog/features/ and writes TWO JSON outputs:
 *
 *   1. apps/web/src/data/catalog/features/_catalog.json
 *      - Catalog rows ONLY (no `analytics`).
 *      - Loaded by catalog-api at boot; analytics merged from Postgres
 *        per-request.
 *
 *   2. apps/web/public/_catalog.json
 *      - Catalog rows WITH deterministic synthetic `analytics` injected
 *        per feature (seeded by feature name → reproducible across builds).
 *      - Vite ships this to dist/ as a static asset. The web loader uses
 *        it as a fallback when /api/v1/features returns the Netlify
 *        DEMO_MODE_API_DISABLED 502 envelope (frontend-only deploy with
 *        no catalog-api host).
 *
 * Decouples web ↔ catalog-api so the latter doesn't import across the
 * workspace boundary.
 *
 * Usage: tsx apps/web/scripts/export-feature-catalog.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));

import { campaignEngagementFeatures } from '../src/data/catalog/features/campaign-engagement.js';
import { currencyFeatures } from '../src/data/catalog/features/currency.js';
import { engagementFeatures } from '../src/data/catalog/features/engagement.js';
import { gameplayCfmFeatures } from '../src/data/catalog/features/gameplay-cfm.js';
import { identityLifecycleFeatures } from '../src/data/catalog/features/identity-lifecycle.js';
import { inventoryFeatures } from '../src/data/catalog/features/inventory.js';
import { monetizationFeatures } from '../src/data/catalog/features/monetization.js';
import { platformPropensityFeatures } from '../src/data/catalog/features/platform-propensity.js';
import { promotionConfigFeatures } from '../src/data/catalog/features/promotion-config.js';
import { socialPlaystyleFeatures } from '../src/data/catalog/features/social-playstyle.js';
import { statefulStreaksFeatures } from '../src/data/catalog/features/stateful-streaks.js';
import { testSystemFeatures } from '../src/data/catalog/features/test-system.js';

const all = [
  ...identityLifecycleFeatures,
  ...monetizationFeatures,
  ...currencyFeatures,
  ...engagementFeatures,
  ...gameplayCfmFeatures,
  ...statefulStreaksFeatures,
  ...inventoryFeatures,
  ...promotionConfigFeatures,
  ...socialPlaystyleFeatures,
  ...testSystemFeatures,
  ...campaignEngagementFeatures,
  ...platformPropensityFeatures,
];

// ── Output 1: bare catalog (no analytics) for catalog-api ─────────────────
const catalogPath = path.resolve(_dirname, '../src/data/catalog/features/_catalog.json');
fs.writeFileSync(catalogPath, JSON.stringify(all, null, 2), 'utf-8');
// eslint-disable-next-line no-console
console.log(`[export-feature-catalog] ${all.length} features → ${catalogPath}`);

// ── Output 2: catalog + synthetic analytics for static demo fallback ──────
//
// Build a fixed reference timestamp so each build produces the same JSON
// (deterministic per feature name, but pinned to one build moment for
// `lastBackfillAt` etc.). Uses SOURCE_DATE_EPOCH if set (reproducible-build
// convention), otherwise current time rounded to the day.
const buildEpoch = process.env.SOURCE_DATE_EPOCH
  ? Number(process.env.SOURCE_DATE_EPOCH) * 1000
  : Math.floor(Date.now() / 86_400_000) * 86_400_000;
const buildDate = new Date(buildEpoch);

interface SyntheticAnalytics {
  usageCount180d: number;
  driftScore: number;
  driftEventDates: string[];
  freshnessSlaMet: number;
  nullRate: number;
  distinctValuesP50: number;
  topConsumingCampaigns: never[];
  requestRateSparkline: number[];
  lastBackfillAt: string | null;
  p99LookupLatencyMs: number;
  coverageOfMau: number;
  medianLagMinutes: number;
  lastSlaMissAt: string | null;
}

function hashSeed(name: string): number {
  // FNV-1a 32-bit over the feature name → uint32 seed for mulberry32.
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function synthAnalytics(feature: { name: string; latencyTier?: string; type?: string }): SyntheticAnalytics {
  const rng = mulberry32(hashSeed(feature.name));
  const r = () => rng();
  const between = (lo: number, hi: number) => lo + r() * (hi - lo);

  const usageCount180d = Math.round(between(50_000, 2_000_000));
  // 15% of features show meaningful drift; rest stay calm.
  const isDrifty = r() < 0.15;
  const driftScore = isDrifty ? between(0.45, 0.85) : between(0, 0.3);
  const driftEventDates: string[] = [];
  if (isDrifty) {
    const events = Math.floor(between(1, 4));
    for (let i = 0; i < events; i++) {
      const daysAgo = Math.floor(between(2, 90));
      const d = new Date(buildEpoch - daysAgo * 86_400_000);
      driftEventDates.push(d.toISOString().slice(0, 10));
    }
  }
  const freshnessSlaMet = between(0.85, 1);
  const nullRate = between(0, 0.08);
  // Numeric features have wider distinct value spread; text/categorical narrower.
  const isNumeric = feature.type === 'int' || feature.type === 'float' || feature.type === 'number';
  const distinctValuesP50 = Math.round(isNumeric ? between(50, 5_000) : between(3, 50));

  // 180-day sparkline: weekday seasonality + slow trend + noise. Daily counts.
  const baseline = usageCount180d / 180;
  const trend = between(-0.15, 0.25);
  const requestRateSparkline = new Array<number>(180);
  for (let i = 0; i < 180; i++) {
    const dayOfWeek = (i + 6) % 7; // arbitrary alignment
    const weekdayMul = dayOfWeek === 5 || dayOfWeek === 6 ? 0.7 : 1.05;
    const trendMul = 1 + trend * (i / 180);
    const noise = 0.85 + r() * 0.3;
    requestRateSparkline[i] = Math.max(0, Math.round(baseline * weekdayMul * trendMul * noise));
  }

  // Latency tier hints freshness: <1h tier ≪ <1d tier
  const latencyTier = feature.latencyTier ?? '<1d';
  const medianLagMinutes =
    latencyTier === '<1h' ? between(1, 30) :
    latencyTier === '<1d' ? between(60, 300) :
    between(5, 60);

  const hoursSinceBackfill = between(0.5, 24);
  const lastBackfillAt = new Date(buildEpoch - hoursSinceBackfill * 3_600_000).toISOString();
  const hadRecentMiss = r() < 0.2;
  const lastSlaMissAt = hadRecentMiss
    ? new Date(buildEpoch - between(1, 30) * 86_400_000).toISOString()
    : null;

  return {
    usageCount180d,
    driftScore: Number(driftScore.toFixed(3)),
    driftEventDates,
    freshnessSlaMet: Number(freshnessSlaMet.toFixed(3)),
    nullRate: Number(nullRate.toFixed(3)),
    distinctValuesP50,
    topConsumingCampaigns: [],
    requestRateSparkline,
    lastBackfillAt,
    p99LookupLatencyMs: Math.round(between(5, 80)),
    coverageOfMau: Number(between(0.6, 0.99).toFixed(3)),
    medianLagMinutes: Number(medianLagMinutes.toFixed(1)),
    lastSlaMissAt,
  };
}

const withAnalytics = all.map((f) => ({
  ...f,
  analytics: synthAnalytics(f as { name: string; latencyTier?: string; type?: string }),
}));

const publicDir = path.resolve(_dirname, '../public');
fs.mkdirSync(publicDir, { recursive: true });
const staticPath = path.resolve(publicDir, '_catalog.json');
fs.writeFileSync(staticPath, JSON.stringify(withAnalytics), 'utf-8');
// eslint-disable-next-line no-console
console.log(`[export-feature-catalog] ${withAnalytics.length} features (with synthetic analytics, build=${buildDate.toISOString().slice(0, 10)}) → ${staticPath}`);
