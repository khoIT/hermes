/**
 * Fire metrics — 4-up row: forecast daily fires · peak rate · latency · est lift.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { CampaignTemplate } from '../_state/compose-types';

interface Props {
  metrics: CampaignTemplate['fireMetrics'];
}

const Cell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{
    flex: 1, padding: 12, borderRadius: 8,
    background: '#fff', border: `1px solid ${T.n200}`,
  }}>
    <div style={{
      fontFamily: T.fMono, fontSize: 9, color: T.n500,
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      {label}
    </div>
    <div style={{
      fontFamily: '"Spectral", Georgia, serif', fontSize: 20,
      color: T.n900, marginTop: 4, lineHeight: 1,
    }}>
      {value}
    </div>
  </div>
);

export const FireMetricsRow: React.FC<Props> = ({ metrics }) => (
  <div style={{ display: 'flex', gap: 8 }}>
    <Cell label="Forecast" value={metrics.forecastDailyFires} />
    <Cell label="Peak rate" value={metrics.peakRate} />
    <Cell label="Latency" value={metrics.latency} />
    <Cell label="Est lift" value={metrics.estLift} />
  </div>
);
