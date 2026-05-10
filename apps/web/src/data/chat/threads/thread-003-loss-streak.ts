/**
 * thread-003 — Hermes-native loss-streak intervention thread.
 * Replaces /agents/op/cfm-loss-streak. Bar chart of streak distribution +
 * intervention insights. Follow-ups lead into segment creation.
 */
import type { Conversation } from '../../../utils/chat-store';

export const thread003: Conversation = {
  id: 'thread-003',
  title: 'Players hitting consecutive ranked losses — intervention pattern?',
  createdAt: '2026-05-08T17:21:00.000Z',
  updatedAt: '2026-05-08T17:21:00.000Z',
  messages: [
    {
      id: 'm-003-u1',
      role: 'user',
      text: 'Players hitting consecutive ranked losses — what\'s the intervention pattern?',
      createdAt: '2026-05-08T17:21:00.000Z',
    },
    {
      id: 'm-003-a1',
      role: 'assistant',
      credits: 4,
      createdAt: '2026-05-08T17:21:09.000Z',
      sections: [
        {
          type: 'narrative',
          payload: {
            text: 'CFM VN players who hit **5+ consecutive ranked losses** churn within 7 days at a rate of 38% — versus 12% for the general non-paying base. The pattern is commonly called *frustration-rescue*: a brief, well-timed intervention right after the 5th loss can recover ~62% of those at-risk sessions in our last A/B test.',
          },
        },
        {
          type: 'h2',
          payload: { text: 'Distribution · streak length at last session' },
        },
        {
          type: 'widget',
          payload: {
            widget: {
              type: 'bar',
              id: 'streak-distribution',
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
              '~52,600 players currently sitting at 5+ streak — eligible audience for targeted intervention.',
              'Highest 7d-churn risk is concentrated in **non-paying tenure ≥ 7d** segment.',
              'Last intervention attempted ≥ 72h ago is the gating predicate from the existing `seg-cfm-loss-streak-non-paying` segment.',
            ],
          },
        },
      ],
      followUps: [
        'Show segment of high-streak non-paying players',
        'What intervention performed best in the last A/B?',
        'Compare 5+ streak churn rate across countries',
        'Build a real-time campaign for this audience',
      ],
    },
  ],
};
