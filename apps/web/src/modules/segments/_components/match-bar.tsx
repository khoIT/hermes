/**
 * MatchBar — per-predicate-row horizontal match count bar.
 * Width uses log10 scale: log10(matchCount) / log10(mauBase) * maxWidth.
 * Orange #f05a22 fill. Number label right of bar.
 *
 * Per reference design-reference/Hermes/src/segments.jsx PredicateRow
 * contribution bar section.
 */
import React from 'react';
import { T } from '../../../theme';

const ACCENT = '#f05a22';
const MAX_WIDTH = 120; // px — the visual max bar width

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

interface Props {
  /** Number of UIDs matching this row alone */
  count: number;
  /** Total MAU base — denominator for log scale */
  mauBase?: number;
  /** Optional: group total for relative comparison */
  groupCount?: number;
  style?: React.CSSProperties;
}

export const MatchBar = React.memo<Props>(({
  count, mauBase = 1_250_000, style,
}) => {
  const logCount = count > 0 ? Math.log10(Math.max(1, count)) : 0;
  const logMax   = Math.log10(Math.max(1, mauBase));
  const fraction = logMax > 0 ? Math.min(1, logCount / logMax) : 0;
  const barPx    = Math.max(3, Math.round(fraction * MAX_WIDTH));

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      width: MAX_WIDTH + 48, // bar + label
      flexShrink: 0,
      ...style,
    }}>
      {/* Track */}
      <div style={{
        flex: 1, height: 6, background: '#eeece6',
        borderRadius: 99, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: barPx,
          background: ACCENT,
          opacity: 0.88,
          borderRadius: 99,
          transition: 'width .35s ease',
        }} />
      </div>
      {/* Label */}
      <span style={{
        fontFamily: T.fMono, fontSize: 10.5, color: T.n500,
        minWidth: 40, textAlign: 'right', whiteSpace: 'nowrap',
      }}>
        {fmtNum(count)}
      </span>
    </div>
  );
});

MatchBar.displayName = 'MatchBar';
