/**
 * EvidencePanelExpanded — full-width evidence panel for Opportunity detail (screen 19).
 * Shows: audience size 30d sparkline · predicted vs actual mini-chart for prior campaigns
 *        event-stream sample table · link-out chips to Explore / Feature Store
 * Per PRD_Hermes_Agentic.md §5.2 detail spec.
 */
import React from 'react';
import { T, Sparkline } from '../../../theme';
import type { EvidenceRow } from '@hermes/contracts';
import { synthSparkline } from '../../../components/sparkline';

// ── Synthetic 30-day audience sparkline ────────────────────────────────────
function AudienceSparklineCard({ sparklineKey, meta }: { sparklineKey: string; meta?: string }) {
  const data = synthSparkline(sparklineKey);
  const peak = Math.max(...data);
  const last = data[data.length - 1] ?? 0;
  const trend = last >= peak * 0.95 ? 'up' : last <= peak * 0.5 ? 'down' : 'flat';

  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8, padding: '14px 16px',
    }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
        Audience size · 30d
      </div>
      <Sparkline data={data} width={180} height={36} color={T.brand} fill />
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: T.fMono, fontSize: 13, color: T.n900, fontWeight: 600 }}>
          {meta ?? '—'}
        </span>
        <span style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
          color: trend === 'up' ? T.green600 : trend === 'down' ? T.red600 : T.n500,
        }}>
          {trend === 'up' ? '↑ growing' : trend === 'down' ? '↓ declining' : '→ stable'}
        </span>
      </div>
    </div>
  );
}

// ── Predicted vs actual mini-chart for 3 prior campaigns ───────────────────
const PRIOR_CAMPAIGNS = [
  { id: 'CFM-407', predicted: 6.8, actual: 7.2 },
  { id: 'CFM-409', predicted: 5.5, actual: 5.9 },
  { id: 'NTH-202', predicted: 6.0, actual: 6.4 },
];

function PriorCampaignsCard() {
  const max = 8;
  return (
    <div style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
        Prior campaigns · predicted vs actual D1 lift
      </div>
      {PRIOR_CAMPAIGNS.map(c => (
        <div key={c.id} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700 }}>{c.id}</span>
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.green600, fontWeight: 600 }}>
              +{c.actual}% actual
            </span>
          </div>
          {/* Predicted bar */}
          <div style={{ position: 'relative', height: 6, background: T.n100, borderRadius: 3, marginBottom: 3 }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${(c.predicted / max) * 100}%`,
              background: T.n300, borderRadius: 3,
            }} />
          </div>
          {/* Actual bar */}
          <div style={{ position: 'relative', height: 6, background: T.n100, borderRadius: 3 }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${(c.actual / max) * 100}%`,
              background: T.brand, borderRadius: 3,
            }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
            <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400 }}>
              <span style={{ display: 'inline-block', width: 8, height: 4, background: T.n300, borderRadius: 2, marginRight: 3 }} />
              predicted {c.predicted}%
            </span>
            <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400 }}>
              <span style={{ display: 'inline-block', width: 8, height: 4, background: T.brand, borderRadius: 2, marginRight: 3 }} />
              actual {c.actual}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Event-stream sample table ───────────────────────────────────────────────
const SAMPLE_EVENTS = [
  { uid: 'uid-7a3f', feature: 'consecutive_ranked_losses_streak', value: '7', ts: '2026-05-08 06:11:02' },
  { uid: 'uid-2b9c', feature: 'consecutive_ranked_losses_streak', value: '6', ts: '2026-05-08 06:11:44' },
  { uid: 'uid-5d1e', feature: 'is_paying_user_lifetime',          value: 'false', ts: '2026-05-08 06:12:10' },
  { uid: 'uid-8f4a', feature: 'consecutive_ranked_losses_streak', value: '5', ts: '2026-05-08 06:12:33' },
  { uid: 'uid-1c6b', feature: 'is_paying_user_lifetime',          value: 'false', ts: '2026-05-08 06:12:58' },
];

function EventStreamSampleCard() {
  return (
    <div style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
        Event-stream sample (last 5 events)
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fMono, fontSize: 11 }}>
        <thead>
          <tr>
            {['UID', 'Feature', 'Value', 'Timestamp'].map(h => (
              <th key={h} style={{ textAlign: 'left', fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 6, borderBottom: `1px solid ${T.n200}` }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SAMPLE_EVENTS.map((ev, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${T.n100}` }}>
              <td style={{ padding: '5px 0', color: T.n600 }}>{ev.uid}</td>
              <td style={{ padding: '5px 8px', color: T.brand }}>{ev.feature}</td>
              <td style={{ padding: '5px 8px', color: T.n800, fontWeight: 600 }}>{ev.value}</td>
              <td style={{ padding: '5px 0', color: T.n400 }}>{ev.ts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Link-out chips ──────────────────────────────────────────────────────────
function LinkChips({ sparklineKey }: { sparklineKey?: string }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <a
        href="/explore"
        style={{
          fontFamily: T.fSans, fontSize: 12, color: T.blue500,
          background: T.blueSoft, border: `1px solid ${T.blue500}20`,
          borderRadius: 6, padding: '5px 12px', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}
      >
        Open in Explore →
      </a>
      {sparklineKey && (
        <a
          href={`/feature-store/${sparklineKey}`}
          style={{
            fontFamily: T.fSans, fontSize: 12, color: T.blue500,
            background: T.blueSoft, border: `1px solid ${T.blue500}20`,
            borderRadius: 6, padding: '5px 12px', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          Open feature →
        </a>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
interface EvidencePanelExpandedProps {
  evidence: EvidenceRow[];
  style?: React.CSSProperties;
}

export const EvidencePanelExpanded = React.memo<EvidencePanelExpandedProps>(({ evidence, style }) => {
  const primaryEvidence = evidence[0];

  return (
    <div style={{ ...style }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
      }}>
        Evidence · expanded
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {primaryEvidence?.sparklineKey && (
          <AudienceSparklineCard
            sparklineKey={primaryEvidence.sparklineKey}
            meta={primaryEvidence.meta}
          />
        )}
        <PriorCampaignsCard />
      </div>

      <EventStreamSampleCard />

      <div style={{ marginTop: 12 }}>
        <LinkChips sparklineKey={primaryEvidence?.sparklineKey} />
      </div>
    </div>
  );
});
EvidencePanelExpanded.displayName = 'EvidencePanelExpanded';
