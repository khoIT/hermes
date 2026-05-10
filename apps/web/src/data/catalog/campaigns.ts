/**
 * Campaign catalog — 7 campaigns (5 representative + 2 agent-drafted variants).
 * Source: Hermes_Demo_Data.md Part 3 + PRD_Hermes_Agentic.md §7.2
 *
 * Naming: cmp-{game}-{seq} per Hermes_Demo_Data.md Part 4
 *
 * Representative (5):
 *   cmp-cfm-402  CFM-2  Voting Vũ Khí SS1        one-time segment push
 *   cmp-cfm-411  CFM-11 Lễ Hội Cuối Năm           scheduled 4-segment branching
 *   cmp-cfm-407  CFM-13 Pass Stuck Rescue          real-time A/B/holdout — ANCHOR
 *   cmp-cfm-408  CFM-18 Low CF Coin + Promoted     real-time mid-session balance
 *   cmp-tf-001   TF-1   Football Hub               hybrid segment-seed + real-time
 *
 * Agent-drafted variants (2):
 *   cmp-cfm-pass-stuck-variant-b  from ag-op-1042
 *   cmp-nth-whale-comeback        from ag-op-1043
 */
import type { HermesCampaign } from '@hermes/contracts';

// ---------------------------------------------------------------------------
// CFM-2 · Voting Vũ Khí SS1 — one-time segment push
// ---------------------------------------------------------------------------
const cmpCfm402: HermesCampaign = {
  id: 'cmp-cfm-402',
  displayName: 'CFM-2 · Voting Vũ Khí SS1',
  game: 'CFM',
  triggerType: 'one-time',
  goal4r: 'retain',
  audienceRef: 'seg-cfm-ss1-weapon-owners-2026',
  variants: [
    {
      id: 'A',
      label: 'Push + IAM banner',
      allocation: 1.0,
      payload: 'Push notification + IAM banner deep-linked to weapon vote H5',
    },
  ],
  holdout: { fraction: 0.0, balanced: false },
  status: 'ended',
  author: 'hand-built',
  windowStart: '2026-06-29',
  windowEnd: '2026-07-12',
};

// ---------------------------------------------------------------------------
// CFM-11 · Lễ Hội Cuối Năm / Sinh Nhật CFL — scheduled 4-segment branching
// ---------------------------------------------------------------------------
const cmpCfm411: HermesCampaign = {
  id: 'cmp-cfm-411',
  displayName: 'CFM-11 · Lễ Hội Cuối Năm',
  game: 'CFM',
  triggerType: 'scheduled',
  goal4r: 'revenue',
  audienceRef: 'seg-cfm-rfm-tier-1-2026',   // primary; campaign also refs tiers 2-4
  schedule: 'Daily 06:00 ICT rebuild · 18–31 Dec 2026',
  variants: [
    {
      id: 'tier-1',
      label: 'NRU reward bundle',
      allocation: 0.25,
      payload: 'Onboarding XP pack + IAM banner with welcome copy',
    },
    {
      id: 'tier-2',
      label: 'Mid upsell bundle',
      allocation: 0.25,
      payload: 'Double-gem pack + IAM banner with match stats ("You played N matches")',
    },
    {
      id: 'tier-3',
      label: 'High recognition bundle',
      allocation: 0.25,
      payload: 'Exclusive cosmetic + personalized contribution stats banner',
    },
    {
      id: 'tier-4',
      label: 'Whale VIP bundle',
      allocation: 0.25,
      payload: 'VIP recognition pack + private thank-you message from studio',
    },
  ],
  holdout: { fraction: 0.05, balanced: true },
  status: 'scheduled',
  author: 'hand-built',
  windowStart: '2026-12-18',
  windowEnd: '2026-12-31',
};

// ---------------------------------------------------------------------------
// CFM-13 / cmp-cfm-407 · Pass Stuck Rescue — CANONICAL DEMO ANCHOR
// TriggerID: trg-cfm-pass-stuck
// ---------------------------------------------------------------------------
const cmpCfm407: HermesCampaign = {
  id: 'cmp-cfm-407',
  displayName: 'CFM-13 · Pass Stuck Rescue',
  game: 'CFM',
  triggerType: 'real-time',
  goal4r: 'retain',
  audienceRef: null,              // pure real-time; no pre-built segment
  eventTrigger: 'event_match_end',
  triggerId: 'trg-cfm-pass-stuck',
  triggerPolicies: {
    cooldownHours: 24,
    antiFatigueMaxIam24h: 2,
  },
  variants: [
    {
      id: 'A',
      label: 'MMR Shield',
      allocation: 0.45,
      payload: 'IAM "MMR shield · Next loss won\'t drop your rank"',
    },
    {
      id: 'B',
      label: 'XP Boost',
      allocation: 0.45,
      payload: 'IAM "Bonus XP boost · +50% XP on next 3 wins"',
    },
    {
      id: 'holdout',
      label: 'Holdout',
      allocation: 0.10,
      payload: 'No IAM — control group',
    },
  ],
  holdout: { fraction: 0.10, balanced: true },
  journey: [
    { day: 0, type: 'action', label: 'IAM shown (variant per A/B allocation)' },
    { day: 1, type: 'wait', label: 'Wait 24h' },
    {
      day: 1,
      type: 'condition',
      label: 'Did event_match_end.outcome = win occur within 24h?',
      branches: { yes: 'Goal "Recovered"', no: 'Exit "No recovery"' },
    },
  ],
  status: 'active',
  author: 'hand-built',
  // Demo thread back-link — demo action_card_campaign navigates here so the
  // ContinueInChatPill and source-thread banner render without a live-campaign lookup.
  sourceThreadId: 'thread-demo-livops-2026',
  estimatedFiresPerDay: 3420,
  estimatedUniquePlayers7d: 18200,
};

// ---------------------------------------------------------------------------
// CFM-18 · Low CF Coin + Promoted Item — real-time mid-session balance check
// ---------------------------------------------------------------------------
const cmpCfm408: HermesCampaign = {
  id: 'cmp-cfm-408',
  displayName: 'CFM-18 · Low CF Coin + Promoted Item',
  game: 'CFM',
  triggerType: 'real-time',
  goal4r: 'revenue',
  audienceRef: null,
  eventTrigger: 'event_currency_balance_change',
  triggerPolicies: {
    cooldownHours: 12,
    globalCapPerDay: 50000,
    antiFatigueMaxIam24h: 2,
  },
  variants: [
    {
      id: 'A',
      label: 'CF Coin top-up offer',
      allocation: 1.0,
      payload: 'IAM with CF Coin top-up offer pre-priced at gap to promoted item ("Top up 400 CF Coins for 99đ")',
    },
  ],
  holdout: { fraction: 0.10, balanced: true },
  status: 'active',
  author: 'hand-built',
  estimatedFiresPerDay: 12800,
  estimatedUniquePlayers7d: 7400,
};

// ---------------------------------------------------------------------------
// TF-1 · Football Hub Học Viện Sân Cỏ — hybrid segment-seed + real-time trigger
// ---------------------------------------------------------------------------
const cmpTf001: HermesCampaign = {
  id: 'cmp-tf-001',
  displayName: 'TF-1 · Football Hub Học Viện Sân Cỏ',
  game: 'TF',
  triggerType: 'hybrid',
  goal4r: 'reactivate',
  audienceRef: 'seg-tf-returning-coaches-2026',
  eventTrigger: 'event_login',
  triggerId: 'trg-tf-returning-login',
  triggerPolicies: { cooldownHours: 336 },  // 14-day per-user clock
  variants: [
    {
      id: 'A',
      label: 'Activation journey',
      allocation: 0.90,
      payload: '14-day guided re-engagement with chapter-stuck rescue branches',
    },
    {
      id: 'holdout',
      label: 'Holdout',
      allocation: 0.10,
      payload: 'No IAM/Push — Day-14 goal still measured',
    },
  ],
  holdout: { fraction: 0.10, balanced: true },
  journey: [
    { day: 0, type: 'action', label: 'IAM "Welcome back coach"' },
    { day: 1, type: 'wait', label: 'Wait 24h' },
    {
      day: 1,
      type: 'condition',
      label: 'session_count_1d > 0?',
      branches: { yes: 'Continue', no: 'Push "Your team\'s waiting"' },
    },
    { day: 3, type: 'wait', label: 'Wait 48h' },
    {
      day: 3,
      type: 'condition',
      label: 'chapter_progress_max advanced?',
      branches: { yes: 'Continue', no: 'IAM "Chapter rescue tutorial"' },
    },
    { day: 7, type: 'wait', label: 'Wait 96h' },
    {
      day: 7,
      type: 'condition',
      label: 'session_count_7d >= 1?',
      branches: { yes: 'Continue', no: 'Re-engage push' },
    },
    { day: 14, type: 'wait', label: 'Wait 168h' },
    {
      day: 14,
      type: 'goal',
      label: 'ranked_match_count_30d increased ≥5 → Activated | else → Not activated',
    },
  ],
  status: 'active',
  author: 'hand-built',
  estimatedFiresPerDay: 600,
  windowStart: '2026-09-01',
  windowEnd: '2026-09-30',
};

// ---------------------------------------------------------------------------
// Agent-drafted variant 1 — from ag-op-1042 (Authoring Agent §7.2 #1)
// ---------------------------------------------------------------------------
const cmpCfmPassStuckVariantB: HermesCampaign = {
  id: 'cmp-cfm-pass-stuck-variant-b',
  displayName: 'CFM · Pass Stuck Rescue · Variant B (Agent Draft)',
  game: 'CFM',
  triggerType: 'real-time',
  goal4r: 'retain',
  audienceRef: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9',
  eventTrigger: 'event_match_end',
  triggerId: 'trg-cfm-pass-stuck-b',
  triggerPolicies: {
    cooldownHours: 24,
    antiFatigueMaxIam24h: 2,
  },
  variants: [
    {
      id: 'A',
      label: 'CF Coin grant',
      allocation: 0.90,
      payload: 'IAM grant 200 CF Coin + retry banner',
    },
    {
      id: 'holdout',
      label: 'Holdout',
      allocation: 0.10,
      payload: 'No IAM — control group',
    },
  ],
  holdout: { fraction: 0.10, balanced: true },
  journey: [
    { day: 0, type: 'action', label: 'IAM grant 200 CF Coin + retry banner' },
    { day: 1, type: 'wait', label: 'Wait 24h' },
    {
      day: 1,
      type: 'goal',
      label: 'D1 retention measured — forecast lift +7%',
    },
  ],
  status: 'draft',
  author: 'agent-drafted',
  agentRef: 'ag-op-1042',
  estimatedFiresPerDay: 3420,
  estimatedUniquePlayers7d: 18200,
};

// ---------------------------------------------------------------------------
// Agent-drafted variant 2 — from ag-op-1043 (Authoring Agent §7.2 #2)
// ---------------------------------------------------------------------------
const cmpNthWhaleComeback: HermesCampaign = {
  id: 'cmp-nth-whale-comeback',
  displayName: 'NTH · Whale Comeback Campaign (Agent Draft)',
  game: 'NTH',
  triggerType: 'real-time',
  goal4r: 'retain',
  audienceRef: 'seg-nth-whale-at-risk-2026',
  eventTrigger: 'event_login',
  triggerPolicies: {
    cooldownHours: 72,
    antiFatigueMaxIam24h: 1,
  },
  variants: [
    {
      id: 'A',
      label: 'VIP welcome-back pack',
      allocation: 0.90,
      payload: 'IAM "Welcome back [name] — your housing plot is waiting" + VIP gift bundle',
    },
    {
      id: 'holdout',
      label: 'Holdout',
      allocation: 0.10,
      payload: 'No IAM — control group',
    },
  ],
  holdout: { fraction: 0.10, balanced: true },
  status: 'draft',
  author: 'agent-drafted',
  agentRef: 'ag-op-1043',
  estimatedFiresPerDay: 280,
  estimatedUniquePlayers7d: 1800,
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export const allCampaigns: HermesCampaign[] = [
  cmpCfm402,
  cmpCfm411,
  cmpCfm407,    // ← anchor campaign
  cmpCfm408,
  cmpTf001,
  cmpCfmPassStuckVariantB,
  cmpNthWhaleComeback,
];

export {
  cmpCfm402,
  cmpCfm411,
  cmpCfm407,
  cmpCfm408,
  cmpTf001,
  cmpCfmPassStuckVariantB,
  cmpNthWhaleComeback,
};
