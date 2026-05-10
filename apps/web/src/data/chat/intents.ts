/**
 * Intent definitions — keyword arrays mapped to response fixture ids.
 * The matcher (utils/chat-intent-matcher.ts) scores incoming user text against
 * each keyword set and picks the highest-scoring intent. PRD §7.2 schema.
 *
 * Plan 260510-1519: thread-003 (legacy loss-streak) replaced by thread-007;
 * added entries for thread-005..008 initial prompts.
 */

export interface Intent {
  id: string;
  /** All keywords lowercased; matcher tokenizes input the same way. */
  keywords: string[];
  /** Id of the canned response (in canned-responses or thread-NNN). */
  responseId: string;
  /** Optional structural action when matched (Phase 5 wires action cards). */
  action?: 'create_segment' | 'create_campaign';
  /** Cosmetic credits stamped on the assistant response. */
  credits?: number;
}

export const INTENTS: Intent[] = [
  // ─── Legacy single-turn responses ─────────────────────────────────────
  {
    id: 'cpi-ltv-correlation',
    keywords: ['cpi', 'ltv', 'correlation', 'channel', 'channels', 'roas', 'compare'],
    responseId: 'thread-001',
    credits: 3,
  },
  {
    id: 'd7-retention-facebook',
    keywords: ['d7', 'retention', 'facebook'],
    responseId: 'thread-002',
    credits: 3,
  },
  {
    id: 'create-segment-churn',
    keywords: ['create', 'segment', 'spent', 'churn', '$50', '50', 'high-spend', 'whales'],
    responseId: 'thread-004',
    action: 'create_segment',
    credits: 2,
  },
  {
    id: 'segment-drift',
    keywords: ['drift', 'drifting', 'envelope', 'segments'],
    responseId: 'segment-drift',
    credits: 2,
  },
  {
    id: 'churn-features',
    keywords: ['churn', 'features', 'predict', 'high-spend'],
    responseId: 'churn-features',
    credits: 3,
  },
  {
    id: 'd7-cfm-cohort',
    keywords: ['d7', 'cfm', 'cohort', '5-game', 'targeting', 'control'],
    responseId: 'd7-cfm-cohort',
    credits: 3,
  },
  // ─── Plan 260510-1519: scripted multi-turn entry triggers ─────────────
  {
    id: 'pt6-gem-burn',
    keywords: ['pt-6', 'pt6', 'pt-10', 'pt10', 'gem-burn', 'gem', 'burn', 'hoarder', 'stockpiles', 'drain'],
    responseId: 'thread-005',
    credits: 4,
  },
  {
    id: 'cfm-tier-roi',
    keywords: ['cfm-11', 'cfm11', 'tier', 'tiers', 'year-end', 'reward-cost', 'reward', 'retention'],
    responseId: 'thread-006',
    credits: 4,
  },
  {
    id: 'cfm-loss-streak',
    keywords: ['loss', 'streak', 'losing', 'losses', 'consecutive', 'ranked', 'frustration', 'frustrated', 'intervene'],
    responseId: 'thread-007',
    credits: 4,
  },
  {
    id: 'pt-whale-recall',
    keywords: ['pt', 'whale', 'whales', 'at-risk', 'recall', "haven't", 'logged', 'login', 'week'],
    responseId: 'thread-008',
    credits: 4,
  },
];
