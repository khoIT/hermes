/**
 * KPI strip — 4 tiles in a responsive grid. Computes values from real
 * catalogs + welcome fixtures. All tiles route to module library.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { allCampaigns } from '../../data/catalog/campaigns';
import { allSegments } from '../../data/catalog/segments';
import {
  AUDIENCE_REACHED_THIS_WEEK,
  CAMPAIGN_FIXTURES,
  DRIFT_SEGMENT_IDS,
  DRIFT_HEADLINE,
} from '../../data/catalog/_welcome-fixtures';
import { KpiTile } from './kpi-tile';

const ACTIVE_STATUSES = new Set(['active', 'scheduled']);

function formatReach(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export function KpiStrip() {
  const navigate = useNavigate();

  const activeCampaigns = allCampaigns.filter(c => ACTIVE_STATUSES.has(c.status));
  const activeSegments = allSegments.filter(s => s.status === 'active');
  const driftCount = allSegments.filter(s => DRIFT_SEGMENT_IDS.has(s.id)).length;

  const liftValues = activeCampaigns
    .map(c => CAMPAIGN_FIXTURES[c.id]?.weekLift)
    .filter((v): v is number => v !== null && v !== undefined);
  const avgLift = liftValues.length
    ? liftValues.reduce((a, b) => a + b, 0) / liftValues.length
    : 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16,
    }}>
      <KpiTile
        emphasizeEyebrow
        eyebrow="Audience reached"
        value={formatReach(AUDIENCE_REACHED_THIS_WEEK)}
        caption={`across ${activeCampaigns.length} active campaigns this week`}
        onClick={() => navigate('/segments')}
      />
      <KpiTile
        eyebrow="Active segments"
        value={String(activeSegments.length)}
        caption={driftCount > 0
          ? `${driftCount} with drift this week`
          : 'all within expected envelope'}
        onClick={() => navigate('/segments')}
      />
      <KpiTile
        eyebrow="Lift this week"
        value={`${avgLift >= 0 ? '+' : ''}${avgLift.toFixed(1)}%`}
        caption={`avg of ${liftValues.length} measured campaigns`}
        onClick={() => navigate('/campaigns?sort=lift')}
      />
      <KpiTile
        eyebrow="Drift signals"
        value={String(driftCount)}
        caption={driftCount > 0
          ? `${DRIFT_HEADLINE.segmentName} · ${DRIFT_HEADLINE.reason}`
          : 'all clear'}
        onClick={() => navigate('/segments?filter=drift')}
      />
    </div>
  );
}
