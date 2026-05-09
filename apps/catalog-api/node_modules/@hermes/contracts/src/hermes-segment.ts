/**
 * Hermes Segment catalog schema — extends Bedrock Segment with
 * Hermes-specific predicate AST, author provenance, and audience breakdown.
 * Used in the Segment library (03_seg_library) and authoring canvas (04_seg_canvas).
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Predicate AST — the AND-of-OR-groups model used by the predicate composer
// ---------------------------------------------------------------------------

export const PredicateOperator = z.enum([
  '=', '!=', '>', '>=', '<', '<=',
  'in', 'not_in',
  'between',
  'contains_any', 'contains_all',
  'is_true', 'is_false',
]);
export type PredicateOperator = z.infer<typeof PredicateOperator>;

export const PredicateLeaf = z.object({
  feature: z.string(),                    // feature name from HermesFeature.name
  op: PredicateOperator,
  value: z.union([
    z.string(), z.number(), z.boolean(),
    z.array(z.string()), z.array(z.number()),
    z.tuple([z.number(), z.number()]),    // between [lo, hi]
  ]),
  /** Latency tier of the referenced feature — for substrate routing display */
  latencyTier: z.string().optional(),
  /** Substrate of the referenced feature */
  substrate: z.string().optional(),
  negate: z.boolean().optional(),
});
export type PredicateLeaf = z.infer<typeof PredicateLeaf>;

export const PredicateGroup = z.object({
  op: z.enum(['AND', 'OR']),
  conditions: z.array(PredicateLeaf),
});
export type PredicateGroup = z.infer<typeof PredicateGroup>;

/** Root AST: groups are AND-ed together; conditions within each group use group.op */
export const PredicateAST = z.object({
  groups: z.array(PredicateGroup),
  /** Top-level NOT exclusions applied after group evaluation */
  exclusions: z.array(PredicateLeaf).optional(),
});
export type PredicateAST = z.infer<typeof PredicateAST>;

// ---------------------------------------------------------------------------
// Audience lifecycle breakdown (per Hermes_Demo_Data Part 3)
// ---------------------------------------------------------------------------

export const LifecycleBreakdown = z.object({
  nru: z.number(),    // 0–1 fraction
  mid: z.number(),
  veteran: z.number(),
  lapsed: z.number().optional(),
});
export type LifecycleBreakdown = z.infer<typeof LifecycleBreakdown>;

export const SpendTierBreakdown = z.object({
  free: z.number(),
  low: z.number(),
  mid: z.number(),
  high: z.number(),
  whale: z.number(),
});
export type SpendTierBreakdown = z.infer<typeof SpendTierBreakdown>;

// ---------------------------------------------------------------------------
// Segment author provenance
// ---------------------------------------------------------------------------

export const HermesSegmentAuthor = z.enum(['hand-built', 'agent-drafted', 'agent-edited']);
export type HermesSegmentAuthor = z.infer<typeof HermesSegmentAuthor>;

export const HermesSegmentType = z.enum([
  'hand-built',
  'derived-from-journey',
  'derived-from-explore',
]);
export type HermesSegmentType = z.infer<typeof HermesSegmentType>;

export const HermesSegmentGoal4r = z.enum(['retain', 'revenue', 'reactivate', 'recruit', 'unset']);
export type HermesSegmentGoal4r = z.infer<typeof HermesSegmentGoal4r>;

// ---------------------------------------------------------------------------
// HermesSegment
// ---------------------------------------------------------------------------

export const HermesSegment = z.object({
  /** Naming: seg-{game}-{purpose}-{year}[-hash] per Hermes_Demo_Data Part 4 */
  id: z.string(),
  displayName: z.string(),
  game: z.string(),
  predicate: PredicateAST,
  goal4r: HermesSegmentGoal4r,
  owner: z.string(),
  lastBuildAt: z.string(),                // ISO-8601 or human display
  audienceSize: z.number().int().nonnegative(),
  lifecycleBreakdown: LifecycleBreakdown.optional(),
  spendTierBreakdown: SpendTierBreakdown.optional(),
  type: HermesSegmentType,
  author: HermesSegmentAuthor,
  /** Opportunity ID that originated this segment when agent-drafted */
  agentRef: z.string().optional(),
  /** Population drift flag for monitoring UI */
  drift: z.boolean().optional(),
  status: z.enum(['active', 'draft', 'stale', 'archived']).optional(),
  usedByCampaigns: z.number().int().nonnegative().optional(),
});
export type HermesSegment = z.infer<typeof HermesSegment>;
