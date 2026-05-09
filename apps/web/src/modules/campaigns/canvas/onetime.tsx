/**
 * 12 — Campaign Canvas · One-time (cmp_canvas_onetime)
 * Placeholder — wired in Phase 8.
 */
import React from 'react';
import { T } from '../../../theme';

export default function CampaignCanvasOnetimePage() {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>04 · Campaign · New · One-time</div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>New Campaign · One-time Push</div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>Screen 12 · cmp_canvas_onetime · Phase 8 pending.</p>
    </div>
  );
}
