/**
 * HealthSnapshotPanel — Analytics tab "Health" panel.
 * Drift score (numeric + plain-English band), 30-day trend arrow,
 * last drift event date.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { FeatureAnalytics180d } from '@hermes/contracts';
import { driftToneColors, formatDriftScore } from './_logic/format-drift-score';
import { formatIsoDate } from './_logic/format-freshness';
import { PanelShell } from './panel-shell';

interface HealthSnapshotPanelProps {
  analytics: FeatureAnalytics180d;
}

/** Compute trend arrow from last 30 buckets vs prior 30. */
function computeTrend(sparkline: number[]): { arrow: '↗' | '↘' | '→'; label: string } {
  if (sparkline.length < 60) return { arrow: '→', label: 'flat' };
  const last30 = sparkline.slice(-30).reduce((a, b) => a + b, 0);
  const prior30 = sparkline.slice(-60, -30).reduce((a, b) => a + b, 0);
  if (prior30 === 0) return { arrow: '→', label: 'flat' };
  const delta = (last30 - prior30) / prior30;
  if (Math.abs(delta) < 0.05) return { arrow: '→', label: 'flat' };
  if (delta > 0) return { arrow: '↗', label: `up ${(delta * 100).toFixed(0)}%` };
  return { arrow: '↘', label: `down ${(Math.abs(delta) * 100).toFixed(0)}%` };
}

export const HealthSnapshotPanel: React.FC<HealthSnapshotPanelProps> = ({ analytics }) => {
  const drift = formatDriftScore(analytics.driftScore);
  const colors = driftToneColors(drift.tone);
  const trend = computeTrend(analytics.requestRateSparkline);
  const lastEvent = analytics.driftEventDates[analytics.driftEventDates.length - 1];

  return (
    <PanelShell title="Health snapshot">
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: T.fDisp,
            fontSize: 32,
            color: colors.fg,
            lineHeight: 1,
          }}
        >
          {drift.numeric}
        </span>
        <span
          style={{
            fontFamily: T.fSans,
            fontSize: 12,
            color: colors.fg,
            fontWeight: 600,
            background: colors.bg,
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {drift.bandLabel}
        </span>
      </div>

      <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, lineHeight: 1.6 }}>
        <div>
          Trend (30d) <span style={{ color: T.n800, marginLeft: 4 }}>{trend.arrow} {trend.label}</span>
        </div>
        <div>
          Last drift event{' '}
          <span style={{ fontFamily: T.fMono, color: T.n800, marginLeft: 4 }}>
            {lastEvent ? formatIsoDate(lastEvent) : 'none in 180d'}
          </span>
        </div>
      </div>
    </PanelShell>
  );
};
