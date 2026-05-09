/**
 * Derivations sourced from etl_recharge raw_event_aggregates.
 *
 * Per row: row_count = purchases that day, numeric_sum = USD revenue,
 * numeric_max = largest single USD purchase.
 */

import type { Derivation } from './derivation-types.js';
import { rowsWithinDays } from './derivation-types.js';

const SECS_PER_DAY = 86_400;

const isPayingUserLifetime: Derivation = {
  feature: 'is_paying_user_lifetime',
  sourceTables: ['etl_recharge'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    const total = rows.reduce((s, r) => s + (r.numericSum ?? 0), 0);
    const paying = total > 0;
    return { uid: rows[0].uid, valueText: paying ? 'true' : 'false', valueNumeric: paying ? 1 : 0 };
  },
};

const lifetimePurchaseCount: Derivation = {
  feature: 'lifetime_purchase_count',
  sourceTables: ['etl_recharge'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    const total = rows.reduce((s, r) => s + r.rowCount, 0);
    return { uid: rows[0].uid, valueText: String(total), valueNumeric: total };
  },
};

const lifetimeRevenueLocal: Derivation = {
  feature: 'lifetime_revenue_local',
  sourceTables: ['etl_recharge'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    // imoney_us is USD; multiply by ~24500 for VND (rough peg) so distribution
    // matches the "local" framing of the synth fixture.
    const usd = rows.reduce((s, r) => s + (r.numericSum ?? 0), 0);
    const vnd = Math.round(usd * 24_500);
    return { uid: rows[0].uid, valueText: String(vnd), valueNumeric: vnd };
  },
};

const lastPurchaseDaysAgo: Derivation = {
  feature: 'last_purchase_days_ago',
  sourceTables: ['etl_recharge'],
  compute: (rows, today) => {
    if (rows.length === 0) return null;
    const lastDate = rows.reduce<string>((m, r) => (r.eventDate > m ? r.eventDate : m), '1970-01-01');
    const days = Math.max(0, Math.round((today.getTime() - Date.parse(lastDate)) / (SECS_PER_DAY * 1000)));
    return { uid: rows[0].uid, valueText: String(days), valueNumeric: days };
  },
};

const avgPurchaseAmount30d: Derivation = {
  feature: 'avg_purchase_amount_30d',
  sourceTables: ['etl_recharge'],
  compute: (rows, today) => {
    const windowed = rowsWithinDays(rows, today, 30);
    if (windowed.length === 0) return null;
    const usdSum   = windowed.reduce((s, r) => s + (r.numericSum ?? 0), 0);
    const purchaseCount = windowed.reduce((s, r) => s + r.rowCount, 0);
    if (purchaseCount === 0) return null;
    const avgVnd = Math.round((usdSum / purchaseCount) * 24_500);
    return { uid: rows[0]?.uid ?? '', valueText: String(avgVnd), valueNumeric: avgVnd };
  },
};

const purchaseCountWindow = (windowDays: number, feature: string): Derivation => ({
  feature,
  sourceTables: ['etl_recharge'],
  compute: (rows, today) => {
    const windowed = rowsWithinDays(rows, today, windowDays);
    const total = windowed.reduce((s, r) => s + r.rowCount, 0);
    return { uid: rows[0]?.uid ?? '', valueText: String(total), valueNumeric: total };
  },
});

const purchaseCount30d = purchaseCountWindow(30, 'purchase_count_30d');
const purchaseCount7d  = purchaseCountWindow(7,  'purchase_count_7d');

/** spend_tier_lifetime — bucketed by lifetime USD: free / low / mid / high / whale. */
const spendTierLifetime: Derivation = {
  feature: 'spend_tier_lifetime',
  sourceTables: ['etl_recharge'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    const usd = rows.reduce((s, r) => s + (r.numericSum ?? 0), 0);
    let tier = 'free';
    if (usd >= 1000)      tier = 'whale';
    else if (usd >= 250)  tier = 'high';
    else if (usd >= 50)   tier = 'mid';
    else if (usd > 0)     tier = 'low';
    return { uid: rows[0].uid, valueText: tier, valueNumeric: null };
  },
};

/** annual_contribution_tier — 1..5 based on percentile within window. */
const annualContributionTier: Derivation = {
  feature: 'annual_contribution_tier',
  sourceTables: ['etl_recharge'],
  compute: (rows) => {
    if (rows.length === 0) return null;
    const usd = rows.reduce((s, r) => s + (r.numericSum ?? 0), 0);
    let tier = 1;
    if (usd >= 500)      tier = 5;
    else if (usd >= 200) tier = 4;
    else if (usd >= 50)  tier = 3;
    else if (usd >= 5)   tier = 2;
    return { uid: rows[0].uid, valueText: String(tier), valueNumeric: tier };
  },
};

export const etlRechargeDerivations: Derivation[] = [
  isPayingUserLifetime,
  lifetimePurchaseCount,
  lifetimeRevenueLocal,
  lastPurchaseDaysAgo,
  avgPurchaseAmount30d,
  purchaseCount30d,
  purchaseCount7d,
  spendTierLifetime,
  annualContributionTier,
];
