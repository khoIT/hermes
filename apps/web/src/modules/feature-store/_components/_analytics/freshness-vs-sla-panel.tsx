/**
 * FreshnessVsSlaPanel — % of buckets meeting SLA, last miss timestamp,
 * median lag vs SLA target.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { FeatureAnalytics180d, HermesLatencyTier } from '@hermes/contracts';
import { formatIsoDate, formatLagMinutes, formatPct } from './_logic/format-freshness';
import { PanelShell } from './panel-shell';

interface FreshnessVsSlaPanelProps {
  analytics: FeatureAnalytics180d;
  latencyTier: HermesLatencyTier;
}

const SLA_MINUTES_BY_TIER: Record<HermesLatencyTier, number> = {
  '<1s': 1, // 1 min effective SLA for realtime path (TEE state)
  '<1h': 60,
  '<1d': 1440,
};

export const FreshnessVsSlaPanel: React.FC<FreshnessVsSlaPanelProps> = ({
  analytics,
  latencyTier,
}) => {
  const slaTarget = SLA_MINUTES_BY_TIER[latencyTier];
  const empty = analytics.lastBackfillAt === null;

  return (
    <PanelShell title="Freshness vs SLA">
      {empty ? (
        <EmptyState />
      ) : (
        <>
          <div style={{ fontFamily: T.fDisp, fontSize: 32, color: T.green600, lineHeight: 1, marginBottom: 6 }}>
            {formatPct(analytics.freshnessSlaMet)}
          </div>
          <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, marginBottom: 10 }}>
            of buckets met SLA
          </div>

          <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, lineHeight: 1.6 }}>
            <div>
              Last miss{' '}
              <span style={{ fontFamily: T.fMono, color: T.n800, marginLeft: 4 }}>
                {analytics.lastSlaMissAt ? formatIsoDate(analytics.lastSlaMissAt) : 'none in 180d'}
              </span>
            </div>
            <div>
              Median lag{' '}
              <span style={{ fontFamily: T.fMono, color: T.n800, marginLeft: 4 }}>
                {analytics.medianLagMinutes !== undefined
                  ? formatLagMinutes(analytics.medianLagMinutes)
                  : '—'}{' '}
                <span style={{ color: T.n400 }}>
                  (SLA {formatLagMinutes(slaTarget)})
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </PanelShell>
  );
};

const EmptyState: React.FC = () => (
  <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, fontStyle: 'italic' }}>
    Awaiting first backfill — SLA tracking starts once buckets begin landing.
  </div>
);
