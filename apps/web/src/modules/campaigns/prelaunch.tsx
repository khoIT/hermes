/**
 * 14 — Campaign Pre-launch (cmp_prelaunch)
 * Placeholder — wired in Phase 8.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { T } from '../../theme';

export default function CampaignPrelaunchPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>04 · Campaign · Pre-launch</div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>Pre-launch Review</div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>Screen 14 · cmp_prelaunch · campaign: <code style={{ fontFamily: T.fMono }}>{id}</code> · Phase 8 pending.</p>
    </div>
  );
}
