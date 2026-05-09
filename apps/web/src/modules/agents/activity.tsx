/**
 * 21 — Agent Activity Log (ag_activity)
 * Placeholder — wired in Phase 9.
 */
import React from 'react';
import { T } from '../../theme';

export default function AgentsActivityPage() {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>05 · Agents · Activity</div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>Activity Log</div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>Screen 21 · ag_activity · Chronological agent action feed · Phase 9 pending.</p>
    </div>
  );
}
