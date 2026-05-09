/**
 * 02 — Feature Store Detail (fs_detail)
 * Placeholder — wired in Phase 6.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { T } from '../../theme';

export default function FeatureStoreDetailPage() {
  const { name } = useParams<{ name: string }>();
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        01 · Feature Store · Detail
      </div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>
        {name ?? 'Feature Detail'}
      </div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
        Screen 02 · fs_detail · feature: <code style={{ fontFamily: T.fMono }}>{name}</code> · Phase 6 implementation pending.
      </p>
    </div>
  );
}
