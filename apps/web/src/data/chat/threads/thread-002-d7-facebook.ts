/**
 * thread-002 — D7 retention for Facebook channel over 7 months (PRD UC2).
 * Single line chart + brief narrative.
 */
import type { Conversation } from '../../../utils/chat-store';

export const thread002: Conversation = {
  id: 'thread-002',
  title: 'D7 retention for Facebook channel',
  createdAt: '2026-05-08T16:08:00.000Z',
  updatedAt: '2026-05-08T16:08:00.000Z',
  messages: [
    {
      id: 'm-002-u1',
      role: 'user',
      text: 'What is the D7 retention for the Facebook channel?',
      createdAt: '2026-05-08T16:08:00.000Z',
    },
    {
      id: 'm-002-a1',
      role: 'assistant',
      credits: 3,
      createdAt: '2026-05-08T16:08:06.000Z',
      sections: [
        {
          type: 'narrative',
          payload: {
            text: 'Facebook D7 retention has trended **from 18.4% in Aug \'25 up to 26.2% in Feb \'26** — a +7.8 pt gain over seven months. Largest jump came after the Sep \'25 creative refresh.',
          },
        },
        {
          type: 'h2',
          payload: { text: 'Facebook D7 retention performance' },
        },
        {
          type: 'widget',
          payload: {
            widget: {
              type: 'line',
              id: 'd7-facebook-trend',
              title: 'D7 retention · Facebook · monthly',
              xLabel: 'Month',
              yLabel: 'D7 retention (%)',
              series: [
                {
                  name: 'Facebook',
                  data: [
                    { x: 'Aug \'25', y: 18.4 },
                    { x: 'Sep \'25', y: 21.1 },
                    { x: 'Oct \'25', y: 22.6 },
                    { x: 'Nov \'25', y: 23.4 },
                    { x: 'Dec \'25', y: 24.0 },
                    { x: 'Jan \'26', y: 25.5 },
                    { x: 'Feb \'26', y: 26.2 },
                  ],
                },
              ],
            },
          },
        },
      ],
      followUps: [
        'Compare Facebook D7 vs. Admob across the same period',
        'Break Facebook D7 down by country',
        'Show D7 retention by creative variant',
      ],
    },
  ],
};
