/**
 * 06 — Segment Handoff Modal page (seg_handoff)
 * This route renders the modal inline as a dedicated page (modal route).
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import { HandoffModal } from '../../components/handoff-modal';

export default function SegmentsHandoffPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>03 · Segments · Handoff</div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>Segment Handoff</div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginBottom: 16 }}>Screen 06 · seg_handoff · segment: <code style={{ fontFamily: T.fMono }}>{id}</code></p>
      <HandoffModal
        open={true}
        idType="segment"
        id={id ?? 'seg-example-id'}
        substrate="B"
        onOpenMonitoring={() => navigate(`/segments/${id}`)}
        onUseCampaign={() => navigate('/campaigns/new/realtime')}
        onDone={() => navigate(`/segments/${id ?? ''}`)}
      />
    </div>
  );
}
