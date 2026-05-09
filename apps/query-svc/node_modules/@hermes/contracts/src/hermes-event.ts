/**
 * Hermes Event catalog schema — Substrate A (Kafka / Apollo TEE) live events.
 * 47 events across 8 domains per Hermes_Demo_Data.md Part 2.
 */
import { z } from 'zod';

export const HermesEventDomain = z.enum([
  'match-gameplay',
  'session-login',
  'purchase-monetization',
  'item-inventory',
  'progression',
  'social',
  'campaign-ui',
  'ugc-moderation',
]);
export type HermesEventDomain = z.infer<typeof HermesEventDomain>;

export const HermesEventKeyProperty = z.object({
  key: z.string(),
  type: z.string(),
  description: z.string().optional(),
});
export type HermesEventKeyProperty = z.infer<typeof HermesEventKeyProperty>;

export const HermesEvent = z.object({
  /** event_ prefixed snake_case name — verbatim from Hermes_Demo_Data.md */
  name: z.string(),
  displayName: z.string(),
  domain: HermesEventDomain,
  keyProperties: z.array(HermesEventKeyProperty),
  /** Campaign / feature IDs that consume this event */
  usedBy: z.array(z.string()).optional(),
  /** Display key for daily volume sparkline */
  dailyVolumeKey: z.string().optional(),
  sparklineKey: z.string().optional(),
});
export type HermesEvent = z.infer<typeof HermesEvent>;
