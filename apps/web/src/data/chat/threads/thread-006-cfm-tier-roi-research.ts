/**
 * thread-006 — CFM-11 year-end tier ROI research → pin to CFM Liveops Board.
 * 3 turns: T1 tier scan, T2 YoY comparison, T3 pin terminal.
 */
import type { Conversation, ChatMessage } from '../../../utils/chat-store';

const T1: ChatMessage = {
  id: 'm-006-a1',
  role: 'assistant',
  credits: 4,
  createdAt: '2026-05-09T11:14:00.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'CFM-11 (year-end progression event) is in week 3. Across the **5 paid tiers** the ROI signal is bimodal: T1 (lowest paid) and T4 are pulling their weight on D14 retention, but T2 and T3 are running negative net-margin. T5 is too early to call — small N.',
      },
    },
    { type: 'h2', payload: { text: 'Reward cost · ARPDAU · D14 retention by tier' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'cfm11-tier-stacked',
          title: 'CFM-11 tiers — week 3 stacked metrics',
          xLabel: 'Tier',
          yLabel: 'Indexed score (T0 baseline = 100)',
          bars: [
            { label: 'T0 (free)', value: 100 },
            { label: 'T1 (Bronze)', value: 142 },
            { label: 'T2 (Silver)', value: 88 },
            { label: 'T3 (Gold)', value: 76 },
            { label: 'T4 (Platinum)', value: 156 },
            { label: 'T5 (Crystal)', value: 118 },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'T2 + T3 combined burn **~$184k** in reward cost vs ~$67k incremental ARPDAU — net **−$117k**.',
          'T4 is the strongest performer — 56% above T0 baseline on combined index.',
          'NRU mix in T1 is **31%** vs only **8%** in T4 — newer players opting into entry tier.',
        ],
      },
    },
  ],
  followUps: [
    'Compare to last year',
    'Show tier population shift',
    'Drill into NRU tier',
  ],
};

const T2_LAST_YEAR: ChatMessage = {
  id: 'm-006-a2-yoy',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-09T11:15:00.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Year-over-year, the **mid-tier sag (T2/T3)** is new. CFM-10 (Dec 2025) had cleaner D14 retention curves at every tier. The new T3 reward bundle introduced this year may be cannibalizing T4 conversions — worth A/B-testing before CFM-12.',
      },
    },
    { type: 'h2', payload: { text: 'YoY tier × D14 retention · Dec 2025 vs Dec 2026' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'cfm11-yoy-retention',
          title: 'D14 retention by tier — CFM-10 vs CFM-11',
          xLabel: 'Tier',
          yLabel: 'D14 retention',
          series: [
            {
              name: 'CFM-10 (Dec 2025)',
              color: '#3f8dff',
              data: [
                { x: 'T0', y: 0.21 }, { x: 'T1', y: 0.34 },
                { x: 'T2', y: 0.41 }, { x: 'T3', y: 0.46 },
                { x: 'T4', y: 0.52 }, { x: 'T5', y: 0.58 },
              ],
            },
            {
              name: 'CFM-11 (Dec 2026)',
              color: '#f05a22',
              data: [
                { x: 'T0', y: 0.22 }, { x: 'T1', y: 0.36 },
                { x: 'T2', y: 0.32 }, { x: 'T3', y: 0.30 },
                { x: 'T4', y: 0.55 }, { x: 'T5', y: 0.51 },
              ],
            },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'T2/T3 D14 retention dropped **~9-16 pts YoY** — biggest divergence of any tier.',
          'T4 held strong (+3 pts YoY) and T5 dipped slightly (−7 pts) — possibly compounding.',
        ],
      },
    },
  ],
  followUps: ['Pin to CFM Liveops Board'],
};

const T2_POPULATION: ChatMessage = {
  id: 'm-006-a2-pop',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-09T11:15:30.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Population mix shifted toward **T0 + T1** this year. Mid-tier opt-in dropped 11 pts vs CFM-10 — players who would have bought T2/T3 last year are landing in T1 or skipping the pass entirely.',
      },
    },
    { type: 'h2', payload: { text: 'Tier population share · CFM-10 vs CFM-11' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'cfm11-population-shift',
          title: 'Share of pass-buyers per tier',
          xLabel: 'Tier',
          yLabel: 'Share of buyers',
          bars: [
            { label: 'T1 · CFM-10',  value: 0.42 },
            { label: 'T1 · CFM-11',  value: 0.51 },
            { label: 'T2 · CFM-10',  value: 0.28 },
            { label: 'T2 · CFM-11',  value: 0.21 },
            { label: 'T3 · CFM-10',  value: 0.18 },
            { label: 'T3 · CFM-11',  value: 0.14 },
            { label: 'T4 · CFM-10',  value: 0.09 },
            { label: 'T4 · CFM-11',  value: 0.10 },
            { label: 'T5 · CFM-10',  value: 0.03 },
            { label: 'T5 · CFM-11',  value: 0.04 },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'Mid-tier (T2+T3) lost **−11 pts** of buyer share YoY.',
          'T1 absorbed most of the shift — ARPDAU per buyer dropped accordingly.',
        ],
      },
    },
  ],
  followUps: ['Pin to CFM Liveops Board'],
};

const T2_NRU: ChatMessage = {
  id: 'm-006-a2-nru',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-09T11:15:45.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'NRU (new-registered users) opt-in pattern is healthy — **31% of T1** are NRUs, with D14 retention at 36%. This is the strongest entry funnel CFM has had since 2024. Question: can we widen the on-ramp into T2 without breaking T4 economics?',
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'NRU share of T1: **31%**, D14 retention 36% — healthy entry funnel.',
          'Of those, only 4% upgraded to T2 by week 3 — leakage point.',
          'NRU LTV uplift from CFM participation: **+18%** vs non-participating NRUs.',
        ],
      },
    },
  ],
  followUps: ['Pin to CFM Liveops Board'],
};

const T3_PIN: ChatMessage = {
  id: 'm-006-a3-pin',
  role: 'assistant',
  credits: 1,
  createdAt: '2026-05-09T11:16:00.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Pinning the YoY tier-retention comparison to the **CFM Liveops Board**. This is the canonical view for tracking CFM tier health going forward.',
      },
    },
    {
      type: 'pin_to_board',
      payload: {
        boardName: 'CFM Liveops Board',
        widgetSnapshotId: 'cfm11-yoy-retention',
      },
    },
  ],
};

export const thread006: Conversation = {
  id: 'thread-006',
  title: 'CFM-11 year-end tier ROI',
  createdAt: '2026-05-09T11:13:30.000Z',
  updatedAt: '2026-05-09T11:16:00.000Z',
  messages: [
    {
      id: 'm-006-u1',
      role: 'user',
      text: 'How are CFM-11 year-end tiers performing on reward-cost vs retention?',
      createdAt: '2026-05-09T11:13:30.000Z',
    },
    T1,
    {
      id: 'm-006-u2',
      role: 'user',
      text: 'Compare to last year',
      createdAt: '2026-05-09T11:14:30.000Z',
    },
    T2_LAST_YEAR,
    {
      id: 'm-006-u3',
      role: 'user',
      text: 'Pin to CFM Liveops Board',
      createdAt: '2026-05-09T11:15:30.000Z',
    },
    T3_PIN,
  ],
};

export const thread006Turns = {
  lastYear: T2_LAST_YEAR,
  population: T2_POPULATION,
  nru: T2_NRU,
  pin: T3_PIN,
};
