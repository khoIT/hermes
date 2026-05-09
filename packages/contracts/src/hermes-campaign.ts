/**
 * Hermes Campaign catalog schema — richer than Bedrock Campaign.
 * Supports one-time, scheduled, real-time, and hybrid (segment-seed +
 * real-time trigger) campaign types per Hermes_Demo_Data.md Part 3.
 */
import { z } from 'zod';

export const HermesTriggerType = z.enum([
  'one-time',
  'scheduled',
  'real-time',
  'hybrid',          // segment-seed + real-time trigger in parallel (TF-1 pattern)
]);
export type HermesTriggerType = z.infer<typeof HermesTriggerType>;

export const HermesVariant = z.object({
  id: z.string(),                          // 'A' | 'B' | 'holdout'
  label: z.string(),
  allocation: z.number(),                  // 0–1 fraction
  payload: z.string(),                     // human-readable action description
});
export type HermesVariant = z.infer<typeof HermesVariant>;

export const HermesHoldout = z.object({
  fraction: z.number(),                    // 0–1, e.g. 0.1
  balanced: z.boolean().optional(),
});
export type HermesHoldout = z.infer<typeof HermesHoldout>;

export const HermesTriggerPolicies = z.object({
  /** Per-player cooldown in hours */
  cooldownHours: z.number().optional(),
  /** Global daily fire cap */
  globalCapPerDay: z.number().optional(),
  /** Anti-fatigue: skip if iam_received_count_24h >= N */
  antiFatigueMaxIam24h: z.number().optional(),
});
export type HermesTriggerPolicies = z.infer<typeof HermesTriggerPolicies>;

export const HermesJourneyStep = z.object({
  day: z.number(),
  type: z.enum(['action', 'condition', 'wait', 'goal']),
  label: z.string(),
  /** Branches when type='condition' */
  branches: z.object({ yes: z.string(), no: z.string() }).optional(),
});
export type HermesJourneyStep = z.infer<typeof HermesJourneyStep>;

export const HermesCampaignGoal4r = z.enum(['retain', 'revenue', 'reactivate', 'recruit']);
export type HermesCampaignGoal4r = z.infer<typeof HermesCampaignGoal4r>;

export const HermesCampaignAuthor = z.enum(['hand-built', 'agent-drafted', 'agent-edited']);
export type HermesCampaignAuthor = z.infer<typeof HermesCampaignAuthor>;

export const HermesCampaign = z.object({
  /** Naming: cmp-{game}-{seq} per Hermes_Demo_Data Part 4 */
  id: z.string(),
  displayName: z.string(),
  game: z.string(),
  triggerType: HermesTriggerType,
  goal4r: HermesCampaignGoal4r,
  /**
   * For segment-backed or hybrid campaigns — references HermesSegment.id.
   * null for pure real-time campaigns with no segment audience.
   */
  audienceRef: z.string().nullable().optional(),
  /** Trigger event name (event_* from HermesEvent.name) for real-time / hybrid */
  eventTrigger: z.string().optional(),
  /** Trigger ID minted at activation — trg-{game}-{purpose} */
  triggerId: z.string().optional(),
  schedule: z.string().optional(),        // human display e.g. 'Daily 06:00 ICT'
  variants: z.array(HermesVariant),
  holdout: HermesHoldout,
  triggerPolicies: HermesTriggerPolicies.optional(),
  journey: z.array(HermesJourneyStep).optional(),
  status: z.enum(['active', 'draft', 'scheduled', 'paused', 'ended', 'archived']),
  author: HermesCampaignAuthor,
  /** Opportunity ID when agent-drafted */
  agentRef: z.string().optional(),
  /** Daily fire estimate and unique players/week for real-time campaigns */
  estimatedFiresPerDay: z.number().optional(),
  estimatedUniquePlayers7d: z.number().optional(),
  /** Campaign window dates (ISO or human display) */
  windowStart: z.string().optional(),
  windowEnd: z.string().optional(),
});
export type HermesCampaign = z.infer<typeof HermesCampaign>;
