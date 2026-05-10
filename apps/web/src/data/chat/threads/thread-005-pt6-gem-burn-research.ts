/**
 * thread-005 — PT-6 vs PT-10 gem-burn research → pin to PT Liveops Board.
 * 3 turns: T1 comparison overview, T2 hoarder drill-down, T3 pin terminal.
 * Used by the multi-turn registry for scripted demo of research → board flow.
 */
import type { Conversation, ChatMessage } from '../../../utils/chat-store';

const T1: ChatMessage = {
  id: 'm-005-a1',
  role: 'assistant',
  credits: 4,
  createdAt: '2026-05-09T10:02:00.000Z',
  sections: [
    { type: 'tool_call', payload: {
      fn: 'query_trino',
      args: [
        { name: 'catalog', value: 'pt_global' },
        { name: 'metric',  value: 'gem_balance_avg' },
        { name: 'segments', value: '["F2P","Mid","VIP3+"]' },
        { name: 'events',  value: '["PT-6","PT-10"]' },
      ],
      result: '6 cohort×event cells · 14d windows',
      durationMs: 1240,
    } },
    {
      type: 'narrative',
      payload: {
        text: 'PT-6 (gem-burn rebalance) and PT-10 (anniversary recall) ran back-to-back. Across the **VIP-3+ hoarder branch** the avg gem balance dropped **−18.4%** post-PT-6 vs only **−4.1%** post-PT-10 — confirming the rebalance pulled stockpiles out of the hoard, but that effect wore off through PT-10. F2P and mid-spender deltas were within noise.',
      },
    },
    { type: 'h2', payload: { text: 'Avg gem-balance Δ before/after by VIP segment' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'pt6-gem-balance-delta',
          title: 'Gem-balance Δ — 14d before vs 14d after each PT',
          xLabel: 'VIP segment',
          yLabel: 'Δ% balance',
          bars: [
            { label: 'F2P · PT-6',     value: -2.1 },
            { label: 'F2P · PT-10',    value: -1.4 },
            { label: 'VIP-1-2 · PT-6', value: -7.8 },
            { label: 'VIP-1-2 · PT-10', value: -3.2 },
            { label: 'VIP-3+ · PT-6',  value: -18.4 },
            { label: 'VIP-3+ · PT-10', value: -4.1 },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'Hoarder branch (VIP-3+) drained **−18.4%** post-PT-6 — the largest single-event drop in 90 days.',
          'PT-10 anniversary recall did **not** reignite the burn; balances refilled within 7 days.',
          'No drop-table parity violations flagged across either run.',
        ],
      },
    },
  ],
  followUps: [
    'Drill into hoarder segment',
    'Compare F2P vs hoarder',
    'Show drop-table parity audit',
  ],
};

const T2_DRILL_HOARDER: ChatMessage = {
  id: 'm-005-a2-hoarder',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-09T10:03:00.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Zooming the **VIP-3+ hoarder** trajectory across the 30-day bracket around PT-6: pre-event baseline holds steady at ~12,400 gems median, then drops sharply to ~10,100 over the 14-day rebalance window. Refill velocity post-event is **slower** than peer segments — this is the cohort to watch for next PT design.',
      },
    },
    { type: 'h2', payload: { text: 'Hoarder gem-balance trajectory · 30d bracketing PT-6' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'pt6-hoarder-trajectory',
          title: 'VIP-3+ median gem balance · −15d to +15d around PT-6',
          xLabel: 'Days from PT-6 start',
          yLabel: 'Median gem balance',
          series: [
            {
              name: 'VIP-3+ hoarder',
              color: '#f05a22',
              data: [
                { x: -15, y: 12410 }, { x: -12, y: 12380 }, { x: -9, y: 12440 },
                { x: -6, y: 12400 }, { x: -3, y: 12420 }, { x: 0, y: 12380 },
                { x: 3, y: 11620 }, { x: 6, y: 10850 }, { x: 9, y: 10410 },
                { x: 12, y: 10180 }, { x: 14, y: 10120 }, { x: 17, y: 10240 },
                { x: 21, y: 10580 }, { x: 24, y: 10920 }, { x: 27, y: 11260 },
              ],
            },
            {
              name: 'F2P (reference)',
              color: '#a3a3a3',
              data: [
                { x: -15, y: 1820 }, { x: -12, y: 1830 }, { x: -9, y: 1815 },
                { x: -6, y: 1840 }, { x: -3, y: 1845 }, { x: 0, y: 1830 },
                { x: 3, y: 1810 }, { x: 6, y: 1795 }, { x: 9, y: 1815 },
                { x: 12, y: 1820 }, { x: 14, y: 1830 }, { x: 17, y: 1825 },
                { x: 21, y: 1810 }, { x: 24, y: 1830 }, { x: 27, y: 1825 },
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
          'Refill velocity post-PT-6 is **~38% slower** than F2P median — hoarders did not chase top-up offers.',
          'Cohort still **−9.6% below pre-event baseline** at the +27d mark — long tail.',
        ],
      },
    },
  ],
  followUps: ['Pin to PT Liveops Board'],
};

const T2_F2P_VS_HOARDER: ChatMessage = {
  id: 'm-005-a2-f2p',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-09T10:03:30.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'F2P balances barely moved (−2.1%) — they had no hoard to drain. The signal is concentrated in **VIP-3+** where burn rate jumped 4.4× post-PT-6 vs F2P.',
      },
    },
    { type: 'h2', payload: { text: 'Burn-rate ratio · VIP-3+ ÷ F2P' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'pt6-burn-ratio',
          title: 'Daily gem-burn ratio (VIP-3+ ÷ F2P) · −7d to +14d',
          xLabel: 'Days from PT-6 start',
          yLabel: 'Burn-rate ratio',
          bars: [
            { label: '−7d', value: 1.05 },
            { label: '−3d', value: 1.10 },
            { label: '0',   value: 1.20 },
            { label: '+3d', value: 3.80 },
            { label: '+7d', value: 4.40 },
            { label: '+14d', value: 2.10 },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'VIP-3+ burn peaked at **4.4× F2P** in week 1 of PT-6.',
          'Effect halved by +14d — the rebalance pulse, not a behavior change.',
        ],
      },
    },
  ],
  followUps: ['Pin to PT Liveops Board'],
};

const T2_PARITY: ChatMessage = {
  id: 'm-005-a2-parity',
  role: 'assistant',
  credits: 2,
  createdAt: '2026-05-09T10:03:45.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Drop-table parity audit across PT-6 ran clean — no rare-tier outliers, no per-server drift, no client-overrides flagged. Production rates within ±0.4% of design weights for all 12 reward slots. Safe to baseline.',
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'All 12 reward slots within ±0.4% of design weights.',
          'No per-server drift across VN-A, VN-B, VN-C.',
          'Zero client-side override events flagged in audit log.',
        ],
      },
    },
  ],
  followUps: ['Pin to PT Liveops Board'],
};

const T3_PIN: ChatMessage = {
  id: 'm-005-a3-pin',
  role: 'assistant',
  credits: 1,
  createdAt: '2026-05-09T10:04:00.000Z',
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Pinning the hoarder trajectory chart to the **PT Liveops Board** for ongoing tracking. Future PT runs can reuse this lens.',
      },
    },
    {
      type: 'pin_to_board',
      payload: {
        boardName: 'PT Liveops Board',
        widgetSnapshotId: 'pt6-hoarder-trajectory',
      },
    },
  ],
};

export const thread005: Conversation = {
  id: 'thread-005',
  title: 'Compare PT-6 vs PT-10 gem-burn',
  createdAt: '2026-05-09T10:01:30.000Z',
  updatedAt: '2026-05-09T10:04:00.000Z',
  messages: [
    {
      id: 'm-005-u1',
      role: 'user',
      text: 'Compare PT-6 vs PT-10 gem-burn — did the hoarder branch drain stockpiles?',
      createdAt: '2026-05-09T10:01:30.000Z',
    },
    T1,
    {
      id: 'm-005-u2',
      role: 'user',
      text: 'Drill into hoarder segment',
      createdAt: '2026-05-09T10:02:30.000Z',
    },
    T2_DRILL_HOARDER,
    {
      id: 'm-005-u3',
      role: 'user',
      text: 'Pin to PT Liveops Board',
      createdAt: '2026-05-09T10:03:30.000Z',
    },
    T3_PIN,
  ],
};

/** Named exports consumed by multi-turn-registry. */
export const thread005Turns = {
  drillHoarder: T2_DRILL_HOARDER,
  f2pVsHoarder: T2_F2P_VS_HOARDER,
  parity: T2_PARITY,
  pin: T3_PIN,
};
