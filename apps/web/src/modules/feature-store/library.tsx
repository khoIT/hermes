/**
 * 01 — Feature Store Library (fs_library)
 * Placeholder — wired in Phase 6.
 */
import React from 'react';
import { T } from '../../theme';
import { LatencyBadge } from '../../components/latency-badge';
import { Histogram } from '../../components/histogram';

export default function FeatureStoreLibraryPage() {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        01 · Feature Store
      </div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>
        Feature Store
      </div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginBottom: 24 }}>
        Screen 01 · fs_library · Phase 6 implementation pending.
      </p>

      {/* Component smoke: LatencyBadge single + dual */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <LatencyBadge tier="<1s" substrate="A" />
        <LatencyBadge tier="<1h" substrate="B" />
        <LatencyBadge tier="<1d" substrate="B" />
        <LatencyBadge tiers={[{ tier: '<1s', substrate: 'A' }, { tier: '<1h', substrate: 'B' }]} />
      </div>

      {/* Histogram smoke */}
      <div style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8, padding: 16, display: 'inline-block' }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400, marginBottom: 6 }}>consecutive_ranked_losses_streak · distribution</div>
        <Histogram featureName="consecutive_ranked_losses_streak" featureType="int" width={400} height={80} />
      </div>
    </div>
  );
}
