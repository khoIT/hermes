/**
 * 19 — Opportunity Detail (ag_opportunity_detail)
 * Full-width OpportunityCard (mode="detail") + EvidencePanelExpanded + AgentThread
 * URL: /agents/op/:id  (id = numeric part e.g. "1042" for ag-op-1042)
 * Per PRD_Hermes_Agentic.md §5.2 detail spec
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import { OpportunityCard } from '../../components/opportunity-card';
import { EvidencePanelExpanded } from './_components/evidence-panel-expanded';
import { AgentThread } from './_components/agent-thread';
import { RejectModal, type RejectReason } from './_components/reject-modal';
import { allOpportunities } from '../../data/catalog/agents/opportunities';
import { allDrafts } from '../../data/catalog/agents/drafts';

export default function AgentsOpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dismissed, setDismissed] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);

  // Resolve opportunity — id param is the numeric suffix
  const op = React.useMemo(() =>
    allOpportunities.find(o => o.id === `ag-op-${id}` || o.id === id),
    [id],
  );

  if (!op) {
    return (
      <div style={{ padding: '40px', fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
        Opportunity <code style={{ fontFamily: T.fMono }}>ag-op-{id}</code> not found.{' '}
        <button onClick={() => navigate('/agents')} style={{ color: T.blue500, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Back to inbox
        </button>
      </div>
    );
  }

  function handleApprove(opId: string) {
    const draft = allDrafts.find(d => d.fromOpportunity === opId);
    if (draft) {
      const route = draft.type === 'segment'
        ? `/segments/new?from=draft-${draft.id}`
        : `/campaigns/new/realtime?from=draft-${draft.id}`;
      navigate(route);
    } else {
      navigate('/agents/drafts');
    }
  }

  function handleEdit(opId: string) {
    const found = allOpportunities.find(o => o.id === opId);
    if (found?.proposed?.segment) {
      navigate(`/segments/new?seedFeature=${encodeURIComponent(found.proposed.segment)}`);
    } else {
      navigate('/campaigns/new/realtime');
    }
  }

  function handleRejectConfirm(_opId: string, _reason: RejectReason | null) {
    setDismissed(true);
    setRejectOpen(false);
    navigate('/agents');
  }

  const effectiveOp = dismissed ? { ...op, status: 'dismissed' as const } : op;

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* Page header */}
      <div style={{ padding: '20px 40px 16px', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <button
          onClick={() => navigate('/agents')}
          style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10 }}
        >
          ← Back to inbox
        </button>

        {/* ID · game · goal · window header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.n400 }}>{op.id}</span>
          <span style={{ fontFamily: T.fSans, fontSize: 12, fontWeight: 700, color: T.n700,
            background: T.n100, borderRadius: 4, padding: '2px 8px' }}>
            {op.game}
          </span>
          <span style={{ fontFamily: T.fSans, fontSize: 12, fontWeight: 700,
            background: T.brandSoft, color: T.brand, borderRadius: 4, padding: '2px 8px',
            textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {op.goal4r}
          </span>
          {op.window !== 'evergreen' && (
            <span style={{ fontFamily: T.fMono, fontSize: 11,
              background: T.amberSoft, color: '#92400e',
              border: `1px solid ${T.amber500}`, borderRadius: 4, padding: '2px 8px' }}>
              {op.window}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 40px', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Full-width OpportunityCard in detail mode */}
        <OpportunityCard
          opportunity={effectiveOp}
          mode="detail"
          onApprove={handleApprove}
          onEdit={handleEdit}
          onDismiss={() => setRejectOpen(true)}
        />

        {/* Evidence panel — expanded */}
        <EvidencePanelExpanded evidence={op.evidence} />

        {/* Agent thread */}
        {op.agentThread && op.agentThread.length > 0 && (
          <AgentThread entries={op.agentThread} />
        )}
      </div>

      {/* Reject modal */}
      <RejectModal
        opportunityId={op.id}
        open={rejectOpen}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectOpen(false)}
      />
    </div>
  );
}
