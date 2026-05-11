/**
 * thread-demo-agent-whale-recall-2026 — AGENT-FIRST demo arc (Thread C).
 *
 * Sibling of thread-demo-agent-livops-2026 (arc A) and thread-demo-agent-b (arc B).
 * Covers top-1% whale spender recall decline triggered by a ranked season reset.
 * Locked design decisions (per plan 260511-1122):
 *   - Inbox/entry voice: C · agent observation-led ("Hermes noticed: Top-1% whale recall drop")
 *   - T4 retrospective tone: B · partial confirmation + endogenous-recovery surprise
 *
 * Arc: T1 diagnose → T2 build segment → T3 launch campaign → T4 retro.
 * Slim shape: only the user prompt seeded; T1 auto-plays on entry.
 *
 * Numbers anchored throughout:
 *   - 1,240 top-1% spenders (p99 cutoff = $187/30d)
 *   - 89 UIDs in rescue segment · $38k MRR at risk
 *   - Recall: 38% (start) → 76% (post-intervention) = +38pp lift
 *   - 4 named whales · 12/58 returners pre-dated outreach (endogenous)
 *   - Honest revised attribution: +30pp outreach-driven, +8pp endogenous
 */
import type { Conversation, ChatMessage } from '../../../utils/chat-store';

const TARGET_SEGMENT_ID = 'seg-cfm-whale-dormant-postseason-2026-0509-c7a1';

// ─── T1: Whale recall diagnosis ────────────────────────────────────────────

const T1: ChatMessage = {
  id: 'm-agent-c1',
  role: 'assistant',
  credits: 6,
  createdAt: '2026-05-08T09:00:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    // Tool-call chain — 3 rotated functions vs arcs A and B
    { type: 'tool_call', payload: {
      fn: 'query_trino',
      args: [
        { name: 'catalog', value: 'cfm_vn' },
        { name: 'table',   value: 'monetization_events' },
        { name: 'window',  value: '2026-03-21 → 2026-05-09' },
      ],
      result: '1,243,890 rows · cached:false',
      durationMs: 1280,
    } },
    { type: 'tool_call', payload: {
      fn: 'spend_distribution',
      args: [
        { name: 'percentile',   value: 99 },
        { name: 'dim',          value: 'spend_per_user_30d' },
        { name: 'n_top_users',  value: 1240 },
      ],
      result: 'p99 cutoff = $187/30d · 1,240 users',
      durationMs: 480,
    } },
    { type: 'tool_call', payload: {
      fn: 'dormancy_signal',
      args: [
        { name: 'cohort',      value: 'top_1pct_spenders' },
        { name: 'window_days', value: 14 },
        { name: 'metric',      value: 'session_count' },
      ],
      result: '472/1240 dormant (38% recall, was 52%)',
      durationMs: 640,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'Top-1% spender 30-day recall rate fell from **52% → 38%** over the last 4 weeks — a **14pp drop**. The cohort definition holds: 1,240 users above $187/30d spend (p99). Of those, **472 went dormant** (no session in 14 days). Drilling in by spend-tier, the dormancy is **bimodal** — heavy on the very top ($500+/30d, the "named whales") and concentrated to the post-Apr-21 window when the **ranked season reset** dropped them out of the leaderboard top brackets. **4 named whales account for $14k of the $38k MRR at risk.**',
      },
    },

    { type: 'h2', payload: { text: 'Top-1% spender recall · 12-week trend' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'agent-c-recall-trend',
          title: 'Recall % sliding post ranked-season reset (week 9+)',
          xLabel: 'Week',
          yLabel: 'Recall %',
          series: [
            {
              name: 'Top-1% recall',
              color: '#f05a22',
              data: [
                { x: 'W01', y: 50 }, { x: 'W02', y: 52 }, { x: 'W03', y: 51 },
                { x: 'W04', y: 52 }, { x: 'W05', y: 52 }, { x: 'W06', y: 51 },
                { x: 'W07', y: 52 }, { x: 'W08', y: 52 }, { x: 'W09', y: 47 },
                { x: 'W10', y: 43 }, { x: 'W11', y: 40 }, { x: 'W12', y: 38 },
              ],
            },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.monetization_events · spend p99 cohort · session-defined recall · 14-day rolling' } },

    { type: 'h2', payload: { text: 'Dormancy by spend tier — bimodal' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-c-dormancy-by-tier',
          title: 'Dormancy rate by 30d spend tier · $500+ is the spike',
          xLabel: '30d spend tier',
          yLabel: 'Dormancy rate %',
          bars: [
            { label: '$100–200', value: 28, color: '#10b981' },
            { label: '$200–300', value: 35, color: '#84cc16' },
            { label: '$300–500', value: 39, color: '#f59e0b' },
            { label: '$500+',    value: 61, color: '#ef4444' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.monetization_events × player_session_summary · 4-week window' } },

    {
      type: 'insights',
      payload: {
        items: [
          'Recall collapsed **14pp in 4 weeks** (52% → 38%) — driven by post-Apr-21 ranked season reset.',
          '**$500+/30d tier hit hardest** — 61% dormancy vs 28% at the $100–200 floor. Bimodal pattern.',
          '**4 named whales** account for $14k of the $38k total MRR at risk — outsized concentration.',
          'Root cause: ranked season reset ejected top-bracket whales from leaderboard · session incentive collapsed.',
        ],
      },
    },

    { type: 'soft_hint', payload: { text: 'I can build a precision recall segment targeting the intersection of spend tier, ranked-tier drop, and dormancy depth. Ready to filter.' } },
  ],
  followUps: ['Build a rescue segment'],
};

// ─── T2: Build rescue segment ──────────────────────────────────────────────

const T2: ChatMessage = {
  id: 'm-agent-c2',
  role: 'assistant',
  credits: 5,
  createdAt: '2026-05-08T09:03:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    { type: 'tool_call', payload: {
      fn: 'query_features',
      args: [
        { name: 'features',  value: '["lifetime_value_usd","last_purchase_days_ago","ranked_tier_change_30d","consecutive_no_session_days"]' },
        { name: 'audience',  value: 'top_1pct_spenders' },
      ],
      result: '4 features · 1,240 UIDs',
      durationMs: 380,
    } },
    { type: 'tool_call', payload: {
      fn: 'cohort_intersect',
      args: [
        { name: 'set_a', value: 'top_1pct_spend' },
        { name: 'set_b', value: 'ranked_tier_dropped_postreset' },
        { name: 'set_c', value: 'consecutive_no_session_days>=10' },
      ],
      result: 'intersection=89 UIDs · est. MRR risk=$38k',
      durationMs: 720,
    } },
    { type: 'tool_call', payload: {
      fn: 'lookalike_scope',
      args: [
        { name: 'seed',              value: '4_named_whales' },
        { name: 'feature_proximity', value: '["spend_pattern","session_cadence","rank_history"]' },
      ],
      result: '85 similar players · cosine ≥ 0.82',
      durationMs: 1140,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'Three filters stack to a precision rescue cohort:\n\n**Filter A** — `lifetime_value_usd ≥ $1,800` (the top-tier spend floor).\n**Filter B** — `ranked_tier_dropped_postreset = true` (the seasonal trigger — this is the mechanism).\n**Filter C** — `consecutive_no_session_days ≥ 10` (the dormancy threshold).\n\nStacked: **89 UIDs · $38k 30d MRR at risk** · includes the 4 named whales + 85 lookalikes (cosine similarity ≥ 0.82 on spend, session, and rank history).',
      },
    },

    { type: 'h2', payload: { text: 'Filter A · Spender LTV distribution' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-c-filter-a-ltv',
          title: 'Dormancy rate by LTV bucket · $1,800+ cutoff',
          xLabel: 'Lifetime value (USD)',
          yLabel: 'Dormancy rate %',
          bars: [
            { label: '<$500',      value: 18, color: '#94a3b8' },
            { label: '$500–1000',  value: 24, color: '#94a3b8' },
            { label: '$1000–1800', value: 33, color: '#f59e0b' },
            { label: '$1800+',     value: 52, color: '#ef4444' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.monetization_events · lifetime_value_usd computed from purchase history · 4-week window' } },

    { type: 'h2', payload: { text: 'Filter B · Recall % by ranked tier change' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-c-filter-b-tier',
          title: 'Recall % by ranked tier change post-reset',
          xLabel: 'Ranked tier change',
          yLabel: 'Recall %',
          bars: [
            { label: 'Climbed',       value: 63, color: '#10b981' },
            { label: 'Unchanged',     value: 58, color: '#84cc16' },
            { label: 'Dropped 1',     value: 44, color: '#f59e0b' },
            { label: 'Dropped 2+',    value: 29, color: '#ef4444' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.ranked_season_log × player_session_summary · post-Apr-21 reset window' } },

    { type: 'h2', payload: { text: 'Filter C · Recall % by consecutive no-session days' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-c-filter-c-dormancy',
          title: 'Recall % by consecutive no-session days',
          xLabel: 'Consecutive no-session days',
          yLabel: 'Recall %',
          bars: [
            { label: '0–3',   value: 92, color: '#10b981' },
            { label: '4–9',   value: 71, color: '#84cc16' },
            { label: '10–14', value: 42, color: '#f59e0b' },
            { label: '15+',   value: 18, color: '#ef4444' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: cfm_vn.player_session_summary · session-defined recall · 14-day rolling window' } },

    {
      type: 'insights',
      payload: {
        items: [
          'Filter A (LTV ≥ $1,800): dormancy jumps to 52% for highest-LTV bucket — confirms the concentration.',
          'Filter B (ranked tier dropped): recall at 29% for 2+ tier drops vs 63% for climbers — the seasonal trigger is causal.',
          'Filter C (10+ no-session days): recall at 42% in the 10–14 day window — beyond this window recovery sharply drops to 18%.',
          'Stacked: **89 UIDs · $38k MRR at risk** — the 4 named whales + 85 lookalike whales. Named-whale risk: $14k of $38k.',
        ],
      },
    },

    {
      type: 'action_card_segment',
      payload: {
        name: 'CFM · Whale Dormant · Post-Season · Rescue',
        description: 'lifetime_value_usd ≥ $1,800 AND ranked_tier_dropped_postreset = true AND consecutive_no_session_days ≥ 10. Includes 4 named whales ($14k MRR) + 85 high-LTV lookalikes.',
        features: [
          'lifetime_value_usd',
          'last_purchase_days_ago',
          'ranked_tier_change_30d',
          'consecutive_no_session_days',
        ],
        targetSegmentId: TARGET_SEGMENT_ID,
      },
    },
  ],
  followUps: ['Launch the rescue campaign'],
};

// ─── T3: Launch rescue campaign ────────────────────────────────────────────

const T3: ChatMessage = {
  id: 'm-agent-c3',
  role: 'assistant',
  credits: 4,
  createdAt: '2026-05-08T09:06:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    { type: 'tool_call', payload: {
      fn: 'manual_outreach_capacity',
      args: [
        { name: 'team',            value: 'cfm_concierge' },
        { name: 'slots_available', value: '50_per_week' },
      ],
      result: '50/89 covered week 1 · 39 week 2',
      durationMs: 150,
    } },
    { type: 'tool_call', payload: {
      fn: 'select_appreciation_drop',
      args: [
        { name: 'tier',      value: 'top_1pct' },
        { name: 'inventory', value: '["skin_rare","currency_bundle","ranked_protect_3day"]' },
      ],
      result: '3-item drop · cost $18 retail-equiv',
      durationMs: 210,
    } },
    { type: 'tool_call', payload: {
      fn: 'forecast_recovery',
      args: [
        { name: 'mechanic',    value: 'concierge_plus_appreciation' },
        { name: 'historical',  value: 'whale_recovery_v2_2025' },
      ],
      result: 'projected 55-70% recovery rate',
      durationMs: 330,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'Hybrid mechanic — **manual concierge outreach** for the 4 named whales + the 50 highest-LTV lookalikes (week 1), then the remaining 39 lookalikes (week 2). Each receives a **3-item appreciation drop** (rare skin + currency bundle + 3-day ranked-protect). No holdout — sample too small (n=89) for statistically-significant A/B; track recovery vs the pre-rescue dormancy baseline. **Estimated cost ~$1,602** in inventory ($18 × 89) + ~8 concierge-hours/week.',
      },
    },

    {
      type: 'action_card_campaign',
      payload: {
        name: 'CFM · Whale Recall · Manual Concierge · May 2026',
        // 'manual' not in type enum; using 'realtime' with mechanic detail in description
        type: 'realtime',
        segmentId: TARGET_SEGMENT_ID,
        description: 'Manual concierge outreach (50/week cadence) + 3-item appreciation drop (skin_rare, currency_bundle, ranked_protect_3day). No holdout — cohort n=89 too small for stat-sig A/B. Track vs pre-rescue dormancy baseline.',
      },
    },

    { type: 'soft_hint', payload: { text: 'I\'ll monitor recovery over two weeks and post a retrospective once the data lands. ↳ Click "Show me the 2-week retrospective" to skip ahead.' } },
  ],
  followUps: ['Show me the 2-week retrospective'],
};

// ─── T4: Two-week retrospective (variant B — partial confirmation + endogenous surprise) ─

const T4: ChatMessage = {
  id: 'm-agent-c4',
  role: 'assistant',
  credits: 5,
  createdAt: '2026-05-22T09:00:00.000Z',
  suppressUniversalCtas: true,
  sections: [
    { type: 'tool_call', payload: {
      fn: 'load_campaign_log',
      args: [
        { name: 'id',     value: 'cfm_whale_concierge_v1' },
        { name: 'window', value: '2026-05-11 → 2026-05-25' },
      ],
      result: '89 outreaches · 71 acknowledged · 58 returned to session',
      durationMs: 390,
    } },
    { type: 'tool_call', payload: {
      fn: 'causal_attribution',
      args: [
        { name: 'cohort',          value: '89_UIDs' },
        { name: 'compare',         value: 'matched_synthetic_holdout' },
        { name: 'n_matches',       value: 89 },
      ],
      result: 'lift_vs_synth=+38pp recall · CI [29-46]',
      durationMs: 870,
    } },
    { type: 'tool_call', payload: {
      fn: 'pre_outreach_recovery_check',
      args: [
        { name: 'cohort',              value: '89_UIDs' },
        { name: 'pre_outreach_returns', value: 12 },
      ],
      result: '12/58 returned BEFORE outreach contact',
      durationMs: 210,
    } },

    {
      type: 'narrative',
      payload: {
        text: 'Two weeks in. Recall recovered to **76% on the cohort vs 38% projected without intervention** — a **+38pp lift**. The 4 named whales: **2 fully recovered, 1 partial (resumed sessions but spend at 60% of baseline), 1 still dormant.**\n\n**Surprise:** 12 of the 58 returners came back **before any concierge outreach landed**. Cross-checking session timestamps against ranked-tier balance updates, those 12 returned the day after a **mid-season ranked-tier rebalance patch** went live (May 17). Implication: **part of the recall recovery is endogenous — seasonal cyclicality, not just the intervention.** The honest lift attributable to outreach is closer to **+30pp**, still strong but less than the headline +38pp suggests.',
      },
    },

    { type: 'h2', payload: { text: 'Recall recovery curve · cohort vs synthetic holdout' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'line',
          id: 'agent-c-retro-recovery-curve',
          title: 'Cohort 38→76% · Synth holdout stays flat at ~38%',
          xLabel: 'Days after campaign launch',
          yLabel: 'Recall %',
          series: [
            {
              name: 'Cohort (treated)',
              color: '#10b981',
              data: [
                { x: 'D0',  y: 38 }, { x: 'D3',  y: 52 }, { x: 'D6',  y: 64 },
                { x: 'D10', y: 71 }, { x: 'D14', y: 76 },
              ],
            },
            {
              name: 'Synthetic holdout',
              color: '#94a3b8',
              data: [
                { x: 'D0',  y: 38 }, { x: 'D3',  y: 39 }, { x: 'D6',  y: 40 },
                { x: 'D10', y: 38 }, { x: 'D14', y: 38 },
              ],
            },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: matched_synthetic_holdout (propensity-weighted) · cfm_vn.player_session_summary' } },

    { type: 'h2', payload: { text: 'Recovery composition · intervention vs endogenous' } },
    {
      type: 'widget',
      payload: {
        widget: {
          type: 'bar',
          id: 'agent-c-retro-attribution',
          title: 'Honest attribution: +30pp outreach-driven · +8pp endogenous · =38pp total',
          xLabel: 'Attribution source',
          yLabel: 'Recovery lift (pp)',
          bars: [
            { label: 'Outreach-attributed (matched-pair)', value: 30, color: '#10b981' },
            { label: 'Endogenous (mid-season patch)',      value:  8, color: '#94a3b8' },
          ],
        },
      },
    },
    { type: 'provenance', payload: { text: 'Source: matched-pair causal attribution + session timestamp cross-check against patch logs' } },

    {
      type: 'insights',
      payload: {
        items: [
          '+38pp headline lift (38%→76%) vs matched-synthetic holdout · CI [29–46] · n=89.',
          '**Honest revised attribution: +30pp outreach-driven, +8pp endogenous** — 12/58 returners arrived before any concierge contact, traced to May 17 ranked-tier rebalance patch.',
          'Named whales: 2 fully recovered · 1 partial (spend at 60% baseline) · 1 still dormant.',
          'Signal for future: a mid-season tier rebalance acts as a natural attractor — timing campaigns to coincide could amplify recovery without extra cost.',
        ],
      },
    },

    { type: 'soft_hint', payload: { text: 'The endogenous signal is actually useful — next season reset I can pre-arm the rebalance patch as a co-trigger for the recall drop. Want me to draft that as a standing alert?' } },
  ],
  followUps: [],
};

// ─── Conversation seed (slim — T1 auto-plays on entry) ─────────────────────

/**
 * Slim conversation seed: only the initial user prompt seeded.
 * T1 auto-plays on entry (chat-rail + thread-page bootstrap).
 *
 * Matches inbox card C in phase 1: "Hermes noticed: Top-1% whale recall drop"
 * at T1 createdAt '2026-05-08T09:00:00.000Z' → "2d ago, ongoing" from demo date.
 */
export const threadDemoAgentWhaleRecall2026: Conversation = {
  id: 'thread-demo-agent-whale-recall-2026',
  title: 'Hermes noticed: Top-1% whale recall drop',
  createdAt: '2026-05-08T09:00:00.000Z',
  updatedAt: '2026-05-08T09:00:00.000Z',
  messages: [
    {
      id: 'm-agent-c-u1',
      role: 'user',
      text: 'Show me what you found.',
      createdAt: '2026-05-08T09:00:00.000Z',
    },
  ],
};

/** Named turn exports consumed by multi-turn-registry + auto-play bootstrap. */
export const threadDemoAgentWhaleRecall2026Turns = {
  t1: T1,
  segment: T2,
  campaign: T3,
  retrospective: T4,
};
