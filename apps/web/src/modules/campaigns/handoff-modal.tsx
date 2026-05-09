/**
 * 15 — Campaign Handoff Modal page (cmp_handoff)
 * Renders the handoff confirmation modal as a dedicated route.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import { HandoffModal } from '../../components/handoff-modal';

export default function CampaignHandoffPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>04 · Campaign · Handoff</div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>Campaign Handoff</div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginBottom: 16 }}>Screen 15 · cmp_handoff · campaign: <code style={{ fontFamily: T.fMono }}>{id}</code></p>
      <HandoffModal
        open={true}
        idType="campaign"
        id={id ?? 'trg-cfm-pass-stuck-2026-0508-b7c2'}
        substrate="A"
        onOpenMonitoring={() => navigate(`/campaigns/${id}`)}
        onDone={() => navigate(`/campaigns/${id ?? ''}`)}
      />
    </div>
  );
}
