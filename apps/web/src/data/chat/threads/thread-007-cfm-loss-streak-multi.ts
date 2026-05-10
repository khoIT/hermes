/**
 * thread-007 — CFM consecutive-loss intervention multi-turn flow.
 * Supersedes thread-003 (deleted). 3 turns: T1 distribution, T2 features
 * via FeatureChip, T3 build-segment terminal.
 */
import type { Conversation, ChatMessage } from '../../../utils/chat-store';

const T1: ChatMessage = {
  id: 'm-007-a1',
  role: 'assistant',
  credits: 4,
  createdAt: '2026-05-09T13:42:00.000Z',
  sections: [
    { type: 'tool_call', payload: {
      fn: 'query_trino',
      args: [
        { name: 'catalog', value: 'cfm_vn' },
        { name: 'feature', value: 'consecutive_ranked_losses_streak' },
        { name: 'window',  value: 'last 14d' },
      ],
      result: '239,800 player-streaks · 5 buckets',
      durationMs: 980,
    } },
    { type: 'tool_call', payload: {
      fn: 'compare_churn_rate',
      args: [
        { name: 'cohort_a', value: 'streak≥5' },
        { name: 'cohort_b', value: 'general_non_paying' },
        { name: 'horizon',  value: '7d' },
      ],
      result: '38% vs 12% · Δ +26pp',
      durationMs: 340,
    } },
    {
      type: 'narrative',
      payload: {
        text: 'CFM VN players who hit **5+ consecutive ranked losses** churn within 7 days at a rate of 38% — versus 12% for the general non-paying base. The pattern is commonly called *frustration-rescue*: a brief, well-timed intervention right after the 5th loss can recover ~62% of those at-risk sessions in our last A/B test.',
      },
    },
    { type: 'h2', payload: { text: 'Distribution · streak length at last session' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'cfm-streak-distribution',
          title: 'Players by max consecutive ranked-loss streak (last 14d)',
          xLabel: 'Streak length',
          yLabel: 'Players',
          bars: [
            { label: '1–2',  value: 124800 },
            { label: '3–4',  value:  62400 },
            { label: '5–6',  value:  31200 },
            { label: '7–8',  value:  14600 },
            { label: '9+',   value:   6800 },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          '~52,600 players currently sitting at 5+ streak — eligible audience for intervention.',
          'Highest 7d-churn risk concentrated in **non-paying tenure ≥ 7d**.',
          'A 24h cooldown (no IAM in last 24h) is the standard guardrail to avoid spam.',
        ],
      },
    },
  ],
  followUps: [
    'Show me the features',
    'Filter by non-paying tenure ≥ 7d',
    'Past A/B results',
  ],
};

const T2_FEATURES: ChatMessage = {
  id: 'm-007-a2-features',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-09T13:43:00.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Three features cover this pattern cleanly. Combine them and we land on a precise intervention cohort.',
      },
    },
    { type: 'feature_chip', payload: { featureName: 'consecutive_ranked_losses_streak' } },
    { type: 'feature_chip', payload: { featureName: 'is_paying_user_lifetime' } },
    { type: 'feature_chip', payload: { featureName: 'iam_received_count_24h' } },
    {
      type: 'narrative',
      payload: {
        text: 'Predicate: `consecutive_ranked_losses_streak ≥ 5 AND is_paying_user_lifetime = false AND iam_received_count_24h < 1`. Audience size estimate: **~52,600 UIDs**.',
      },
    },
  ],
  followUps: ['Build segment from these features'],
};

const T2_TENURE: ChatMessage = {
  id: 'm-007-a2-tenure',
  role: 'assistant',
  credits: 2,
  createdAt: '2026-05-09T13:43:30.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Tightening to **non-paying with tenure ≥ 7d** — drops the audience to **~38,200 UIDs** but D7 churn risk in this slice is **44%**, the densest churn cohort across CFM.',
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          '~38,200 UIDs match (vs 52,600 unfiltered).',
          'D7 churn risk: 44% — highest among CFM segments.',
        ],
      },
    },
  ],
  followUps: ['Show me the features'],
};

const T2_AB: ChatMessage = {
  id: 'm-007-a2-ab',
  role: 'assistant',
  credits: 2,
  createdAt: '2026-05-09T13:43:45.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Last A/B (CFM Frustration Rescue, Jan 2026): test arm received a 200-gem consolation IAM at L+5; control received nothing. Test arm retained at **62%** D7 vs **38%** control — **+24 pts** absolute lift, p < 0.001.',
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'Test arm D7 retention: **62%** (n=8,400).',
          'Control arm D7 retention: **38%** (n=8,250).',
          'Cost per recovered session: **$0.18** — well within target.',
        ],
      },
    },
  ],
  followUps: ['Show me the features'],
};

const T3_BUILD: ChatMessage = {
  id: 'm-007-a3-build',
  role: 'assistant',
  credits: 2,
  createdAt: '2026-05-09T13:44:00.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Setting up the segment with all three features combined. Audience estimate: **~52,600 UIDs**. Confirm the name below or refine the predicate first.',
      },
    },
    {
      type: 'action_card_segment',
      payload: {
        name: 'CFM · 5+ Loss Streak · Non-paying · 24h cooldown',
        description: 'consecutive_ranked_losses_streak ≥ 5 AND is_paying_user_lifetime = false AND iam_received_count_24h < 1',
      },
    },
  ],
};

export const thread007: Conversation = {
  id: 'thread-007',
  title: 'Players hitting consecutive ranked losses',
  createdAt: '2026-05-09T13:41:30.000Z',
  updatedAt: '2026-05-09T13:44:00.000Z',
  messages: [
    {
      id: 'm-007-u1',
      role: 'user',
      text: 'Players hitting consecutive ranked losses — how to intervene?',
      createdAt: '2026-05-09T13:41:30.000Z',
    },
    T1,
    {
      id: 'm-007-u2',
      role: 'user',
      text: 'Show me the features',
      createdAt: '2026-05-09T13:42:30.000Z',
    },
    T2_FEATURES,
    {
      id: 'm-007-u3',
      role: 'user',
      text: 'Build segment from these features',
      createdAt: '2026-05-09T13:43:30.000Z',
    },
    T3_BUILD,
  ],
};

export const thread007Turns = {
  features: T2_FEATURES,
  tenure: T2_TENURE,
  ab: T2_AB,
  build: T3_BUILD,
};
