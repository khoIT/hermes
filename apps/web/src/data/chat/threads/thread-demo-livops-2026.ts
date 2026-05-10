/**
 * thread-demo-livops-2026 — Canonical guided demo thread for May-12 stakeholder
 * walkthrough. 3 turns covering the full arc:
 *   T1: ARPDAU dip analysis → pin to LiveOps 2026 board
 *   T2: at-risk segment proposal → confirm existing seg-cfm-loss-streak-non-paying-2026-0508-a3f9
 *   T3: campaign proposal → CFM-13 Loss-Streak Rescue · 2026 LiveOps Demo
 *
 * All widget data reuses CFM patterns from data/catalog/. File kept ≤200 LOC.
 */
import type { Conversation, ChatMessage } from '../../../utils/chat-store';

// ─── T1: ARPDAU breakdown ───────────────────────────────────────────────────

const T1: ChatMessage = {
  id: 'm-demo-a1',
  role: 'assistant',
  credits: 5,
  createdAt: '2026-05-10T09:00:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'CFM ARPDAU dropped **7%** from April to May — the steepest single-month decline in Q1 2026. Three player cohorts are driving the slide: loss-streak players going dark after 4+ ranked defeats, lapsed mid-tier spenders who skipped the May battle pass, and F2P churners who never converted after the recent rank-reset event. The loss-streak cohort is the most actionable — they have high re-engagement propensity if reached within 24h of the streak.',
      },
    },
    { type: 'h2', payload: { text: 'CFM ARPDAU · 12-week trend (Apr–May 2026)' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'demo-arpdau-trend-12w',
          title: 'CFM ARPDAU · weekly (USD)',
          xLabel: 'Week',
          yLabel: 'ARPDAU $',
          series: [
            {
              name: 'ARPDAU',
              color: '#f05a22',
              data: [
                { x: 'W01', y: 2.84 }, { x: 'W02', y: 2.91 }, { x: 'W03', y: 2.88 },
                { x: 'W04', y: 2.95 }, { x: 'W05', y: 2.97 }, { x: 'W06', y: 2.93 },
                { x: 'W07', y: 2.89 }, { x: 'W08', y: 2.78 }, { x: 'W09', y: 2.71 },
                { x: 'W10', y: 2.66 }, { x: 'W11', y: 2.61 }, { x: 'W12', y: 2.57 },
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
          'Loss-streak players (4+ ranked defeats): **−3.1%** ARPDAU contribution · 52,600 UIDs at risk.',
          'Lapsed mid-tier spenders skipped May battle pass: **−2.2%** ARPDAU contribution.',
          'F2P churn post rank-reset: **−1.7%** ARPDAU contribution · hardest to recover.',
        ],
      },
    },
    {
      type: 'pin_to_board',
      payload: {
        boardName: 'LiveOps 2026',
        widgetSnapshotId: 'demo-arpdau-trend-12w',
      },
    },
  ],
  followUps: [
    "Who's most at risk right now?",
    'Compare to Q1 2026',
    'Show competitor benchmarks',
  ],
};

// ─── T2: at-risk segment ─────────────────────────────────────────────────────

const T2: ChatMessage = {
  id: 'm-demo-a2',
  role: 'assistant',
  credits: 4,
  createdAt: '2026-05-10T09:02:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    {
      type: 'narrative',
      payload: {
        text: '5,200 players hit a 4+ ranked-loss streak **this week** — the single most actionable cohort. They have a 38% 7d churn rate vs 12% baseline, but past rescue IAMs at loss-5 recovered 62% of sessions with a 200-gem consolation grant. Three features pin the cohort precisely.',
      },
    },
    { type: 'h2', payload: { text: 'Loss-streak distribution · current week' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'demo-loss-streak-dist',
          title: 'Players by consecutive ranked-loss streak (current week)',
          xLabel: 'Streak length',
          yLabel: 'Players',
          bars: [
            { label: '1–2',  value: 41200 },
            { label: '3–4',  value: 18600, color: '#f59e0b' },
            { label: '5–6',  value:  5200, color: '#f05a22' },
            { label: '7–8',  value:  2100, color: '#dc2626' },
            { label: '9+',   value:   900, color: '#991b1b' },
          ],
        },
      },
    },
    { type: 'feature_chip', payload: { featureName: 'consecutive_ranked_losses_streak' } },
    { type: 'feature_chip', payload: { featureName: 'is_paying_user_lifetime' } },
    { type: 'feature_chip', payload: { featureName: 'iam_received_count_24h' } },
    {
      type: 'action_card_segment',
      payload: {
        name: 'CFM · Loss Streak · Non-Paying · Ranked',
        description: 'consecutive_ranked_losses_streak ≥ 5 AND is_paying_user_lifetime = false AND iam_received_count_24h < 1',
        targetSegmentId: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9',
      },
    },
  ],
  followUps: [
    'Build a rescue intervention',
    'Tighten to non-paying only',
    'Show 7d retention impact',
  ],
};

// ─── T3: campaign proposal ───────────────────────────────────────────────────

const T3: ChatMessage = {
  id: 'm-demo-a3',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-10T09:04:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Triggering on `consecutive_ranked_losses_streak = 5` (realtime Kafka event), sending a 200-gem consolation IAM within 60s of the 5th loss. 10% holdout preserves measurement. Payload: `{ "gem_grant": 200, "copy_variant": "rescue_cfm_loss_v2" }`. Past A/B (Jan 2026) showed +24 pts D7 retention lift, p < 0.001.',
      },
    },
    {
      type: 'action_card_campaign',
      payload: {
        name: 'CFM-13 Loss-Streak Rescue · 2026 LiveOps Demo',
        type: 'realtime',
        segmentId: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9',
        description: 'Realtime rescue IAM on loss-streak=5 · 200-gem grant · 10% holdout · sourceThreadId: thread-demo-livops-2026',
      },
    },
  ],
  followUps: [
    // "Activate" removed — the action_card_campaign Confirm button is the
    // canonical activation path; the chip was a dead-end (narrative-only).
    'Tweak holdout %',
    'Add a control variant',
  ],
};

// ─── Full conversation ────────────────────────────────────────────────────────

export const threadDemoLivops2026: Conversation = {
  id: 'thread-demo-livops-2026',
  title: 'Why is CFM ARPDAU dipping last quarter?',
  createdAt: '2026-05-10T09:00:00.000Z',
  updatedAt: '2026-05-10T09:04:00.000Z',
  messages: [
    {
      id: 'm-demo-u1',
      role: 'user',
      text: 'Why is CFM ARPDAU dipping last quarter?',
      createdAt: '2026-05-10T09:00:00.000Z',
    },
    T1,
    {
      id: 'm-demo-u2',
      role: 'user',
      text: "Who's most at risk right now?",
      createdAt: '2026-05-10T09:01:30.000Z',
    },
    T2,
    {
      id: 'm-demo-u3',
      role: 'user',
      text: 'Build a rescue intervention',
      createdAt: '2026-05-10T09:03:30.000Z',
    },
    T3,
  ],
};

/** Named turn exports consumed by multi-turn-registry. */
export const threadDemoLivops2026Turns = {
  atRisk: T2,
  campaign: T3,
};
