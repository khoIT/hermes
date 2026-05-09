/**
 * AgentDraft — an Authoring Agent artifact awaiting PM review.
 * Represents a drafted Segment or Campaign produced from an approved Opportunity.
 * Surfaces in Module 05 drafts queue (20_ag_drafts) and the library rows
 * of Modules 03 / 04 with the `agent-drafted` badge.
 *
 * Per PRD_Hermes_Agentic.md §5.4 and §7.2.
 */
import { z } from 'zod';

export const AgentDraftType = z.enum(['segment', 'campaign']);
export type AgentDraftType = z.infer<typeof AgentDraftType>;

export const AgentDraftStatus = z.enum([
  'pending-review',
  'edits-applied',
  'approved',
  'rejected',
]);
export type AgentDraftStatus = z.infer<typeof AgentDraftStatus>;

export const AgentDraft = z.object({
  /** Format: ad-{NNNN} */
  id: z.string(),
  /** References Opportunity.id that triggered this draft */
  fromOpportunity: z.string(),
  type: AgentDraftType,
  /**
   * The draft artifact ID — references HermesSegment.id or HermesCampaign.id.
   * The actual artifact object lives in the catalog; this links to it.
   */
  draftRef: z.string(),
  /** Human-readable display name for the draft artifact */
  displayName: z.string(),
  status: AgentDraftStatus,
  draftedAt: z.string(),                  // ISO-8601 or human display
  /** PM who applied edits, if status is 'edits-applied' or 'approved' */
  editedBy: z.string().optional(),
  /** Estimated impact copy — audience size or forecast lift */
  estimatedImpact: z.string().optional(),
});
export type AgentDraft = z.infer<typeof AgentDraft>;
