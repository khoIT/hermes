/**
 * AudienceBand — sticky UID count + % MAU + % subpop + breakdown expansion.
 * Pulses on uid count change (~400ms CSS keyframe).
 * Per PRD §8.3 Region 2 — always visible, sticky while editing predicate.
 */
import React from 'react';
import { T } from '../theme';
import { formatUidCount } from '../utils/format-uid-count';

interface BreakdownBar {
  label: string;
  fraction: number; // 0–1
  color?: string;
}

interface AudienceBandProps {
  uids: number;
  percentMau: number;        // 0–100
  percentSubpop: number;     // 0–100
  subpopLabel?: string;
  breakdown?: {
    lifecycle: BreakdownBar[];
    spendTier: BreakdownBar[];
  };
  style?: React.CSSProperties;
}

const PULSE_STYLE = `
@keyframes audience-pulse {
  0%   { transform: scale(1);    opacity: 1; }
  25%  { transform: scale(1.04); opacity: 0.8; }
  60%  { transform: scale(0.98); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}
`;

function Bar({ label, fraction, color = T.brand }: BreakdownBar) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600, width: 80, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.n100, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(100, fraction * 100).toFixed(1)}%`,
          height: '100%', borderRadius: 3,
          background: color, transition: 'width .3s',
        }} />
      </div>
      <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500, width: 34, textAlign: 'right' }}>
        {(fraction * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export const AudienceBand = React.memo<AudienceBandProps>(({
  uids, percentMau, percentSubpop, subpopLabel = 'active subpop',
  breakdown, style,
}) => {
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  const [pulsing, setPulsing] = React.useState(false);
  const prevUids = React.useRef(uids);

  React.useEffect(() => {
    if (prevUids.current !== uids) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 420);
      prevUids.current = uids;
      return () => clearTimeout(t);
    }
  }, [uids]);

  return (
    <>
      <style>{PULSE_STYLE}</style>
      <div style={{
        background: '#fff', border: `1px solid ${T.n200}`,
        borderRadius: 8, padding: '10px 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        ...style,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* UID count — primary feedback signal */}
          <span style={{
            fontFamily: T.fDisp, fontSize: 28, fontWeight: 400,
            color: T.n950, textTransform: 'uppercase', letterSpacing: '0.02em',
            lineHeight: 1,
            animation: pulsing ? 'audience-pulse 0.42s ease-out' : 'none',
          }}>
            {formatUidCount(uids)}
          </span>

          <span style={{ color: T.n300, fontSize: 14 }}>·</span>

          <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n600 }}>
            ≈{percentMau.toFixed(1)}% of MAU
          </span>

          <span style={{ color: T.n300, fontSize: 14 }}>·</span>

          <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n600 }}>
            ≈{percentSubpop.toFixed(1)}% of {subpopLabel}
          </span>

          {breakdown && (
            <button
              onClick={() => setShowBreakdown(s => !s)}
              style={{
                marginLeft: 'auto', fontFamily: T.fSans, fontSize: 12,
                color: T.n600, background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {showBreakdown ? 'Hide breakdown ▴' : 'Show breakdown ▾'}
            </button>
          )}
        </div>

        {showBreakdown && breakdown && (
          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.n100}`,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px',
          }}>
            <div>
              <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Lifecycle
              </div>
              {breakdown.lifecycle.map(b => <Bar key={b.label} {...b} />)}
            </div>
            <div>
              <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Spend tier
              </div>
              {breakdown.spendTier.map((b, i) => (
                <Bar key={b.label} {...b} color={[T.brand, T.amber500, T.blue500, T.green600, T.purple500][i % 5]} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
});
AudienceBand.displayName = 'AudienceBand';
