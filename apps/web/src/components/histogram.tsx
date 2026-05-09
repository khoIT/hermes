/**
 * Histogram — 28-bin SVG distribution chart with optional p50/p90/p99 markers
 * and an optional matched-region overlay (used by threshold playground).
 * Per PRD §6.3 and §8.5.
 *
 * Data source: crawled/distributions.json if present, else synth via seededRandom.
 */
import React from 'react';
import { T, CHART } from '../theme';
import { seededRandom } from '../utils/predicate-hash';

export interface HistogramData {
  /** 28 bin counts — raw values, normalised internally */
  bins: number[];
  /** Bin edges (length = bins.length + 1). If omitted, uses 0..N labels. */
  edges?: number[];
  p50?: number;
  p90?: number;
  p99?: number;
}

interface HistogramProps {
  data?: HistogramData;
  /** Feature name + type used to synthesise data if data is omitted */
  featureName?: string;
  featureType?: string;
  /** If set, bins with edge >= matchFrom are highlighted as matched-region */
  matchFrom?: number;
  width?: number;
  height?: number;
  color?: string;
  style?: React.CSSProperties;
}

/** Generate deterministic 28-bin synth data from a seed string */
function synthData(seed: string): HistogramData {
  const BINS = 28;
  const bins: number[] = [];
  // Generate a plausible right-skewed distribution
  for (let i = 0; i < BINS; i++) {
    const base = seededRandom(seed, i) * 100;
    // Apply soft right-skew: earlier bins tend higher
    const skew = Math.max(0, 1 - i / BINS) * 60;
    bins.push(Math.round(base + skew));
  }
  // Derive rough p-values from cumulative distribution
  const total = bins.reduce((s, v) => s + v, 0);
  let cum = 0;
  let p50 = 0, p90 = 0, p99 = 0;
  for (let i = 0; i < BINS; i++) {
    cum += bins[i] ?? 0;
    const pct = cum / total;
    if (pct >= 0.5 && !p50) p50 = i;
    if (pct >= 0.9 && !p90) p90 = i;
    if (pct >= 0.99 && !p99) p99 = i;
  }
  return { bins, p50, p90, p99 };
}

export const Histogram = React.memo<HistogramProps>(({
  data: dataProp,
  featureName = 'feature',
  featureType = 'int',
  matchFrom,
  width = 400,
  height = 80,
  color = CHART[0],
  style,
}) => {
  const data = dataProp ?? synthData(`${featureName}-${featureType}`);
  const { bins, p50, p90, p99 } = data;

  if (!bins?.length) return null;

  const BINS = bins.length;
  const PAD_L = 4;
  const PAD_R = 4;
  const PAD_T = 4;
  const PAD_B = 16; // room for axis labels if needed
  const chartW = width - PAD_L - PAD_R;
  const chartH = height - PAD_T - PAD_B;
  const binW = chartW / BINS;
  const maxVal = Math.max(...bins.map(b => b ?? 0), 1);

  const BAR_GAP = 1;

  // Convert bin index (0..BINS-1) to x coordinate
  const binX = (i: number) => PAD_L + i * binW;
  // Convert bin index to x center
  const markerX = (i: number) => PAD_L + (i + 0.5) * binW;

  // Matched-region overlay: bins where index >= matchFrom
  const matchStartIdx = matchFrom != null
    ? Math.max(0, Math.round((matchFrom / BINS) * BINS))
    : null;

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block', ...style }}
      aria-label={`Distribution histogram for ${featureName}`}
    >
      {/* Matched-region overlay — behind bars */}
      {matchStartIdx != null && (
        <rect
          x={binX(matchStartIdx)}
          y={PAD_T}
          width={chartW - matchStartIdx * binW}
          height={chartH}
          fill={color}
          opacity={0.08}
        />
      )}

      {/* Bars */}
      {bins.map((v, i) => {
        const barH = Math.max(2, (v / maxVal) * chartH);
        const isMatched = matchStartIdx != null && i >= matchStartIdx;
        return (
          <rect
            key={i}
            x={binX(i) + BAR_GAP / 2}
            y={PAD_T + chartH - barH}
            width={Math.max(1, binW - BAR_GAP)}
            height={barH}
            fill={isMatched ? color : T.n300}
            opacity={isMatched ? 0.85 : 0.7}
            rx={1}
          />
        );
      })}

      {/* p50 marker */}
      {p50 != null && (
        <g>
          <line
            x1={markerX(p50)} y1={PAD_T}
            x2={markerX(p50)} y2={PAD_T + chartH}
            stroke={T.green600} strokeWidth={1} strokeDasharray="3,2"
          />
          <text
            x={markerX(p50) + 2} y={PAD_T + 9}
            fontFamily={T.fMono} fontSize={8} fill={T.green600}
          >p50</text>
        </g>
      )}

      {/* p90 marker */}
      {p90 != null && (
        <g>
          <line
            x1={markerX(p90)} y1={PAD_T}
            x2={markerX(p90)} y2={PAD_T + chartH}
            stroke={T.amber500} strokeWidth={1} strokeDasharray="3,2"
          />
          <text
            x={markerX(p90) + 2} y={PAD_T + 9}
            fontFamily={T.fMono} fontSize={8} fill={T.amber500}
          >p90</text>
        </g>
      )}

      {/* p99 marker */}
      {p99 != null && (
        <g>
          <line
            x1={markerX(p99)} y1={PAD_T}
            x2={markerX(p99)} y2={PAD_T + chartH}
            stroke={T.red500} strokeWidth={1} strokeDasharray="3,2"
          />
          <text
            x={markerX(p99) + 2} y={PAD_T + 9}
            fontFamily={T.fMono} fontSize={8} fill={T.red500}
          >p99</text>
        </g>
      )}
    </svg>
  );
});
Histogram.displayName = 'Histogram';
