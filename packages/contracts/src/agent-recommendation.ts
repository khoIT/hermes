/**
 * AgentRecommendation — an Experiment Agent recommendation on an active campaign.
 * Surfaces in the Experiment Agent panel on 16_cmp_monitoring (§6.3) and in
 * Module 05 inbox Recommendations tab.
 *
 * Per PRD_Hermes_Agentic.md §2, §6.3, and §7.3.
 */
import { z } from 'zod';

export const RecommendationType = z.enum([
  'scale',          // scale winning variant to 100%
  'extract',        // extract derived segment from a responding cohort
  'extend',         // extend campaign runtime (need more data)
  'kill',           // kill underperforming campaign
  'drop_variant',   // drop a specific variant
]);
export type RecommendationType = z.infer<typeof RecommendationType>;

export const AgentRecommendation = z.object({
  /** Format: ar-{NNNN} */
  id: z.string(),
  /** References HermesCampaign.id */
  campaignId: z.string(),
  type: RecommendationType,
  /** Plain-language justification — shown in the Experiment Agent panel */
  reason: z.string(),
  /** Forecast copy — e.g. '+11k uplifted players / week at 100% rollout' */
  projection: z.string(),
  surfacedAt: z.string(),                 // ISO-8601 or human display
  status: z.enum(['open', 'approved', 'dismissed']).optional(),
});
export type AgentRecommendation = z.infer<typeof AgentRecommendation>;
