/**
 * Experiment Agent recommendations — 2 per PRD_Hermes_Agentic.md §7.3.
 * Surface in the Experiment Agent panel on 16_cmp_monitoring (§6.3)
 * and in Module 05 inbox Recommendations tab.
 */
import type { AgentRecommendation } from '@hermes/contracts';

export const allRecommendations: AgentRecommendation[] = [
  {
    id: 'ar-0001',
    campaignId: 'cmp-cfm-407',
    type: 'scale',
    reason: 'Holdout vs treatment shows +8.2% D1 retention, p=0.02 (significant). Variant A (MMR Shield) is the clear winner — 15% higher D7 retention than Variant B.',
    projection: 'Forecast at 100% rollout: +11k uplifted players / week. Revenue impact neutral — this is a retention play.',
    surfacedAt: '2026-05-08T08:00:00+07:00',
    status: 'open',
  },
  {
    id: 'ar-0002',
    campaignId: 'cmp-nth-whale-comeback',
    type: 'extend',
    reason: 'Current p=0.34 — insufficient data to conclude. Treatment shows +4.1% D7 retention but confidence interval is wide. Recommend 4 more days to reach 80% power.',
    projection: 'With 4 additional days: projected p < 0.05 if true effect ≥ 3.5%. Early termination would waste the 72h of ramp-up already spent.',
    surfacedAt: '2026-05-07T20:00:00+07:00',
    status: 'open',
  },
];
