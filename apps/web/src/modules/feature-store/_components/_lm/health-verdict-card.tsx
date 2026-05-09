/**
 * Health Verdict Card — LM persona panel.
 *
 * Aggregates 4 signals (drift, freshness SLA, null rate, coverage of MAU)
 * into a single GREEN / YELLOW / RED chip. Drilldown rows show each signal
 * with its threshold so the LM understands why the verdict landed.
 *
 * Pure function: no fetching, reads `feature.analytics` directly.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { HermesFeature } from '@hermes/contracts';

type Verdict = 'GREEN' | 'YELLOW' | 'RED';

interface SignalRow {
  label:    string;
  value:    string;
  status:   Verdict;
  reason:   string;
}

function rate(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function aggregate(feature: HermesFeature): { verdict: Verdict; signals: SignalRow[] } {
  const a = feature.analytics;
  const signals: SignalRow[] = [];

  // Drift
  const driftStatus: Verdict = a.driftScore >= 0.7 ? 'RED' : a.driftScore >= 0.4 ? 'YELLOW' : 'GREEN';
  signals.push({
    label:  'Drift',
    value:  a.driftScore.toFixed(3),
    status: driftStatus,
    reason: a.driftScore >= 0.7 ? '≥0.7 severe drift' : a.driftScore >= 0.4 ? '≥0.4 moderate drift' : 'stable',
  });

  // Freshness SLA
  const freshStatus: Verdict = a.freshnessSlaMet < 0.9 ? 'RED' : a.freshnessSlaMet < 0.95 ? 'YELLOW' : 'GREEN';
  signals.push({
    label:  'Freshness SLA',
    value:  rate(a.freshnessSlaMet),
    status: freshStatus,
    reason: a.freshnessSlaMet < 0.9 ? '<90% buckets met SLA' : a.freshnessSlaMet < 0.95 ? '<95% buckets met SLA' : 'meeting SLA',
  });

  // Null rate
  const nullStatus: Verdict = a.nullRate > 0.2 ? 'RED' : a.nullRate > 0.1 ? 'YELLOW' : 'GREEN';
  signals.push({
    label:  'Null rate',
    value:  rate(a.nullRate),
    status: nullStatus,
    reason: a.nullRate > 0.2 ? '>20% null' : a.nullRate > 0.1 ? '>10% null' : 'mostly populated',
  });

  // Coverage of MAU
  const cov = a.coverageOfMau ?? 0;
  const covStatus: Verdict = cov < 0.3 ? 'RED' : cov < 0.6 ? 'YELLOW' : 'GREEN';
  signals.push({
    label:  'MAU coverage',
    value:  rate(cov),
    status: covStatus,
    reason: cov < 0.3 ? '<30% of MAU' : cov < 0.6 ? '<60% of MAU' : 'broad coverage',
  });

  // Worst signal wins.
  const verdict: Verdict = signals.some((s) => s.status === 'RED')
    ? 'RED'
    : signals.some((s) => s.status === 'YELLOW') ? 'YELLOW' : 'GREEN';
  return { verdict, signals };
}

const PALETTE: Record<Verdict, { bg: string; fg: string; label: string }> = {
  GREEN:  { bg: T.greenSoft, fg: T.green600, label: 'HEALTHY' },
  YELLOW: { bg: T.amberSoft, fg: T.amber500, label: 'WATCH'   },
  RED:    { bg: T.redSoft,   fg: T.red600,   label: 'AT RISK' },
};

interface Props { feature: HermesFeature }

export const HealthVerdictCard: React.FC<Props> = ({ feature }) => {
  const { verdict, signals } = aggregate(feature);
  const p = PALETTE[verdict];

  return (
    <div
      style={{
        background:   '#fff',
        border:       `1px solid ${T.n200}`,
        borderRadius: 6,
        padding:      '14px 16px',
        fontFamily:   T.fSans,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div
          style={{
            fontFamily:   T.fMono,
            fontSize:     10,
            fontWeight:   700,
            color:        T.n500,
            letterSpacing: '0.08em',
          }}
        >
          HEALTH VERDICT
        </div>
        <div
          style={{
            fontFamily:   T.fMono,
            fontSize:     11,
            fontWeight:   700,
            padding:      '3px 10px',
            borderRadius: 999,
            background:   p.bg,
            color:        p.fg,
          }}
        >
          ● {p.label}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
        {signals.map((s) => {
          const sp = PALETTE[s.status];
          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ color: sp.fg, fontSize: 14 }}>●</span>
              <span style={{ width: 110, color: T.n700 }}>{s.label}</span>
              <span style={{ width: 80, fontFamily: T.fMono, color: T.n800 }}>{s.value}</span>
              <span style={{ flex: 1, color: T.n500, fontStyle: 'italic' }}>{s.reason}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
