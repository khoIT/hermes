/**
 * AgentActivity — chronological log of every agent action across the workspace.
 * Powers the Activity tab in Module 05 (21_ag_activity).
 * Used for governance and post-hoc audit per PRD_Hermes_Agentic.md §5.5 and §7.4.
 */
import { z } from 'zod';

export const AgentActivityAgent = z.enum(['insight', 'authoring', 'experiment']);
export type AgentActivityAgent = z.infer<typeof AgentActivityAgent>;

export const AgentActivityAction = z.enum([
  'proposed',       // Insight Agent surfaced an opportunity
  'drafted',        // Authoring Agent produced a draft artifact
  'recommended',    // Experiment Agent issued a recommendation
  'auto-archived',  // Agent auto-archived an expired opportunity
]);
export type AgentActivityAction = z.infer<typeof AgentActivityAction>;

export const AgentActivityOutcome = z.enum([
  'approved',
  'approved-with-edits',
  'rejected',
  'dismissed',
  'expired',
]);
export type AgentActivityOutcome = z.infer<typeof AgentActivityOutcome>;

export const AgentActivity = z.object({
  /** Format: aa-{NNNN} */
  id: z.string(),
  agent: AgentActivityAgent,
  action: AgentActivityAction,
  outcome: AgentActivityOutcome,
  /**
   * Structured reject reason code — from the four-option reject modal.
   * Present when outcome is 'rejected'.
   */
  reasonCode: z.enum([
    'already-covered',
    'tried-before-didnt-work',
    'wrong-target',
    'other',
  ]).optional(),
  /** References the artifact acted upon (Opportunity.id, AgentDraft.id, etc.) */
  artifactRef: z.string().optional(),
  /** Display label for the artifact */
  artifactLabel: z.string().optional(),
  timestamp: z.string(),                  // ISO-8601
});
export type AgentActivity = z.infer<typeof AgentActivity>;
