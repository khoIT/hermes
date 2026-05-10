/**
 * thread-demo-livops-2026 — Canonical guided demo thread for May-12 stakeholder
 * walkthrough. Slim shape: messages[] holds ONLY [user msg 1]. T1 auto-plays
 * on entry; T2/T3 (and 6 alt-branch variants) advance via multi-turn-registry
 * on follow-up click.
 *
 * Canonical script: ARPDAU dip → at-risk segment → rescue campaign.
 *   T1 → Who's most at risk → T2 → Build a rescue intervention → T3
 *
 * T1 narrative arc: ARPPU flat / Paying-DAU% sliding (decomp) → leak in mid-
 * skill ranked cohort (retention split) → 5+ loss-streak cliff + 3.2× pop
 * growth (revealed via data, not announced).
 *
 * T2 filter set: severity (streak ≥ 5) + engagement quality (session_count_7d
 * ≥ 3) + monetization fit (last_purchase_days_ago ≥ 30). Each filter earned
 * via a different Jan 2026 A/B chart.
 *
 * Alternative branches (each ends with a soft chip back to canonical):
 *   T1 alts: Compare to Q1 2026 (q1Compare) · Show competitor benchmarks (competitorBench)
 *   T2 alts: Tighten to non-paying only (tightenNonPaying) · Show 7d retention impact (show7dRetention)
 *   T3 alts: Tweak holdout % (tweakHoldout) · Add a control variant (addControl)
 */
import type { Conversation, ChatMessage } from '../../../utils/chat-store';

// ─── T1: ARPDAU diagnosis (3-beat deduction) ─────────────────────────────────

const T1: ChatMessage = {
  id: 'm-demo-a1',
  role: 'assistant',
  credits: 5,
  createdAt: '2026-05-10T09:00:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    // Tool-call chain — what the agent ran to support the deduction below.
    { type: 'tool_call', payload: {
      fn: 'query_trino',
      args: [
        { name: 'catalog', value: 'cfm_vn' },
        { name: 'metric',  value: 'arpdau' },
        { name: 'window',  value: '2026-02-16 → 2026-05-09' },
      ],
      result: '12 weekly buckets',
      durationMs: 1180,
    } },
    { type: 'tool_call', payload: {
      fn: 'compute_decomp',
      args: [
        { name: 'metric',  value: 'arpdau' },
        { name: 'factors', value: '["arppu","paying_dau_pct"]' },
      ],
      result: 'arppu flat · paying_dau_pct −14%',
      durationMs: 280,
    } },
    {
      type: 'narrative',
      payload: {
        text: 'CFM ARPDAU dropped **7%** over the last 4 weeks (May to-date vs April). Decomposing the metric: ARPPU is **flat at $24.10**, but Paying-DAU% slipped from **12.1% → 10.4%**. This is a **conversion problem, not a spend problem** — fewer players are reaching the paid funnel, not that paying players are spending less.',
      },
    },

    // ─── Beat 1: decompose the metric ───
    { type: 'h2', payload: { text: '1 · ARPDAU decomposition · ARPPU flat, Paying-DAU% sliding' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'demo-arpdau-decomp',
          title: 'ARPDAU components · 12-week index (W01 = 100)',
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
    {
      type: 'pin_to_board',
      payload: {
        boardName: 'LiveOps 2026',
        widgetSnapshotId: 'demo-arpdau-decomp',
      },
    },

    // ─── Beat 2: localize the leak ───
    { type: 'h2', payload: { text: '2 · D7 retention by cohort · leak in mid-skill ranked' } },
    {
      type: 'narrative',
      payload: {
        text: 'Conversion follows retention. D7 retention dropped **8 points (47% → 39%)** over the same window. The drop is concentrated in **mid-skill ranked** players — new users and paying users held flat. The leak is in the middle of the funnel.',
      },
    },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'demo-d7-retention-by-cohort',
          title: 'D7 retention by player cohort · 12-week (%)',
          xLabel: 'Week',
          yLabel: 'D7 retention %',
          series: [
            {
              name: 'New users (≤7d tenure)',
              color: '#3b82f6',
              data: [
                { x: 'W01', y: 58 }, { x: 'W02', y: 59 }, { x: 'W03', y: 57 },
                { x: 'W04', y: 58 }, { x: 'W05', y: 60 }, { x: 'W06', y: 58 },
                { x: 'W07', y: 57 }, { x: 'W08', y: 58 }, { x: 'W09', y: 59 },
                { x: 'W10', y: 58 }, { x: 'W11', y: 57 }, { x: 'W12', y: 58 },
              ],
            },
            {
              name: 'Paying users',
              color: '#10b981',
              data: [
                { x: 'W01', y: 71 }, { x: 'W02', y: 72 }, { x: 'W03', y: 70 },
                { x: 'W04', y: 71 }, { x: 'W05', y: 72 }, { x: 'W06', y: 71 },
                { x: 'W07', y: 70 }, { x: 'W08', y: 71 }, { x: 'W09', y: 72 },
                { x: 'W10', y: 70 }, { x: 'W11', y: 71 }, { x: 'W12', y: 71 },
              ],
            },
            {
              name: 'All players',
              color: '#94a3b8',
              data: [
                { x: 'W01', y: 47 }, { x: 'W02', y: 48 }, { x: 'W03', y: 47 },
                { x: 'W04', y: 47 }, { x: 'W05', y: 48 }, { x: 'W06', y: 46 },
                { x: 'W07', y: 45 }, { x: 'W08', y: 44 }, { x: 'W09', y: 43 },
                { x: 'W10', y: 42 }, { x: 'W11', y: 41 }, { x: 'W12', y: 40 },
              ],
            },
            {
              name: 'Mid-skill ranked',
              color: '#f05a22',
              data: [
                { x: 'W01', y: 47 }, { x: 'W02', y: 48 }, { x: 'W03', y: 47 },
                { x: 'W04', y: 46 }, { x: 'W05', y: 47 }, { x: 'W06', y: 45 },
                { x: 'W07', y: 44 }, { x: 'W08', y: 42 }, { x: 'W09', y: 41 },
                { x: 'W10', y: 40 }, { x: 'W11', y: 40 }, { x: 'W12', y: 39 },
              ],
            },
          ],
        },
      },
    },
    {
      type: 'pin_to_board',
      payload: {
        boardName: 'LiveOps 2026',
        widgetSnapshotId: 'demo-d7-retention-by-cohort',
      },
    },

    // ─── Beat 3: the cliff (loss-streak emerges) ───
    { type: 'h2', payload: { text: '3 · Retention by loss streak · the cliff at 5+' } },
    {
      type: 'narrative',
      payload: {
        text: 'What changed for mid-skill ranked? The Q2 ranked season (April reset) widened matchmaking ranges to compensate for season-start population sparsity — `mmr_drift_7d` distribution shifted right. Players previously matched to similar-skill opponents now face longer loss streaks. Bucketing 7d retention by `consecutive_ranked_losses_streak` reveals the cliff.',
      },
    },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'demo-streak-retention-cliff',
          title: '7d retention by consecutive ranked-loss streak (%)',
          xLabel: 'Streak length',
          yLabel: '7d retention %',
          bars: [
            { label: '1–2',  value: 73, color: '#10b981' },
            { label: '3–4',  value: 67, color: '#84cc16' },
            { label: '5–6',  value: 41, color: '#f59e0b' },
            { label: '7–8',  value: 28, color: '#f05a22' },
            { label: '9+',   value: 19, color: '#dc2626' },
          ],
        },
      },
    },
    {
      type: 'pin_to_board',
      payload: {
        boardName: 'LiveOps 2026',
        widgetSnapshotId: 'demo-streak-retention-cliff',
      },
    },

    {
      type: 'insights',
      payload: {
        items: [
          'ARPPU **flat at $24.10** — not a spend-depth problem. Paying-DAU% is the slipping component.',
          'D7 retention −8pt **concentrated in mid-skill ranked** cohort. New + paying users held flat.',
          'Loss-streak ≥ 5: retention drops **73% → 41%**, AND that bucket grew **3.2× since the April matchmaking change**.',
          'One operationally-actionable lever — streak-rescue intervention on the 5+ band.',
        ],
      },
    },
  ],
  followUps: [
    "Who's most at risk right now?",
    'Compare to Q1 2026',
    'Show competitor benchmarks',
  ],
};

// ─── T2: at-risk segment (3 filters earned via Jan A/B) ──────────────────────

const T2: ChatMessage = {
  id: 'm-demo-a2',
  role: 'assistant',
  credits: 4,
  createdAt: '2026-05-10T09:02:00.000Z',
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
        { name: 'predicate', value: 'streak≥5 ∧ session_count_7d≥3 ∧ last_purchase≥30d' },
      ],
      result: '2,950 UIDs · 4.4× baseline churn',
      durationMs: 620,
    } },
    {
      type: 'narrative',
      payload: {
        text: 'Cohort is **5,200 UIDs at streak ≥ 5**. Three filters tighten this to **~2,950 UIDs** of high-leverage targets. Each filter earns its place against past A/B data — severity, engagement quality, monetization fit.',
      },
    },

    // ─── Filter A: severity ───
    { type: 'h2', payload: { text: '1 · streak ≥ 5 · severity (the trigger zone)' } },
    {
      type: 'narrative',
      payload: {
        text: 'Population by streak length, current week. The 5+ band is **8,200 UIDs/week** — small enough to operate against, large enough for measurement power. Below 5, matchmaking + skill MMR auto-correct; intervening here would cannibalize natural recovery.',
      },
    },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'demo-loss-streak-dist',
          title: 'Players by consecutive ranked-loss streak · current week',
          xLabel: 'Streak length',
          yLabel: 'Players',
          bars: [
            { label: '1–2',  value: 41200, color: '#94a3b8' },
            { label: '3–4',  value: 18600, color: '#94a3b8' },
            { label: '5–6',  value:  5200, color: '#f05a22' },
            { label: '7–8',  value:  2100, color: '#dc2626' },
            { label: '9+',   value:   900, color: '#991b1b' },
          ],
        },
      },
    },

    // ─── Filter B: engagement quality ───
    { type: 'h2', payload: { text: '2 · session_count_7d ≥ 3 · engagement floor' } },
    {
      type: 'narrative',
      payload: {
        text: 'Past rescue A/Bs (Jan 2026) split treatment lift sharply by player engagement. Players with **fewer than 3 sessions/wk** saw ~3× weaker D7 lift from the gem grant — already too disengaged to convert. Above the 3-session floor, the grant materializes.',
      },
    },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'demo-lift-by-session-count',
          title: 'D7 retention lift from 200-gem grant · by session_count_7d (Jan 2026 A/B)',
          xLabel: 'Sessions per week',
          yLabel: 'D7 lift (pp)',
          bars: [
            { label: '1',     value:  6, color: '#94a3b8' },
            { label: '2',     value:  9, color: '#94a3b8' },
            { label: '3',     value: 18, color: '#10b981' },
            { label: '4–5',   value: 24, color: '#10b981' },
            { label: '6+',    value: 27, color: '#10b981' },
          ],
        },
      },
    },

    // ─── Filter C: monetization fit ───
    { type: 'h2', payload: { text: '3 · last_purchase_days_ago ≥ 30 · monetization fit' } },
    {
      type: 'narrative',
      payload: {
        text: 'Recent payers self-rescue via shop. In the same Jan A/B, players who purchased in the **last 7 days saw near-zero D7 lift** from the rescue grant — they would have bought gems anyway, so the grant cannibalized IAP intent. Lift only materializes for players **30+ days from last purchase OR never paid**.',
      },
    },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'demo-lift-by-purchase-recency',
          title: 'D7 retention lift from grant · by last_purchase_days_ago (Jan 2026 A/B)',
          xLabel: 'Days since last purchase',
          yLabel: 'D7 lift (pp)',
          bars: [
            { label: '0–7d',         value:  1, color: '#94a3b8' },
            { label: '8–30d',        value:  9, color: '#f59e0b' },
            { label: '30+ d',        value: 22, color: '#10b981' },
            { label: 'Never paid',   value: 26, color: '#10b981' },
          ],
        },
      },
    },

    {
      type: 'insights',
      payload: {
        items: [
          '**Severity**: 5+ losses → retention cliff (T1 chart 3); below 5, matchmaking self-corrects.',
          '**Quality**: <3 sessions/wk → ~3× weaker grant lift; player too disengaged to convert.',
          '**Fit**: <30d since last purchase → grant cannibalizes IAP (~0 lift); 30+ or never-paid is where grants move retention.',
          'Stacked: **2,950 UIDs · 53% projected 7d churn · 4.4× baseline lift** with **+24pt expected D7** from Jan A/B effect size.',
        ],
      },
    },
    {
      type: 'action_card_segment',
      payload: {
        name: 'CFM · Loss Streak · Engaged · Lapsed-Payer',
        description: 'consecutive_ranked_losses_streak ≥ 5 AND session_count_7d ≥ 3 AND last_purchase_days_ago ≥ 30',
        targetSegmentId: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9',
        features: [
          'consecutive_ranked_losses_streak',
          'session_count_7d',
          'last_purchase_days_ago',
        ],
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
    { type: 'tool_call', payload: {
      fn: 'register_trigger',
      args: [
        { name: 'event',     value: 'event_match_end' },
        { name: 'predicate', value: 'consecutive_ranked_losses_streak == 5' },
        { name: 'substrate', value: 'apollo_tee' },
      ],
      result: 'trigger_id=trg_cfm_rescue_v2 · <60s SLA',
      durationMs: 240,
    } },
    { type: 'tool_call', payload: {
      fn: 'split_holdout',
      args: [{ name: 'percent', value: 10 }],
      result: '90% treat · 10% hold · power@α=0.05 in 14d',
      durationMs: 120,
    } },
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
    'Tweak holdout %',
    'Add a control variant',
  ],
};

// ─── T1 ALT-A: Compare to Q1 2026 ────────────────────────────────────────────

const T1_q1Compare: ChatMessage = {
  id: 'm-demo-a1-q1',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-10T09:01:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Q1 2026 (Jan–Mar) averaged ARPPU **$24.30**, Paying-DAU% **12.4%**. Today: ARPPU **$24.10** (effectively flat), Paying-DAU% **10.4%** (−2pt). Q1\'s mid-quarter dip in Feb recovered in **14 days** via natural matchmaking re-balancing — the current dip is **28 days and accelerating**. Q2 season (April reset) widened MMR matching, which Q1 didn\'t have. Loss-streak share of churn: **18% in Q1 vs 31% in May** — the new variable.',
      },
    },
    { type: 'h2', payload: { text: 'Paying-DAU % by period · Q1 vs Q2 (May to-date)' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'demo-paying-dau-q1-vs-may',
          title: 'Avg weekly Paying-DAU % by period',
          xLabel: 'Period',
          yLabel: 'Paying-DAU %',
          bars: [
            { label: 'Q1 Jan',  value: 12.5 },
            { label: 'Q1 Feb',  value: 12.0, color: '#f59e0b' },
            { label: 'Q1 Mar',  value: 12.4 },
            { label: 'Q2 Apr',  value: 12.1 },
            { label: 'Q2 May',  value: 10.4, color: '#f05a22' },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'Q1 dip recovered in **14 days**; current dip is **28 days and accelerating**.',
          'ARPPU stable across both quarters — slide is purely conversion (Paying-DAU%).',
          'Loss-streak share of churn: **18% (Q1) → 31% (May)** — primary new contributor.',
          'No event/seasonality match — this is a behavioral drift driven by Q2 matchmaking change.',
        ],
      },
    },
    {
      type: 'soft_hint',
      payload: { text: 'The loss-streak signal is the new variable. ↳ Click "Who\'s most at risk right now?" to drill in.' },
    },
  ],
  followUps: [
    "Who's most at risk right now?",
  ],
};

// ─── T1 ALT-B: Show competitor benchmarks ────────────────────────────────────

const T1_competitorBench: ChatMessage = {
  id: 'm-demo-a1-bench',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-10T09:01:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Sensor Tower peer-set (top-10 mobile fighting genre, May 2026): median ARPPU **$22.40** (CFM at $24.10 — still above), median Paying-DAU% **9.8%** (CFM at 10.4% — close to median). **The conversion gap is closing fast.** Two peers (A, B) saw similar mid-quarter slides in 2025 Q4 and recovered with streak-rescue mechanics — both regained 1.5+ pts of Paying-DAU% in 4–6 weeks.',
      },
    },
    { type: 'h2', payload: { text: 'CFM vs peer-set Paying-DAU % · May 2026' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'demo-paying-dau-peer-bench',
          title: 'Avg Paying-DAU % · top-10 fighting peers',
          xLabel: 'Title',
          yLabel: 'Paying-DAU %',
          bars: [
            { label: 'Peer A',  value: 13.2 },
            { label: 'Peer B',  value: 11.8 },
            { label: 'CFM',     value: 10.4, color: '#f05a22' },
            { label: 'Peer C',  value: 10.6 },
            { label: 'Peer D',  value:  9.4 },
            { label: 'Peer E',  value:  8.7 },
            { label: 'Median',  value:  9.8, color: '#94a3b8' },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'Peer A recovered **+1.8pt Paying-DAU%** in 6 weeks via streak-rescue IAMs (2025 Q4).',
          'Peer B added a streak-break "comeback" reward — recovered to top quartile in 4 weeks.',
          'CFM ARPPU still in top quartile ($24.10 vs $22.40 median) — depth is fine; conversion is the gap.',
          'CFM has not shipped a streak-mitigation play yet — biggest available lever.',
        ],
      },
    },
    {
      type: 'soft_hint',
      payload: { text: 'Peers prove the rescue play works. ↳ Click "Who\'s most at risk right now?" to scope our cohort.' },
    },
  ],
  followUps: [
    "Who's most at risk right now?",
  ],
};

// ─── T2 ALT-A: Tighten to non-paying only ────────────────────────────────────

const T2_tightenNonPaying: ChatMessage = {
  id: 'm-demo-a2-tighten',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-10T09:03:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Tightening from `last_purchase_days_ago ≥ 30` to **strict non-paying** (`is_paying_user_lifetime = false`) drops the cohort from ~2,950 → **1,840 UIDs**. Lapsed payers (30+ d since last purchase) still convert — they have wallet history. Never-paid players have 22% better D7 lift response and zero IAP-cannibalization risk. Trade-off: smaller measurement cohort, longer time to significance.',
      },
    },
    { type: 'h2', payload: { text: 'D7 retention lift · lapsed-payer vs never-paid' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'demo-lapsed-vs-neverpaid',
          title: 'D7 retention lift · loss-streak ≥ 5 (Jan 2026 A/B)',
          xLabel: 'Sub-cohort',
          yLabel: 'D7 lift (pp)',
          bars: [
            { label: 'Lapsed payer (30+d)', value: 22 },
            { label: 'Never paid (1,840)',  value: 26, color: '#10b981' },
            { label: 'Recent payer (<30d)', value:  1, color: '#94a3b8' },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'Never-paid: **+26pt D7 lift** vs lapsed-payer **+22pt** — modest precision gain.',
          'Cohort halves (2,950 → 1,840) — adds ~7 days to significance at current traffic.',
          'Recommend keeping `last_purchase_days_ago ≥ 30` as the broader filter unless calendar pressure demands tighter targeting.',
        ],
      },
    },
    {
      type: 'soft_hint',
      payload: { text: 'Cohort is now precisely scoped. ↳ Click "Build a rescue intervention" to draft the campaign.' },
    },
  ],
  followUps: [
    'Build a rescue intervention',
  ],
};

// ─── T2 ALT-B: Show 7d retention impact ──────────────────────────────────────

const T2_show7dRetention: ChatMessage = {
  id: 'm-demo-a2-retention',
  role: 'assistant',
  credits: 3,
  createdAt: '2026-05-10T09:03:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Past loss-streak rescue IAMs (Jan 2026 A/B, 4-week window) lifted **D7 retention by +24 percentage points** in the treatment arm vs control. ARPDAU recovered to baseline within 9 days post-grant. Effect was strongest at streak=5 (current trigger) and decayed beyond streak=8.',
      },
    },
    { type: 'h2', payload: { text: 'D7 retention · Jan 2026 rescue A/B' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'demo-d7-retention-ab',
          title: 'D7 retention by treatment day',
          xLabel: 'Day after streak trigger',
          yLabel: 'Retention %',
          series: [
            {
              name: 'Treatment',
              color: '#10b981',
              data: [
                { x: 'D0', y: 100 }, { x: 'D1', y: 92 }, { x: 'D2', y: 84 },
                { x: 'D3', y: 79 }, { x: 'D4', y: 75 }, { x: 'D5', y: 72 },
                { x: 'D6', y: 70 }, { x: 'D7', y: 68 },
              ],
            },
            {
              name: 'Control',
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
    {
      type: 'insights',
      payload: {
        items: [
          'Treatment D7 retention **68% vs 44% control** — +24 pts, p < 0.001.',
          'ARPDAU recovery within **9 days** post-grant — minimal LTV dilution.',
          'Effect concentrated at streak=5–7; weaker at 8+ (already disengaged).',
        ],
      },
    },
    {
      type: 'soft_hint',
      payload: { text: 'Past A/B confirms the play works. ↳ Click "Build a rescue intervention" to ship it again.' },
    },
  ],
  followUps: [
    'Build a rescue intervention',
  ],
};

// ─── T3 ALT-A: Tweak holdout % ───────────────────────────────────────────────

const T3_tweakHoldout: ChatMessage = {
  id: 'm-demo-a3-holdout',
  role: 'assistant',
  credits: 2,
  createdAt: '2026-05-10T09:05:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Default 10% holdout sizes the control arm at ~520 UIDs/week — enough power for ARPDAU lift detection at α=0.05 in 2 weeks. Increasing to 20% halves measurement time to 7 days but doubles the revenue-foregone cost on the holdout arm. **Recommend keeping 10%** unless you need a faster ship-decision.',
      },
    },
    { type: 'h2', payload: { text: 'Holdout % trade-off' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'demo-holdout-tradeoff',
          title: 'Time to significance vs holdout-arm cost',
          xLabel: 'Holdout %',
          yLabel: 'Days to p<0.05',
          bars: [
            { label: '5%',  value: 21, color: '#94a3b8' },
            { label: '10%', value: 14, color: '#10b981' },
            { label: '15%', value:  9 },
            { label: '20%', value:  7, color: '#f59e0b' },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          '10% holdout: **14d to significance** · ~$340 revenue-forgone.',
          '20% holdout: **7d to significance** · ~$680 revenue-forgone.',
          'No power gain past 20%; just doubling the cost.',
        ],
      },
    },
  ],
  followUps: [],
};

// ─── T3 ALT-B: Add a control variant ─────────────────────────────────────────

const T3_addControl: ChatMessage = {
  id: 'm-demo-a3-control',
  role: 'assistant',
  credits: 2,
  createdAt: '2026-05-10T09:05:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    {
      type: 'narrative',
      payload: {
        text: 'Three-arm test recommended: **A = 200-gem grant** (current), **B = 100-gem + 1 free entry ticket** (mixed reward), **C = control (no grant)**. B isolates whether reward composition matters at constant gem-equivalent cost. 33/33/34 split keeps each arm above the power floor with the current cohort size.',
      },
    },
    { type: 'h2', payload: { text: 'Proposed 3-arm split' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'demo-arm-split',
          title: 'UIDs per arm · weekly',
          xLabel: 'Arm',
          yLabel: 'UIDs',
          bars: [
            { label: 'A · 200 gems',          value: 1716 },
            { label: 'B · 100 gem + ticket',  value: 1716, color: '#f59e0b' },
            { label: 'C · control',           value: 1768, color: '#94a3b8' },
          ],
        },
      },
    },
    {
      type: 'insights',
      payload: {
        items: [
          'Arm B tests reward **composition** not just magnitude — sharper learning per ARPDAU spent.',
          'Arm C (true control) sized at 34% to absorb noise; matches current 10% holdout policy aggregated.',
          'Power floor met for all three arms at current cohort size.',
        ],
      },
    },
  ],
  followUps: [],
};

// ─── Conversation (slim — registry adds T2/T3 on follow-up click) ───────────

/**
 * Slim conversation seed: only the initial user prompt. T1 is auto-played by
 * chat-rail + thread-page on demo entry (with loading-dot delay), giving the
 * "data-loading then typed answer" feel. T2/T3 (and alt branches) advance via
 * multi-turn-registry on follow-up click.
 */
export const threadDemoLivops2026: Conversation = {
  id: 'thread-demo-livops-2026',
  title: 'Why is CFM ARPDAU dipping last quarter?',
  createdAt: '2026-05-10T09:00:00.000Z',
  updatedAt: '2026-05-10T09:00:00.000Z',
  messages: [
    {
      id: 'm-demo-u1',
      role: 'user',
      text: 'Why is CFM ARPDAU dipping last quarter?',
      createdAt: '2026-05-10T09:00:00.000Z',
    },
  ],
};

/** Named turn exports consumed by multi-turn-registry + chat-rail/thread-page demo bootstrap. */
export const threadDemoLivops2026Turns = {
  // Canonical script
  t1: T1,
  atRisk: T2,
  campaign: T3,
  // T1 alts
  q1Compare: T1_q1Compare,
  competitorBench: T1_competitorBench,
  // T2 alts
  tightenNonPaying: T2_tightenNonPaying,
  show7dRetention: T2_show7dRetention,
  // T3 alts
  tweakHoldout: T3_tweakHoldout,
  addControl: T3_addControl,
};
