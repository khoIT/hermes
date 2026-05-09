/**
 * 19 — Opportunity Detail (ag_opportunity_detail)
 * Placeholder — wired in Phase 9.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { T } from '../../theme';

export default function AgentsOpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>05 · Agents · Opportunity</div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>Opportunity Detail</div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>Screen 19 · ag_opportunity_detail · op: <code style={{ fontFamily: T.fMono }}>ag-op-{id}</code> · Phase 9 pending.</p>
    </div>
  );
}
