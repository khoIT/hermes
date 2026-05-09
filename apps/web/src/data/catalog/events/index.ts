/**
 * Event catalog index — aggregates all 47 Hermes live events across 8 domains.
 * Source: Hermes_Demo_Data.md Part 2
 *
 * Domain breakdown:
 *   match-gameplay          6
 *   session-login           7
 *   purchase-monetization   6
 *   item-inventory          6
 *   progression             8
 *   social                  6
 *   campaign-ui             8
 *   ugc-moderation          4
 *   ─────────────────────────
 *   TOTAL                  51  ← PRD header says 47; tables sum to 51.
 *   All named events from Part 2 tables are included verbatim.
 */
import type { HermesEvent } from '@hermes/contracts';

export { matchGameplayEvents } from './match-gameplay.js';
export { sessionLoginEvents } from './session-login.js';
export { purchaseMonetizationEvents } from './purchase-monetization.js';
export { itemInventoryEvents } from './item-inventory.js';
export { progressionEvents } from './progression.js';
export { socialEvents } from './social.js';
export { campaignUiEvents } from './campaign-ui.js';
export { ugcModerationEvents } from './ugc-moderation.js';

import { matchGameplayEvents } from './match-gameplay.js';
import { sessionLoginEvents } from './session-login.js';
import { purchaseMonetizationEvents } from './purchase-monetization.js';
import { itemInventoryEvents } from './item-inventory.js';
import { progressionEvents } from './progression.js';
import { socialEvents } from './social.js';
import { campaignUiEvents } from './campaign-ui.js';
import { ugcModerationEvents } from './ugc-moderation.js';

/** All events as a flat array — used by event source picker in Campaign canvas. */
export const allEvents: HermesEvent[] = [
  ...matchGameplayEvents,
  ...sessionLoginEvents,
  ...purchaseMonetizationEvents,
  ...itemInventoryEvents,
  ...progressionEvents,
  ...socialEvents,
  ...campaignUiEvents,
  ...ugcModerationEvents,
];

/** Look up an event by its technical name (event_ prefix, snake_case). */
export function getEventByName(name: string): HermesEvent | undefined {
  return allEvents.find((e) => e.name === name);
}
