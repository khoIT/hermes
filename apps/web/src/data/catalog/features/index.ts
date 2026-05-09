/**
 * Feature catalog — runtime view.
 *
 * Phase 06 hard cut: features are populated by `_loader.bootFeatureLoader()`
 * from the catalog-api `/features` endpoint. There is NO static-JSON
 * fallback in the web bundle.
 *
 * The catalog source files in this folder (`identity-lifecycle.ts`,
 * `monetization.ts`, etc.) are still consumed by
 * `apps/web/scripts/export-feature-catalog.ts` at build time so the
 * server has metadata to serve. They are NOT imported into the runtime
 * bundle anymore — the snapshot starts empty and is populated by the
 * loader.
 */

import type { FeatureAnalytics180d, HermesFeature } from '@hermes/contracts';
import { bootFeatureLoader, subscribeLoadStatus, getLoadStatus, type LoadStatus } from './_loader';

// Re-export source arrays so the build-time exporter script keeps working.
export { campaignEngagementFeatures } from './campaign-engagement.js';
export { currencyFeatures } from './currency.js';
export { engagementFeatures } from './engagement.js';
export { gameplayCfmFeatures } from './gameplay-cfm.js';
export { identityLifecycleFeatures } from './identity-lifecycle.js';
export { inventoryFeatures } from './inventory.js';
export { monetizationFeatures } from './monetization.js';
export { platformPropensityFeatures } from './platform-propensity.js';
export { promotionConfigFeatures } from './promotion-config.js';
export { socialPlaystyleFeatures } from './social-playstyle.js';
export { statefulStreaksFeatures } from './stateful-streaks.js';
export { testSystemFeatures } from './test-system.js';

/**
 * Empty analytics block for newly-registered features (Phase 4 register page) —
 * zeroed sparkline + null backfill timestamp. UI panels detect and render
 * the "no data yet · 7-day warm-up" empty state.
 */
export function emptyAnalytics180d(): FeatureAnalytics180d {
  return {
    usageCount180d: 0,
    driftScore: 0,
    driftEventDates: [],
    freshnessSlaMet: 1,
    nullRate: 0,
    distinctValuesP50: 0,
    topConsumingCampaigns: [],
    requestRateSparkline: new Array(180).fill(0),
    lastBackfillAt: null,
    p99LookupLatencyMs: 0,
    coverageOfMau: 0,
    medianLagMinutes: 0,
    lastSlaMissAt: null,
  };
}

// ── In-memory snapshot ────────────────────────────────────────────────────

/**
 * Cached snapshot. Stable reference between getSnapshot calls so React's
 * useSyncExternalStore doesn't detect spurious changes. Replaced (not
 * mutated) when the loader receives data or registerFeature() is called.
 */
let cachedSnapshot: readonly HermesFeature[] = [];

const subs = new Set<() => void>();

export function subscribeFeatures(cb: () => void): () => void {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

function notifyFeatureSubscribers(): void {
  subs.forEach((cb) => cb());
}

/** Read-only snapshot of all features (loader-fed + user-registered). */
export function getAllFeatures(): readonly HermesFeature[] {
  return cachedSnapshot;
}

/** Look up a feature by its technical name (snake_case). */
export function getFeatureByName(name: string): HermesFeature | undefined {
  return cachedSnapshot.find((f) => f.name === name);
}

/**
 * Register a new feature into the in-memory catalog (Phase 4 register
 * page). Throws if `feature.name` is already taken.
 */
export function registerFeature(feature: HermesFeature): void {
  if (cachedSnapshot.some((f) => f.name === feature.name)) {
    throw new Error(`Feature ${feature.name} already exists`);
  }
  cachedSnapshot = [...cachedSnapshot, feature];
  notifyFeatureSubscribers();
  syncMutableArray();
}

/** Replace the snapshot with the loader's payload. */
export function _setLoadedFeatures(features: HermesFeature[]): void {
  cachedSnapshot = features;
  notifyFeatureSubscribers();
  syncMutableArray();
}

/**
 * Back-compat: legacy call sites import `allFeatures` directly. Keeps
 * the named export and updates it whenever the snapshot changes.
 *
 * Note: not `readonly` here because legacy code does `.find()` /
 * `.filter()` against it — those work transparently. Avoid mutating
 * from outside; use `registerFeature()`.
 */
export const allFeatures: HermesFeature[] = [];
function syncMutableArray(): void {
  allFeatures.length = 0;
  allFeatures.push(...cachedSnapshot);
}

// ── Boot ──────────────────────────────────────────────────────────────────
// `main.tsx` awaits the boot fetch before rendering. This module only
// fires the request; the snapshot lands once the loader resolves.
export { bootFeatureLoader, subscribeLoadStatus, getLoadStatus };
export type { LoadStatus };
