/**
 * ValueDistributionOverTimePanel — 4 small histograms in a row showing the
 * value distribution at today / 30d / 90d / 180d ago. Drift events overlay
 * as faint amber vertical markers on the today snapshot.
 *
 * Each small histogram reuses the existing <Histogram /> component at
 * smaller width (140px each). Seed varies per snapshot so re-runs produce
 * the same drift visualisation.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { FeatureAnalytics180d, HermesFeature } from '@hermes/contracts';
import { Histogram } from '../../../../components/histogram';
import { formatIsoDate } from './_logic/format-freshness';
import { PanelShell } from './panel-shell';

interface ValueDistributionOverTimePanelProps {
  feature: HermesFeature;
  analytics: FeatureAnalytics180d;
}

const SNAPSHOTS: { label: string; seedSuffix: string }[] = [
  { label: '180d ago', seedSuffix: '-180d' },
  { label: '90d ago', seedSuffix: '-90d' },
  { label: '30d ago', seedSuffix: '-30d' },
  { label: 'today', seedSuffix: '' },
];

export const ValueDistributionOverTimePanel: React.FC<ValueDistributionOverTimePanelProps> = ({
  feature,
  analytics,
}) => {
  const empty = analytics.lastBackfillAt === null;
  const driftCount = analytics.driftEventDates.length;

  return (
    <PanelShell title="Value distribution over time" fullWidth>
      {empty ? (
        <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, fontStyle: 'italic' }}>
          No distribution recorded yet · awaiting first backfill.
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 10,
            }}
          >
            {SNAPSHOTS.map(({ label, seedSuffix }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 10,
                    color: T.n500,
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <Histogram
                  featureName={`${feature.name}${seedSuffix}`}
                  featureType={feature.type}
                  width={140}
                  height={64}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              fontFamily: T.fSans,
              fontSize: 11,
              color: T.n500,
              borderTop: `1px dashed ${T.n200}`,
              paddingTop: 10,
            }}
          >
            {driftCount === 0 ? (
              <span>No drift events flagged in the last 180 days.</span>
            ) : (
              <span>
                {driftCount} drift event{driftCount > 1 ? 's' : ''} flagged ·{' '}
                <span style={{ fontFamily: T.fMono, color: T.n800 }}>
                  {analytics.driftEventDates.map(formatIsoDate).join(', ')}
                </span>
              </span>
            )}
          </div>
        </>
      )}
    </PanelShell>
  );
};
