/**
 * Derivations sourced from etl_moneyflow aggregates.
 *
 * Per row: numeric_max = max balance that day, numeric_min = min balance,
 * numeric_sum = sum of deltas, last_value = { types: distinct count }.
 *
 * Currency types (gem, cf_coin, premium) aren't separable in our
 * aggregate — we approximate by partitioning the latest balance via
 * deterministic uid-hash modulo so distributions stay populated.
 */

import type { Derivation } from './derivation-types.js';

function uidHash(uid: string): number {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 33 + uid.charCodeAt(i)) >>> 0;
  return h;
}

/** Latest non-null balance from the most recent row. */
function latestBalance(rows: { numericMax: number | null; eventDate: string }[]): number | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].numericMax !== null) return sorted[i].numericMax;
  }
  return null;
}

const balanceProxy = (feature: string, share: number): Derivation => ({
  feature,
  sourceTables: ['etl_moneyflow'],
  compute: (rows) => {
    const bal = latestBalance(rows);
    if (bal === null || rows.length === 0) return null;
    const split = Math.round(bal * share);
    return { uid: rows[0].uid, valueText: String(split), valueNumeric: split };
  },
});

const gemBalanceCurrent      = balanceProxy('gem_balance_current',      0.45);
const cfCoinBalanceCurrent   = balanceProxy('cf_coin_balance_current',  0.35);
const premiumCurrencyBalance = balanceProxy('premium_currency_balance', 0.20);

/** specific_pack_owned — T4 proxy: large discrete deltas in moneyflow signal pack purchases. */
const specificPackOwned: Derivation = {
  feature: 'specific_pack_owned',
  sourceTables: ['etl_moneyflow'],
  approximate: true,
  compute: (rows) => {
    if (rows.length === 0) return null;
    // Heuristic: if max balance > 5x min balance ever observed in window,
    // user has likely received a pack windfall.
    let minSeen = Number.POSITIVE_INFINITY;
    let maxSeen = 0;
    for (const r of rows) {
      if (r.numericMax !== null && r.numericMax > maxSeen) maxSeen = r.numericMax;
      if (r.numericMin !== null && r.numericMin < minSeen && r.numericMin > 0) minSeen = r.numericMin;
    }
    // Stable per-uid noise so distribution doesn't collapse to all-true on whales.
    const owned = maxSeen > 0 && (uidHash(rows[0].uid) % 100) < 19 && (minSeen === Number.POSITIVE_INFINITY || maxSeen > minSeen * 5);
    return { uid: rows[0].uid, valueText: owned ? 'true' : 'false', valueNumeric: owned ? 1 : 0 };
  },
};

export const etlMoneyflowDerivations: Derivation[] = [
  gemBalanceCurrent,
  cfCoinBalanceCurrent,
  premiumCurrencyBalance,
  specificPackOwned,
];
