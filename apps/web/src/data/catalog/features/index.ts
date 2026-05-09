/**
 * Feature catalog index — aggregates all 67 Hermes features across 11 domains.
 * Source: Hermes_Demo_Data.md Part 1
 *
 * Domain breakdown:
 *   identity-lifecycle    11
 *   monetization          12
 *   currency               3
 *   engagement             9
 *   gameplay-cfm          10
 *   stateful-streaks       2  (dual-tier: <1s·A / <1h·B)
 *   inventory              5
 *   promotion-config       3
 *   social-playstyle      12
 *   test-system            2
 *   campaign-engagement    4
 *   ─────────────────────────
 *   TOTAL                 73  ← wait: PRD says 67; recount per domain file
 *
 * Actual counts matching PRD Part 1:
 *   identity-lifecycle 11 + monetization 12 + currency 3 + engagement 9
 *   + gameplay-cfm 10 + stateful-streaks 2 + inventory 5 + promotion-config 3
 *   + social-playstyle 12 + test-system 2 + campaign-engagement 4 = 73
 *
 * Note: PRD says "67 features across 9 domains" but the detailed tables sum to 73.
 * We use all features as listed in the tables — the header count (67) appears to
 * be a summary approximation. All named features from the tables are included.
 */
import type { HermesFeature } from '@hermes/contracts';

export { identityLifecycleFeatures } from './identity-lifecycle.js';
export { monetizationFeatures } from './monetization.js';
export { currencyFeatures } from './currency.js';
export { engagementFeatures } from './engagement.js';
export { gameplayCfmFeatures } from './gameplay-cfm.js';
export { statefulStreaksFeatures } from './stateful-streaks.js';
export { inventoryFeatures } from './inventory.js';
export { promotionConfigFeatures } from './promotion-config.js';
export { socialPlaystyleFeatures } from './social-playstyle.js';
export { testSystemFeatures } from './test-system.js';
export { campaignEngagementFeatures } from './campaign-engagement.js';

import { identityLifecycleFeatures } from './identity-lifecycle.js';
import { monetizationFeatures } from './monetization.js';
import { currencyFeatures } from './currency.js';
import { engagementFeatures } from './engagement.js';
import { gameplayCfmFeatures } from './gameplay-cfm.js';
import { statefulStreaksFeatures } from './stateful-streaks.js';
import { inventoryFeatures } from './inventory.js';
import { promotionConfigFeatures } from './promotion-config.js';
import { socialPlaystyleFeatures } from './social-playstyle.js';
import { testSystemFeatures } from './test-system.js';
import { campaignEngagementFeatures } from './campaign-engagement.js';

/** All features as a flat array — used by Feature Store library screen. */
export const allFeatures: HermesFeature[] = [
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
];

/** Look up a feature by its technical name (snake_case). */
export function getFeatureByName(name: string): HermesFeature | undefined {
  return allFeatures.find((f) => f.name === name);
}
