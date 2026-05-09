/**
 * Derivation registry — every batch feature with a real or proxy source
 * mapping is registered here. Step 08 iterates this list to compute
 * per-uid feature values from raw_event_aggregates.
 *
 * Coverage: 39 derivations (T1+T2+T3+T4 from the catalog). The remaining
 * 25 catalog features are T5 (no upstream Trino source) — those keep
 * their analytics path through the synth seed JSON in Phase 04 step 09.
 */

import type { Derivation } from './derivation-types.js';
import { etlLoginDerivations } from './etl-login-derivations.js';
import { etlRechargeDerivations } from './etl-recharge-derivations.js';
import { etlGameDetailDerivations } from './etl-game-detail-derivations.js';
import { etlMoneyflowDerivations } from './etl-moneyflow-derivations.js';
import {
  etlLogoutDerivations,
  etlAppsflyerDerivations,
  stdMasterUserProfileDerivations,
} from './misc-source-derivations.js';

export const ALL_DERIVATIONS: Derivation[] = [
  ...etlLoginDerivations,
  ...etlRechargeDerivations,
  ...etlGameDetailDerivations,
  ...etlMoneyflowDerivations,
  ...etlLogoutDerivations,
  ...etlAppsflyerDerivations,
  ...stdMasterUserProfileDerivations,
];

export function getDerivation(name: string): Derivation | undefined {
  return ALL_DERIVATIONS.find((d) => d.feature === name);
}

export type { Derivation } from './derivation-types.js';
