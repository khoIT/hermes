/**
 * Bar sparkline — small vertical-bar viz for campaign rows. Distinct from
 * theme.tsx Sparkline (line-style). 8 bars, varying heights, colored
 * brand-orange when active or T.n300 when "measuring".
 */
import React from 'react';
import { T } from '../../theme';

interface BarSparklineProps {
  /** Normalized 0..1 values. */
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  /** When true, render bars in muted gray (no signal yet). */
  muted?: boolean;
}

export const BarSparkline = React.memo<BarSparklineProps>(({
  data, width = 60, height = 22, color = T.brand, muted = false,
}) => {
  if (!data?.length) return null;
  const barW = width / data.length;
  const gap = 1.2;
  const fill = muted ? T.n300 : color;
  return (
    <svg width={width} height={height} aria-hidden style={{ display: 'block' }}>
      {data.map((v, i) => {
        const h = Math.max(2, v * height);
        return (
          <rect
            key={i}
            x={i * barW + gap / 2}
            y={height - h}
            width={Math.max(1, barW - gap)}
            height={h}
            fill={fill}
            rx={0.5}
          />
        );
      })}
    </svg>
  );
});
BarSparkline.displayName = 'BarSparkline';
