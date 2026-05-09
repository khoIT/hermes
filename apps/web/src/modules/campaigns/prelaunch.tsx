/**
 * 14 — Campaign Pre-launch (cmp_prelaunch)
 * Simulation against last 7 days, sanity checks (green), holdout summary,
 * sample fires walkthrough, forecast restated. Activate CTA at bottom.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { T, Sparkline } from '../../theme';
import { allCampaigns } from '../../data/catalog/campaigns';
import { CampaignHandoffModal } from './handoff-modal';

const SANITY_CHECKS = [
  { label: 'Event source reachable',                  status: 'pass', detail: 'event_match_end · 3,420/day avg'   },
  { label: 'Predicate compiles to expr-lang',         status: 'pass', detail: 'consecutive_ranked_losses_streak ≥ 3 AND pass_owned_current = true' },
  { label: 'Holdout bucket assigned',                 status: 'pass', detail: '10% · balanced allocation'          },
  { label: 'Variant allocations sum to 1.0',          status: 'pass', detail: 'A=0.45 B=0.45 holdout=0.10'        },
  { label: 'Anti-fatigue clause active',              status: 'pass', detail: 'max 2 IAMs per player per 24h'      },
  { label: 'Goal metric registered',                  status: 'pass', detail: 'D1_retention_rate · daily build'    },
  { label: 'No overlapping active campaigns',         status: 'pass', detail: '0 conflicts detected'              },
  { label: 'Feature freshness within SLA',            status: 'pass', detail: 'pass_owned_current: 4h ago · SLA <1h warm ✓' },
];

const SAMPLE_FIRES = [
  { playerId: 'uid-8a3f', event: 'event_match_end', outcome: 'loss', streak: 4, pass: true,  variant: 'A', action: 'IAM: MMR Shield' },
  { playerId: 'uid-2c91', event: 'event_match_end', outcome: 'loss', streak: 5, pass: true,  variant: 'B', action: 'IAM: XP Boost'   },
  { playerId: 'uid-f04d', event: 'event_match_end', outcome: 'loss', streak: 3, pass: true,  variant: 'holdout', action: 'No IAM — control' },
  { playerId: 'uid-7b22', event: 'event_match_end', outcome: 'loss', streak: 6, pass: false, variant: '—', action: 'Skip: not pass owner' },
  { playerId: 'uid-a1e5', event: 'event_match_end', outcome: 'loss', streak: 4, pass: true,  variant: 'A', action: 'Skip: cooldown active' },
];

const REACH_SPARKLINE = [2800, 3100, 3200, 3350, 3420, 3380, 3450];

export default function CampaignPrelaunchPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [handoffOpen, setHandoffOpen] = React.useState(false);

  const campaign = allCampaigns.find(c => c.id === id);

  return (
    <div style={{ minHeight: '100vh', background: T.n50, paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: '24px 40px', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          04 · Campaign · Pre-launch
        </div>
        <div style={{ fontFamily: T.fDisp, fontSize: 32, textTransform: 'uppercase', color: T.n950, lineHeight: 1 }}>
          {campaign?.displayName ?? id} — Pre-launch Review
        </div>
      </div>

      <div style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 920 }}>

        {/* Simulation summary */}
        <Section title="Simulation · Last 7 Days">
          <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n600, marginBottom: 14 }}>
            Simulated against 7 days of real event_match_end events (May 2–8, 2026).
            Predicate matched {' '}
            <strong style={{ color: T.n900 }}>23,940 events</strong> across{' '}
            <strong style={{ color: T.n900 }}>18,200 unique players</strong>.
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, marginBottom: 4 }}>Fires / day (simulated)</div>
              <Sparkline data={REACH_SPARKLINE} width={200} height={40} color={T.brand} fill />
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { label: 'Avg fires/day', value: '~3,420' },
                { label: 'Peak fires/day', value: '3,500'  },
                { label: 'Unique players', value: '18,200' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontFamily: T.fDisp, fontSize: 22, textTransform: 'uppercase', color: T.n900 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Sanity checks */}
        <Section title="Sanity Checks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SANITY_CHECKS.map(check => (
              <div key={check.label} style={{
                display: 'grid', gridTemplateColumns: '20px 1fr auto',
                alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 7,
                background: T.greenSoft, border: '1px solid #a7f3d0',
              }}>
                <span style={{ color: T.green600, fontWeight: 700 }}>✓</span>
                <div>
                  <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n800, fontWeight: 500 }}>{check.label}</div>
                  <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500, marginTop: 1 }}>{check.detail}</div>
                </div>
                <span style={{
                  fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.green600,
                  background: '#d1fae5', borderRadius: 4, padding: '2px 8px',
                }}>
                  pass
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Holdout design summary */}
        <Section title="Holdout Design">
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Variant A · MMR Shield', alloc: '45%', color: T.brand },
              { label: 'Variant B · XP Boost',   alloc: '45%', color: T.blue600 },
              { label: 'Holdout · Control',       alloc: '10%', color: T.n400 },
            ].map(v => (
              <div key={v.label} style={{
                flex: 1, padding: '12px 14px', borderRadius: 8,
                border: `1px solid ${T.n200}`, background: '#fff',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: T.fDisp, fontSize: 28, color: v.color, textTransform: 'uppercase' }}>{v.alloc}</div>
                <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n600, marginTop: 4 }}>{v.label}</div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 7,
            background: T.greenSoft, border: '1px solid #a7f3d0',
            fontFamily: T.fSans, fontSize: 12, color: T.green600,
          }}>
            Powered to detect ≥5% lift in 14 days (80% power, α=0.05) with 10% holdout
          </div>
        </Section>

        {/* Sample fires walkthrough */}
        <Section title="Sample Fires Walkthrough">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fSans, fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.n200}` }}>
                  {['Player', 'Event', 'Streak', 'Pass owner', 'Variant', 'Action'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: T.n500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE_FIRES.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.n100}`, background: i % 2 === 0 ? '#fff' : T.n50 }}>
                    <td style={{ padding: '7px 10px', fontFamily: T.fMono, color: T.n600 }}>{row.playerId}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fMono, color: T.n700 }}>{row.event}</td>
                    <td style={{ padding: '7px 10px', color: T.n800 }}>{row.streak}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ color: row.pass ? T.green600 : T.n400 }}>{row.pass ? 'Yes' : 'No'}</span>
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{
                        fontFamily: T.fSans, fontWeight: 600, fontSize: 11,
                        padding: '2px 7px', borderRadius: 4,
                        background: row.variant === 'holdout' ? T.n100 : row.variant === '—' ? T.n50 : T.brandSoft,
                        color: row.variant === 'holdout' ? T.n500 : row.variant === '—' ? T.n400 : T.brand,
                      }}>
                        {row.variant}
                      </span>
                    </td>
                    <td style={{ padding: '7px 10px', color: row.action.startsWith('Skip') ? T.n400 : T.n800 }}>
                      {row.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Forecast restated */}
        <Section title="Forecast Summary">
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'D1 retention lift', value: '+8.2%',   color: T.green600 },
              { label: 'D7 retention lift', value: '+4.1%',   color: T.green600 },
              { label: 'Uplift players/wk', value: '~11k',    color: T.brand    },
              { label: 'Est. cost',         value: 'None',    color: T.n500     },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1, minWidth: 120, padding: '12px 14px',
                border: `1px solid ${T.n200}`, borderRadius: 8, background: '#fff',
              }}>
                <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: T.fDisp, fontSize: 26, textTransform: 'uppercase', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Sticky bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#fff', borderTop: `1px solid ${T.n200}`,
        padding: '12px 40px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400, marginBottom: 1 }}>All checks passed · Ready to activate</div>
          <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700 }}>Substrate A · Apollo TEE + Temporal</div>
        </div>
        <button
          onClick={() => navigate(`/campaigns/${id}/journey`)}
          style={{ ...btnStyle, background: T.n100, color: T.n700, border: `1px solid ${T.n200}` }}
        >
          View journey
        </button>
        <button
          onClick={() => setHandoffOpen(true)}
          style={{ ...btnStyle, background: T.brand, color: '#fff', border: 'none', fontWeight: 700 }}
        >
          Activate
        </button>
        <button
          onClick={() => setHandoffOpen(true)}
          style={{ ...btnStyle, background: T.n900, color: '#fff', border: 'none' }}
        >
          5% rollout →
        </button>
      </div>

      {handoffOpen && (
        <CampaignHandoffModal
          open={handoffOpen}
          campaignId={id ?? 'cmp-cfm-407'}
          triggerId={campaign?.triggerId ?? 'trg-cfm-pass-stuck'}
          isHybrid={campaign?.triggerType === 'hybrid'}
          isAgentDrafted={campaign?.author === 'agent-drafted'}
          agentRef={campaign?.agentRef}
          onOpenMonitoring={() => navigate(`/campaigns/${id ?? ''}`)}
          onDone={() => setHandoffOpen(false)}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`,
      borderRadius: 10, padding: '18px 20px',
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

const btnStyle: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
};
