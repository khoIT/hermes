/**
 * thread-001 — CPI vs. LTV correlation across channels (PRD UC1).
 * Canonical landing-prompt thread. 4 channels, scatter + table + insights.
 */
import type { Conversation } from '../../../utils/chat-store';

export const thread001: Conversation = {
  id: 'thread-001',
  title: 'Does higher CPI actually produce higher LTV players?',
  createdAt: '2026-05-08T14:32:00.000Z',
  updatedAt: '2026-05-08T14:32:00.000Z',
  messages: [
    {
      id: 'm-001-u1',
      role: 'user',
      text: 'Does higher CPI actually produce higher LTV players? Show the correlation across channels',
      createdAt: '2026-05-08T14:32:00.000Z',
    },
    {
      id: 'm-001-a1',
      role: 'assistant',
      credits: 3,
      createdAt: '2026-05-08T14:32:08.000Z',
      sections: [
        {
          type: 'narrative',
          payload: {
            text: 'Across the four primary acquisition channels in CFM VN over the last 90 days, **higher CPI does not reliably predict higher LTV**. Facebook delivers the strongest 90-day ROAS at 1.4× despite mid-pack CPI, while Vungle pays the highest CPI but underperforms on retained value.',
          },
        },
        {
          type: 'h2',
          payload: { text: 'CPI vs. LTV correlation' },
        },
        {
          type: 'widget',
          payload: {
            widget: {
              type: 'table',
              id: 'cpi-ltv-table',
              title: 'Channel performance · last 90d',
              columns: [
                { key: 'channel', label: 'Channel', format: 'string' },
                { key: 'avg_cpi', label: 'Avg CPI', format: 'currency' },
                { key: 'd90_ltv', label: 'D90 LTV', format: 'currency', highlightTop: true },
                { key: 'd90_roas', label: 'D90 ROAS', format: 'number', highlightTop: true },
                { key: 'installs', label: 'Installs', format: 'number' },
              ],
              rows: [
                { channel: 'Facebook', avg_cpi: 2.85, d90_ltv: 4.12, d90_roas: 1.44, installs: 18420 },
                { channel: 'Admob',    avg_cpi: 1.92, d90_ltv: 2.31, d90_roas: 1.20, installs: 24180 },
                { channel: 'Moloco',   avg_cpi: 3.10, d90_ltv: 3.05, d90_roas: 0.98, installs: 9620 },
                { channel: 'Vungle',   avg_cpi: 4.20, d90_ltv: 3.18, d90_roas: 0.76, installs: 5840 },
              ],
            },
          },
        },
        {
          type: 'widget',
          payload: {
            widget: {
              type: 'scatter',
              id: 'cpi-ltv-scatter',
              title: 'CPI ↔ LTV by channel',
              xLabel: 'CPI ($)',
              yLabel: 'D90 LTV ($)',
              series: [
                { name: 'Facebook', data: [{ x: 2.85, y: 4.12 }] },
                { name: 'Admob',    data: [{ x: 1.92, y: 2.31 }] },
                { name: 'Moloco',   data: [{ x: 3.10, y: 3.05 }] },
                { name: 'Vungle',   data: [{ x: 4.20, y: 3.18 }] },
              ],
            },
          },
        },
        {
          type: 'h2',
          payload: { text: 'Critical performance warnings' },
        },
        {
          type: 'insights',
          payload: {
            items: [
              '**Vungle** ROAS dropped 0.76× — burning $4.20 CPI for $3.18 LTV. Shift budget to Facebook.',
              '**Admob** is the lowest-CPI scaler but D90 LTV trails Facebook by ~44%. Quality vs. quantity tradeoff.',
              'Correlation coefficient between CPI and LTV across these 4 channels: **r = 0.31** — weak.',
            ],
          },
        },
      ],
      followUps: [
        'Compare D30 retention across all channels',
        'Show LTV cohorts segmented by spend tier',
        'Which creative variants are driving Facebook\'s ROAS lead?',
        'How does CPI break down by country in Vungle?',
      ],
    },
  ],
};
