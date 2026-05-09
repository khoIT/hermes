/**
 * DataQualityPanel — null rate, distinct values (p50 daily), coverage of MAU,
 * last successful backfill timestamp.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { FeatureAnalytics180d } from '@hermes/contracts';
import { formatIsoDate, formatPct } from './_logic/format-freshness';
import { PanelShell } from './panel-shell';

interface DataQualityPanelProps {
  analytics: FeatureAnalytics180d;
}

export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({ analytics }) => {
  const empty = analytics.lastBackfillAt === null;
  const stats = empty
    ? []
    : [
        { label: 'Null rate', value: formatPct(analytics.nullRate) },
        { label: 'Distinct values (p50/day)', value: analytics.distinctValuesP50.toLocaleString() },
        {
          label: 'Coverage of MAU',
          value:
            analytics.coverageOfMau !== undefined ? formatPct(analytics.coverageOfMau) : '—',
        },
        { label: 'Last backfill', value: `${formatIsoDate(analytics.lastBackfillAt)} · successful` },
      ];

  return (
    <PanelShell title="Data quality" fullWidth>
      {empty ? (
        <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, fontStyle: 'italic' }}>
          Quality stats activate after the first backfill.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
          {stats.map(({ label, value }) => (
            <div key={label}>
              <div
                style={{
                  fontFamily: T.fSans,
                  fontSize: 10,
                  fontWeight: 600,
                  color: T.n400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
              <div style={{ fontFamily: T.fMono, fontSize: 13, color: T.n800, fontWeight: 600 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
};
