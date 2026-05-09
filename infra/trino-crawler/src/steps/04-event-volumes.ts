/**
 * Step 04 — Event volumes (synth-only path).
 *
 * Synthesises daily volume + 7-day sparkline for all 51 events in the Hermes
 * event catalog. Volume scale is proportional to expected Kafka throughput for
 * a mid-size mobile game (~2M MAU):
 *
 *   High-frequency (match/kill/round):  500k-2M events/day
 *   Mid-frequency (login/session):      200k-800k events/day
 *   Low-frequency (purchase/social):    10k-150k events/day
 *   Rare (ugc/suspicious):              1k-20k events/day
 *
 * Output: apps/web/src/data/crawled/event-volumes.json
 */

import { makeRng } from '../synthesizers/seeded-rng.js';
import { writeCrawledJson } from '../outputs.js';

const SOURCE_TAG = 'P-4 synth · awaiting VPN/auth for cfm_vn pull';

type EventVolumeTier = 'high' | 'mid' | 'low' | 'rare';

// Volume range per tier: [min, max] daily events
const TIER_RANGES: Record<EventVolumeTier, [number, number]> = {
  high: [500_000, 2_000_000],
  mid:  [200_000,   800_000],
  low:  [ 10_000,   150_000],
  rare: [  1_000,    20_000],
};

// All 51 events with their volume tier
const EVENT_TIERS: Record<string, EventVolumeTier> = {
  // Match & gameplay (6) — highest volume per active session
  event_match_start:    'high',
  event_match_end:      'high',
  event_round_end:      'high',
  event_kill:           'high',
  event_death:          'high',
  event_weapon_pickup:  'high',

  // Session & login (7)
  event_login:          'mid',
  event_logout:         'mid',
  event_session_start:  'mid',
  event_session_end:    'mid',
  event_lobby_enter:    'mid',
  event_lobby_exit:     'mid',
  event_lobby_idle_60min: 'low',

  // Purchase & monetization (6)
  event_purchase:           'low',
  event_iap_shop_open:      'mid',
  event_clicktobuy_item_iap: 'low',
  event_pack_offered:       'low',
  event_purchase_failed:    'low',
  event_pack_purchased:     'low',

  // Item & inventory (6)
  event_item_received:           'mid',
  event_item_used:               'mid',
  event_currency_balance_change: 'mid',
  event_weapon_trial_started:    'low',
  event_weapon_trial_expired:    'low',
  event_weapon_unlocked:         'low',

  // Progression (8)
  event_level_up:              'low',
  event_quest_complete:        'low',
  event_chapter_complete:      'low',
  event_chapter_started:       'low',
  event_milestone_reached:     'low',
  event_rank_promotion:        'low',
  event_rank_demotion:         'low',
  event_mmr_threshold_crossed: 'low',

  // Social (6)
  event_friend_invite_sent:     'low',
  event_friend_invite_accepted: 'low',
  event_guild_join:             'rare',
  event_guild_leave:            'rare',
  event_chat_message_sent:      'mid',
  event_pair_formed:            'rare',

  // Campaign / UI (8)
  event_iam_shown:      'low',
  event_iam_clicked:    'low',
  event_iam_dismissed:  'low',
  event_shop_open:      'mid',
  event_shop_click:     'mid',
  event_survey_response: 'rare',
  event_h5_event_open:  'low',
  event_minigame_played: 'low',

  // UGC & moderation (4)
  event_ugc_submission:              'rare',
  event_ugc_vote:                    'rare',
  event_ugc_view:                    'low',
  event_suspicious_activity_flagged: 'rare',
};

function synthEventVolume(eventName: string): {
  synthesised: true;
  source: string;
  computedAt: string;
  domain: string;
  tier: EventVolumeTier;
  dailyVolume: number;
  peakRate: number;
  sparkline7d: number[];
} {
  const rng = makeRng(`event-vol-${eventName}`);
  const tierKey = EVENT_TIERS[eventName] ?? 'low';
  const [lo, hi] = TIER_RANGES[tierKey];

  // Base daily volume — uniform within tier range
  const dailyVolume = Math.round(lo + rng() * (hi - lo));

  // peakRate: events per second at peak hour (assume 4h peak window)
  const peakRate = Math.round((dailyVolume * 0.35) / (4 * 3600));

  // 7-day sparkline with realistic weekend/weekday pattern
  // Day 0 = 7 days ago; day 6 = yesterday
  const dayOfWeekBase = [0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 0.95];
  const sparkline7d: number[] = dayOfWeekBase.map((factor) =>
    Math.round(dailyVolume * factor * (0.95 + rng() * 0.10)),
  );

  // Derive domain from event prefix groupings
  const domain = eventName.startsWith('event_match') || eventName.startsWith('event_kill') ||
    eventName.startsWith('event_death') || eventName.startsWith('event_round') ||
    eventName.startsWith('event_weapon_pickup') ? 'match-gameplay'
    : eventName.startsWith('event_login') || eventName.startsWith('event_logout') ||
    eventName.startsWith('event_session') || eventName.startsWith('event_lobby') ? 'session-login'
    : eventName.startsWith('event_purchase') || eventName.startsWith('event_iap') ||
    eventName.startsWith('event_pack') || eventName.startsWith('event_clicktobuy') ? 'purchase-monetization'
    : eventName.startsWith('event_item') || eventName.startsWith('event_currency') ||
    eventName.startsWith('event_weapon_trial') || eventName.startsWith('event_weapon_unlocked') ? 'item-inventory'
    : eventName.startsWith('event_level') || eventName.startsWith('event_quest') ||
    eventName.startsWith('event_chapter') || eventName.startsWith('event_milestone') ||
    eventName.startsWith('event_rank') || eventName.startsWith('event_mmr') ? 'progression'
    : eventName.startsWith('event_friend') || eventName.startsWith('event_guild') ||
    eventName.startsWith('event_chat') || eventName.startsWith('event_pair') ? 'social'
    : eventName.startsWith('event_iam') || eventName.startsWith('event_shop') ||
    eventName.startsWith('event_survey') || eventName.startsWith('event_h5') ||
    eventName.startsWith('event_minigame') ? 'campaign-ui'
    : 'ugc-moderation';

  return {
    synthesised: true,
    source: SOURCE_TAG,
    computedAt: new Date().toISOString(),
    domain,
    tier: tierKey,
    dailyVolume,
    peakRate,
    sparkline7d,
  };
}

export async function runEventVolumes(): Promise<void> {
  console.log('[step-04] Generating event volumes (synth-only mode)...');

  const output: Record<string, unknown> = {};
  for (const eventName of Object.keys(EVENT_TIERS)) {
    output[eventName] = synthEventVolume(eventName);
  }

  writeCrawledJson('event-volumes.json', output);
  console.log(`[step-04] Done — ${Object.keys(output).length} events synthesised.`);
}
