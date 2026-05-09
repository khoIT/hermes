/**
 * OpportunityCard — the load-bearing agent component. 3 render modes:
 *   card     — inbox row (constrained width)
 *   detail   — full-width screen 19
 *   embedded — inline within monitoring panel 16
 *
 * 6 regions per PRD_Hermes_Agentic.md §4 ASCII spec:
 *   1. Intent (serif italic)
 *   2. Window pill (amber) + Confidence (mono)
 *   3. Evidence rows (feature chips + sparklines)
 *   4. Proposed artifact (styled as library row preview)
 *   5. Why now (collapsible, collapsed by default)
 *   6. CTAs (Approve · Edit · Dismiss)
 */
import React from 'react';
import { T } from '../theme';
import { SparklineChart, synthSparkline } from './sparkline';
import { LatencyBadge } from './latency-badge';
import { AgentAttribution } from './agent-attribution';
import { ApproveEditDismiss } from './approve-edit-dismiss';
import type { Opportunity } from '@hermes/contracts';

export type OpportunityCardMode = 'card' | 'detail' | 'embedded';

interface OpportunityCardProps {
  opportunity: Opportunity;
  mode?: OpportunityCardMode;
  onApprove?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onOpenThread?: (id: string) => void;
  style?: React.CSSProperties;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function WindowPill({ window: win }: { window: string }) {
  if (win === 'evergreen') return null;
  return (
    <span style={{
      fontFamily: T.fMono, fontSize: 11,
      background: T.amberSoft, color: '#92400e',
      border: `1px solid ${T.amber500}`, borderRadius: 4,
      padding: '2px 8px', whiteSpace: 'nowrap',
    }}>
      Window: {win}
    </span>
  );
}

function ConfidencePill({ confidence }: { confidence: number }) {
  return (
    <span style={{
      fontFamily: T.fMono, fontSize: 11, color: T.n600,
      background: T.n100, border: `1px solid ${T.n200}`,
      borderRadius: 4, padding: '2px 8px',
    }}>
      Confidence {confidence.toFixed(2)}
    </span>
  );
}

function EvidenceSection({ evidence, detail }: { evidence: Opportunity['evidence']; detail: boolean }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
      }}>
        Evidence
      </div>
      {evidence.map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ color: T.n400, fontSize: 12, flexShrink: 0 }}>▸</span>
          <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.n800, flex: 1 }}>
            {row.label}
          </span>
          {row.meta && (
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>{row.meta}</span>
          )}
          {row.sparklineKey && detail && (
            <SparklineChart
              data={synthSparkline(row.sparklineKey)}
              width={60} height={20}
              color={T.brand} fill={false}
            />
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button style={{
          fontFamily: T.fSans, fontSize: 11, color: T.blue500,
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        }}>open in Explore →</button>
        <button style={{
          fontFamily: T.fSans, fontSize: 11, color: T.blue500,
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        }}>open feature →</button>
      </div>
    </div>
  );
}

function ProposedArtifact({ proposed }: { proposed: Opportunity['proposed'] }) {
  if (!proposed.segment && !proposed.campaign) return null;
  return (
    <div style={{
      border: `1px solid ${T.n200}`, borderRadius: 8,
      padding: '10px 14px', marginBottom: 12,
      background: T.n50,
    }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
      }}>
        Proposed artifact
      </div>
      {proposed.segment && (
        <div style={{ marginBottom: proposed.campaign ? 8 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontFamily: T.fSans, fontSize: 10, fontWeight: 700,
              color: T.n600, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>NEW SEGMENT</span>
            <LatencyBadge tier="<1h" substrate="B" />
          </div>
          <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700 }}>
            {proposed.segment}
          </div>
        </div>
      )}
      {proposed.campaign && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontFamily: T.fSans, fontSize: 10, fontWeight: 700,
              color: T.n600, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>NEW CAMPAIGN</span>
            <LatencyBadge tier="<1s" substrate="A" />
          </div>
          <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700 }}>
            {proposed.campaign}
          </div>
        </div>
      )}
    </div>
  );
}

function WhyNow({ text, defaultOpen = false }: { text: string; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily: T.fSans, fontSize: 12, color: T.n600,
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>Why now</span>
      </button>
      {open && (
        <p style={{
          fontFamily: T.fSans, fontSize: 12, color: T.n600, lineHeight: 1.6,
          margin: '6px 0 0 16px',
        }}>
          {text}
        </p>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export const OpportunityCard = React.memo<OpportunityCardProps>(({
  opportunity: op,
  mode = 'card',
  onApprove,
  onEdit,
  onDismiss,
  onOpenThread,
  style,
}) => {
  const isDetail   = mode === 'detail';
  const isEmbedded = mode === 'embedded';

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${T.n200}`,
      borderRadius: isEmbedded ? 8 : 10,
      padding: isDetail ? '24px 28px' : '16px 18px',
      boxShadow: isDetail
        ? '0 2px 8px rgba(0,0,0,0.07)'
        : '0 1px 3px rgba(0,0,0,0.05)',
      ...style,
    }}>
      {/* Header row — ID + timestamp */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 10,
      }}>
        <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400 }}>
          OPPORTUNITY · {op.id}
        </span>
        <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400 }}>
          {op.surfacedAt}
        </span>
      </div>

      {/* Region 1 — Intent (serif italic) */}
      <p style={{
        fontFamily: T.fDisp,
        fontSize: isDetail ? 20 : 16,
        fontWeight: 400,
        fontStyle: 'italic',
        color: T.n950,
        margin: '0 0 12px',
        lineHeight: 1.3,
        letterSpacing: '0.01em',
      }}>
        "{op.intent}"
      </p>

      {/* Region 2 — Window pill + Confidence */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <WindowPill window={op.window} />
        <ConfidencePill confidence={op.confidence} />
      </div>

      {/* Region 3 — Evidence */}
      <EvidenceSection evidence={op.evidence} detail={isDetail || isEmbedded} />

      {/* Region 4 — Proposed artifact */}
      <ProposedArtifact proposed={op.proposed} />

      {/* Region 5 — Why now (collapsed by default per PRD) */}
      <WhyNow text={op.whyNow} defaultOpen={isDetail} />

      {/* Agent attribution line */}
      <AgentAttribution
        agentLabel="Insight Agent"
        threadId={op.id.replace('ag-op-', '')}
        onOpenThread={() => onOpenThread?.(op.id)}
        style={{ marginBottom: 14 }}
      />

      {/* Region 6 — CTAs */}
      <ApproveEditDismiss
        onApprove={() => onApprove?.(op.id)}
        onEdit={() => onEdit?.(op.id)}
        onDismiss={() => onDismiss?.(op.id)}
        disabled={op.status !== 'open'}
      />
    </div>
  );
});
OpportunityCard.displayName = 'OpportunityCard';
