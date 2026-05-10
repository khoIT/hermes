/**
 * Intent definitions — keyword arrays mapped to response fixture ids.
 * The matcher (utils/chat-intent-matcher.ts) scores incoming user text against
 * each keyword set and picks the highest-scoring intent. PRD §7.2 schema.
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
    id: 'loss-streak',
    keywords: ['loss', 'streak', 'losing', 'losses', 'consecutive', 'ranked', 'frustration', 'frustrated'],
    responseId: 'thread-003',
    credits: 4,
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
];
