/**
 * HealthSnapshotCard — compact right-rail card showing drift / freshness /
 * null rate at a glance. Click "Open Analytics" jumps to the Analytics tab.
 *
 * Mirrors the data the Analytics tab surfaces but stays visible across all
 * tabs so a PM on Overview can still see whether the feature is healthy.
 */
import React from 'react';
import { T } from '../../../theme';
import type { FeatureAnalytics180d } from '@hermes/contracts';
import { driftToneColors, formatDriftScore } from './_analytics/_logic/format-drift-score';
import { formatPct } from './_analytics/_logic/format-freshness';

interface HealthSnapshotCardProps {
  analytics: FeatureAnalytics180d;
  onOpenAnalytics: () => void;
}

export const HealthSnapshotCard: React.FC<HealthSnapshotCardProps> = ({
  analytics,
  onOpenAnalytics,
}) => {
  const drift = formatDriftScore(analytics.driftScore);
  const driftColors = driftToneColors(drift.tone);
  const empty = analytics.lastBackfillAt === null;

  return (
    <div
      style={{
        border: `1px solid ${T.n200}`,
        borderRadius: 8,
        background: '#fff',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          fontFamily: T.fSans,
          fontSize: 10,
          fontWeight: 700,
          color: T.n500,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}
      >
        Health
      </div>

      {empty ? (
        <div
          style={{
            fontFamily: T.fSans,
            fontSize: 11,
            color: T.n500,
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          No data yet · 7-day warm-up after registration.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Row
            label="Drift"
            value={
              <span
                style={{
                  fontFamily: T.fMono,
                  fontSize: 12,
                  fontWeight: 600,
                  color: driftColors.fg,
                }}
              >
                {drift.numeric} · {drift.bandLabel}
              </span>
            }
          />
          <Row
            label="Fresh"
            value={
              <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.n800 }}>
                {formatPct(analytics.freshnessSlaMet)} SLA
              </span>
            }
          />
          <Row
            label="Null"
            value={
              <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.n800 }}>
                {formatPct(analytics.nullRate)}
              </span>
            }
          />
        </div>
      )}

      <button
        onClick={onOpenAnalytics}
        style={{
          marginTop: 12,
          width: '100%',
          fontFamily: T.fSans,
          fontSize: 11,
          fontWeight: 600,
          color: T.brand,
          background: 'transparent',
          border: `1px solid ${T.brandBorder}`,
          borderRadius: 6,
          padding: '6px 10px',
          cursor: 'pointer',
        }}
      >
        Open Analytics →
      </button>
    </div>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, fontWeight: 600 }}>
      {label}
    </span>
    {value}
  </div>
);
