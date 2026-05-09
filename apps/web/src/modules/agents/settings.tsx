/**
 * 22 — Agent Settings (ag_settings)
 * Placeholder — wired in Phase 9.
 */
import React from 'react';
import { T, Badge } from '../../theme';

export default function AgentsSettingsPage() {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>05 · Agents · Settings</div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>Agent Settings</div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginBottom: 16 }}>Screen 22 · ag_settings · Phase 9 pending.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Badge variant="secondary">Insight Agent · enabled</Badge>
        <Badge variant="secondary">Authoring Agent · enabled</Badge>
        <Badge variant="secondary">Experiment Agent · enabled</Badge>
        <Badge variant="outline">Studio Agent · Coming in Phase 2</Badge>
      </div>
    </div>
  );
}
