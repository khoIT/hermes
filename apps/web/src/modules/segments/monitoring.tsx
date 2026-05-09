/**
 * 07 — Segment Monitoring (seg_monitoring)
 * 3 tabs: Overview · Monitoring · Used by.
 * Audience-size-over-time chart with rebuild markers + campaign windows.
 * Schedule rebuild toggle. Per PRD §8.8.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import { Tabs } from '../../theme';
import { Switch } from '../../theme';
import { MonitoringChart } from './_components/monitoring-chart';
import { allSegments } from '../../data/catalog/segments';

// Synth time-series data for demo
function synthTimeSeries(baseCount: number, days = 30) {
  const result: Array<{ date: string; count: number }> = [];
  const now = new Date('2026-05-09');
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const jitter = (Math.sin(i * 0.7) * 0.08 + (Math.random() - 0.5) * 0.04);
    result.push({
      date: d.toISOString().slice(0, 10),
      count: Math.max(100, Math.round(baseCount * (1 + jitter))),
    });
  }
  return result;
}

const TABS = [
  { value: 'overview',   label: 'Overview' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'used-by',    label: 'Used by' },
];

export default function SegmentsMonitoringPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = React.useState('overview');
  const [autoRebuild, setAutoRebuild] = React.useState(true);

  const seg = allSegments.find(s => s.id === id) ?? allSegments[0]!;
  const timeSeries = React.useMemo(
    () => synthTimeSeries(seg?.audienceSize ?? 20000),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seg?.audienceSize],
  );

  if (!seg) {
    return <div style={{ padding: 32, fontFamily: T.fSans }}>Segment not found.</div>;
  }

  const rebuildMarkers = [
    { date: timeSeries[7]?.date ?? '', label: 'rebuild' },
    { date: timeSeries[20]?.date ?? '', label: 'rebuild' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
        07 · Segments · Monitoring
      </div>
      <div style={{ fontFamily: T.fDisp, fontSize: 32, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 4 }}>
        {seg.displayName}
      </div>
      <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500, marginBottom: 16 }}>{seg.id}</div>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        {[
          { label: 'Audience', value: seg.audienceSize?.toLocaleString() ?? '—' },
          { label: 'Goal', value: seg.goal4r.toUpperCase() },
          { label: 'Status', value: seg.status },
          { label: 'Last build', value: seg.lastBuildAt ? new Date(seg.lastBuildAt).toLocaleDateString() : '—' },
          { label: 'Campaigns', value: String(seg.usedByCampaigns ?? 0) },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            <div style={{ fontFamily: T.fMono, fontSize: 14, color: T.n900, marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} value={tab} onChange={setTab} style={{ marginBottom: 20 }} />

      {tab === 'overview' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: T.fSans, fontSize: 12, fontWeight: 600, color: T.n700 }}>Audience size — last 30 days</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>Auto-rebuild daily</span>
              <Switch checked={autoRebuild} onChange={setAutoRebuild} />
            </div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8, padding: '16px' }}>
            <MonitoringChart
              data={timeSeries}
              rebuildMarkers={rebuildMarkers}
              height={160}
            />
          </div>
        </div>
      )}

      {tab === 'monitoring' && (
        <div>
          <div style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontFamily: T.fSans, fontSize: 12, fontWeight: 600, color: T.n700, marginBottom: 12 }}>
              90-day trend with expected envelope
            </div>
            <MonitoringChart
              data={synthTimeSeries(seg.audienceSize ?? 20000, 90)}
              rebuildMarkers={[
                { date: '2026-02-14', label: 'rebuild' },
                { date: '2026-03-28', label: 'rebuild' },
                { date: '2026-05-01', label: 'rebuild' },
              ]}
              height={200}
            />
          </div>
          {seg.drift && (
            <div style={{
              background: T.amberSoft, border: `1px solid ${T.amber500}`,
              borderRadius: 8, padding: '12px 16px',
              fontFamily: T.fSans, fontSize: 12, color: '#92400e',
            }}>
              ⚠ Drift detected — audience composition has shifted &gt;15% from baseline. Consider rebuilding the predicate.
            </div>
          )}
        </div>
      )}

      {tab === 'used-by' && (
        <div>
          {(seg.usedByCampaigns ?? 0) > 0 ? (
            <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n700 }}>
              This segment is used by <strong>{seg.usedByCampaigns}</strong> active campaign{seg.usedByCampaigns !== 1 ? 's' : ''}.
            </div>
          ) : (
            <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
              Not used in any campaigns yet.{' '}
              <button
                onClick={() => navigate('/campaigns/new/realtime')}
                style={{
                  fontFamily: T.fSans, fontSize: 13, color: T.brand,
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                Create a campaign using this segment →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action strip */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <button
          onClick={() => navigate(`/segments/${id}/threshold`)}
          style={{
            fontFamily: T.fSans, fontSize: 12, color: T.n700,
            background: T.n50, border: `1px solid ${T.n200}`,
            borderRadius: 7, padding: '7px 14px', cursor: 'pointer',
          }}
        >
          Explore threshold
        </button>
        <button
          onClick={() => navigate(`/segments/${id}/handoff`)}
          style={{
            fontFamily: T.fSans, fontSize: 12, fontWeight: 600, color: '#fff',
            background: T.brand, border: 'none',
            borderRadius: 7, padding: '7px 16px', cursor: 'pointer',
          }}
        >
          Rebuild →
        </button>
      </div>
    </div>
  );
}
