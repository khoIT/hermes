/**
 * 20 — Agent Drafts Queue (ag_drafts)
 * Placeholder — wired in Phase 9.
 */
import React from 'react';
import { T } from '../../theme';

export default function AgentsDraftsPage() {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>05 · Agents · Drafts</div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>Drafts</div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>Screen 20 · ag_drafts · Phase 9 pending.</p>
      <p style={{ fontFamily: T.fSans, fontSize: 12, color: T.n400, fontStyle: 'italic', marginTop: 16 }}>
        No drafts pending. The Authoring Agent waits for an approved opportunity or a typed intent.
      </p>
    </div>
  );
}
