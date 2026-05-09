/* global window */
// Hermes demo data — features, events, segments, campaigns

const FEATURE_DOMAINS = [
  { key: 'engagement',   label: 'Engagement',    count: 9 },
  { key: 'monetization', label: 'Monetization',  count: 12 },
  { key: 'identity',     label: 'Identity & Lifecycle', count: 11 },
  { key: 'gameplay',     label: 'Gameplay (CFM)', count: 10 },
  { key: 'inventory',    label: 'Inventory & Items', count: 5 },
  { key: 'social',       label: 'Social & Playstyle', count: 12 },
  { key: 'currency',     label: 'Currency Snapshots', count: 3 },
  { key: 'streaks',      label: 'Stateful Streaks', count: 2 },
  { key: 'campaign',     label: 'Campaign Engagement', count: 4 },
];

// rough-sample histogram bin arrays (28 bins)
const histo = (peak, skew, base = 4) => Array.from({length: 28}, (_, i) => {
  const x = i / 27;
  const dist = Math.abs(x - peak);
  const v = Math.exp(-dist * dist * 14 * (1 - skew * 0.6)) * 100;
  return Math.max(base + Math.random() * 6, v + Math.random() * 8);
});

const FEATURES = [
  { id: 'consecutive_ranked_losses_streak', display: 'Consecutive ranked losses streak', domain: 'streaks',
    type: 'Counter', tier: 'dual', tierBadges: ['<1s · A', '<1h · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    desc: 'Number of ranked matches lost in a row. Resets on win. Dual-tier: served from Apollo TEE online state at <1s for triggers, mirrored in Iceberg via CDC.',
    p50: 1, p90: 4, p99: 8, max: 14,
    spark: [3,4,5,4,6,5,7], hist: histo(0.20, 0.6),
    usedBy: { segments: 4, campaigns: 2 },
    freshness: '14s ago', lastBuild: 'streaming',
  },
  { id: 'is_paying_user_lifetime', display: 'Is paying user (lifetime)', domain: 'monetization',
    type: 'Boolean', tier: 'warm', tierBadges: ['<1h · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    desc: 'True when player has ever made a non-refunded purchase. Computed from union of all event_purchase records.',
    spark: [4,4,5,5,6,6,7], hist: [70, 30],
    usedBy: { segments: 18, campaigns: 12 },
    freshness: '38m ago',
  },
  { id: 'mmr_drift_7d', display: 'MMR drift (7d)', domain: 'gameplay',
    type: 'Counter', tier: 'cold', tierBadges: ['<1d · B'],
    owner: 'CFM', ownerAvatar: 'KP', status: 'Active',
    desc: 'mmr_current minus mmr value 7 days ago. Negative values indicate skill regression — used to detect frustration cohorts.',
    p50: -2, p90: -22, p99: -45, max: 60,
    spark: [5,5,4,5,6,5,6], hist: histo(0.42, 0.0),
    usedBy: { segments: 7, campaigns: 3 },
    freshness: '6h ago',
  },
  { id: 'account_age_days', display: 'Account age (days)', domain: 'identity',
    type: 'Counter', tier: 'cold', tierBadges: ['<1d · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    desc: 'Days since account_first_login_ts. Recomputed nightly.',
    p50: 412, p90: 1240, p99: 1890, max: 2400,
    spark: [4,4,5,5,5,6,6], hist: histo(0.30, 0.4),
    usedBy: { segments: 26, campaigns: 22 },
    freshness: '8h ago',
  },
  { id: 'spend_tier_lifetime', display: 'Spend tier (lifetime)', domain: 'monetization',
    type: 'Tag', tier: 'cold', tierBadges: ['<1d · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    desc: 'free / low / mid / high / whale — based on lifetime gross revenue with portfolio-tuned cutoffs.',
    spark: [5,5,5,5,5,5,5], hist: [42,28,18,8,4],
    usedBy: { segments: 22, campaigns: 18 },
    freshness: '8h ago',
  },
  { id: 'cf_coin_balance_current', display: 'CF Coin balance (current)', domain: 'currency',
    type: 'Counter', tier: 'warm', tierBadges: ['<1h · B'],
    owner: 'CFM', ownerAvatar: 'KP', status: 'Active',
    desc: 'CFM secondary currency balance. Snapshotted hourly; mirrored in TEE online state for trigger evaluation.',
    p50: 320, p90: 1820, p99: 5400, max: 12000,
    spark: [4,5,5,4,6,5,6], hist: histo(0.18, 0.7),
    usedBy: { segments: 3, campaigns: 4 },
    freshness: '24m ago',
  },
  { id: 'is_test_account', display: 'Is test account', domain: 'identity',
    type: 'Boolean', tier: 'cold', tierBadges: ['<1d · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    desc: 'Always exclude from production segments. Source: internal QA roster + flag on signup.',
    usedBy: { segments: 31, campaigns: 28 }, freshness: '8h ago',
  },
  { id: 'iam_received_count_24h', display: 'IAM received count (24h)', domain: 'campaign',
    type: 'Counter', tier: 'warm', tierBadges: ['<1h · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    desc: 'In-app messages received in the last 24 hours. Used in anti-fatigue clauses.',
    spark: [3,4,5,4,5,6,5], hist: histo(0.05, 0.9),
    usedBy: { segments: 1, campaigns: 14 }, freshness: '12m ago',
  },
  { id: 'tenure_days_total', display: 'Tenure days total', domain: 'identity',
    type: 'Counter', tier: 'cold', tierBadges: ['<1d · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    spark: [4,4,5,5,5,6,6],
    usedBy: { segments: 4, campaigns: 5 }, freshness: '8h ago',
  },
  { id: 'gem_balance_current', display: 'Gem balance (current)', domain: 'currency',
    type: 'Counter', tier: 'warm', tierBadges: ['<1h · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    spark: [4,5,5,5,6,5,6],
    usedBy: { segments: 6, campaigns: 9 }, freshness: '24m ago',
  },
  { id: 'weapon_owned_lifetime', display: 'Weapon owned (lifetime)', domain: 'inventory',
    type: 'Array', tier: 'cold', tierBadges: ['<1d · B'],
    owner: 'CFM', ownerAvatar: 'KP', status: 'Active',
    spark: [5,5,5,5,5,5,5],
    usedBy: { segments: 5, campaigns: 4 }, freshness: '8h ago',
  },
  { id: 'last_login_days_ago', display: 'Last login days ago', domain: 'identity',
    type: 'Counter', tier: 'cold', tierBadges: ['<1d · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    spark: [5,4,5,5,5,6,6],
    usedBy: { segments: 12, campaigns: 14 }, freshness: '8h ago',
  },
  { id: 'daily_login_streak_current', display: 'Daily login streak (current)', domain: 'engagement',
    type: 'Streak', tier: 'cold', tierBadges: ['<1d · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    spark: [4,4,5,5,6,5,6],
    usedBy: { segments: 8, campaigns: 7 }, freshness: '8h ago',
  },
  { id: 'session_count_7d', display: 'Session count (7d)', domain: 'engagement',
    type: 'Counter', tier: 'cold', tierBadges: ['<1d · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    spark: [5,5,5,4,5,6,5],
    usedBy: { segments: 9, campaigns: 6 }, freshness: '8h ago',
  },
  { id: 'vip_status', display: 'VIP status', domain: 'monetization',
    type: 'Tag', tier: 'warm', tierBadges: ['<1h · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    spark: [5,5,5,5,5,5,5],
    usedBy: { segments: 11, campaigns: 13 }, freshness: '20m ago',
  },
  { id: 'pass_owned_current', display: 'Pass owned (current)', domain: 'monetization',
    type: 'Boolean', tier: 'warm', tierBadges: ['<1h · B'],
    owner: 'GDS', ownerAvatar: 'TL', status: 'Active',
    spark: [4,5,5,5,5,6,5], hist: [62, 38],
    usedBy: { segments: 5, campaigns: 8 }, freshness: '20m ago',
  },
  { id: 'ranked_match_count_30d', display: 'Ranked match count (30d)', domain: 'gameplay',
    type: 'Counter', tier: 'cold', tierBadges: ['<1d · B'],
    owner: 'CFM', ownerAvatar: 'KP', status: 'Active',
    spark: [4,5,5,5,6,6,6],
    usedBy: { segments: 6, campaigns: 5 }, freshness: '8h ago',
  },
  { id: 'mong_hoa_luc_popularity_score', display: 'Mong Hoa Luc popularity score', domain: 'social',
    type: 'Score', tier: 'warm', tierBadges: ['<1h · B'],
    owner: 'NTH', ownerAvatar: 'NL', status: 'Beta',
    spark: [3,4,5,4,5,5,6],
    usedBy: { segments: 1, campaigns: 1 }, freshness: '32m ago',
  },
  { id: 'anti_fraud_trust_score', display: 'Anti-fraud trust score', domain: 'social',
    type: 'Score', tier: 'warm', tierBadges: ['<1h · B'],
    owner: 'NTH', ownerAvatar: 'NL', status: 'Active',
    spark: [5,5,5,5,5,5,5],
    usedBy: { segments: 2, campaigns: 1 }, freshness: '8m ago',
  },
];

const EVENTS = [
  { id: 'event_match_end', name: 'event_match_end', domain: 'Match & gameplay',
    desc: 'Fires when a ranked or casual match completes for a player.',
    properties: ['outcome', 'mode', 'mmr_change', 'kills', 'deaths', 'weapon_used', 'duration'],
    volume: '4.2M /day', peak: '128k/min', latency: '~340ms',
    schema: 'v3.2 · stable', drift: false, spark: [4,5,5,6,5,6,5],
  },
  { id: 'event_currency_balance_change', name: 'event_currency_balance_change', domain: 'Item & inventory',
    desc: 'Fires whenever a player\'s currency balance changes.',
    properties: ['currency', 'delta', 'balance_after', 'reason'],
    volume: '12M /day', peak: '380k/min', latency: '~210ms',
    schema: 'v2.1 · stable', drift: false, spark: [5,5,5,5,5,5,5],
  },
  { id: 'event_login', name: 'event_login', domain: 'Session & login',
    desc: 'Player session start.',
    properties: ['is_first_login_in_window', 'last_login_gap_days', 'platform'],
    volume: '2.1M /day', peak: '45k/min', latency: '~180ms',
    schema: 'v4.0 · stable', drift: false, spark: [4,5,4,5,5,6,5],
  },
  { id: 'event_lobby_idle_60min', name: 'event_lobby_idle_60min', domain: 'Session & login',
    desc: 'Timer event; fires after 60 minutes of lobby idle.',
    properties: [],
    volume: '180k /day', peak: '6k/min', latency: '<1s',
    schema: 'v1.0 · stable', drift: true, spark: [5,5,5,4,5,5,4],
  },
  { id: 'event_purchase', name: 'event_purchase', domain: 'Purchase & monetization',
    desc: 'IAP purchase finalized.',
    properties: ['sku', 'currency', 'gross_charged_amount', 'order_number'],
    volume: '380k /day', peak: '12k/min', latency: '~420ms',
    schema: 'v3.0 · stable', drift: false, spark: [4,5,5,5,6,6,5],
  },
  { id: 'event_pack_purchased', name: 'event_pack_purchased', domain: 'Purchase & monetization',
    desc: 'Tiered pack purchased — used by step-up campaigns.',
    properties: ['tier', 'sku'], volume: '24k /day', peak: '800/min', latency: '~320ms',
    schema: 'v2.0 · stable', drift: false, spark: [4,5,5,5,5,6,5],
  },
];

const SEGMENTS = [
  { id: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9',
    display: 'CFM ranked loss streak · non-paying',
    goal: 'Retain', type: 'Hand-built',
    size: 23890, mauPct: 1.9, asOf: '2026-05-08 06:00 ICT',
    owner: 'Khoi · CFM', ownerAvatar: 'KP', edited: '2 hours ago',
    campaigns: 1, drift: false,
    spark: [22,23,21,22,24,23,24],
    desc: 'Players in CFM ranked who are losing streaks of 5 or more, are not paying users, and whose MMR has drifted negative over the last week.',
  },
  { id: 'seg-cfm-ss1-weapon-owners-2026',
    display: 'CFM SS1 weapon owners',
    goal: 'Recruit', type: 'Hand-built',
    size: 84200, mauPct: 6.8, asOf: '2026-06-29 06:00 ICT',
    owner: 'Khoi · CFM', ownerAvatar: 'KP', edited: '1 day ago',
    campaigns: 1, drift: false,
    spark: [82,83,84,82,85,84,84],
  },
  { id: 'seg-cfm-eoy-tier1-nru',
    display: 'CFM EoY · Tier 1 NRU',
    goal: 'Reactivate', type: 'Hand-built',
    size: 480000, mauPct: 38.4, asOf: '2026-12-18 06:00 ICT',
    owner: 'Lan · CFM', ownerAvatar: 'LL', edited: '3 days ago',
    campaigns: 1, drift: true,
    spark: [44,46,48,47,49,48,48],
  },
  { id: 'seg-cfm-eoy-tier4-whale',
    display: 'CFM EoY · Tier 4 Whale',
    goal: 'Revenue', type: 'Hand-built',
    size: 22340, mauPct: 1.8, asOf: '2026-12-18 06:00 ICT',
    owner: 'Lan · CFM', ownerAvatar: 'LL', edited: '3 days ago',
    campaigns: 1, drift: false,
    spark: [21,22,22,21,23,22,22],
  },
  { id: 'seg-tf-returning-coaches',
    display: 'TF returning coaches',
    goal: 'Reactivate', type: 'Hand-built',
    size: 38120, mauPct: 8.4, asOf: '2026-09-01 00:00 ICT',
    owner: 'Vinh · TF', ownerAvatar: 'VT', edited: '5 days ago',
    campaigns: 1, drift: false,
    spark: [37,38,38,38,38,38,38],
  },
  { id: 'seg-cfm-pass-stuck-responders',
    display: 'CFM Pass Stuck · Variant A responders',
    goal: 'Retain', type: 'Derived from journey',
    size: 4720, mauPct: 0.4, asOf: '2026-05-07 18:00 ICT',
    owner: 'Khoi · CFM', ownerAvatar: 'KP', edited: '6 hours ago',
    campaigns: 0, drift: false,
    spark: [4,4,5,4,5,5,5],
  },
  { id: 'seg-nth-couples-active',
    display: 'NTH active couples',
    goal: 'Retain', type: 'Hand-built',
    size: 12880, mauPct: 1.1, asOf: '2026-05-07 06:00 ICT',
    owner: 'Mai · NTH', ownerAvatar: 'MN', edited: '1 week ago',
    campaigns: 2, drift: false,
    spark: [12,13,12,13,13,12,13],
  },
  { id: 'seg-cos-step-up-tier3',
    display: 'COS step-up tier 3 candidates',
    goal: 'Revenue', type: 'Derived from Explore',
    size: 7240, mauPct: 0.6, asOf: '2026-05-07 06:00 ICT',
    owner: 'Đạt · COS', ownerAvatar: 'DT', edited: '2 weeks ago',
    campaigns: 1, drift: false,
    spark: [7,7,7,7,7,7,7],
  },
  { id: 'seg-cfm-vip-active-draft',
    display: 'CFM VIP active (draft)',
    goal: 'Revenue', type: 'Hand-built',
    size: 0, mauPct: 0, asOf: '—', status: 'Draft',
    owner: 'Khoi · CFM', ownerAvatar: 'KP', edited: '4 hours ago',
    campaigns: 0, drift: false,
    spark: [],
  },
];

const CAMPAIGNS = [
  { id: 'cmp-cfm-407', display: 'Pass Stuck Rescue',
    goal: 'Retain', triggerType: 'Real-time', status: 'Active',
    audience: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9',
    audienceLabel: 'CFM ranked loss streak · non-paying',
    triggerId: 'trg-cfm-pass-stuck',
    fires: '3,420 /day', reach: '18,200 /wk', lift: '+8.2%',
    liftSig: true, holdout: '10%', spark: [3,4,4,5,5,5,5],
    owner: 'Khoi · CFM', ownerAvatar: 'KP', edited: '2 hours ago',
    runDays: 14,
  },
  { id: 'cmp-cfm-218', display: 'Voting Vũ Khí SS1',
    goal: 'Recruit', triggerType: 'One-time', status: 'Ended',
    audience: 'seg-cfm-ss1-weapon-owners-2026',
    audienceLabel: 'CFM SS1 weapon owners',
    fires: '84,200 sent', reach: '84,200', lift: '—',
    spark: [5,8,2,1,1,0,0],
    owner: 'Khoi · CFM', ownerAvatar: 'KP', edited: '2 days ago',
  },
  { id: 'cmp-cfm-411', display: 'Lễ Hội Cuối Năm · Tier 1 NRU',
    goal: 'Reactivate', triggerType: 'Scheduled', status: 'Active',
    audience: 'seg-cfm-eoy-tier1-nru',
    audienceLabel: 'CFM EoY · Tier 1 NRU',
    fires: '480k /day', reach: '480k /day', lift: '+3.1%',
    holdout: '5%', spark: [5,5,5,5,5,5,5],
    owner: 'Lan · CFM', ownerAvatar: 'LL', edited: '1 day ago',
  },
  { id: 'cmp-cfm-418', display: 'Low CF Coin + Promoted Item',
    goal: 'Revenue', triggerType: 'Real-time', status: 'Active',
    triggerId: 'trg-cfm-low-coin-promo',
    audience: null, audienceLabel: '— eligibility: VIP only',
    fires: '12,800 /day', reach: '7,400 /wk', lift: '+12.4%',
    liftSig: true, holdout: '10%', spark: [4,4,5,5,5,5,5],
    owner: 'Khoi · CFM', ownerAvatar: 'KP', edited: '4 hours ago',
  },
  { id: 'cmp-tf-101', display: 'Football Hub · Học Viện Sân Cỏ',
    goal: 'Reactivate', triggerType: 'Real-time', status: 'Active',
    audience: 'seg-tf-returning-coaches', audienceLabel: 'TF returning coaches',
    triggerId: 'trg-tf-returning-login',
    fires: 'Hybrid · 38k seed + 600/day', reach: '~38,600', lift: 'measuring',
    holdout: '10%', spark: [4,5,5,5,5,5,5],
    owner: 'Vinh · TF', ownerAvatar: 'VT', edited: '3 days ago',
  },
  { id: 'cmp-cfm-322', display: 'CFM-13 Pass Stuck · Draft v2',
    goal: 'Retain', triggerType: 'Real-time', status: 'Draft',
    audienceLabel: 'CFM ranked loss streak · non-paying',
    fires: '—', reach: '—', lift: '—',
    spark: [], owner: 'Khoi · CFM', ownerAvatar: 'KP', edited: '20 minutes ago',
  },
  { id: 'cmp-nth-052', display: 'Couples weekly minigame',
    goal: 'Retain', triggerType: 'Scheduled', status: 'Active',
    audience: 'seg-nth-couples-active', audienceLabel: 'NTH active couples',
    fires: '12,880 /wk', reach: '12,880', lift: '+4.8%',
    holdout: '10%', spark: [4,5,5,5,5,5,5],
    owner: 'Mai · NTH', ownerAvatar: 'MN', edited: '5 days ago',
  },
];

// ── Feature selectivity (for live audience computation) ───────────────────
// Returns fraction of MAU (1.25M base) matching the row.
const MAU_BASE = 1250000;
const CFM_RANKED_ACTIVE_FRAC = 0.07; // tuned so canvas hydration lands near recorded segment sizes

function rowSelectivity(featureId, op, value) {
  const f = featureId;
  // CFM-scoped behaviour features
  if (f === 'consecutive_ranked_losses_streak') {
    const v = Math.max(0, +value || 0);
    if (op === '≥') return CFM_RANKED_ACTIVE_FRAC * Math.exp(-(v - 1) * 0.42);
    if (op === '>') return CFM_RANKED_ACTIVE_FRAC * Math.exp(-v * 0.42);
    if (op === '<') return CFM_RANKED_ACTIVE_FRAC * (1 - Math.exp(-(v - 1) * 0.42));
    if (op === '=') return CFM_RANKED_ACTIVE_FRAC * 0.06;
    return CFM_RANKED_ACTIVE_FRAC * 0.3;
  }
  if (f === 'mmr_drift_7d') {
    const v = +value || 0;
    if (op === '<') return CFM_RANKED_ACTIVE_FRAC * Math.max(0.04, 0.42 * Math.exp(v / 40));
    if (op === '>') return CFM_RANKED_ACTIVE_FRAC * Math.max(0.04, 0.4 * Math.exp(-v / 40));
    return CFM_RANKED_ACTIVE_FRAC * 0.3;
  }
  if (f === 'is_paying_user_lifetime') return value === false ? 0.78 : 0.22;
  if (f === 'pass_owned_current')      return value === true ? 0.38 : 0.62;
  if (f === 'is_test_account')         return value === true ? 0.004 : 0.996;
  if (f === 'account_age_days') {
    const v = +value || 0;
    if (op === '≥' || op === '>') return Math.max(0.06, 1 - Math.min(1, v / 1200));
    if (op === '<' || op === '≤') return Math.min(0.94, v / 1200);
    return 0.5;
  }
  if (f === 'tenure_days_total') {
    const v = +value || 0;
    if (op === '≤' || op === '<') return Math.min(0.92, v / 800);
    if (op === '≥' || op === '>') return Math.max(0.08, 1 - v / 800);
    return 0.5;
  }
  if (f === 'last_login_days_ago') {
    const v = +value || 0;
    if (op === '≥' || op === '>') return Math.max(0.05, Math.exp(-v / 14));
    if (op === '≤' || op === '<') return Math.min(0.95, 1 - Math.exp(-v / 14));
    return 0.4;
  }
  if (f === 'session_count_7d') {
    const v = +value || 0;
    if (op === '≥' || op === '>') return Math.max(0.04, Math.exp(-v / 6));
    if (op === '≤' || op === '<') return Math.min(0.96, 1 - Math.exp(-v / 6));
    return 0.5;
  }
  if (f === 'daily_login_streak_current') {
    const v = +value || 0;
    if (op === '≥' || op === '>') return Math.max(0.03, Math.exp(-v / 4));
    return 0.4;
  }
  if (f === 'cf_coin_balance_current' || f === 'gem_balance_current') {
    const v = +value || 0;
    if (op === '<' || op === '≤') return Math.min(0.95, 1 - Math.exp(-v / 800));
    if (op === '≥' || op === '>') return Math.max(0.05, Math.exp(-v / 800));
    return 0.5;
  }
  if (f === 'spend_tier_lifetime') {
    if (String(value).toLowerCase().includes('free')) return 0.78;
    if (String(value).toLowerCase().includes('low'))  return 0.13;
    if (String(value).toLowerCase().includes('mid'))  return 0.06;
    if (String(value).toLowerCase().includes('high')) return 0.025;
    if (String(value).toLowerCase().includes('whale')) return 0.005;
    return 0.18;
  }
  if (f === 'vip_status') {
    if (op === '=' && value === true) return 0.18;
    if (op === '≠' || (op === '=' && value === false)) return 0.82;
    return 0.18;
  }
  if (f === 'iam_received_count_24h') {
    const v = +value || 0;
    if (op === '≤' || op === '<') return Math.min(0.95, 0.5 + v * 0.07);
    if (op === '≥' || op === '>') return Math.max(0.05, 0.5 - v * 0.07);
    return 0.5;
  }
  if (f === 'weapon_owned_lifetime') return 0.07;
  if (f === 'ranked_match_count_30d') {
    const v = +value || 0;
    if (op === '≥' || op === '>') return Math.max(0.06, CFM_RANKED_ACTIVE_FRAC * Math.exp(-v / 40));
    return CFM_RANKED_ACTIVE_FRAC * 0.5;
  }
  // default: middling selective
  return 0.35;
}

// ── Demo predicates per segment (for hydrating canvas in edit mode) ─────
const SEGMENT_PREDICATES = {
  'seg-cfm-loss-streak-non-paying-2026-0508-a3f9': {
    title: 'CFM ranked loss streak · non-paying',
    intent: 'Players in CFM ranked who are losing streaks of 5+, are not paying users, and whose MMR has drifted negative this week.',
    groups: [
      { id: 'g1', any: true, rows: [
        { id: 'r1', feature: 'consecutive_ranked_losses_streak', op: '≥', value: 5 },
        { id: 'r2', feature: 'mmr_drift_7d', op: '<', value: -30 },
      ]},
      { id: 'g2', any: false, rows: [
        { id: 'r3', feature: 'is_paying_user_lifetime', op: '=', value: false },
        { id: 'r4', feature: 'account_age_days', op: '≥', value: 30 },
      ]},
    ],
    excl: [{ id: 'r5', feature: 'is_test_account', op: '=', value: true }],
  },
  'seg-cfm-ss1-weapon-owners-2026': {
    title: 'CFM SS1 weapon owners',
    intent: 'CFM players who currently own any SS1 series weapon and have logged a ranked match in the last 30 days.',
    groups: [
      { id: 'g1', any: false, rows: [
        { id: 'r1', feature: 'weapon_owned_lifetime', op: '∈', value: 'SS1_set' },
        { id: 'r2', feature: 'ranked_match_count_30d', op: '≥', value: 1 },
      ]},
    ],
    excl: [{ id: 'r3', feature: 'is_test_account', op: '=', value: true }],
  },
  'seg-cfm-eoy-tier1-nru': {
    title: 'CFM EoY · Tier 1 NRU',
    intent: 'New / returning users in CFM with ≤30 days tenure, not yet paying — to seed the End-of-Year reactivation funnel.',
    groups: [
      { id: 'g1', any: false, rows: [
        { id: 'r1', feature: 'tenure_days_total', op: '≤', value: 30 },
        { id: 'r2', feature: 'is_paying_user_lifetime', op: '=', value: false },
      ]},
      { id: 'g2', any: true, rows: [
        { id: 'r3', feature: 'last_login_days_ago', op: '≤', value: 7 },
        { id: 'r4', feature: 'session_count_7d', op: '≥', value: 2 },
      ]},
    ],
    excl: [{ id: 'r5', feature: 'is_test_account', op: '=', value: true }],
  },
  'seg-cfm-eoy-tier4-whale': {
    title: 'CFM EoY · Tier 4 Whale',
    intent: 'CFM whales with high lifetime spend, currently active, holding the season pass.',
    groups: [
      { id: 'g1', any: false, rows: [
        { id: 'r1', feature: 'spend_tier_lifetime', op: '=', value: 'whale' },
        { id: 'r2', feature: 'pass_owned_current', op: '=', value: true },
        { id: 'r3', feature: 'last_login_days_ago', op: '≤', value: 14 },
      ]},
    ],
    excl: [{ id: 'r4', feature: 'is_test_account', op: '=', value: true }],
  },
  'seg-cfm-pass-stuck-responders': {
    title: 'CFM Pass Stuck · Variant A responders',
    intent: 'Players who saw the Pass Stuck Variant A IAM and engaged with the offer in the last 24 hours.',
    groups: [
      { id: 'g1', any: false, rows: [
        { id: 'r1', feature: 'iam_received_count_24h', op: '≥', value: 1 },
        { id: 'r2', feature: 'consecutive_ranked_losses_streak', op: '≥', value: 5 },
      ]},
    ],
    excl: [{ id: 'r3', feature: 'is_test_account', op: '=', value: true }],
  },
  'seg-cfm-vip-active-draft': {
    title: 'CFM VIP active (draft)',
    intent: 'Active VIPs in CFM with a current pass and recent ranked play.',
    groups: [
      { id: 'g1', any: false, rows: [
        { id: 'r1', feature: 'vip_status', op: '=', value: true },
        { id: 'r2', feature: 'pass_owned_current', op: '=', value: true },
      ]},
    ],
    excl: [],
  },
};

window.HERMES_DATA = { FEATURES, EVENTS, SEGMENTS, CAMPAIGNS, FEATURE_DOMAINS, SEGMENT_PREDICATES, MAU_BASE, rowSelectivity };
