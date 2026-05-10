/**
 * 16 — Campaign Monitoring (cmp_monitoring)
 * Header with cross-link badges to SegmentID/TriggerID.
 * Health snapshot, uplift chart, Experiment Agent panel, operational health,
 * sample fires, suggested follow-ups. Canonical demo: cmp-cfm-407.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { T, Badge, Sparkline } from '../../theme';
import { allCampaigns } from '../../data/catalog/campaigns';
import { UpliftChart } from './_components/uplift-chart';
import { ExperimentAgentPanel } from './_components/experiment-agent-panel';
import { SampleFiresTable } from './_components/sample-fires-table';
import { pushRecent } from '../../utils/recent-items-store';
import { notifyRecentChanged } from '../../components/sidebar/recent-items';

const HEALTH_SPARKLINE = [3200, 3280, 3350, 3420, 3380, 3450, 3500, 3420, 3480, 3520, 3410, 3460, 3440, 3480];

const FOLLOW_UPS = [
  'Scale to 100% rollout — Variant A clearly wins; Variant B can be retired.',
  'Cross-game adaptation: Port ia-pass-stuck-rescue to NTH with adjusted streak threshold (≥4).',
  'Extend to non-pass players: Loss streak rescue without pass gate — broader audience, lower lift expected.',
  'Add Push fallback: Players who dismiss IAM and don\'t log back in within 2h → send push.',
];

export default function CampaignMonitoringPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const campaign = allCampaigns.find(c => c.id === id) ?? allCampaigns.find(c => c.id === 'cmp-cfm-407')!;
  const isAnchor = campaign.id === 'cmp-cfm-407';

  // Track recent: log a visit once we know which campaign rendered.
  React.useEffect(() => {
    pushRecent('campaigns', {
      id: campaign.id,
      title: campaign.displayName,
      updatedAt: new Date().toISOString(),
      href: `/campaigns/${campaign.id}`,
    });
    notifyRecentChanged();
  }, [campaign.id]);

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* Header */}
      <div style={{ padding: '24px 40px', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          04 · Campaign · Monitoring
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.fDisp, fontSize: 32, textTransform: 'uppercase', color: T.n950, lineHeight: 1, marginBottom: 8 }}>
              {campaign.displayName}
            </div>
            {/* Status + active duration */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Badge variant="live" dot>Active</Badge>
              <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500 }}>
                Active for 12 days · since 2026-04-27
              </span>
              <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500 }}>·</span>
              <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n700, fontWeight: 600 }}>
                Total fires: 41,040
              </span>
            </div>
          </div>

          {/* Cross-link badges */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {campaign.triggerId && (
              <button
                onClick={() => navigate(`/campaigns/${campaign.id}/handoff`)}
                style={{
                  fontFamily: T.fMono, fontSize: 11, fontWeight: 600,
                  background: T.brandSoft, color: T.brand,
                  border: `1px solid ${T.brandBorder}`,
                  borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span>⚡</span>
                <span>TriggerID: {campaign.triggerId}</span>
              </button>
            )}
            {campaign.audienceRef && (
              <button
                onClick={() => navigate(`/segments/${campaign.audienceRef}`)}
                style={{
                  fontFamily: T.fMono, fontSize: 11, fontWeight: 600,
                  background: T.blueSoft, color: T.blue600,
                  border: `1px solid #bfdbfe`,
                  borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span>◉</span>
                <span>SegmentID: {campaign.audienceRef.slice(0, 28)}…</span>
              </button>
            )}
            <button
              onClick={() => navigate(`/campaigns/${campaign.id}/journey`)}
              style={{
                fontFamily: T.fSans, fontSize: 12,
                background: T.n100, color: T.n700,
                border: `1px solid ${T.n200}`,
                borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
              }}
            >
              View journey →
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 40px', maxWidth: 1100 }}>

        {/* Health snapshot */}
        <Section title="Health Snapshot">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Total fires',    value: '41,040',  sparkline: HEALTH_SPARKLINE },
              { label: 'Unique players', value: '18,200',  sparkline: undefined },
              { label: '% MAU',          value: '3.2%',    sparkline: undefined },
              { label: 'Cost to date',   value: '$0',      sparkline: undefined },
            ].map(s => (
              <div key={s.label} style={{
                padding: '12px 14px', borderRadius: 8,
                border: `1px solid ${T.n200}`, background: '#fff',
              }}>
                <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: T.fDisp, fontSize: 24, textTransform: 'uppercase', color: T.n900 }}>
                    {s.value}
                  </div>
                  {s.sparkline && <Sparkline data={s.sparkline} width={60} height={20} color={T.brand} />}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Uplift measurement */}
        <Section title="Uplift Measurement · Holdout vs Treatment">
          {isAnchor ? (
            <UpliftChart />
          ) : (
            <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n400, fontStyle: 'italic', padding: '20px 0' }}>
              Insufficient data — holdout measurement begins after 3 days.
            </div>
          )}
        </Section>

        {/* Experiment Agent panel — Agentic §6.3, embedded below holdout chart */}
        <ExperimentAgentPanel campaignId={campaign.id} />

        {/* Operational health */}
        <Section title="Operational Health">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Event source latency',     value: '<1s avg · p99 4s',        ok: true  },
              { label: 'Predicate eval errors',    value: '0 in last 24h',             ok: true  },
              { label: 'Anti-fatigue blocks',      value: '12% of eligible fires',     ok: true  },
              { label: 'Cooldown skips',           value: '31% of eligible fires',     ok: true  },
              { label: 'Variant balance check',    value: 'A=45.1% B=44.9% H=10.0%', ok: true  },
              { label: 'Goal metric freshness',    value: 'D1_retention_rate · 4h ago',ok: true  },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 12px', borderRadius: 7,
                background: row.ok ? T.greenSoft : T.redSoft,
                border: `1px solid ${row.ok ? '#a7f3d0' : '#fecaca'}`,
              }}>
                <span style={{ color: row.ok ? T.green600 : T.red600, fontWeight: 700 }}>
                  {row.ok ? '✓' : '✗'}
                </span>
                <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n800, fontWeight: 500, flex: 1 }}>
                  {row.label}
                </span>
                <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Sample fires */}
        <Section title="Sample Fires (last 100)">
          <SampleFiresTable maxRows={7} />
        </Section>

        {/* Suggested follow-ups */}
        <Section title="Suggested Follow-ups">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FOLLOW_UPS.map((text, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '10px 14px',
                borderRadius: 8, background: T.purpleSoft,
                border: `1px solid #e9d5ff`,
              }}>
                <span style={{ color: T.purple500, fontWeight: 700, flexShrink: 0 }}>✦</span>
                <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n800, lineHeight: 1.5 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`,
      borderRadius: 10, padding: '18px 20px', marginBottom: 16,
    }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400,
        textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14,
        borderBottom: `1px solid ${T.n100}`, paddingBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}
