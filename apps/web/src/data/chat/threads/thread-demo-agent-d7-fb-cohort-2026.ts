/**
 * thread-demo-agent-d7-fb-cohort-2026 — AGENT-FIRST demo arc (Thread B).
 *
 * Sibling of thread-demo-agent-livops-2026. Covers the D7 retention drop on
 * FB-acquired May 2026 cohort. Same 4-turn structure but rotated tool-call
 * shapes to avoid déjà vu with arc A.
 *   - Inbox/entry voice: B · D7 retention drop on FB cohort
 *   - T4 retrospective tone: B · forecast exceeded + new insight (D14 carryover)
 *
 * Arc: T1 diagnose → T2 build rescue segment → T3 launch campaign → T4 retro.
 * Slim shape: only the user prompt seeded; T1 auto-plays on entry.
 *
 * Numerical anchors (pin across all turns):
 *   blended D7 baseline = 22.4%
 *   FB May cohort D7    = 18.2%
 *   gap                 = 4.2pp
 *   rescue segment      = ~38,200 UIDs
 *   forecast lift       = +6.0pp ± 1.4pp
 *   actual lift         = +8.1pp (beat forecast by 2pt)
 *   D14 carryover       = +5.2pp
 *   D21 carryover       = +3.4pp
 */
import type { Conversation, ChatMessage } from '../../../utils/chat-store';
import type {
  WorkingStatusPayload, TaskProgressPayload, SubagentPanelPayload,
} from '../response-types';

const TARGET_SEGMENT_ID = 'seg-cfm-d7-fb-cohort-engaged-2026-0510-b4e2';

// ─── Deep-research trace consts (rendered when toggle ON) ───────────────────

const WORKING_STATUS_D7_FB: WorkingStatusPayload = {
  intent: 'I will analyze D7 retention drop on the FB-acquired May 2026 cohort, isolate the funnel stage where retention diverges from baseline, and identify the in-cohort sub-segment most responsive to rescue.',
  state: 'working',
};

const TASK_PROGRESS_D7_FB: TaskProgressPayload = {
  percent: 57,
  steps: [
    { label: 'Read schema and understand available data structure',                state: 'done' },
    { label: 'Gather initial data from specialized agents in parallel',            state: 'done' },
    { label: 'Build and validate hypotheses from initial findings',                state: 'done' },
    { label: 'Conduct statistical significance tests on top insights',             state: 'done' },
    { label: 'Synthesize findings and create comprehensive report with visualizations', state: 'in_progress' },
    { label: 'Get critique and refine report',                                     state: 'pending' },
    { label: 'Send final report to client',                                        state: 'pending' },
  ],
};

const SUBAGENTS_D7_FB: SubagentPanelPayload['agents'] = [
  {
    name: 'Acquisition Analysis Agent',
    summary: 'Compared D7 retention across acquisition channels for the May 2026 cohort. Facebook = 18.2% vs blended 22.4% — a 4.2pp gap. Google, Organic, and Referral cohorts at parity with baseline.',
    tasks: [
      'Pull May 2026 install attribution from cfm_vn',
      'Segment by acquisition channel (FB / Google / Organic / Referral)',
      'Compute D1/D3/D7 retention curves per channel',
      'Flag channels deviating > 2pp from blended baseline',
      'Conclude: FB cohort isolated for further analysis',
    ],
  },
  {
    name: 'Onboarding Funnel Agent',
    summary: 'Decomposed the FB cohort funnel D0→D1→D3→D7. Drop opens between D3 and D7. D0/D1/D3 retention matches baseline within 1pt; gap concentrates at D7.',
    tasks: [
      'Load D0-D7 retention snapshots for FB May cohort',
      'Compute per-day retention deltas vs blended baseline',
      'Identify the day-window where the gap opens',
      'Cross-check against tutorial-completion timestamps',
      'Conclude: D3→D7 transition is the leak point',
    ],
  },
  {
    name: 'Cohort Comparison Agent',
    summary: 'Compared April 2026 and May 2026 FB cohorts. April FB cohort behaved like baseline; May FB cohort regressed. Onset of the regression aligns with the May 2 onboarding A/B mishap that exposed legacy variant to all FB users.',
    tasks: [
      'Build paired FB cohorts: Apr 1-30 vs May 1-9',
      'Run two-sample test on D7 retention',
      'Cross-reference with deployment-history table',
      'Identify May 2 onboarding-variant rollback as inflection point',
      'Confirm regression is variant-driven, not seasonal',
    ],
  },
  {
    name: 'Tutorial Completion Agent',
    summary: 'Measured tutorial-completion% across onboarding variants. Legacy v1 completion = 58%; new v2 (the rolled-back one) = 81%. Users who saw legacy and partially completed (40-60%) drive the D7 gap.',
    tasks: [
      'Pull tutorial-completion percentages by variant',
      'Bucket users by completion % (0-25 / 25-60 / 60-90 / 90+)',
      'Compute D7 retention per bucket',
      'Identify the 25-60% bucket as the lift target',
      'Confirm legacy variant correlates with low completion',
    ],
  },
  {
    name: 'Research Agent',
    summary: 'Cross-referenced internal cohort archive for prior onboarding regressions. Found 2 comparable cases (Q3 2024, Q1 2025) where tutorial-rollback caused D7 drops of 3-5pp; both recovered with re-trigger campaigns.',
    tasks: [
      'Search anomaly archive for "tutorial rollback" + "D7 drop"',
      'Pull 2024-Q3 and 2025-Q1 case studies',
      'Compare regression magnitudes (3-5pp range)',
      'Extract historical rescue mechanic (tutorial re-trigger)',
      'Validate +6pp lift forecast against prior case outcomes',
    ],
  },
];

// ─── T1: D7 retention diagnosis (tool calls + channel breakdown + funnel) ────

const T1: ChatMessage = {
  id: 'm-agent-b1',
  role: 'assistant',
  credits: 6,
  createdAt: '2026-05-09T14:20:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    // Deep-research trace (rendered when toggle ON; gated in assistant-response).
    { type: 'working_status', payload: WORKING_STATUS_D7_FB },
    { type: 'task_progress',  payload: TASK_PROGRESS_D7_FB },
    { type: 'subagent_panel', payload: { agents: SUBAGENTS_D7_FB } },

    // Tool-call chain: query raw data → split by channel → compare funnels
    { type: 'tool_call', payload: {
      fn: 'query_trino',
      args: [
        { name: 'catalog', value: 'cfm_vn' },
        { name: 'table',   value: 'acquisition_attribution' },
        { name: 'window',  value: '2026-04-15 → 2026-05-09' },
      ],
      result: '1,847,302 rows · cached:false',
      durationMs: 1340,
    } },
    { type: 'tool_call', payload: {
      fn: 'cohort_split',
      args: [
        { name: 'dim',      value: 'acquisition_channel' },
        { name: 'cohorts',  value: '["facebook","google","organic","referral"]' },
        { name: 'measure',  value: 'd7_retention' },
      ],
      result: '4 cohorts · FB outlier',
      durationMs: 410,
    } },
    { type: 'tool_call', payload: {
      fn: 'compare_funnels',
      args: [
        { name: 'cohort',   value: 'facebook_may_2026' },
        { name: 'stages',   value: '["D1","D3","D7"]' },
        { name: 'baseline', value: 'blended_q1_2026' },
      ],
      result: 'D1=92% D3=64% D7=18.2% (blended D7=22.4%)',
      durationMs: 620,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'D7 retention for FB-acquired May cohort is **18.2% vs blended baseline 22.4% — a 4.2pp gap**. Decomposed: D1 holds parity (92% vs 91%), D3 holds parity (64% vs 65%), but **D7 drops 4.2pp on the FB cohort specifically**. The damage happens between D3 and D7. Drilling into the funnel, the gap concentrates in users who saw the **legacy onboarding tutorial** (rolled back to all FB cohorts during the May 2 A/B mishap).',
      },
    },

    { type: 'h2', payload: { text: 'D7 retention by acquisition channel (May 2026)' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-b-channel-d7',
          title: 'D7 retention by acquisition channel · FB is the outlier',
          xLabel: 'Acquisition channel',
          yLabel: 'D7 retention %',
          bars: [
            { label: 'Facebook',  value: 18.2, color: '#ef4444' },
            { label: 'Google',    value: 22.6, color: '#94a3b8' },
            { label: 'Organic',   value: 23.1, color: '#94a3b8' },
            { label: 'Referral',  value: 22.0, color: '#94a3b8' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.acquisition_attribution · window 2026-04-15 → 2026-05-09 · n=1.84M attributable installs' } },

    { type: 'h2', payload: { text: 'Funnel parity until D7 — gap opens between D3 and D7' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'agent-b-funnel-diverge',
          title: 'FB May cohort vs Blended Q1 baseline · converge at D3, diverge at D7',
          xLabel: 'Retention day',
          yLabel: 'Retention %',
          series: [
            {
              name: 'FB May cohort',
              color: '#ef4444',
              data: [
                { x: 'D1', y: 92 }, { x: 'D3', y: 64 }, { x: 'D7', y: 18.2 },
                { x: 'D14', y: 11.4 }, { x: 'D30', y: 6.2 },
              ],
            },
            {
              name: 'Blended Q1 baseline',
              color: '#94a3b8',
              data: [
                { x: 'D1', y: 91 }, { x: 'D3', y: 65 }, { x: 'D7', y: 22.4 },
                { x: 'D14', y: 15.8 }, { x: 'D30', y: 9.1 },
              ],
            },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.acquisition_attribution + user_events · cohort window 2026-04-15 → 2026-05-09 · n=480k FB UIDs vs 1.36M blended UIDs' } },

    {
      type: 'insights',
      payload: {
        items: [
          'FB cohort D7 = **18.2%** vs blended 22.4% — **4.2pp gap**.',
          'D1 and D3 hold parity — the drop is D3→D7, not early churn.',
          'Root cause traced to **legacy_v1 onboarding tutorial** rolled back to FB cohorts during May 2 A/B mishap.',
          'Actionable: re-trigger tutorial + add a D3 completion incentive for the affected sub-segment.',
        ],
      },
    },

    {
      type: 'soft_hint',
      payload: { text: 'I\'ve identified ~38k UIDs where the fix will land. Ready to build the rescue segment.' },
    },
  ],
  followUps: [
    'Build a rescue segment',
  ],
};

// ─── T2: Build rescue segment (3 filters + action card) ───────────────────

const T2: ChatMessage = {
  id: 'm-agent-b2',
  role: 'assistant',
  credits: 5,
  createdAt: '2026-05-09T14:23:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    { type: 'tool_call', payload: {
      fn: 'query_features',
      args: [
        { name: 'features',  value: '["onboarding_variant","session_count_3d","tutorial_completion_pct"]' },
        { name: 'audience',  value: 'fb_may_2026_d3_active' },
      ],
      result: '4 features · 218k UIDs',
      durationMs: 340,
    } },
    { type: 'tool_call', payload: {
      fn: 'bucket_lift',
      args: [
        { name: 'metric',  value: 'd7_retention' },
        { name: 'splits',  value: '["legacy_tutorial","new_tutorial"]' },
      ],
      result: 'legacy=15.8% · new=22.1% · gap=6.3pp',
      durationMs: 520,
    } },
    { type: 'tool_call', payload: {
      fn: 'estimate_cohort_size',
      args: [
        { name: 'predicate', value: 'fb AND legacy_tutorial AND tutorial_completion<60%' },
      ],
      result: '~38,200 UIDs · 17.5% of FB cohort',
      durationMs: 190,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'Filter A — `acquisition_channel = facebook` (the cohort with the gap).\nFilter B — `onboarding_variant = legacy_v1` (the regression source; legacy users D7=15.8% vs new=22.1%, a 6.3pp spread).\nFilter C — `tutorial_completion_pct < 60%` (the in-cohort sub-segment where lift will land — fully-completed legacy users already have D7 parity).\n\nStacked: **~38,200 UIDs**, projected **+6pp D7 lift**.',
      },
    },

    { type: 'h2', payload: { text: 'Filter A · D7 retention by acquisition channel' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-b-filter-a',
          title: 'D7 retention by channel · FB is the target',
          xLabel: 'Acquisition channel',
          yLabel: 'D7 retention %',
          bars: [
            { label: 'Facebook',  value: 18.2, color: '#ef4444' },
            { label: 'Google',    value: 22.6, color: '#94a3b8' },
            { label: 'Organic',   value: 23.1, color: '#94a3b8' },
            { label: 'Referral',  value: 22.0, color: '#94a3b8' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.acquisition_attribution · window 2026-04-15 → 2026-05-09 · n=1.84M installs' } },

    { type: 'h2', payload: { text: 'Filter B · D7 retention by onboarding variant' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-b-filter-b',
          title: 'Legacy onboarding variant drives the gap (6.3pp)',
          xLabel: 'onboarding_variant',
          yLabel: 'D7 retention %',
          bars: [
            { label: 'legacy_v1',  value: 15.8, color: '#ef4444' },
            { label: 'new_v2',     value: 22.1, color: '#10b981' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.user_events · feature: onboarding_variant · FB May cohort · n=218k UIDs · query_features run 14:23' } },

    { type: 'h2', payload: { text: 'Filter C · D7 retention by tutorial completion %' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-b-filter-c',
          title: 'Lift concentrates in <60% completers (staircase pattern)',
          xLabel: 'tutorial_completion_pct',
          yLabel: 'D7 retention %',
          bars: [
            { label: '0–25%',   value: 13.1, color: '#b91c1c' },
            { label: '25–60%',  value: 16.9, color: '#ef4444' },
            { label: '60–90%',  value: 21.4, color: '#84cc16' },
            { label: '90%+',    value: 22.8, color: '#10b981' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.user_events · feature: tutorial_completion_pct · FB legacy_v1 cohort · n=98k UIDs' } },

    {
      type: 'insights',
      payload: {
        items: [
          'Filter A (channel): **acquisition_channel = facebook** — the only channel below blended baseline.',
          'Filter B (onboarding): **onboarding_variant = legacy_v1** — 6.3pp lift vs new_v2 within FB cohort.',
          'Filter C (completion): **tutorial_completion_pct < 60%** — completed users already at parity; intervention unneeded.',
          'Stacked segment: **~38,200 UIDs · 17.5% of FB cohort** · projected **+6pp D7 lift**.',
        ],
      },
    },

    {
      type: 'action_card_segment',
      payload: {
        name: 'CFM · FB May · Legacy Onboarding · Low Completion',
        description: 'acquisition_channel = facebook AND onboarding_variant = legacy_v1 AND tutorial_completion_pct < 60%',
        features: [
          'onboarding_variant',
          'session_count_3d',
          'tutorial_completion_pct',
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
  id: 'm-agent-b3',
  role: 'assistant',
  credits: 4,
  createdAt: '2026-05-09T14:26:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    { type: 'tool_call', payload: {
      fn: 'estimate_cost',
      args: [
        { name: 'audience',    value: 38200 },
        { name: 'iam_cpm_usd', value: 0.81 },
        { name: 'touches',     value: 2 },
      ],
      result: '$619 · 76,400 impressions',
      durationMs: 210,
    } },
    { type: 'tool_call', payload: {
      fn: 'split_holdout',
      args: [
        { name: 'cohort',  value: 38200 },
        { name: 'percent', value: 20 },
      ],
      result: '30,560 treatment · 7,640 holdout',
      durationMs: 130,
    } },
    { type: 'tool_call', payload: {
      fn: 'forecast_lift',
      args: [
        { name: 'mechanic',            value: 'tutorial_retrigger_plus_d3_bonus' },
        { name: 'historical_baseline', value: 'cfm_d7_lift_v3_2025' },
      ],
      result: 'projected +6.0pp ± 1.4pp',
      durationMs: 280,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'Rescue mechanic: **tutorial re-trigger** (D2 push notification to resume the interrupted tutorial) + **first-week bonus** (rank-token grant on D3 login). **Estimated cost ~$619** for 2-touch delivery across 38,200 UIDs. **20% holdout** (30,560 treatment · 7,640 holdout) to measure lift at 7-day check. Auto-pause guardrail wired: rolls back if D7 lift < +2pp vs holdout at day 7.',
      },
    },

    {
      type: 'action_card_campaign',
      payload: {
        name: 'CFM · FB D7 Rescue · May 2026',
        type: 'realtime',
        segmentId: TARGET_SEGMENT_ID,
        description: 'Tutorial re-trigger (D2 push) + rank-token grant on D3 login. 20% holdout. Auto-pause guardrail at +2pp D7 threshold.',
      },
    },

    {
      type: 'soft_hint',
      payload: { text: 'I\'ll monitor this for two weeks and post a retrospective when the D7 data is in. ↳ Click "Show me the 2-week retrospective" to skip ahead.' },
    },
  ],
  followUps: [
    'Show me the 2-week retrospective',
  ],
};

// ─── T4: Two-weeks-later retrospective (variant B: forecast exceeded + D14 carryover surprise) ─────

const T4: ChatMessage = {
  id: 'm-agent-b4',
  role: 'assistant',
  credits: 5,
  createdAt: '2026-05-23T14:30:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    { type: 'tool_call', payload: {
      fn: 'load_experiment',
      args: [
        { name: 'id',     value: 'cfm_fb_d7_rescue_v1' },
        { name: 'window', value: '2026-05-11 → 2026-05-25' },
      ],
      result: 'n=30,540 (treat) + 7,632 (hold) · p<0.001',
      durationMs: 470,
    } },
    { type: 'tool_call', payload: {
      fn: 'cross_metric_check',
      args: [
        { name: 'metric', value: 'd14_retention' },
        { name: 'target', value: 'experiment_cohort' },
      ],
      result: 'd14_lift=+5.2pp (carryover)',
      durationMs: 890,
    } },
    { type: 'tool_call', payload: {
      fn: 'shapley_attribution',
      args: [
        { name: 'filters', value: '[A:channel,B:variant,C:completion]' },
        { name: 'target',  value: 'd7_retention_lift' },
      ],
      result: 'B=58% · A=24% · C=18%',
      durationMs: 1090,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'Two weeks in. Rescue delivered **+8.1pp D7 retention lift** — beating the +6pp forecast by 2pt (p<0.001, holdout intact). **Surprise:** the lift carried into **D14 (+5.2pp) and D21 (+3.4pp)**. The intervention didn\'t just rescue D7 — it repaired the retention curve through the first month. Re-running attribution, **Filter B (onboarding_variant=legacy_v1) explained 58% of the lift** — confirms the tutorial regression was the root cause, not the channel itself.',
      },
    },

    { type: 'h2', payload: { text: 'D7 · D14 · D21 lift — treatment vs holdout' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-b-retro-lift-bars',
          title: 'Lift carried beyond D7 — surprise D14 and D21 carryover',
          xLabel: 'Retention checkpoint',
          yLabel: 'Lift (pp vs holdout)',
          bars: [
            { label: 'D7 lift',  value: 8.1, color: '#10b981' },
            { label: 'D14 lift', value: 5.2, color: '#84cc16' },
            { label: 'D21 lift', value: 3.4, color: '#94a3b8' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: experiment cfm_fb_d7_rescue_v1 · 2026-05-11 → 2026-05-25 · n=30,540 (treat) + 7,632 (hold) · α=0.05 · p<0.001' } },

    { type: 'h2', payload: { text: 'Retention curve — treatment vs holdout over 21 days' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'agent-b-retro-curve',
          title: 'Treatment D7=26.3% · Holdout D7=18.2% · Δ +8.1pp (curves stay separated through D21)',
          xLabel: 'Day',
          yLabel: 'Retention %',
          series: [
            {
              name: 'Treatment',
              color: '#10b981',
              data: [
                { x: 'D1', y: 92 }, { x: 'D3', y: 68 }, { x: 'D7', y: 26.3 },
                { x: 'D14', y: 18.6 }, { x: 'D21', y: 13.2 },
              ],
            },
            {
              name: 'Holdout',
              color: '#94a3b8',
              data: [
                { x: 'D1', y: 91 }, { x: 'D3', y: 63 }, { x: 'D7', y: 18.2 },
                { x: 'D14', y: 13.4 }, { x: 'D21', y: 9.8 },
              ],
            },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: experiment cfm_fb_d7_rescue_v1 · same sample · cross_metric_check run 2026-05-25 · D14/D21 carryover confirmed' } },

    { type: 'h2', payload: { text: 'Shapley attribution — which filter drove the lift?' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-b-retro-shapley',
          title: 'Lift attribution by filter (Shapley, % of total +8.1pp)',
          xLabel: 'Filter',
          yLabel: '% of total lift',
          bars: [
            { label: 'B · onboarding_variant=legacy_v1', value: 58, color: '#10b981' },
            { label: 'A · acquisition_channel=facebook',  value: 24, color: '#84cc16' },
            { label: 'C · tutorial_completion<60%',        value: 18, color: '#94a3b8' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: Shapley value attribution over filter coalitions · same A/B sample · shapley_attribution run 2026-05-25' } },

    {
      type: 'insights',
      payload: {
        items: [
          '+8.1pp D7 lift, beating the +6pp forecast by 2pt · p<0.001 · holdout intact at 7,632/7,640.',
          '**Surprise:** lift carried into D14 (+5.2pp) and D21 (+3.4pp) — the tutorial fix repaired the retention curve through the first month.',
          'Shapley attribution: **Filter B (onboarding_variant=legacy_v1) drove 58% of the lift** — confirms tutorial regression as root cause, not the FB channel itself.',
          'Implication: future FB cohorts should be gated from legacy_v1 at the acquisition funnel; don\'t wait for D7 signal.',
        ],
      },
    },

    {
      type: 'soft_hint',
      payload: { text: 'Full lift confirmed. Next step: harden the onboarding A/B guard-rails so legacy_v1 can\'t roll back to new cohorts automatically.' },
    },
  ],
  followUps: [],
};

// ─── Conversation seed (slim — T1 auto-plays on entry) ─────────────────────

/**
 * Slim conversation seed mirrors thread-demo-agent-livops-2026 shape: only the
 * initial user prompt. T1 auto-plays on entry (chat-rail + thread-page).
 *
 * User clicks the "Hermes noticed" inbox card for the D7 retention drop and
 * lands here — the agent has already diagnosed the issue pre-arrival.
 */
export const threadDemoAgentD7FbCohort2026: Conversation = {
  id: 'thread-demo-agent-d7-fb-cohort-2026',
  title: 'Hermes noticed: D7 retention drop on FB May cohort',
  createdAt: '2026-05-09T14:20:00.000Z',
  updatedAt: '2026-05-09T14:20:00.000Z',
  messages: [
    {
      id: 'm-agent-b-u1',
      role: 'user',
      text: 'Why is D7 down on the FB May cohort?',
      createdAt: '2026-05-09T14:20:00.000Z',
    },
  ],
};

/** Named turn exports consumed by multi-turn-registry + auto-play bootstrap. */
export const threadDemoAgentD7FbCohort2026Turns = {
  t1: T1,
  segment: T2,
  campaign: T3,
  retrospective: T4,
};
