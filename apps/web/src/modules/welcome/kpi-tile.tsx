/**
 * KPI tile — eyebrow / big number / caption. Sans-serif throughout
 * (theme's `Kpi` uses Spectral display; reference matches a tabular look).
 */
import React from 'react';
import { T } from '../../theme';

interface KpiTileProps {
  eyebrow: string;
  value: string;
  caption: string;
  /** First tile uses brand color for the eyebrow as a visual anchor. */
  emphasizeEyebrow?: boolean;
  onClick?: () => void;
}

export const KpiTile = React.memo<KpiTileProps>(({
  eyebrow, value, caption, emphasizeEyebrow, onClick,
}) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hover && onClick ? T.brand : T.n200}`,
        borderRadius: 10,
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .12s, box-shadow .12s',
        boxShadow: hover && onClick ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
        minWidth: 0,
      }}
    >
      <div style={{
        fontFamily: T.fSans,
        fontSize: 11,
        fontWeight: 600,
        color: emphasizeEyebrow ? T.brand : T.n500,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 12,
      }}>
        {eyebrow}
      </div>
      <div style={{
        fontFamily: T.fSans,
        fontSize: 36,
        fontWeight: 600,
        color: T.n950,
        lineHeight: 1,
        marginBottom: 12,
        letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: T.fSans,
        fontSize: 12,
        color: T.n500,
        lineHeight: 1.45,
      }}>
        {caption}
      </div>
    </div>
  );
});
KpiTile.displayName = 'KpiTile';
