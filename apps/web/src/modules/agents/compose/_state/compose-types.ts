/**
 * Compose canvas — type system for the three-stage agent authoring flow.
 * Pure types only. See compose-reducer.ts for state transitions.
 */

export type FourRTag = '4r-retain' | '4r-revenue' | '4r-reactivate' | '4r-recruit';

export type PlaybookId =
  | 'loss-streak'
  | 'whale-dormancy'
  | 'stuck-on-first-match'
  | '7-day-non-payers'
  | 'lapsed-vip-last-touch';

export type StageId = 'features' | 'segment' | 'campaign';
export type StageStatus = 'idle' | 'proposing' | 'reviewing' | 'computing' | 'approved' | 'stale';

// ── Feature rows ───────────────────────────────────────────────────────────

export interface ProposedFeatureRow {
  id: string;                       // row instance id (sa-row-…)
  featureId: string;                // catalog feature name e.g. consecutive_ranked_losses_streak
  rephrase: string;                 // plain-English description
  rationale: 'core signal' | 'filter bots' | 'avoid spam' | 'cohort filter';
  threshold: { op: '>=' | '<=' | '<' | '>' | '=' | 'is_false' | 'is_true'; value: number | string | boolean };
  isHeadline?: boolean;             // headline numeric → drives threshold slider
}

export interface ApprovedFeatureRow extends ProposedFeatureRow {
  approvedAt: string;
}

// ── Predicate ──────────────────────────────────────────────────────────────

export interface PredicateLeaf {
  feature: string;
  op: string;
  value: number | string | boolean;
}

export interface PredicateGroup {
  all?: (PredicateGroup | { leaf: PredicateLeaf })[];
  any?: (PredicateGroup | { leaf: PredicateLeaf })[];
}

// ── Campaign template ──────────────────────────────────────────────────────

export interface CampaignTemplate {
  headline: string;                  // "The moment a player loses 5 in a row…"
  eventSource: { name: string; peakRate: string; lifecycle: string };
  action: {
    channel: 'iam' | 'push' | 'email' | 'in-game-popup';
    payload: string;                 // user-visible offer copy
    cooldown: string;                // "72h"
    platformCap: string;             // "1/day"
    abHoldout: string;               // "10%"
  };
  alignment: { tag: FourRTag; score: number; rationale: string };
  fireMetrics: {
    forecastDailyFires: string;
    peakRate: string;
    latency: string;
    estLift: string;
  };
  triggerLifecycle: string[];        // ["event", "predicate", "match", "iam", "cooldown", "resume"]
  sampleProfiles: { uid: string; oneLiner: string }[];
}

// ── Stage state ────────────────────────────────────────────────────────────

export interface StageFeatures {
  status: StageStatus;
  proposed: ProposedFeatureRow[];
  approved: ApprovedFeatureRow[];
}

export interface StageSegment {
  status: StageStatus;
  predicate: PredicateGroup | null;
  audienceCount: number | null;
  matchedExistingSegmentId: string | null;
  decision: 'new-draft' | 'use-existing' | 'manual-edit' | null;
}

export interface StageCampaign {
  status: StageStatus;
  template: CampaignTemplate | null;
  refinements: string[];
}

// ── Chat log ───────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'agent' | 'system';

export interface ChatEntry {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: string;                 // ISO
}

// ── Playbook ───────────────────────────────────────────────────────────────

export interface Playbook {
  id: PlaybookId;
  keywords: string[];
  patternName: string;               // flavor text: "frustration-rescue"
  fourR: { tag: FourRTag; alignment: number };
  intro: string;                     // first agent reply on intent submit
  proposedFeatures: ProposedFeatureRow[];
  segmentMatch: { existingId: string | null };
  campaignTemplate: CampaignTemplate | null;
  scriptedReplies: { trigger: string; agent: string; templatePatch?: Partial<CampaignTemplate['action']> }[];
}

// ── Top-level session ──────────────────────────────────────────────────────

export interface ComposeSession {
  id: string;                        // sa-2026-0510-…
  intent: string;
  matchedPlaybook: PlaybookId | null;
  fourR: { tag: FourRTag; alignment: number } | null;
  activeStage: StageId;
  stages: {
    features: StageFeatures;
    segment: StageSegment;
    campaign: StageCampaign;
  };
  chatLog: ChatEntry[];
  startedAt: string;
}

// ── Reducer actions ────────────────────────────────────────────────────────

export type ComposeAction =
  | { type: 'INTENT_SUBMIT'; intent: string; playbookId: PlaybookId | null }
  | { type: 'INTENT_FROM_OPPORTUNITY'; opportunityId: string; intent: string; playbookId: PlaybookId; agentThread: string[]; fourR: { tag: FourRTag; alignment: number } }
  | { type: 'FEATURE_APPROVE'; rowId: string }
  | { type: 'FEATURE_SWAP'; rowId: string; newFeatureId: string; newRephrase: string; newRationale: ProposedFeatureRow['rationale'] }
  | { type: 'FEATURE_DROP'; rowId: string }
  | { type: 'STAGE_ADVANCE'; from: StageId }
  | { type: 'STAGE_REOPEN'; stage: StageId }
  | { type: 'SEGMENT_AUDIENCE_FETCH_START' }
  | { type: 'SEGMENT_AUDIENCE_RESULT'; count: number }
  | { type: 'SEGMENT_THRESHOLD_CHANGE'; rowId: string; value: number }
  | { type: 'SEGMENT_DECISION'; decision: NonNullable<StageSegment['decision']>; existingId?: string | null }
  | { type: 'CAMPAIGN_REFINE'; userText: string; agentReply: string; templatePatch?: Partial<CampaignTemplate['action']> }
  | { type: 'CHAT_USER_REPLY'; text: string };
