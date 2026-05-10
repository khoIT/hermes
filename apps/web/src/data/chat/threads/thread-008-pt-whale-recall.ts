/**
 * thread-008 — PT at-risk whale recall multi-turn flow.
 * 3 turns: T1 distribution, T2 features via FeatureChip, T3 build-segment terminal.
 */
import type { Conversation, ChatMessage } from '../../../utils/chat-store';

const T1: ChatMessage = {
  id: 'm-008-a1',
  role: 'assistant',
  credits: 4,
  createdAt: '2026-05-09T15:18:00.000Z',
  sections: [
    { type: 'tool_call', payload: {
      fn: 'query_trino',
      args: [
        { name: 'catalog', value: 'pt_global' },
        { name: 'feature', value: 'lifetime_revenue_local' },
        { name: 'min_usd', value: 500 },
        { name: 'last_login', value: '7..14d' },
      ],
      result: '3,420 whales · $5.7M LTV',
      durationMs: 760,
    } },
    { type: 'tool_call', payload: {
      fn: 'load_experiment',
      args: [{ name: 'id', value: 'pt_whale_recall_jan_2026' }],
      result: '+$24..$38 ARPDAU · n=4,180 · p<0.01',
      durationMs: 320,
    } },
    {
      type: 'narrative',
      payload: {
        text: 'PT-tier whales (lifetime spend ≥ $500) who haven\'t logged in for 7-14 days are the highest-value at-risk cohort. Most recover with a single targeted IAM + bonus offer; past whale-recall A/Bs delivered **+$24-$38 ARPDAU** for the cohort during the recall week.',
      },
    },
    { type: 'h2', payload: { text: 'Whale-tier login distribution last 30d' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'pt-whale-login-distribution',
          title: 'PT whales (lifetime spend ≥ $500) by days-since-login',
          xLabel: 'Days since last login',
          yLabel: 'Players',
          bars: [
            { label: '0-1d',  value: 4820 },
            { label: '2-3d',  value: 1240 },
            { label: '4-6d',  value:  680 },
            { label: '7-14d', value: 1840 },
            { label: '15-29d', value: 720 },
            { label: '30d+',  value:  410 },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          '~1,840 whales sitting at 7-14 days dark — recoverable window.',
          'Past 30+ day cohort recovers at <8% — diminishing returns past 14d.',
          'Cohort revenue density: **$1,840 × $58 ARPDAU = ~$107k recovery potential**.',
        ],
      },
    },
  ],
  followUps: [
    'Show me the features',
    'Tighten cohort',
    'Compare to active whales',
  ],
};

const T2_FEATURES: ChatMessage = {
  id: 'm-008-a2-features',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-09T15:19:00.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Three features define the at-risk whale cohort precisely.',
      },
    },
    { type: 'feature_chip', payload: { featureName: 'spend_tier_lifetime' } },
    { type: 'feature_chip', payload: { featureName: 'last_login_days_ago' } },
    { type: 'feature_chip', payload: { featureName: 'lifetime_revenue_local' } },
    {
      type: 'narrative',
      payload: {
        text: 'Predicate: `spend_tier_lifetime IN (\'whale\', \'mega_whale\') AND last_login_days_ago BETWEEN 7 AND 14 AND lifetime_revenue_local ≥ 500`. Audience size estimate: **~1,840 UIDs**.',
      },
    },
  ],
  followUps: ['Build at-risk whale segment'],
};

const T2_TIGHTEN: ChatMessage = {
  id: 'm-008-a2-tighten',
  role: 'assistant',
  credits: 2,
  createdAt: '2026-05-09T15:19:30.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Tightening to **mega-whale only** (lifetime ≥ $2,000) shrinks the audience to **~410 UIDs** but raises per-head ARPDAU to ~$140 during recall — denser, higher CAC tolerance.',
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          '~410 mega-whale UIDs match (vs 1,840 unfiltered).',
          'Per-head recall ARPDAU: ~$140 (vs $58 across full whale cohort).',
        ],
      },
    },
  ],
  followUps: ['Show me the features'],
};

const T2_ACTIVE: ChatMessage = {
  id: 'm-008-a2-active',
  role: 'assistant',
  credits: 2,
  createdAt: '2026-05-09T15:19:45.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Active whales (logged in within 24h) trend at **$78 ARPDAU sustained**. The 7-14d cohort baseline (before recall) is **$11 ARPDAU** — a 7× recovery headroom if we can get them back in.',
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'Active whale ARPDAU: **$78**.',
          '7-14d dark whale ARPDAU: **$11** — recall headroom 7×.',
          'Reactivation typically lasts ~12 days before re-fading.',
        ],
      },
    },
  ],
  followUps: ['Show me the features'],
};

const T3_BUILD: ChatMessage = {
  id: 'm-008-a3-build',
  role: 'assistant',
  credits: 2,
  createdAt: '2026-05-09T15:20:00.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Setting up the at-risk whale recall segment. Audience estimate: **~1,840 UIDs**.',
      },
    },
    {
      type: 'action_card_segment',
      payload: {
        name: 'PT · At-risk Whales · last login 7-14d',
        description: 'spend_tier_lifetime IN (whale, mega_whale) AND last_login_days_ago BETWEEN 7 AND 14 AND lifetime_revenue_local ≥ 500',
      },
    },
  ],
};

export const thread008: Conversation = {
  id: 'thread-008',
  title: 'Find at-risk PT whales',
  createdAt: '2026-05-09T15:17:30.000Z',
  updatedAt: '2026-05-09T15:20:00.000Z',
  messages: [
    {
      id: 'm-008-u1',
      role: 'user',
      text: 'Find at-risk PT whales who haven\'t logged in this week',
      createdAt: '2026-05-09T15:17:30.000Z',
    },
    T1,
    {
      id: 'm-008-u2',
      role: 'user',
      text: 'Show me the features',
      createdAt: '2026-05-09T15:18:30.000Z',
    },
    T2_FEATURES,
    {
      id: 'm-008-u3',
      role: 'user',
      text: 'Build at-risk whale segment',
      createdAt: '2026-05-09T15:19:30.000Z',
    },
    T3_BUILD,
  ],
};

export const thread008Turns = {
  features: T2_FEATURES,
  tighten: T2_TIGHTEN,
  active: T2_ACTIVE,
  build: T3_BUILD,
};
