/**
 * 06 — Segment Handoff Modal page (seg_handoff)
 * Dedicated route that renders the shared HandoffModal with Substrate B copy.
 * Supports ?agentDraft=1 to show agent attribution line (Agentic §6.4).
 * Cannot be dismissed by overlay click per PRD §10.
 * Per PRD §8.7.
 */
import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { HandoffModal } from '../../components/handoff-modal';
import { allSegments } from '../../data/catalog/segments';

export default function SegmentsHandoffPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const isAgentDraft = params.get('agentDraft') === '1';
  const seg = allSegments.find(s => s.id === id);
  const isAgentAuthored = seg?.author === 'agent-drafted' || seg?.author === 'agent-edited';
  const showAttribution = isAgentDraft || isAgentAuthored;

  return (
    <HandoffModal
      open={true}
      idType="segment"
      id={id ?? 'seg-example-id'}
      substrate="B"
      agentAttribution={showAttribution ? {
        agentLabel: 'Authoring Agent',
        approvedBy: 'Khoi',
        threadId: seg?.agentRef ?? 'ag-op-1042',
      } : undefined}
      onOpenMonitoring={() => navigate(`/segments/${id}`)}
      onUseCampaign={() => navigate('/campaigns/new/realtime')}
      onDone={() => navigate(`/segments/${id ?? ''}`)}
    />
  );
}
