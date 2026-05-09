/**
 * Campaign Pattern Library — 7 intervention archetypes per PRD_Hermes_Design.md §9.11.
 * Each card: archetype name, origin game, lift band, uses across portfolio,
 * predicate + action template, cross-game lineage timeline.
 *
 * Archetypes:
 *   Pass Stuck Rescue, Loss Streak Rescue, Whale Comeback,
 *   NRU D2 Nudge, Shop Window Shopper Conversion,
 *   Friend-of-Lapsed Social Re-engagement, Mid-Session Step-up Offer
 */

export interface InterventionArchetype {
  id: string;
  name: string;
  originGame: string;
  /** e.g. '+6–9% D1 retention' */
  liftBand: string;
  /** Number of campaigns in the portfolio using this pattern */
  portfolioUses: number;
  description: string;
  /** Predicate template in plain English */
  predicateTemplate: string;
  /** Action template */
  actionTemplate: string;
  /** Key trigger event (if real-time) */
  triggerEvent?: string;
  /** Key features in predicate */
  keyFeatures: string[];
  /** Cross-game lineage timeline — ordered list of campaign IDs that used the pattern */
  lineage: Array<{ campaignId: string; game: string; liftObserved: string }>;
  goal4r: 'retain' | 'revenue' | 'reactivate' | 'recruit';
}

export const interventionArchetypes: InterventionArchetype[] = [
  {
    id: 'ia-pass-stuck-rescue',
    name: 'Pass Stuck Rescue',
    originGame: 'CFM',
    liftBand: '+6–9% D1 retention',
    portfolioUses: 3,
    description: 'Real-time rescue for pass holders whose ranked loss streak indicates frustration-driven churn risk. MMR shield or XP boost offer at the cliff moment.',
    predicateTemplate: 'consecutive_ranked_losses_streak ≥ N AND pass_owned_current = true AND NOT is_test_account',
    actionTemplate: 'IAM offer: MMR shield (variant A) or XP boost (variant B) · Holdout 10%',
    triggerEvent: 'event_match_end',
    keyFeatures: ['consecutive_ranked_losses_streak', 'pass_owned_current', 'is_paying_user_lifetime'],
    lineage: [
      { campaignId: 'cmp-cfm-407', game: 'CFM', liftObserved: '+8.2% D1 retention' },
      { campaignId: 'cmp-cfm-409', game: 'CFM', liftObserved: '+6.1% D1 retention' },
      { campaignId: 'nth-202', game: 'NTH', liftObserved: '+5.8% D1 retention' },
    ],
    goal4r: 'retain',
  },
  {
    id: 'ia-loss-streak-rescue',
    name: 'Loss Streak Rescue',
    originGame: 'CFM',
    liftBand: '+4–8% D1 retention',
    portfolioUses: 4,
    description: 'Broader version of Pass Stuck — targets any player on a loss streak regardless of pass ownership. Lower average lift but larger audience.',
    predicateTemplate: 'consecutive_ranked_losses_streak ≥ N AND NOT is_test_account',
    actionTemplate: 'IAM motivational message + optional reward · Per-player cooldown 24h',
    triggerEvent: 'event_match_end',
    keyFeatures: ['consecutive_ranked_losses_streak', 'mmr_drift_7d'],
    lineage: [
      { campaignId: 'cmp-cfm-407', game: 'CFM', liftObserved: '+8.2% D1 retention' },
      { campaignId: 'cmp-cfm-408', game: 'CFM', liftObserved: '+4.7% D1 retention' },
    ],
    goal4r: 'retain',
  },
  {
    id: 'ia-whale-comeback',
    name: 'Whale Comeback',
    originGame: 'NTH',
    liftBand: '+18–26% 7d recovery',
    portfolioUses: 2,
    description: 'Login-triggered welcome-back for high-value payers with rising login recency. VIP recognition framing outperforms discount framing by 3:1.',
    predicateTemplate: 'spend_tier_lifetime = whale AND event_login.last_login_gap_days ≥ N AND NOT is_test_account',
    actionTemplate: 'IAM VIP welcome-back pack + personalized message · 72h cooldown',
    triggerEvent: 'event_login',
    keyFeatures: ['spend_tier_lifetime', 'last_login_days_ago', 'vip_status'],
    lineage: [
      { campaignId: 'nth-202', game: 'NTH', liftObserved: '+24% 7d recovery' },
      { campaignId: 'cmp-nth-whale-comeback', game: 'NTH', liftObserved: 'pending (draft)' },
    ],
    goal4r: 'retain',
  },
  {
    id: 'ia-nru-d2-nudge',
    name: 'New Player D2 Nudge',
    originGame: 'CFM',
    liftBand: '+12–18% D7 retention',
    portfolioUses: 5,
    description: 'Proactive tutorial or reward nudge on Day 2 — largest D7 retention delta of any single-touchpoint campaign in the portfolio.',
    predicateTemplate: 'is_new_user_d7 = true AND account_age_days BETWEEN 1 AND 2',
    actionTemplate: 'Push + IAM onboarding guide or first-purchase incentive · No holdout (new users too valuable)',
    triggerEvent: 'event_login',
    keyFeatures: ['is_new_user_d7', 'account_age_days'],
    lineage: [
      { campaignId: 'cfm-d2-nudge-2025', game: 'CFM', liftObserved: '+17% D7 retention' },
      { campaignId: 'nth-d2-nudge-2025', game: 'NTH', liftObserved: '+13% D7 retention' },
      { campaignId: 'seg-cfm-new-player-d2-2026', game: 'CFM', liftObserved: 'active' },
    ],
    goal4r: 'recruit',
  },
  {
    id: 'ia-shop-window-shopper',
    name: 'Shop Window Shopper Conversion',
    originGame: 'CFM',
    liftBand: '+2–5% first purchase rate',
    portfolioUses: 3,
    description: 'Converts active non-payers who show shop-browsing intent. Low-friction entry-point offers (single-item, low-price) work best for first conversion.',
    predicateTemplate: 'is_paying_user_lifetime = false AND session_count_30d ≥ 10 AND purchase_count_30d = 0',
    actionTemplate: 'IAM limited-time entry-price offer · Global cap 50k fires/day',
    triggerEvent: 'event_shop_open',
    keyFeatures: ['is_paying_user_lifetime', 'session_count_30d'],
    lineage: [
      { campaignId: 'cfm-first-buy-2025', game: 'CFM', liftObserved: '+4.8% conversion' },
    ],
    goal4r: 'revenue',
  },
  {
    id: 'ia-friend-of-lapsed',
    name: 'Friend-of-Lapsed Social Re-engagement',
    originGame: 'CFM',
    liftBand: '+8–14% reactivation rate',
    portfolioUses: 2,
    description: 'Targets active players whose friends have lapsed — social pressure + referral incentive. Requires friend-graph join on Trino (Substrate B).',
    predicateTemplate: 'friend_uid IN (lapsed_player_segment) AND session_count_7d ≥ 1',
    actionTemplate: 'IAM "Your friend [name] hasn\'t played in N days — invite them back for a reward"',
    keyFeatures: ['social_engagement_score', 'session_count_7d'],
    lineage: [
      { campaignId: 'cfm-4', game: 'CFM', liftObserved: '+12% 7d reactivation' },
    ],
    goal4r: 'reactivate',
  },
  {
    id: 'ia-mid-session-stepup',
    name: 'Mid-Session Step-up Offer',
    originGame: 'COS',
    liftBand: '+3–6% revenue per session',
    portfolioUses: 2,
    description: 'Triggered by an in-session purchase event — offers the next tier pack while purchase intent is hot. The 3-minute window is critical; longer delays drop conversion sharply.',
    predicateTemplate: 'event_pack_purchased.tier = N AND time_since_purchase < 3min AND pass_owned_current = false',
    actionTemplate: 'IAM next-tier upgrade offer · Single-use per session',
    triggerEvent: 'event_pack_purchased',
    keyFeatures: ['pass_progress_current', 'pass_owned_current'],
    lineage: [
      { campaignId: 'cos-3', game: 'COS', liftObserved: '+5.2% revenue/session' },
    ],
    goal4r: 'revenue',
  },
];
