/**
 * Canned assistant responses for follow-ups + fallback.
 * Keyed by responseId from intents.ts (or by id passed at append time).
 * Each entry is a fully-formed assistant ChatMessage minus id/createdAt.
 */
import type { ChatMessage } from '../../utils/chat-store';

type CannedResponse = Omit<ChatMessage, 'id' | 'createdAt'>;

export const CANNED_RESPONSES: Record<string, CannedResponse> = {
  // Generic fallback when no intent matches
  fallback: {
    role: 'assistant',
    credits: 1,
    sections: [
      {
        type: 'narrative',
        payload: {
          text: 'I don\'t recognize that pattern yet. Try one of the suggested follow-ups, or ask about CPI/LTV correlation, D7 retention, loss-streak interventions, or segment creation.',
        },
      },
    ],
    followUps: [
      'Compare D30 retention across all channels',
      'Show D7 retention for the Facebook channel',
      'What features predict churn for high-spend players?',
      'Create a segment of users who spent over $50 in the last 30 days',
    ],
  },

  'segment-drift': {
    role: 'assistant',
    credits: 2,
    sections: [
      {
        type: 'narrative',
        payload: {
          text: 'Three segments are currently outside their expected envelope this week: **organic-power-users** (-12% size), **whale-revenue-7d** (+18% size), and **dormant-30d-cfm** (drift score 0.74).',
        },
      },
      {
        type: 'h2',
        payload: { text: 'Drift snapshot' },
      },
      {
        type: 'widget',
        payload: {
          widget: {
            type: 'bar',
            id: 'segment-drift-bars',
            title: 'Drift score · last 7d',
            bars: [
              { label: 'organic-power-users', value: 0.62 },
              { label: 'whale-revenue-7d',    value: 0.71 },
              { label: 'dormant-30d-cfm',     value: 0.74 },
              { label: 'casual-weekend',      value: 0.18 },
            ],
            funnel: true,
          },
        },
      },
    ],
    followUps: [
      'What\'s causing whale-revenue-7d to grow 18%?',
      'Show drift over the last 30 days',
    ],
  },

  'churn-features': {
    role: 'assistant',
    credits: 3,
    sections: [
      {
        type: 'narrative',
        payload: {
          text: 'For high-spend players (lifetime revenue ≥ $200), the top three churn predictors right now are: **session_count_7d**, **last_purchase_days_ago**, and **friend_concurrency_index**. SHAP attribution from the last weekly retrain.',
        },
      },
      {
        type: 'widget',
        payload: {
          widget: {
            type: 'bar',
            id: 'churn-features-shap',
            title: 'SHAP attribution · churn model · high-spend cohort',
            bars: [
              { label: 'session_count_7d',          value: 0.41 },
              { label: 'last_purchase_days_ago',    value: 0.27 },
              { label: 'friend_concurrency_index',  value: 0.18 },
              { label: 'avg_session_duration',      value: 0.09 },
              { label: 'tutorial_replay_count',     value: 0.05 },
            ],
            funnel: true,
          },
        },
      },
    ],
    followUps: [
      'Show feature drift for session_count_7d',
      'Build a churn-risk segment from these features',
    ],
  },

  'd7-cfm-cohort': {
    role: 'assistant',
    credits: 3,
    sections: [
      {
        type: 'narrative',
        payload: {
          text: 'CFM 5-game-targeting cohort holds **D7 = 32.1%** vs control at **D7 = 24.6%** — a +7.5 pt absolute lift sustained over 4 weekly cohort batches.',
        },
      },
      {
        type: 'widget',
        payload: {
          widget: {
            type: 'line',
            id: 'd7-cfm-cohort-vs-control',
            title: 'D7 retention · 5-game cohort vs control',
            xLabel: 'Cohort week',
            yLabel: 'D7 retention (%)',
            series: [
              {
                name: '5-game cohort',
                data: [
                  { x: 'W14', y: 30.8 },
                  { x: 'W15', y: 31.4 },
                  { x: 'W16', y: 32.1 },
                  { x: 'W17', y: 32.1 },
                ],
              },
              {
                name: 'control',
                data: [
                  { x: 'W14', y: 23.9 },
                  { x: 'W15', y: 24.2 },
                  { x: 'W16', y: 24.4 },
                  { x: 'W17', y: 24.6 },
                ],
              },
            ],
          },
        },
      },
    ],
    followUps: [
      'Show D14 / D30 split for the same cohort',
      'What\'s the revenue-per-user difference?',
    ],
  },
};
