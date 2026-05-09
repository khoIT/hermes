/**
 * Audience Pattern Library — 5 cards per PRD_Hermes_Design.md §8.9.
 * Each pattern is a reusable archetype shown in the Segment library entry-point
 * strip ("Start from an audience pattern").
 *
 * Patterns: Loss Streak, Whale at Risk, Lapsed Mid-Spender,
 *            New Player D2, Shop Window Shopper
 */

export interface AudiencePattern {
  id: string;
  name: string;
  description: string;
  /** Key features referenced in the pattern predicate */
  keyFeatures: string[];
  /** Typical goal4r alignment */
  goal4r: 'retain' | 'revenue' | 'reactivate' | 'recruit';
  /** Example segment IDs that use this pattern */
  exampleSegments: string[];
  /** Archetypal audience size range (display string) */
  typicalAudienceRange: string;
  game: string;
}

export const audiencePatterns: AudiencePattern[] = [
  {
    id: 'ap-loss-streak',
    name: 'Loss Streak',
    description: 'Players on a consecutive ranked loss run — frustration signal that predicts next-session churn. High receptivity to MMR protection or XP boost offers.',
    keyFeatures: ['consecutive_ranked_losses_streak', 'mmr_drift_7d', 'is_paying_user_lifetime'],
    goal4r: 'retain',
    exampleSegments: ['seg-cfm-loss-streak-non-paying-2026-0508-a3f9'],
    typicalAudienceRange: '15k – 30k',
    game: 'CFM',
  },
  {
    id: 'ap-whale-at-risk',
    name: 'Whale at Risk',
    description: 'High-value payers whose login recency is drifting upward — early churn signal before the cliff. Highest urgency of all retention patterns.',
    keyFeatures: ['spend_tier_lifetime', 'last_login_days_ago', 'session_count_7d'],
    goal4r: 'retain',
    exampleSegments: ['seg-cfm-whale-at-risk-2026', 'seg-nth-whale-at-risk-2026'],
    typicalAudienceRange: '3k – 8k',
    game: 'CFM',
  },
  {
    id: 'ap-lapsed-mid-spender',
    name: 'Lapsed Mid-Spender',
    description: 'Low–mid tier payers who have not purchased in 30d and last logged in 14–60 days ago. Reactivation window is highest before 60-day mark.',
    keyFeatures: ['spend_tier_lifetime', 'last_login_days_ago', 'purchase_count_30d'],
    goal4r: 'reactivate',
    exampleSegments: ['seg-cfm-lapsed-mid-spender-2026'],
    typicalAudienceRange: '40k – 80k',
    game: 'CFM',
  },
  {
    id: 'ap-new-player-d2',
    name: 'New Player D2',
    description: 'Players in their first 48 hours — highest churn-risk window. D2 nudge campaigns typically yield the largest D7 retention delta of any touchpoint.',
    keyFeatures: ['is_new_user_d7', 'account_age_days', 'session_count_1d'],
    goal4r: 'recruit',
    exampleSegments: ['seg-cfm-new-player-d2-2026'],
    typicalAudienceRange: '6k – 15k',
    game: 'CFM',
  },
  {
    id: 'ap-shop-window-shopper',
    name: 'Shop Window Shopper',
    description: 'Active non-payers who open the shop regularly but never convert — highest-potential first-purchase cohort. Low-friction entry-point offers work best.',
    keyFeatures: ['is_paying_user_lifetime', 'session_count_30d', 'purchase_count_30d'],
    goal4r: 'revenue',
    exampleSegments: ['seg-cfm-shop-window-shopper-2026'],
    typicalAudienceRange: '150k – 250k',
    game: 'CFM',
  },
];
