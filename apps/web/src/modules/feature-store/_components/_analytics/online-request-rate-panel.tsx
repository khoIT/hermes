/**
 * OnlineRequestRatePanel — 180-day daily request count sparkline + peak day
 * callout + p99 lookup latency stat.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { FeatureAnalytics180d } from '@hermes/contracts';
import { SparklineChart } from '../../../../components/sparkline';
import { formatCount, formatIsoDate } from './_logic/format-freshness';
import { PanelShell } from './panel-shell';

interface OnlineRequestRatePanelProps {
  analytics: FeatureAnalytics180d;
}

function findPeakDate(sparkline: number[], lastBackfillIso: string | null): {
  date: string | null;
  value: number;
} {
  if (sparkline.length === 0) return { date: null, value: 0 };
  let peakIdx = 0;
  let peakVal = sparkline[0] ?? 0;
  for (let i = 1; i < sparkline.length; i++) {
    if ((sparkline[i] ?? 0) > peakVal) {
      peakVal = sparkline[i] ?? 0;
      peakIdx = i;
    }
  }
  if (!lastBackfillIso) return { date: null, value: peakVal };
  const lastMs = new Date(lastBackfillIso).getTime();
  const peakMs = lastMs - (sparkline.length - 1 - peakIdx) * 86_400_000;
  return { date: new Date(peakMs).toISOString(), value: peakVal };
}

export const OnlineRequestRatePanel: React.FC<OnlineRequestRatePanelProps> = ({ analytics }) => {
  const empty = analytics.lastBackfillAt === null;
  const peak = findPeakDate(analytics.requestRateSparkline, analytics.lastBackfillAt);

  return (
    <PanelShell title="Online request rate (180d)">
      {empty ? (
        <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, fontStyle: 'italic' }}>
          No request traffic recorded yet.
        </div>
      ) : (
        <>
          <SparklineChart
            data={analytics.requestRateSparkline}
            width={260}
            height={48}
            color={T.brand}
            fill
            endDot
          />

          <div
            style={{
              marginTop: 10,
              fontFamily: T.fSans,
              fontSize: 11,
              color: T.n500,
              lineHeight: 1.6,
            }}
          >
            <div>
              Peak{' '}
              <span style={{ fontFamily: T.fMono, color: T.n800, marginLeft: 4 }}>
                {formatCount(peak.value)} reqs
                {peak.date && ` (${formatIsoDate(peak.date)})`}
              </span>
            </div>
            {analytics.p99LookupLatencyMs !== undefined && (
              <div>
                p99 lookup latency{' '}
                <span style={{ fontFamily: T.fMono, color: T.n800, marginLeft: 4 }}>
                  {analytics.p99LookupLatencyMs.toFixed(1)} ms
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </PanelShell>
  );
};
