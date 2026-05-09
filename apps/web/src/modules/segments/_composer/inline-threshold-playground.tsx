/**
 * InlineThresholdPlayground — PRD §8.5 demo centerpiece.
 * Mini histogram (~32px) with slider thumb overlaid, numeric input synced,
 * matched-region color sweep on drag (deep red #f05a22 bins ≥ threshold),
 * sensitivity hint generated from threshold grid, Apply / Cancel buttons.
 *
 * Audience preview band updates LIVE on drag via onThresholdChange callback
 * (parent debounces 50ms before dispatching SET_THRESHOLD to reducer).
 */
import React from 'react';
import { T } from '../../../theme';
import { getDistributionBins, getThresholdGrid } from '../_state/audience-lookup';
import { seededRandom } from '../../../utils/predicate-hash';

interface Props {
  featureName: string;
  featureType?: string;
  initialValue: number;
  operator?: string;
  /** Called on every drag move (≥60fps intent; parent debounces 50ms) */
  onThresholdChange: (value: number) => void;
  onApply: (value: number) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Histogram rendering (32px tall, full width)
// ---------------------------------------------------------------------------
const HIST_HEIGHT = 32;
const HIST_BINS   = 24; // downscale bins for compact display

/** Synthesise compact bins from feature name if no crawled data */
function synthBins(featureName: string): number[] {
  return Array.from({ length: HIST_BINS }, (_, i) => {
    const base = seededRandom(featureName, i) * 100;
    const skew = Math.max(0, 1 - i / HIST_BINS) * 60;
    return Math.round(base + skew);
  });
}

/** Downsample arbitrary-length bins to HIST_BINS for compact display */
function downsample(bins: number[], target: number): number[] {
  if (bins.length <= target) return bins;
  const result: number[] = [];
  const step = bins.length / target;
  for (let i = 0; i < target; i++) {
    const lo = Math.floor(i * step);
    const hi = Math.ceil((i + 1) * step);
    result.push(bins.slice(lo, hi).reduce((s, v) => s + v, 0));
  }
  return result;
}

/** Build sensitivity hint from threshold grid */
function buildSensitivityHint(
  grid: Array<{ threshold: number; count: number }>,
  currentValue: number,
): string {
  if (grid.length < 2) return '';
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `${(n / 1_000).toFixed(0)}k`
    : String(n);

  const samples = grid
    .filter(g => Math.abs(g.threshold - currentValue) <= 4 || grid.indexOf(g) < 4)
    .slice(0, 4);

  const parts = samples.map(g => `At ≥${g.threshold}: ${fmt(g.count)}`);

  // Find steepest drop
  let steepFrom = 0, steepTo = 0, maxDrop = 0;
  for (let i = 0; i < grid.length - 1; i++) {
    const curr = grid[i];
    const next = grid[i + 1];
    if (!curr || !next) continue;
    const drop = curr.count - next.count;
    if (drop > maxDrop) { maxDrop = drop; steepFrom = curr.threshold; steepTo = next.threshold; }
  }

  const hint = steepFrom
    ? ` Steep drop between ${steepFrom} and ${steepTo} — choose carefully.`
    : '';

  return parts.join('. ') + '.' + hint;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const InlineThresholdPlayground = React.memo<Props>(({
  featureName, featureType = 'int', initialValue,
  operator = '>=', onThresholdChange, onApply, onCancel,
}) => {
  const [value, setValue] = React.useState<number>(initialValue);
  const [committed, setCommitted] = React.useState<number>(initialValue);
  const rafRef = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Resolve bins once on mount
  const rawBins = React.useMemo(() => {
    const crawled = getDistributionBins(featureName);
    return crawled ? downsample(crawled, HIST_BINS) : synthBins(featureName);
  }, [featureName]);

  const maxBin = Math.max(...rawBins, 1);

  // Threshold grid for sensitivity hint
  const threshGrid = React.useMemo(
    () => getThresholdGrid(featureName),
    [featureName],
  );

  // Map value → bin index for matched-region highlight
  const minVal = 0;
  const maxVal = HIST_BINS - 1;

  const clamp = (v: number) => Math.max(minVal, Math.min(maxVal, v));

  // Bin index at or above current value (for >= / > operators)
  const matchFromBin = React.useMemo(() => {
    const ratio = (value - minVal) / Math.max(maxVal - minVal, 1);
    return Math.max(0, Math.floor(ratio * HIST_BINS));
  }, [value, maxVal]);

  // rAF-throttled live update on slider drag
  const handleSliderChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setValue(v);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      onThresholdChange(v);
      rafRef.current = null;
    });
  }, [onThresholdChange]);

  const handleNumericChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!Number.isNaN(v)) {
      setValue(v);
      onThresholdChange(v);
    }
  }, [onThresholdChange]);

  React.useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  const sensitivityHint = React.useMemo(
    () => buildSensitivityHint(threshGrid, value),
    [threshGrid, value],
  );

  const svgWidth = 360; // will be overridden by CSS width:100%

  return (
    <div
      ref={containerRef}
      style={{
        background: T.n50, border: `1px solid ${T.n200}`,
        borderRadius: 8, padding: '10px 12px',
        marginTop: 6,
      }}
    >
      {/* Histogram + slider overlay */}
      <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
        {/* SVG histogram */}
        <svg
          viewBox={`0 0 ${svgWidth} ${HIST_HEIGHT}`}
          style={{ width: '100%', height: HIST_HEIGHT, display: 'block' }}
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* Matched-region background sweep */}
          {operator === '>=' || operator === '>' ? (
            <rect
              x={(matchFromBin / HIST_BINS) * svgWidth}
              y={0}
              width={((HIST_BINS - matchFromBin) / HIST_BINS) * svgWidth}
              height={HIST_HEIGHT}
              fill={T.brand}
              opacity={0.10}
            />
          ) : null}

          {/* Bars */}
          {rawBins.map((v, i) => {
            const barH = Math.max(2, (v / maxBin) * HIST_HEIGHT);
            const isMatched = (operator === '>=' || operator === '>') && i >= matchFromBin;
            const x = (i / HIST_BINS) * svgWidth;
            const bw = svgWidth / HIST_BINS;
            return (
              <rect
                key={i}
                x={x + 0.5}
                y={HIST_HEIGHT - barH}
                width={Math.max(1, bw - 1)}
                height={barH}
                fill={isMatched ? T.brand : T.n300}
                opacity={isMatched ? 0.85 : 0.55}
                rx={1}
              />
            );
          })}
        </svg>

        {/* Range slider overlaid on histogram */}
        <input
          type="range"
          min={minVal}
          max={maxVal}
          step={1}
          value={value}
          onChange={handleSliderChange}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: HIST_HEIGHT,
            margin: 0,
            opacity: 0.001, // transparent — visual handled by SVG; still captures pointer
            cursor: 'ew-resize',
            WebkitAppearance: 'none',
          }}
          aria-label={`Threshold for ${featureName}`}
        />

        {/* Visible thumb indicator line */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: `calc(${((value - minVal) / (maxVal - minVal)) * 100}% - 1px)`,
            width: 2,
            height: HIST_HEIGHT,
            background: T.brand,
            borderRadius: 1,
            pointerEvents: 'none',
            transition: 'left 0ms', // intentionally no transition for 60fps feel
          }}
        />
      </div>

      {/* Operator + numeric input row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span style={{
          fontFamily: T.fMono, fontSize: 11, color: T.n600,
          background: T.n200, borderRadius: 4, padding: '2px 6px',
        }}>
          {operator}
        </span>
        <input
          type="number"
          value={value}
          onChange={handleNumericChange}
          style={{
            fontFamily: T.fMono, fontSize: 13, color: T.n900,
            border: `1px solid ${T.n300}`, borderRadius: 5,
            padding: '3px 8px', width: 72, background: '#fff',
            outline: 'none',
          }}
        />
        <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>
          {featureType === 'int' ? 'integer' : featureType}
        </span>
      </div>

      {/* Sensitivity hint */}
      {sensitivityHint ? (
        <p style={{
          fontFamily: T.fSans, fontSize: 11, color: T.n500,
          margin: '6px 0 8px', lineHeight: 1.5,
        }}>
          {sensitivityHint}
        </p>
      ) : null}

      {/* Apply / Cancel */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button
          onClick={() => { setCommitted(value); onApply(value); }}
          style={{
            fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
            color: '#fff', background: T.brand,
            border: 'none', borderRadius: 6,
            padding: '4px 14px', cursor: 'pointer',
          }}
        >
          Apply
        </button>
        <button
          onClick={() => { setValue(committed); onThresholdChange(committed); onCancel(); }}
          style={{
            fontFamily: T.fSans, fontSize: 12,
            color: T.n600, background: 'none',
            border: `1px solid ${T.n200}`, borderRadius: 6,
            padding: '4px 12px', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
});
InlineThresholdPlayground.displayName = 'InlineThresholdPlayground';
