/**
 * thread-004 — Create-segment action card flow (PRD UC4).
 * Demo: prompt → action card with name preview → Confirm → live POST in Phase 5.
 */
import type { Conversation } from '../../../utils/chat-store';

export const thread004: Conversation = {
  id: 'thread-004',
  title: 'Create a segment of users who spent over $50 in the last 30 days',
  createdAt: '2026-05-08T18:14:00.000Z',
  updatedAt: '2026-05-08T18:14:00.000Z',
  messages: [
    {
      id: 'm-004-u1',
      role: 'user',
      text: 'Create a segment of users who spent over $50 in the last 30 days and are at high churn risk',
      createdAt: '2026-05-08T18:14:00.000Z',
    },
    {
      id: 'm-004-a1',
      role: 'assistant',
      credits: 2,
      createdAt: '2026-05-08T18:14:05.000Z',
      sections: [
        {
          type: 'narrative',
          payload: {
            text: 'I\'ll set up a segment combining `lifetime_revenue_local ≥ $50` over 30d with `churn_risk_score ≥ 0.7`. Roughly **8,400 players** match across CFM VN. Confirm the name below or refine first.',
          },
        },
        {
          type: 'action_card_segment',
          payload: {
            name: 'Spent Over $50 In The Last 30 Days And Are At High Churn Risk',
            description: 'lifetime_revenue_local_30d ≥ 50 AND churn_risk_score ≥ 0.7',
          },
        },
      ],
    },
  ],
};
