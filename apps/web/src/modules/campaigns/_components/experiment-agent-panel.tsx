/**
 * ExperimentAgentPanel — Agentic §6.3
 * Renders 2 recommendations from agents/recommendations.ts.
 * Each with reason text + Approve / Edit / Dismiss CTAs.
 * Embeds below holdout chart in monitoring screen (16).
 */
import React from 'react';
import { T } from '../../../theme';
import { allRecommendations } from '../../../data/catalog/agents/recommendations';
import type { AgentRecommendation } from '@hermes/contracts';

type RecStatus = 'open' | 'approved' | 'dismissed';

interface RecState {
  id: string;
  status: RecStatus;
}

export function ExperimentAgentPanel({ campaignId }: { campaignId?: string }) {
  const recs = campaignId
    ? allRecommendations.filter(r => r.campaignId === campaignId)
    : allRecommendations;

  const [states, setStates] = React.useState<RecState[]>(
    recs.map(r => ({ id: r.id, status: 'open' as RecStatus }))
  );

  function setStatus(id: string, status: RecStatus) {
    setStates(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  }

  const openCount = states.filter(s => s.status === 'open').length;

  return (
    <div style={{
      border: `1px solid ${T.purple500}`,
      borderRadius: 10, overflow: 'hidden',
      marginBottom: 20,
    }}>
      {/* Panel header */}
      <div style={{
        background: T.purpleSoft,
        borderBottom: `1px solid #e9d5ff`,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Agent icon */}
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: T.purple500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: '#fff' }}>⚗</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.purple500,
            textTransform: 'uppercase', letterSpacing: '0.09em',
          }}>
            Experiment Agent
          </div>
          <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.purple500, opacity: 0.8 }}>
            {openCount} recommendation{openCount !== 1 ? 's' : ''}
          </div>
        </div>
        <span style={{
          fontFamily: T.fSans, fontSize: 10, fontWeight: 700,
          background: T.purple500, color: '#fff',
          borderRadius: 9999, padding: '2px 8px',
        }}>
          {openCount}
        </span>
      </div>

      {/* Recommendations */}
      <div style={{ background: '#fff', padding: '0 16px' }}>
        {recs.map((rec, i) => {
          const state = states.find(s => s.id === rec.id);
          const status = state?.status ?? 'open';
          return (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              status={status}
              isLast={i === recs.length - 1}
              onApprove={() => setStatus(rec.id, 'approved')}
              onEdit={() => setStatus(rec.id, 'open')}
              onDismiss={() => setStatus(rec.id, 'dismissed')}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Individual recommendation card ──────────────────────────────────────────
function RecommendationCard({
  rec, status, isLast, onApprove, onEdit, onDismiss,
}: {
  rec: AgentRecommendation;
  status: RecStatus;
  isLast: boolean;
  onApprove: () => void;
  onEdit: () => void;
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = React.useState(true);

  const typeLabel: Record<string, string> = {
    scale: 'Scale to 100%', extend: 'Extend runtime', pause: 'Pause campaign',
  };

  const statusColors: Record<RecStatus, { bg: string; fg: string }> = {
    open:      { bg: T.purpleSoft, fg: T.purple500 },
    approved:  { bg: T.greenSoft,  fg: T.green600  },
    dismissed: { bg: T.n100,       fg: T.n500      },
  };
  const sc = statusColors[status];

  return (
    <div style={{
      borderBottom: isLast ? 'none' : `1px solid ${T.n100}`,
      padding: '14px 0',
      opacity: status === 'dismissed' ? 0.5 : 1,
    }}>
      {/* Rec header */}
      <div
        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: T.fSans, fontSize: 11, fontWeight: 700,
              background: sc.bg, color: sc.fg,
              borderRadius: 4, padding: '2px 8px',
            }}>
              {status === 'open' ? (typeLabel[rec.type] ?? rec.type) : status.toUpperCase()}
            </span>
            <span style={{ fontFamily: T.fMono, fontSize: 10, color: T.n400 }}>{rec.id}</span>
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400 }}>
              {new Date(rec.surfacedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>

          {expanded && (
            <>
              <div style={{
                fontFamily: T.fSans, fontSize: 13, color: T.n800,
                marginTop: 8, lineHeight: 1.5,
              }}>
                {rec.reason}
              </div>
              {rec.projection && (
                <div style={{
                  fontFamily: T.fSans, fontSize: 12, color: T.n600,
                  marginTop: 6, padding: '6px 10px',
                  background: T.n50, borderRadius: 6,
                  borderLeft: `3px solid ${T.purple500}`,
                }}>
                  {rec.projection}
                </div>
              )}
            </>
          )}
        </div>
        <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n400, flexShrink: 0, marginTop: 2 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* CTAs — Agentic §12.6 requires Approve / Edit / Dismiss */}
      {expanded && status === 'open' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={onApprove}
            style={{
              fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
              background: T.purple500, color: '#fff',
              border: 'none', borderRadius: 6,
              padding: '6px 14px', cursor: 'pointer',
            }}
          >
            Approve
          </button>
          <button
            onClick={onEdit}
            style={{
              fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
              background: T.purpleSoft, color: T.purple500,
              border: `1px solid #e9d5ff`, borderRadius: 6,
              padding: '6px 14px', cursor: 'pointer',
            }}
          >
            Edit
          </button>
          <button
            onClick={onDismiss}
            style={{
              fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
              background: T.n100, color: T.n600,
              border: `1px solid ${T.n200}`, borderRadius: 6,
              padding: '6px 14px', cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
