/**
 * 20 — Agent Drafts Queue (ag_drafts)
 * List of agent-authored Segments + Campaigns awaiting PM review.
 * Click "Open" routes to canvas review mode via ?from=draft-{id} param.
 * Per PRD_Hermes_Agentic.md §5.4
 */
import React from 'react';
import { T } from '../../theme';
import { DraftRow } from './_components/draft-row';
import { allDrafts } from '../../data/catalog/agents/drafts';

export default function AgentsDraftsPage() {
  const [approvedDrafts, setApprovedDrafts] = React.useState<Set<string>>(new Set());
  const [rejectedDrafts, setRejectedDrafts] = React.useState<Set<string>>(new Set());

  const [toast, setToast] = React.useState('');
  const [toastVisible, setToastVisible] = React.useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }

  const liveDrafts = allDrafts.filter(d => !rejectedDrafts.has(d.id));

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* Page header */}
      <div style={{ padding: '28px 40px 20px', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          05 · Agents · Drafts
        </div>
        <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 6 }}>
          Drafts Queue
        </div>
        <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
          Agent-authored artifacts awaiting review · {liveDrafts.length} pending
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 40px', maxWidth: 1100 }}>
        {liveDrafts.length === 0 ? (
          <div style={{
            fontFamily: T.fSans, fontSize: 13, color: T.n500, fontStyle: 'italic',
            textAlign: 'center', padding: '64px 0',
          }}>
            No drafts pending. The Authoring Agent waits for an approved opportunity or a typed intent.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {liveDrafts.map(draft => (
              <DraftRow
                key={draft.id}
                draft={approvedDrafts.has(draft.id) ? { ...draft, status: 'approved' } : draft}
                onApprove={id => {
                  setApprovedDrafts(prev => new Set(prev).add(id));
                  showToast('Draft approved');
                }}
                onReject={id => {
                  setRejectedDrafts(prev => new Set(prev).add(id));
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        background: T.n900, color: '#fff',
        fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
        padding: '10px 20px', borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        opacity: toastVisible ? 1 : 0, transition: 'opacity .2s',
        pointerEvents: 'none', zIndex: 2000, whiteSpace: 'nowrap',
      }}>
        {toast}
      </div>
    </div>
  );
}
