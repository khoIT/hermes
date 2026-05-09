/**
 * BrandMark — VNGGames mark + Hermes wordmark in League Gothic (T.fDisp).
 * Used in the top-left corner of the Nav shell.
 */
import React from 'react';
import { T } from '../theme';

interface BrandMarkProps {
  style?: React.CSSProperties;
}

export const BrandMark = React.memo<BrandMarkProps>(({ style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...style }}>
    {/* VNGGames mark — compact badge */}
    <div style={{
      width: 28, height: 28, borderRadius: 6,
      background: T.brand, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{
        fontFamily: T.fDisp, fontSize: 13, fontWeight: 400,
        color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em',
        lineHeight: 1,
      }}>VG</span>
    </div>

    {/* Hermes wordmark */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <span style={{
        fontFamily: T.fDisp, fontSize: 20, fontWeight: 400,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: T.n950, lineHeight: 1,
      }}>HERMES</span>
      <span style={{
        fontFamily: T.fSans, fontSize: 9, fontWeight: 600,
        color: T.brand, textTransform: 'uppercase', letterSpacing: '0.1em',
        lineHeight: 1.2,
      }}>LiveOps Platform</span>
    </div>
  </div>
));
BrandMark.displayName = 'BrandMark';
