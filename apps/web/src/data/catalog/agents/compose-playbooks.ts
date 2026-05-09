/**
 * Compose canvas — scripted playbooks.
 *
 * Each playbook maps a free-text intent (matched by keyword) to a fully-
 * scripted three-stage flow: proposed features → segment match → campaign
 * template + scripted refinement replies.
 *
 * The loss-streak playbook is the canonical demo anchor (ag-op-1042).
 * The other 4 are filled out in Phase 7; here they ship with keywords +
 * fourR + minimal intro so the matcher and intent flow work end-to-end.
 *
 * Not subject to the 200-LOC rule — this is a typed data file.
 */
import type { Playbook, PlaybookId } from '../../../modules/agents/compose/_state/compose-types';

// ── Loss streak — canonical (CFM ranked, 5+ losses, non-paying) ─────────────
const lossStreak: Playbook = {
  id: 'loss-streak',
  keywords: [
    'losing', 'loss streak', 'losing streak', 'frustrated', 'frustration', 'lose',
    'losses', 'ranked match', 'ranked matches', '5 in a row', 'five in a row',
    'consecutive', 'losing 5', 'tilt', 'tilted',
  ],
  patternName: 'frustration-rescue',
  fourR: { tag: '4r-retain', alignment: 0.92 },
  intro:
    "I see this pattern — frustration-rescue. Players hitting consecutive ranked losses tilt off the platform. " +
    "Three signals make a clean cohort. I'll propose them — approve the ones that fit.",
  proposedFeatures: [
    {
      id: 'sa-row-loss-1',
      featureId: 'consecutive_ranked_losses_streak',
      rephrase: 'Player has lost at least 5 ranked matches in a row',
      rationale: 'core signal',
      threshold: { op: '>=', value: 5 },
      isHeadline: true,
    },
    {
      id: 'sa-row-loss-2',
      featureId: 'tenure_days',
      rephrase: 'Account is at least 7 days old (filters bots and brand-new installs)',
      rationale: 'filter bots',
      threshold: { op: '>=', value: 7 },
    },
    {
      id: 'sa-row-loss-3',
      featureId: 'is_paying_user_lifetime',
      rephrase: 'Player has never paid (focus retention spend on growth cohort)',
      rationale: 'cohort filter',
      threshold: { op: 'is_false', value: false },
    },
  ],
  segmentMatch: { existingId: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9' },
  campaignTemplate: {
    headline: 'The moment a player loses 5 in a row, offer a starter pack — once per 72h.',
    eventSource: { name: 'ranked_match_completed', peakRate: '~14k/min', lifecycle: 'mature · 18mo' },
    action: {
      channel: 'iam',
      payload: 'Starter Pack · 30% off · 1 weapon skin + 200 gems',
      cooldown: '72h',
      platformCap: '1/day · 2/week',
      abHoldout: '10%',
    },
    alignment: { tag: '4r-retain', score: 0.92, rationale: 'Pattern recognized as frustration-rescue · 3 prior wins +6.4% D1 retention' },
    fireMetrics: {
      forecastDailyFires: '~3.4k/day',
      peakRate: '~14k events/min',
      latency: 'p99 152ms',
      estLift: '+6.4% D1 retention',
    },
    triggerLifecycle: ['event', 'predicate match', 'IAM render', 'cooldown 72h', 'resume'],
    sampleProfiles: [
      { uid: 'uid-cfm-19273', oneLiner: '8 losses streak · tenure 124d · never paid · last login 2h ago' },
      { uid: 'uid-cfm-22841', oneLiner: '6 losses streak · tenure 38d · never paid · last login 16m ago' },
      { uid: 'uid-cfm-30119', oneLiner: '5 losses streak · tenure 91d · never paid · last login 4h ago' },
    ],
  },
  scriptedReplies: [
    {
      trigger: 'generous',
      agent: "Toned down the offer — 15% off instead of 30%, no skin. Cohort still gets the moment-of-pain rescue without overspending.",
      templatePatch: { payload: 'Starter Pack · 15% off · 100 gems' },
    },
    {
      trigger: 'payer',
      agent: "Already filtered — the cohort is `is_paying_user_lifetime = false`. No payers will see this.",
    },
    {
      trigger: "don't spam",
      agent: "Bumped cooldown to 7 days and capped at 1/week — players won't see this twice in the same losing run.",
      templatePatch: { cooldown: '7d', platformCap: '1/week' },
    },
    {
      trigger: 'aggressive',
      agent: "Switched channel from IAM to a soft push notification — less interruptive, fires only once per 7d.",
      templatePatch: { channel: 'push', cooldown: '7d' },
    },
  ],
};

// ── Whale dormancy — Phase 7 stub ──────────────────────────────────────────
const whaleDormancy: Playbook = {
  id: 'whale-dormancy',
  keywords: ['whale', 'whales', 'dormant', 'dormancy', 'big spender', 'spend tier', 'lapsed whale'],
  patternName: 'whale-recall',
  fourR: { tag: '4r-reactivate', alignment: 0.88 },
  intro: "Whale-recall pattern. I'll surface the at-risk whale cohort — high lifetime spend, dropping session count.",
  proposedFeatures: [
    {
      id: 'sa-row-whale-1',
      featureId: 'last_login_days_ago',
      rephrase: 'Hasn\'t logged in for 14+ days',
      rationale: 'core signal',
      threshold: { op: '>=', value: 14 },
      isHeadline: true,
    },
    {
      id: 'sa-row-whale-2',
      featureId: 'lifetime_revenue_local',
      rephrase: 'Lifetime spend ≥ 500,000 VND',
      rationale: 'cohort filter',
      threshold: { op: '>=', value: 500000 },
    },
    {
      id: 'sa-row-whale-3',
      featureId: 'session_count_7d',
      rephrase: 'Zero sessions in last 7 days',
      rationale: 'filter bots',
      threshold: { op: '=', value: 0 },
    },
  ],
  segmentMatch: { existingId: null },
  campaignTemplate: {
    headline: 'When a whale stays away for 14+ days, send a hand-picked comeback gift.',
    eventSource: { name: 'daily_whale_dormancy_check', peakRate: 'batch · 1×/day', lifecycle: 'mature · 24mo' },
    action: {
      channel: 'push',
      payload: 'We miss you · 50 gems gift + 20% off Premium Pass',
      cooldown: '14d',
      platformCap: '1/14d',
      abHoldout: '15%',
    },
    alignment: { tag: '4r-reactivate', score: 0.88, rationale: 'Whale-recall · NTH-202 precedent recovered 24% in 7d on similar predicate' },
    fireMetrics: {
      forecastDailyFires: '~280/day',
      peakRate: 'batch ~3.8k/day',
      latency: 'p99 11s (batch)',
      estLift: '+24% recovery in 7d',
    },
    triggerLifecycle: ['daily scan', 'predicate match', 'push send', 'cooldown 14d', 'recheck'],
    sampleProfiles: [
      { uid: 'uid-cfm-71024', oneLiner: 'Lifetime 1.2M VND · last login 18d · 0 sessions 7d' },
      { uid: 'uid-cfm-44293', oneLiner: 'Lifetime 850k VND · last login 16d · 0 sessions 7d' },
      { uid: 'uid-cfm-58111', oneLiner: 'Lifetime 2.4M VND · last login 21d · 0 sessions 7d' },
    ],
  },
  scriptedReplies: [
    {
      trigger: 'gift',
      agent: "Switched the gift to a free Pass week — same recovery target, lower margin hit.",
      templatePatch: { payload: 'We miss you · 1 free week of Premium Pass' },
    },
    {
      trigger: 'frequent',
      agent: "Tightened cap to 1/30d — won't pile on if they bounce in and out.",
      templatePatch: { cooldown: '30d', platformCap: '1/30d' },
    },
  ],
};

// ── Stuck on first match (FTUE) — Phase 7 stub ─────────────────────────────
const stuckFirstMatch: Playbook = {
  id: 'stuck-on-first-match',
  keywords: ['stuck', 'first match', 'tutorial', 'ftue', 'onboarding', 'new player', 'first time'],
  patternName: 'ftue-rescue',
  fourR: { tag: '4r-recruit', alignment: 0.90 },
  intro: "FTUE-rescue pattern. New players who can't get past their first match drop off fast. I'll surface them.",
  proposedFeatures: [
    {
      id: 'sa-row-ftue-1',
      featureId: 'tutorial_completed',
      rephrase: 'Tutorial not yet completed',
      rationale: 'core signal',
      threshold: { op: 'is_false', value: false },
      isHeadline: true,
    },
    {
      id: 'sa-row-ftue-2',
      featureId: 'account_age_hours',
      rephrase: 'Account at least 1 hour old',
      rationale: 'filter bots',
      threshold: { op: '>=', value: 1 },
    },
  ],
  segmentMatch: { existingId: null },
  campaignTemplate: {
    headline: 'The moment a new player rage-quits the tutorial, drop a soft hint.',
    eventSource: { name: 'tutorial_progress', peakRate: '~3k/min', lifecycle: 'evergreen' },
    action: {
      channel: 'in-game-popup',
      payload: 'Stuck? Tap here for a quick walkthrough.',
      cooldown: '24h',
      platformCap: '2/day',
      abHoldout: '20%',
    },
    alignment: { tag: '4r-recruit', score: 0.90, rationale: 'FTUE-rescue · CFM-FT3 saw +18% D1 from a similar predicate' },
    fireMetrics: {
      forecastDailyFires: '~5.6k/day',
      peakRate: '~3k events/min',
      latency: 'p99 90ms',
      estLift: '+18% D1 retention (FTUE cohort)',
    },
    triggerLifecycle: ['event', 'predicate match', 'in-game popup', 'cooldown 24h', 'resume'],
    sampleProfiles: [
      { uid: 'uid-cfm-91204', oneLiner: '3h account · tutorial step 2 · 0 matches' },
      { uid: 'uid-cfm-91219', oneLiner: '2h account · tutorial step 1 · 0 matches' },
      { uid: 'uid-cfm-91241', oneLiner: '5h account · tutorial step 3 · 1 match · lost' },
    ],
  },
  scriptedReplies: [
    {
      trigger: 'hint',
      agent: "Replaced the popup copy with a softer 'Need a hand?' prompt — keeps the help in-game without being intrusive.",
      templatePatch: { payload: 'Need a hand? Tap for a 30-second walkthrough.' },
    },
  ],
};

// ── 7-day non-payers — Phase 7 stub ────────────────────────────────────────
const sevenDayNonPayers: Playbook = {
  id: '7-day-non-payers',
  keywords: ['7-day', '7 day', 'non-payer', 'non payer', 'non-paying', 'free user', 'free players', 'starter pack', 'first purchase', 'conversion'],
  patternName: 'first-purchase-push',
  fourR: { tag: '4r-revenue', alignment: 0.84 },
  intro: "First-purchase push pattern. Players past day 7 who're engaged but haven't paid yet are the highest-conversion cohort.",
  proposedFeatures: [
    {
      id: 'sa-row-7d-1',
      featureId: 'tenure_days',
      rephrase: 'Tenure between 7 and 14 days',
      rationale: 'core signal',
      threshold: { op: '>=', value: 7 },
      isHeadline: true,
    },
    {
      id: 'sa-row-7d-2',
      featureId: 'is_paying_user_lifetime',
      rephrase: 'Has never paid',
      rationale: 'cohort filter',
      threshold: { op: 'is_false', value: false },
    },
    {
      id: 'sa-row-7d-3',
      featureId: 'session_count_7d',
      rephrase: '3+ sessions in last 7 days (engaged)',
      rationale: 'filter bots',
      threshold: { op: '>=', value: 3 },
    },
  ],
  segmentMatch: { existingId: null },
  campaignTemplate: {
    headline: 'When an engaged 7-day non-payer returns, offer a one-time starter pack.',
    eventSource: { name: 'session_start', peakRate: '~22k/min', lifecycle: 'evergreen' },
    action: {
      channel: 'iam',
      payload: 'Starter Pack · 50% off · 500 gems + 1 weapon skin · 24h only',
      cooldown: '7d',
      platformCap: '1/7d',
      abHoldout: '15%',
    },
    alignment: { tag: '4r-revenue', score: 0.84, rationale: 'First-purchase push · 7-day engaged non-payers convert 3.2× the floor' },
    fireMetrics: {
      forecastDailyFires: '~2.1k/day',
      peakRate: '~22k events/min',
      latency: 'p99 180ms',
      estLift: '+3.2× first-purchase rate vs control',
    },
    triggerLifecycle: ['event', 'predicate match', 'IAM render', 'cooldown 7d', 'resume'],
    sampleProfiles: [
      { uid: 'uid-cfm-83191', oneLiner: 'Day 9 · 5 sessions/7d · never paid' },
      { uid: 'uid-cfm-83217', oneLiner: 'Day 11 · 4 sessions/7d · never paid' },
      { uid: 'uid-cfm-83233', oneLiner: 'Day 8 · 6 sessions/7d · never paid' },
    ],
  },
  scriptedReplies: [
    {
      trigger: 'aggressive',
      agent: "Pulled the discount back to 30% off · 300 gems — still attractive without burning margin.",
      templatePatch: { payload: 'Starter Pack · 30% off · 300 gems + 1 skin · 24h' },
    },
    {
      trigger: 'expand',
      agent: "Loosened the engagement filter to 2+ sessions/7d — wider audience, slightly lower conversion floor.",
    },
  ],
};

// ── Lapsed VIP — Phase 7 stub ──────────────────────────────────────────────
const lapsedVip: Playbook = {
  id: 'lapsed-vip-last-touch',
  keywords: ['vip', 'lapsed vip', 'vip max', 'pass owners', 'pass holder', 'high-tier'],
  patternName: 'vip-last-touch',
  fourR: { tag: '4r-reactivate', alignment: 0.81 },
  intro: "VIP last-touch pattern. High-status players slipping out — re-engage before the status decays.",
  proposedFeatures: [
    {
      id: 'sa-row-vip-1',
      featureId: 'vip_status',
      rephrase: 'Has vip_max status currently',
      rationale: 'core signal',
      threshold: { op: '=', value: 'vip_max' },
      isHeadline: true,
    },
    {
      id: 'sa-row-vip-2',
      featureId: 'last_login_days_ago',
      rephrase: 'Hasn\'t logged in for 5+ days',
      rationale: 'cohort filter',
      threshold: { op: '>=', value: 5 },
    },
  ],
  segmentMatch: { existingId: null },
  campaignTemplate: {
    headline: 'When a vip_max player slips past 5 days idle, send a personal touch.',
    eventSource: { name: 'daily_vip_dormancy_check', peakRate: 'batch · 1×/day', lifecycle: 'mature · 12mo' },
    action: {
      channel: 'email',
      payload: 'Your VIP gift is waiting · 100 gems + a free Pass week · 7 days to claim',
      cooldown: '21d',
      platformCap: '1/21d',
      abHoldout: '20%',
    },
    alignment: { tag: '4r-reactivate', score: 0.81, rationale: 'VIP last-touch · prior cohort recovered 31% within 14d' },
    fireMetrics: {
      forecastDailyFires: '~110/day',
      peakRate: 'batch ~1.4k/day',
      latency: 'p99 7s (batch)',
      estLift: '+31% VIP recovery in 14d',
    },
    triggerLifecycle: ['daily scan', 'predicate match', 'email send', 'cooldown 21d', 'recheck'],
    sampleProfiles: [
      { uid: 'uid-cfm-12001', oneLiner: 'vip_max · last login 6d · spent 4.2M VND lifetime' },
      { uid: 'uid-cfm-12047', oneLiner: 'vip_max · last login 8d · spent 2.1M VND lifetime' },
      { uid: 'uid-cfm-12089', oneLiner: 'vip_max · last login 5d · spent 6.8M VND lifetime' },
    ],
  },
  scriptedReplies: [
    {
      trigger: 'channel',
      agent: "Switched the channel from email to push — VIPs respond faster to in-app touches.",
      templatePatch: { channel: 'push' },
    },
  ],
};

// ── Catalog ────────────────────────────────────────────────────────────────
export const allPlaybooks: readonly Playbook[] = Object.freeze([
  lossStreak, whaleDormancy, stuckFirstMatch, sevenDayNonPayers, lapsedVip,
]);

export const opportunityToPlaybookMap: Readonly<Record<string, PlaybookId>> = Object.freeze({
  'ag-op-1042': 'loss-streak',
  'ag-op-1043': 'whale-dormancy',
});

export function getPlaybookById(id: PlaybookId): Playbook | undefined {
  return allPlaybooks.find((p) => p.id === id);
}
