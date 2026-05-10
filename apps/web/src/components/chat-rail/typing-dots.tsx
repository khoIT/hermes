/**
 * TypingDots — three pulsing dots in a Hermes identity bubble.
 * Rendered while an assistant turn is pending (delayed-append in chat-rail).
 */
import React from 'react';
import { T } from '../../theme';

export function TypingDots() {
  return (
    <div style={{ maxWidth: 820, margin: '8px 0 24px' }}>
      <style>{KEYFRAMES}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5, background: T.n900,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.fDisp, fontSize: 11, lineHeight: 1, letterSpacing: '0.02em',
        }}>VG</div>
        <span style={{
          fontFamily: T.fSans, fontSize: 12, fontWeight: 600, color: T.n800,
        }}>Hermes</span>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '8px 12px', borderRadius: 12,
        background: T.n50, border: `1px solid ${T.n200}`,
      }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: 6, height: 6, borderRadius: '50%', background: T.n500,
              animation: `hermesDotPulse 1.2s ${i * 0.15}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

const KEYFRAMES = `
@keyframes hermesDotPulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
`;
