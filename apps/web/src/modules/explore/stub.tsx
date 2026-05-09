/**
 * Explore — nav-only stub (Module 02, deferred for May 12 per PRD §7).
 */
import React from 'react';
import { T, Badge } from '../../theme';

export default function ExploreStubPage() {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        02 · Explore
      </div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>
        Explore
      </div>
      <Badge variant="secondary">Nav-only · Deferred for May 12</Badge>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginTop: 16, maxWidth: 480, lineHeight: 1.6 }}>
        Investigation surface — anomaly landing, event browser, funnel and retention analytics,
        per-user timeline, hypothesis save / library. Not load-bearing for the May 12 alignment decisions.
      </p>
    </div>
  );
}
