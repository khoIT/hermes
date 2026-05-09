/**
 * 18 — Agents Inbox (ag_inbox) — module 05 landing
 * Smoke: renders one OpportunityCard with all 6 regions visible.
 * Wired in Phase 9.
 */
import React from 'react';
import { T, Badge } from '../../theme';
import { OpportunityCard } from '../../components/opportunity-card';
import type { Opportunity } from '@hermes/contracts';

const DEMO_OPPORTUNITY: Opportunity = {
  id: 'ag-op-1042',
  agent: 'insight',
  surfacedAt: '2h ago',
  confidence: 0.78,
  window: 'this week · act by Friday',
  intent: 'Players in CFM ranked who lose 5+ but never paid are growing 18% week-over-week — no campaign serves them.',
  evidence: [
    { label: 'consecutive_ranked_losses_streak ≥ 5 — population +18% (7d)', sparklineKey: 'consecutive_ranked_losses_streak', meta: '+18%' },
    { label: 'is_paying_user_lifetime = false in this cohort — 91%', meta: '91%' },
    { label: 'No active campaign references this combination' },
  ],
  proposed: {
    segment: 'Loss Streak · non-paying · ranked',
    campaign: 'Pass Stuck Rescue (variant) · Real-time · event_match_end · 24h cooldown',
  },
  whyNow: 'Three prior campaigns of similar shape averaged +6.4% D1 retention (CFM-407, CFM-409, NTH-202). The cohort grew 18% in 7 days, projected to grow another ~12% next week. Acting now captures ~31% more impressions than acting on Friday.',
  game: 'CFM',
  goal4r: 'retain',
  status: 'open',
  agentThread: [
    '06:14:02  scan       feature-drift cycle started',
    '06:14:18  detect     consecutive_ranked_losses_streak.population_p90 +18% (7d)',
    '06:14:22  cross-ref  no active campaign references this feature ≥ 5 + non-paying combo',
    '06:14:31  match      3 prior campaigns of similar shape — avg lift +6.4%',
    '06:14:39  draft      proposed segment + campaign artifact',
    '06:14:42  surface    opportunity ag-op-1042',
  ],
};

export default function AgentsInboxPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        05 · Agents
      </div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 12 }}>
        Agents
      </div>

      {/* Stat strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <Badge variant="brandSoft">9 opportunities</Badge>
        <Badge variant="warning">3 drafts pending review</Badge>
        <Badge variant="info">2 experiment recommendations</Badge>
        <Badge variant="secondary">31 actions this week</Badge>
      </div>

      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginBottom: 24 }}>
        Screen 18 · ag_inbox · Phase 9 implementation pending. Demo OpportunityCard (all 6 regions):
      </p>

      {/* Smoke: full OpportunityCard per Agentic §4 */}
      <OpportunityCard
        opportunity={DEMO_OPPORTUNITY}
        mode="card"
        onApprove={id => alert(`Approve ${id}`)}
        onEdit={id => alert(`Edit ${id}`)}
        onDismiss={id => alert(`Dismiss ${id}`)}
      />
    </div>
  );
}
