/**
 * Build-time exporter: reads all TS feature catalog files in
 * apps/web/src/data/catalog/features/ and writes a single JSON file
 * (apps/web/src/data/catalog/features/_catalog.json) that catalog-api
 * loads at boot.
 *
 * Decouples web ↔ catalog-api so the latter doesn't import across the
 * workspace boundary. Stripped of the `analytics` field — analytics
 * comes from feature_analytics_180d in Postgres at API request time.
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

const outputPath = path.resolve(_dirname, '../src/data/catalog/features/_catalog.json');
fs.writeFileSync(outputPath, JSON.stringify(all, null, 2), 'utf-8');

// eslint-disable-next-line no-console
console.log(`[export-feature-catalog] ${all.length} features → ${outputPath}`);
