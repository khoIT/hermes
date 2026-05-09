/**
 * Agent opportunities catalog — 9 Insight Agent proposals.
 * Source: PRD_Hermes_Agentic.md §7.1
 *
 * 5 anchored to existing demo campaigns + 4 lower-priority inbox fillers.
 * ag-op-1042 is the canonical demo anchor (step 11 of the demo flow).
 */
import type { Opportunity } from '@hermes/contracts';

// ---------------------------------------------------------------------------
// 1. CFM Loss Streak non-paying growth — DEMO ANCHOR (ag-op-1042)
// ---------------------------------------------------------------------------
export const opCfmLossStreak: Opportunity = {
  id: 'ag-op-1042',
  agent: 'insight',
  surfacedAt: '2026-05-08T06:14:42+07:00',
  confidence: 0.78,
  window: 'this week · act by Friday',
  intent: 'Players in CFM ranked who lose 5+ but never paid are growing 18% week-over-week — no campaign serves them.',
  evidence: [
    {
      label: 'consecutive_ranked_losses_streak ≥ 5 — population +18% (7d)',
      sparklineKey: 'spk-consecutive-ranked-losses-streak',
      meta: '+18% WoW · ~23,890 UIDs',
    },
    {
      label: 'is_paying_user_lifetime = false in this cohort — 91%',
      sparklineKey: 'spk-is-paying-user-lifetime',
      meta: '91% non-paying',
    },
    {
      label: 'No active campaign references this combination',
      meta: 'Gap confirmed via campaign cross-ref scan',
    },
  ],
  proposed: {
    segment: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9',
    campaign: 'cmp-cfm-pass-stuck-variant-b',
  },
  whyNow: 'Three prior campaigns of similar shape averaged +6.4% D1 retention (CFM-407, CFM-409, NTH-202). The cohort grew 18% in 7 days, projected to grow another ~12% next week. Acting now captures ~31% more impressions than acting on Friday.',
  game: 'CFM',
  goal4r: 'retain',
  status: 'open',
  agentThread: [
    '06:14:02  scan       feature-drift cycle started',
    '06:14:18  detect     consecutive_ranked_losses_streak.population_p90 +18% (7d)',
    '06:14:22  cross-ref  no active campaign references this feature ≥ 5 + non-paying combo',
    '06:14:31  match      3 prior campaigns of similar shape — avg lift +6.4%',
    '06:14:39  draft      proposed segment + campaign artifact',
    '06:14:42  surface    opportunity ag-op-1042',
  ],
};

// ---------------------------------------------------------------------------
// 2. NTH Whale-at-risk drift (ag-op-1043)
// ---------------------------------------------------------------------------
export const opNthWhaleAtRisk: Opportunity = {
  id: 'ag-op-1043',
  agent: 'insight',
  surfacedAt: '2026-05-07T09:31:05+07:00',
  confidence: 0.65,
  window: 'this week',
  intent: 'NTH whale segment last_login_days p90 shifted +2.1d this week — early churn signal before it becomes a cliff.',
  evidence: [
    {
      label: 'last_login_days_ago p90 for spend_tier=whale shifted +2.1d (7d)',
      sparklineKey: 'spk-last-login-days-ago',
      meta: '+2.1d drift · 3,870 UIDs affected',
    },
    {
      label: 'session_count_7d down 18% for same cohort vs prior week',
      sparklineKey: 'spk-session-count-7d',
      meta: '-18% sessions',
    },
    {
      label: 'No whale-specific reactivation campaign currently active in NTH',
      meta: 'Gap confirmed',
    },
  ],
  proposed: {
    segment: 'seg-nth-whale-at-risk-2026',
    campaign: 'cmp-nth-whale-comeback',
  },
  whyNow: 'NTH-202 ran a similar whale-recall campaign 6 months ago and recovered 24% of the at-risk cohort within 7 days. The drift signal is early — acting before it crosses the 7-day login gap threshold typically yields 2× the recovery rate vs acting after.',
  game: 'NTH',
  goal4r: 'retain',
  status: 'open',
  agentThread: [
    '09:30:48  scan       nightly segment-population drift check',
    '09:30:59  detect     last_login_days_ago.p90 for whale cohort +2.1d vs 7d prior',
    '09:31:01  cross-ref  no active whale recall in NTH campaign set',
    '09:31:04  match      NTH-202 precedent — +24% recovery, similar predicate',
    '09:31:05  surface    opportunity ag-op-1043',
  ],
};

// ---------------------------------------------------------------------------
// 3. TF-1 Football Hub returning coaches (ag-op-1044)
// ---------------------------------------------------------------------------
export const opTfReturningCoaches: Opportunity = {
  id: 'ag-op-1044',
  agent: 'insight',
  surfacedAt: '2026-05-08T07:02:18+07:00',
  confidence: 0.81,
  window: 'today · campaign window opens Sep 1',
  intent: '38k lapsed TF coaches match the Football Hub return criteria — the 14-day per-user clock pattern is not yet drafted for the Sep 1 window.',
  evidence: [
    {
      label: 'last_login_days_ago BETWEEN 30 AND 180 — 38k UIDs matching',
      sparklineKey: 'spk-last-login-days-ago',
      meta: '38,000 UIDs · last_login_days_ago 30–180',
    },
    {
      label: 'chapter_progress_max ≥ 3 — prior engagement confirmed',
      sparklineKey: 'spk-chapter-progress-max',
      meta: '94% of cohort have chapter_progress_max ≥ 3',
    },
  ],
  proposed: {
    segment: 'seg-tf-returning-coaches-2026',
    campaign: 'cmp-tf-001',
  },
  whyNow: 'Sep 1 campaign window is 24 days out. Segment build + campaign approval needs ~3 days. Starting now provides 21 days of buffer for QA, legal clearance (NTH partner assets), and studio sign-off.',
  game: 'TF',
  goal4r: 'reactivate',
  status: 'approved',
  agentThread: [
    '07:01:55  scan       upcoming campaign window horizon check (next 30d)',
    '07:02:01  detect     TF Football Hub Sep 1 window — no draft segment or campaign exists',
    '07:02:09  match      segment predicate matches 38k UIDs vs forecast of 35k',
    '07:02:18  surface    opportunity ag-op-1044',
  ],
};

// ---------------------------------------------------------------------------
// 4. COS-3 step-up tier-1 → tier-4 (ag-op-1045)
// ---------------------------------------------------------------------------
export const opCosStepUp: Opportunity = {
  id: 'ag-op-1045',
  agent: 'insight',
  surfacedAt: '2026-05-06T14:22:09+07:00',
  confidence: 0.58,
  window: 'evergreen',
  intent: 'COS within-session purchase pattern shows tier-1 buyers who see a tier-4 offer within 3 minutes of first purchase convert at 4.2× baseline — a step-up trigger is not yet live.',
  evidence: [
    {
      label: 'event_pack_purchased tier=1 → tier=4 within 3min — 4.2× baseline conversion',
      sparklineKey: 'spk-event-pack-purchased',
      meta: '4.2× conversion rate · 3-minute window',
    },
    {
      label: 'purchase_count_30d > 0 — active buyers in cohort',
      sparklineKey: 'spk-purchase-count-30d',
      meta: '~12,400 eligible players/week',
    },
  ],
  proposed: {
    campaign: 'cmp-cos-step-up-draft',
  },
  whyNow: 'This pattern is evergreen — no time-sensitive window. However, each week without the trigger foregoes ~52k incremental conversions (12.4k × 4.2 × 1.0 baseline). Low urgency, high cumulative value.',
  game: 'COS',
  goal4r: 'revenue',
  status: 'open',
  agentThread: [
    '14:21:44  scan       within-session purchase sequence analysis',
    '14:21:58  detect     tier-1 → tier-4 within 3min at 4.2× baseline — no active trigger',
    '14:22:09  surface    opportunity ag-op-1045',
  ],
};

// ---------------------------------------------------------------------------
// 5. CFM Pass Stuck cooldown experiment (ag-op-1046)
// ---------------------------------------------------------------------------
export const opCfmPassStuckCooldown: Opportunity = {
  id: 'ag-op-1046',
  agent: 'insight',
  surfacedAt: '2026-05-05T11:08:33+07:00',
  confidence: 0.44,
  window: 'this month',
  intent: 'cmp-cfm-407 cooldown at 24h may be too generous — modeled 12h variant predicts +3.1% uplift at cost of +22% fire rate.',
  evidence: [
    {
      label: 'cmp-cfm-407 holdout D1 recovery: 7.2% treatment vs 4.9% control',
      sparklineKey: 'spk-event-match-end',
      meta: '+7.2% D1 recovery vs +4.9% holdout',
    },
    {
      label: '12h cooldown model: +3.1% uplift · +22% fire volume',
      meta: 'Modeled from match cadence histogram',
    },
  ],
  proposed: {
    campaign: 'cmp-cfm-pass-stuck-variant-b',
  },
  whyNow: 'cmp-cfm-407 has been live for 6 weeks with stable metrics. An A/B test of the cooldown variant can run for 2 weeks with 80% power at current fire volume. Lower confidence because the +3.1% is modeled, not observed.',
  game: 'CFM',
  goal4r: 'retain',
  status: 'open',
  agentThread: [
    '11:08:10  scan       active campaign cooldown sensitivity analysis',
    '11:08:21  detect     cmp-cfm-407 cooldown 24h — match-restart cadence histogram suggests 12h optimal',
    '11:08:33  surface    opportunity ag-op-1046',
  ],
};

// ---------------------------------------------------------------------------
// Lower-priority inbox fillers (4)
// ---------------------------------------------------------------------------
export const opPtAnniversary: Opportunity = {
  id: 'ag-op-1047',
  agent: 'insight',
  surfacedAt: '2026-05-07T08:15:00+07:00',
  confidence: 0.72,
  window: 'this month',
  intent: 'PT players whose account_first_login_mmdd falls in the next 14 days have no anniversary campaign queued — historical retention lift for anniversary pushes is +9.4%.',
  evidence: [
    {
      label: 'account_first_login_mmdd in next 14 days — 28,400 UIDs',
      sparklineKey: 'spk-account-first-login-mmdd',
      meta: '28,400 upcoming anniversaries',
    },
    {
      label: 'Prior anniversary campaigns avg +9.4% D7 retention',
      meta: 'Based on PT-1 and PT-3 historical data',
    },
  ],
  proposed: {},
  whyNow: 'Anniversary window is date-fixed — no flexibility. Each day of delay removes ~2,030 players from the reachable audience.',
  game: 'PT',
  goal4r: 'retain',
  status: 'open',
  agentThread: [
    '08:14:52  scan       upcoming anniversary cohort projection',
    '08:15:00  surface    opportunity ag-op-1047',
  ],
};

export const opCfmGuildContribution: Opportunity = {
  id: 'ag-op-1048',
  agent: 'insight',
  surfacedAt: '2026-05-06T16:40:22+07:00',
  confidence: 0.51,
  window: 'evergreen',
  intent: 'CFM guild leaders with high guild_contribution_30d but no active pass are the highest-conversion upsell signal not yet targeted.',
  evidence: [
    {
      label: 'guild_contribution_30d top decile + pass_owned_current = false — 6,200 UIDs',
      sparklineKey: 'spk-guild-contribution-30d',
      meta: '6,200 UIDs · top-decile guild contributors without pass',
    },
  ],
  proposed: {},
  whyNow: 'Evergreen pattern. Current pass season ends in 18 days — acting within the window maximises pass upsell relevance.',
  game: 'CFM',
  goal4r: 'revenue',
  status: 'open',
  agentThread: [
    '16:40:22  surface    opportunity ag-op-1048',
  ],
};

export const opNthUgcCreatorActivation: Opportunity = {
  id: 'ag-op-1049',
  agent: 'insight',
  surfacedAt: '2026-05-05T10:11:30+07:00',
  confidence: 0.63,
  window: 'this week',
  intent: 'NTH UGC creators with high ugc_creator_score have not submitted content in 14+ days — a reactivation nudge historically lifts submission rate 34%.',
  evidence: [
    {
      label: 'ugc_creator_score ≥ 0.6 + no event_ugc_submission in 14d — 4,100 UIDs',
      sparklineKey: 'spk-ugc-creator-score',
      meta: '4,100 dormant creators',
    },
    {
      label: 'NTH-4 reactivation nudge: +34% submission rate in 7d',
      meta: 'Historical lift from NTH-4 run Apr 2026',
    },
  ],
  proposed: {},
  whyNow: 'NTH Mộng Hóa Lục season ends in 12 days. Creator reactivation now maximises content volume before season close.',
  game: 'NTH',
  goal4r: 'retain',
  status: 'open',
  agentThread: [
    '10:11:30  surface    opportunity ag-op-1049',
  ],
};

export const opCrossgameVipLoyalty: Opportunity = {
  id: 'ag-op-1050',
  agent: 'insight',
  surfacedAt: '2026-05-04T07:55:44+07:00',
  confidence: 0.39,
  window: 'evergreen',
  intent: 'Players with VIP status in CFM who have never played NTH represent an untapped cross-title acquisition pool of ~18k UIDs — no cross-game campaign has targeted this combination.',
  evidence: [
    {
      label: 'vip_status ≠ none (CFM) + no NTH session in lifetime — 18,300 UIDs',
      sparklineKey: 'spk-vip-status',
      meta: '18,300 cross-title candidates',
    },
    {
      label: 'Cross-title campaigns in comparable portfolios: avg 8–12% D30 NTH trial rate',
      meta: 'Benchmark from industry comparable',
    },
  ],
  proposed: {},
  whyNow: 'Lower confidence because cross-title conversion benchmarks come from external data, not VNG-specific historical. Evergreen — no time pressure.',
  game: 'CFM',
  goal4r: 'recruit',
  status: 'open',
  agentThread: [
    '07:55:44  surface    opportunity ag-op-1050',
  ],
};

export const allOpportunities: Opportunity[] = [
  opCfmLossStreak,
  opNthWhaleAtRisk,
  opTfReturningCoaches,
  opCosStepUp,
  opCfmPassStuckCooldown,
  opPtAnniversary,
  opCfmGuildContribution,
  opNthUgcCreatorActivation,
  opCrossgameVipLoyalty,
];
