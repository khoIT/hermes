/**
 * Opportunity — an Insight Agent proposal surfaced in Module 05 inbox.
 * Per PRD_Hermes_Agentic.md §4 card spec and §7.1 demo content.
 *
 * Schema decisions:
 *  - confidence: 0–1 two-decimal number (mono register in UI)
 *  - window: date-string (ISO or human) or 'evergreen' (no time pressure)
 *  - evidence: array of evidence rows matching Feature Store card chips
 *  - agentThread: terse mono reasoning steps for the transparency panel §5.3
 */
import { z } from 'zod';

export const OpportunityAgent = z.enum(['insight', 'authoring', 'experiment']);
export type OpportunityAgent = z.infer<typeof OpportunityAgent>;

export const OpportunityStatus = z.enum(['open', 'approved', 'dismissed']);
export type OpportunityStatus = z.infer<typeof OpportunityStatus>;

export const OpportunityGoal4r = z.enum(['retain', 'revenue', 'reactivate', 'recruit']);
export type OpportunityGoal4r = z.infer<typeof OpportunityGoal4r>;

export const EvidenceRow = z.object({
  label: z.string(),
  /** References HermesFeature.name for the sparkline chip */
  sparklineKey: z.string().optional(),
  /** Additional display metadata — e.g. percentage, cohort count */
  meta: z.string().optional(),
});
export type EvidenceRow = z.infer<typeof EvidenceRow>;

export const ProposedArtifact = z.object({
  /** References HermesSegment.id */
  segment: z.string().optional(),
  /** References HermesCampaign.id */
  campaign: z.string().optional(),
});
export type ProposedArtifact = z.infer<typeof ProposedArtifact>;

export const Opportunity = z.object({
  /** Format: ag-op-{NNNN} */
  id: z.string(),
  agent: OpportunityAgent,
  surfacedAt: z.string(),                 // ISO-8601 or human display ('2h ago')
  /** 0.00–1.00 — two decimal precision, displayed as mono in UI */
  confidence: z.number().min(0).max(1),
  /**
   * Actionable window. 'evergreen' = no time pressure (no amber pill shown).
   * Otherwise a human-readable date string, e.g. 'this week · act by Friday'.
   */
  window: z.union([z.string(), z.literal('evergreen')]),
  /** Serif italic intent statement — max 2 sentences; longer detail goes to whyNow */
  intent: z.string(),
  evidence: z.array(EvidenceRow).min(1).max(4),
  proposed: ProposedArtifact,
  /** Collapsible paragraph — cites prior campaigns and projects the actionable window */
  whyNow: z.string(),
  game: z.string(),
  goal4r: OpportunityGoal4r,
  status: OpportunityStatus,
  /**
   * Agent reasoning thread — terse mono lines for the transparency panel.
   * Format: 'HH:MM:SS  action  description'
   * Populated by Insight Agent; read-only for humans.
   */
  agentThread: z.array(z.string()).optional(),
});
export type Opportunity = z.infer<typeof Opportunity>;
