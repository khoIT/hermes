/**
 * thread-demo-agent-livops-2026 — AGENT-FIRST demo arc.
 *
 * Sibling of thread-demo-livops-2026 (the canonical analyst arc). Lives on a
 * separate demo path so the canonical conversational-analyst demo is untouched.
 * Locked design decisions (per /cook plan 260510-2300):
 *   - Inbox/entry voice: A · analyst observation-led ("Hermes · 06:14 today /
 *     CFM ARPDAU is down 7% vs last 4 weeks. Traced to mid-skill ranked
 *     players hitting loss-streaks ≥ 5 — that bucket grew 3.2× this quarter.")
 *   - T4 retrospective tone: B · forecast exceeded + new insight
 *
 * Differentiators vs the canonical arc (these are the demo's value claims):
 *   1. Tool-call chips — each turn opens with one or more `tool_call` sections
 *      surfacing the queries the agent ran. Distinguishes "agent doing work"
 *      from "well-styled chatbot."
 *   2. Provenance footers — every chart has a `provenance` caption beneath
 *      with source/window/sample. Grounds claims in data.
 *   3. T4 post-launch retrospective — closes the loop. Confirms (or partially
 *      confirms) the prediction, surfaces an unexpected learning.
 *
 * Arc: T1 diagnose → T2 build segment → T3 launch campaign → T4 retro.
 * Slim shape: only the user prompt seeded; T1 auto-plays on entry.
 */
import type { Conversation, ChatMessage } from '../../../utils/chat-store';

const TARGET_SEGMENT_ID = 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9';

// ─── T1: ARPDAU diagnosis (analyst observation, tool calls, provenance) ─────

const T1: ChatMessage = {
  id: 'm-agent-a1',
  role: 'assistant',
  credits: 6,
  createdAt: '2026-05-10T06:14:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    // Tool-call chain — what the agent did before posting this opportunity.
    { type: 'tool_call', payload: {
      fn: 'query_trino',
      args: [
        { name: 'catalog', value: 'cfm_vn' },
        { name: 'table',   value: 'ranked_match' },
        { name: 'window',  value: '2026-04-15 → 2026-05-09' },
      ],
      result: '2,103,847 rows · cached:false',
      durationMs: 1420,
    } },
    { type: 'tool_call', payload: {
      fn: 'compute_decomp',
      args: [
        { name: 'metric',  value: 'arpdau' },
        { name: 'factors', value: '["arppu","paying_dau_pct"]' },
        { name: 'grain',   value: 'weekly' },
      ],
      result: '2 series · 12 buckets',
      durationMs: 320,
    } },
    { type: 'tool_call', payload: {
      fn: 'bucket_by',
      args: [
        { name: 'feature', value: 'consecutive_ranked_losses_streak' },
        { name: 'bins',    value: '[1-2,3-4,5-6,7-8,9+]' },
        { name: 'measure', value: 'd7_retention' },
      ],
      result: '5 buckets · cliff at 5+',
      durationMs: 540,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'CFM ARPDAU is down **7%** over the last 4 weeks vs April. I decomposed the metric: **ARPPU is flat at $24.10**, but **Paying-DAU% slipped from 12.1% → 10.4%**. This is a conversion problem, not a spend problem — fewer players are reaching the paid funnel, not that paying players are spending less.',
      },
    },

    { type: 'h2', payload: { text: 'ARPDAU decomposition · 12-week index' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'agent-arpdau-decomp',
          title: 'ARPPU flat, Paying-DAU% sliding (W01 = 100)',
          xLabel: 'Week',
          yLabel: 'Indexed value',
          series: [
            {
              name: 'ARPPU',
              color: '#94a3b8',
              data: [
                { x: 'W01', y: 100 }, { x: 'W02', y: 101 }, { x: 'W03', y: 100 },
                { x: 'W04', y:  99 }, { x: 'W05', y: 101 }, { x: 'W06', y: 100 },
                { x: 'W07', y:  99 }, { x: 'W08', y: 100 }, { x: 'W09', y:  99 },
                { x: 'W10', y: 100 }, { x: 'W11', y:  99 }, { x: 'W12', y:  99 },
              ],
            },
            {
              name: 'Paying-DAU %',
              color: '#f05a22',
              data: [
                { x: 'W01', y: 100 }, { x: 'W02', y: 101 }, { x: 'W03', y: 100 },
                { x: 'W04', y: 102 }, { x: 'W05', y: 102 }, { x: 'W06', y: 100 },
                { x: 'W07', y:  98 }, { x: 'W08', y:  95 }, { x: 'W09', y:  92 },
                { x: 'W10', y:  90 }, { x: 'W11', y:  88 }, { x: 'W12', y:  86 },
              ],
            },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.ranked_match · window 2026-02-16 → 2026-05-09 · n=2.1M player-weeks · refreshed 14m ago' } },

    { type: 'h2', payload: { text: 'Where the leak is · streak ≥ 5 cliff' } },
    {
      type: 'narrative',
      payload: {
        text: 'I drilled into mid-skill ranked. Bucketing 7d retention by `consecutive_ranked_losses_streak` reveals the cliff: at **5+ losses, retention drops 73% → 41%**, and that bucket grew **3.2× since the April matchmaking widening**.',
      },
    },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-streak-retention-cliff',
          title: '7d retention by loss-streak length · cliff at 5+',
          xLabel: 'consecutive_ranked_losses_streak',
          yLabel: '7d retention %',
          bars: [
            { label: '1–2',  value: 73, color: '#10b981' },
            { label: '3–4',  value: 67, color: '#84cc16' },
            { label: '5–6',  value: 41, color: '#f59e0b' },
            { label: '7–8',  value: 28, color: '#ef4444' },
            { label: '9+',   value: 19, color: '#b91c1c' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.ranked_match + ranked_session · window 2026-04-15 → 2026-05-09 · cohort: mid-skill ranked (mmr 1100–1900) · n=480k UIDs' } },

    {
      type: 'insights',
      payload: {
        items: [
          'ARPPU stable ($24.10) — **not a depth-of-spend problem**.',
          'D7 retention −8pt, concentrated in mid-skill ranked.',
          'Loss-streak ≥ 5: retention cliff 73 → 41% **and** bucket size +3.2× QoQ.',
          'One operationally-actionable lever: rescue mechanic for the cliff bucket.',
        ],
      },
    },
  ],
  followUps: [
    'Build a rescue segment',
    'Show me Q1 comparison',
  ],
};

// ─── T2: Build rescue segment ──────────────────────────────────────────────

const T2: ChatMessage = {
  id: 'm-agent-a2',
  role: 'assistant',
  credits: 5,
  createdAt: '2026-05-10T06:16:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    { type: 'tool_call', payload: {
      fn: 'load_experiment',
      args: [
        { name: 'id',     value: 'cfm_loss_streak_rescue_v1' },
        { name: 'window', value: '2026-01-08 → 2026-01-29' },
      ],
      result: 'n=18,400 · 3 arms · α=0.05',
      durationMs: 380,
    } },
    { type: 'tool_call', payload: {
      fn: 'estimate_audience',
      args: [
        { name: 'predicate', value: 'streak≥5 AND session_count_7d≥3 AND last_purchase≥30d' },
      ],
      result: '2,950 UIDs · projected +24pp D7',
      durationMs: 720,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'The cliff bucket is **5,200 UIDs/week**. That\'s too broad — Jan 2026 A/B showed grants converted poorly on the disengaged tail and zero on recent payers. I tightened with two filters that earned their place against past A/B data:',
      },
    },

    { type: 'h2', payload: { text: 'Filter B · session_count_7d ≥ 3 (engagement quality)' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-filter-b-lift',
          title: 'D7 retention lift from rescue grant, by 7d session count',
          xLabel: 'session_count_7d',
          yLabel: 'D7 lift (pp)',
          bars: [
            { label: '1',   value:  6, color: '#94a3b8' },
            { label: '2',   value:  9, color: '#94a3b8' },
            { label: '3',   value: 18, color: '#10b981' },
            { label: '4–5', value: 24, color: '#10b981' },
            { label: '6+',  value: 27, color: '#10b981' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: experiment cfm_loss_streak_rescue_v1 · 2026-01-08 → 2026-01-29 · n=18,400 · α=0.05' } },

    { type: 'h2', payload: { text: 'Filter C · last_purchase_days_ago ≥ 30 (monetization fit)' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-filter-c-lift',
          title: 'D7 retention lift, by purchase recency',
          xLabel: 'last_purchase_days_ago',
          yLabel: 'D7 lift (pp)',
          bars: [
            { label: '0–7',     value:  1, color: '#ef4444' },
            { label: '8–30',    value:  9, color: '#94a3b8' },
            { label: '30+',     value: 22, color: '#10b981' },
            { label: 'never',   value: 26, color: '#10b981' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: experiment cfm_loss_streak_rescue_v1 · cohort split by monetization recency · n=18,400' } },

    {
      type: 'insights',
      payload: {
        items: [
          'Filter A (severity): **streak ≥ 5** — already established (the cliff).',
          'Filter B (engagement quality): **session_count_7d ≥ 3** — clear elbow, lift collapses below.',
          'Filter C (monetization fit): **last_purchase_days_ago ≥ 30** — recent payers self-rescue via shop, ~0pp lift.',
          'Stacked cohort: **2,950 UIDs/week** · 4.4× baseline churn risk · projected **+24pp D7 lift**.',
        ],
      },
    },

    {
      type: 'action_card_segment',
      payload: {
        name: 'CFM · Loss Streak · Engaged · Lapsed-Payer',
        description: 'consecutive_ranked_losses_streak ≥ 5 AND session_count_7d ≥ 3 AND last_purchase_days_ago ≥ 30',
        features: [
          'consecutive_ranked_losses_streak',
          'session_count_7d',
          'last_purchase_days_ago',
        ],
        targetSegmentId: TARGET_SEGMENT_ID,
      },
    },
  ],
  followUps: [
    'Launch the rescue campaign',
  ],
};

// ─── T3: Launch rescue campaign ────────────────────────────────────────────

const T3: ChatMessage = {
  id: 'm-agent-a3',
  role: 'assistant',
  credits: 4,
  createdAt: '2026-05-10T06:18:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    { type: 'tool_call', payload: {
      fn: 'estimate_cost',
      args: [
        { name: 'audience',       value: 2950 },
        { name: 'iam_cpm_usd',    value: 0.81 },
        { name: 'touches',        value: 3 },
      ],
      result: '$2,406 · 8,850 impressions',
      durationMs: 220,
    } },
    { type: 'tool_call', payload: {
      fn: 'split_holdout',
      args: [
        { name: 'cohort',  value: 2950 },
        { name: 'percent', value: 20 },
      ],
      result: '2,360 treatment · 590 holdout',
      durationMs: 140,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'Rescue mechanic mirrors Jan 2026 v1: **3-touch IAM grant** (rank-token + cosmetic + ranked-protect) triggered on the next loss after `streak ≥ 5`. **Estimated cost ~$2.4k** for the 2,950 cohort. **20% holdout** to measure lift in 14d. Auto-pause guardrail wired: rolls back if D7 retention drops > 2pt vs holdout.',
      },
    },

    {
      type: 'action_card_campaign',
      payload: {
        name: 'CFM · Loss-streak rescue · May 2026',
        type: 'realtime',
        segmentId: TARGET_SEGMENT_ID,
        description: '3-touch IAM grant on streak ≥ 5 trigger. 20% holdout. Auto-pause guardrail at −2pp D7.',
      },
    },

    {
      type: 'soft_hint',
      payload: { text: 'I\'ll watch this for two weeks and post a retrospective. ↳ Click "Show me the 2-week retrospective" to skip ahead.' },
    },
  ],
  followUps: [
    'Show me the 2-week retrospective',
  ],
};

// ─── T4: Two-weeks-later retrospective (variant B — forecast exceeded) ─────

const T4: ChatMessage = {
  id: 'm-agent-a4',
  role: 'assistant',
  credits: 5,
  createdAt: '2026-05-24T06:30:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    { type: 'tool_call', payload: {
      fn: 'load_experiment',
      args: [
        { name: 'id',     value: 'cfm_loss_streak_rescue_v2' },
        { name: 'window', value: '2026-05-10 → 2026-05-24' },
      ],
      result: 'n=2,947 (treat) + 587 (hold) · p<0.001',
      durationMs: 460,
    } },
    { type: 'tool_call', payload: {
      fn: 'shapley_attribution',
      args: [
        { name: 'filters', value: '[A:streak,B:sessions,C:purchase]' },
        { name: 'target',  value: 'd7_retention_lift' },
      ],
      result: 'B=71% · A=19% · C=10%',
      durationMs: 1180,
    } },
    { type: 'tool_call', payload: {
      fn: 'check_holdout_integrity',
      args: [{ name: 'experiment_id', value: 'cfm_loss_streak_rescue_v2' }],
      result: '587/590 measurable · 99.5% intact',
      durationMs: 280,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'Two weeks in. Rescue delivered **+27pp D7 retention lift** on the targeted cohort vs holdout — **beating the +24pp forecast by 3pt**. Holdout intact at 587/590 UIDs (3 churned independently before assignment).',
      },
    },

    { type: 'h2', payload: { text: 'D7 retention · treatment vs holdout · 14-day curve' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'agent-retro-d7-curve',
          title: 'Treatment D7 = 71% · Holdout D7 = 44% · Δ +27pp',
          xLabel: 'Day after streak trigger',
          yLabel: 'Retention %',
          series: [
            {
              name: 'Treatment',
              color: '#10b981',
              data: [
                { x: 'D0', y: 100 }, { x: 'D1', y: 94 }, { x: 'D2', y: 87 },
                { x: 'D3', y: 82 }, { x: 'D4', y: 78 }, { x: 'D5', y: 75 },
                { x: 'D6', y: 73 }, { x: 'D7', y: 71 },
              ],
            },
            {
              name: 'Holdout',
              color: '#94a3b8',
              data: [
                { x: 'D0', y: 100 }, { x: 'D1', y: 78 }, { x: 'D2', y: 64 },
                { x: 'D3', y: 56 }, { x: 'D4', y: 51 }, { x: 'D5', y: 47 },
                { x: 'D6', y: 45 }, { x: 'D7', y: 44 },
              ],
            },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: experiment cfm_loss_streak_rescue_v2 · 2026-05-10 → 2026-05-24 · n=2,947 (treat) + 587 (hold) · α=0.05 · p<0.001' } },

    { type: 'h2', payload: { text: 'Where the lift came from · the surprise' } },
    {
      type: 'narrative',
      payload: {
        text: 'I decomposed the +27pp lift across the three filters. The surprise: **Filter B (`session_count_7d ≥ 3`) explained 71% of the lift on its own** — meaning the **engaged-but-frustrated** player was the dominant rescue candidate, not the disengaged loss-streaker we initially weighted higher.',
      },
    },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-retro-attribution',
          title: 'Lift attribution by filter (Shapley, % of total +27pp)',
          xLabel: 'Filter',
          yLabel: '% of total lift',
          bars: [
            { label: 'B · session_count_7d ≥ 3',     value: 71, color: '#10b981' },
            { label: 'A · streak ≥ 5',                value: 19, color: '#84cc16' },
            { label: 'C · last_purchase ≥ 30d',       value: 10, color: '#94a3b8' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: shapley value attribution over filter coalitions · same A/B sample as above' } },

    {
      type: 'insights',
      payload: {
        items: [
          '+27pp D7 lift, beating forecast by 3pt · p<0.001 · holdout intact.',
          '**The surprise:** filter B (engagement) explained 71% of the lift on its own.',
          'Implication: engaged-but-frustrated > disengaged loss-streaker as rescue target.',
          'Future rescues should **lead with engagement filters**, use streak as secondary.',
        ],
      },
    },

    {
      type: 'soft_hint',
      payload: { text: 'I\'ve drafted a v2 segment that puts engagement first. Ready when you are.' },
    },
  ],
  followUps: [],
};

// ─── Conversation seed (slim — T1 auto-plays on entry) ─────────────────────

/**
 * Slim conversation seed mirrors thread-demo-livops-2026 shape: only the
 * initial user prompt. T1 auto-plays on entry (chat-rail + thread-page).
 *
 * Seed-message convention (agent-first threads):
 *   The user message is a contextual investigative question grounded in the
 *   detection's subject — NOT a generic "show me what you found." The user
 *   is staged as a PM asking the agent to dig into the specific anomaly
 *   surfaced on the /welcome inbox card. T1's answer then reads as a real
 *   handoff response rather than the agent unloading on an empty prompt.
 *   See docs/journals/260511-agent-first-seed-message-convention.md.
 */
export const threadDemoAgentLivops2026: Conversation = {
  id: 'thread-demo-agent-livops-2026',
  title: 'Hermes noticed: CFM ARPDAU −7% drift',
  createdAt: '2026-05-10T06:14:00.000Z',
  updatedAt: '2026-05-10T06:14:00.000Z',
  messages: [
    {
      id: 'm-agent-u1',
      role: 'user',
      text: 'What\'s behind the CFM ARPDAU drop?',
      createdAt: '2026-05-10T06:14:00.000Z',
    },
  ],
};

/** Named turn exports consumed by multi-turn-registry + auto-play bootstrap. */
export const threadDemoAgentLivops2026Turns = {
  t1: T1,
  segment: T2,
  campaign: T3,
  retrospective: T4,
};
