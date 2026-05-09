/**
 * DraftRow — list item for the Drafts queue (screen 20).
 * Shows: type chip · mono ID + serif italic display name · opportunity link
 *        "Drafted by Authoring Agent · Nh ago" · estimated impact · quick actions
 * Per PRD_Hermes_Agentic.md §5.4
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../../theme';
import type { AgentDraft } from '@hermes/contracts';

interface DraftRowProps {
  draft: AgentDraft;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export const DraftRow = React.memo<DraftRowProps>(({ draft, onApprove, onReject }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);

  const typeColor = draft.type === 'segment'
    ? { bg: T.blueSoft,   fg: T.blue600  }
    : { bg: T.brandSoft,  fg: T.brand    };

  // Route for "Open" quick action
  const openRoute = draft.type === 'segment'
    ? `/segments/new?from=draft-${draft.id}`
    : `/campaigns/new/realtime?from=draft-${draft.id}`;

  const statusBg =
    draft.status === 'pending-review' ? { bg: T.amberSoft,  fg: '#92400e' } :
    draft.status === 'edits-applied'  ? { bg: T.blueSoft,   fg: T.blue600 } :
    draft.status === 'approved'       ? { bg: '#d1fae5',    fg: '#065f46' } :
                                        { bg: '#fee2e2',    fg: '#991b1b' };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '90px 1fr 160px 120px',
        alignItems: 'center', gap: 16,
        padding: '14px 16px', borderRadius: 9, cursor: 'default',
        background: '#fff',
        border: `1px solid ${hovered ? T.brand : T.n200}`,
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        transition: 'border-color .1s, box-shadow .1s',
      }}
    >
      {/* Type chip */}
      <div>
        <span style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 700,
          padding: '3px 10px', borderRadius: 5,
          background: typeColor.bg, color: typeColor.fg,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          {draft.type}
        </span>
      </div>

      {/* Name + meta */}
      <div style={{ minWidth: 0 }}>
        {/* Serif italic display name */}
        <div style={{
          fontFamily: '"Georgia","Times New Roman",serif',
          fontStyle: 'italic', fontSize: 14, color: T.n900,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 2,
        }}>
          {draft.displayName}
        </div>
        {/* Mono ID */}
        <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n400, marginBottom: 3 }}>
          {draft.draftRef}
        </div>
        {/* Opportunity link */}
        <button
          onClick={() => navigate(`/agents/op/${draft.fromOpportunity.replace('ag-op-', '')}`)}
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.blue500,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}
        >
          ↗ Drafted from opportunity {draft.fromOpportunity}
        </button>
        {/* Attribution + time */}
        <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, marginTop: 3 }}>
          Drafted by{' '}
          <span style={{ color: T.brand, fontWeight: 600 }}>Authoring Agent</span>
          {' · '}
          {relativeTime(draft.draftedAt)}
          {draft.editedBy && (
            <span> · edited by <strong style={{ color: T.n700 }}>{draft.editedBy}</strong></span>
          )}
        </div>
      </div>

      {/* Estimated impact + status */}
      <div>
        <span style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
          padding: '2px 8px', borderRadius: 5,
          background: statusBg.bg, color: statusBg.fg,
          display: 'block', marginBottom: 4, width: 'fit-content',
        }}>
          {draft.status.replace('-', ' ')}
        </span>
        {draft.estimatedImpact && (
          <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600 }}>
            {draft.estimatedImpact}
          </span>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button
          onClick={() => navigate(openRoute)}
          style={{
            fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
            color: T.n800, background: T.n100,
            border: `1px solid ${T.n200}`, borderRadius: 6,
            padding: '5px 10px', cursor: 'pointer',
          }}
        >
          Open
        </button>
        <button
          onClick={() => onApprove(draft.id)}
          disabled={draft.status === 'approved'}
          style={{
            fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
            color: '#fff', background: T.brand,
            border: 'none', borderRadius: 6,
            padding: '5px 10px', cursor: draft.status === 'approved' ? 'not-allowed' : 'pointer',
            opacity: draft.status === 'approved' ? 0.5 : 1,
          }}
        >
          Approve
        </button>
        <button
          onClick={() => onReject(draft.id)}
          style={{
            fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
            color: T.n600, background: 'transparent',
            border: 'none', borderRadius: 6,
            padding: '5px 8px', cursor: 'pointer',
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
});
DraftRow.displayName = 'DraftRow';
