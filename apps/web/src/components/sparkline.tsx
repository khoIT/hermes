/**
 * Sparkline — re-export from theme primitive + an extended chart variant
 * with configurable color, fill, and an optional annotation dot at end.
 * Per PRD §6.2 — 7-day distribution sparkline on feature rows.
 */
import React from 'react';
import { T, Sparkline as SparklinePrimitive } from '../theme';
import { seededRandom } from '../utils/predicate-hash';

// Re-export the base primitive so callers can import from one place
export { SparklinePrimitive };

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  /** Show a dot at the last data point */
  endDot?: boolean;
  style?: React.CSSProperties;
}

/** Extended sparkline with optional end-dot annotation */
export const SparklineChart = React.memo<SparklineChartProps>(({
  data,
  width = 80,
  height = 24,
  color = T.brand,
  fill = true,
  endDot = false,
  style,
}) => {
  if (!data?.length) return null;
  const mn = Math.min(...data), mx = Math.max(...data);
  const rng = mx - mn || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - mn) / rng) * (height - 4) - 2,
  ] as [number, number]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${width} ${height} L0 ${height} Z`;
  const last = pts[pts.length - 1] as [number, number] | undefined;

  return (
    <svg width={width} height={height} style={{ display: 'block', ...style }}>
      {fill && <path d={area} fill={color} opacity={0.12} />}
      <path d={path} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round" />
      {endDot && last && (
        <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />
      )}
    </svg>
  );
});
SparklineChart.displayName = 'SparklineChart';

/** Generate deterministic synth sparkline data from a feature name seed */
export function synthSparkline(featureName: string, points = 7): number[] {
  return Array.from({ length: points }, (_, i) => {
    const base = seededRandom(featureName, i) * 80 + 10;
    return Math.round(base);
  });
}
