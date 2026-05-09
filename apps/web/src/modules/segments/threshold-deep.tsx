/**
 * 05 — Threshold Playground Deep (seg_threshold_deep)
 * Placeholder — wired in Phase 7.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { T } from '../../theme';

export default function SegmentsThresholdPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>03 · Segments · Threshold</div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>Threshold Playground</div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>Screen 05 · seg_threshold_deep · segment: <code style={{ fontFamily: T.fMono }}>{id}</code> · Phase 7 pending.</p>
    </div>
  );
}
