/**
 * SegmentSizeChart — full-width audience-over-time card with 3 toolbar
 * controls: date-range chip dropdown · chart-type segmented control ·
 * Data dropdown (Users / DAU / WAU). Defaults to 30-day Area / Users.
 */
import React from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import type { HermesSegment } from '@hermes/contracts';
import { T, CHART } from '../../../theme';
import { getSizeTimeSeries, type DataKey } from '../_utils/synth-segment-detail-data';

interface Props { segment: HermesSegment }

type RangeKey = '7' | '30' | '90' | 'custom';
type ChartType = 'line' | 'bar' | 'area';

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: '7',  label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
  { key: 'custom', label: 'Custom' },
];

const DATA_OPTIONS: Array<{ key: DataKey; label: string }> = [
  { key: 'users', label: 'Users' },
  { key: 'dau',   label: 'Daily Active' },
  { key: 'wau',   label: 'Weekly Active' },
];

const CHART_OPTIONS: Array<{ key: ChartType; label: string }> = [
  { key: 'line', label: 'Line' },
  { key: 'bar',  label: 'Bar' },
  { key: 'area', label: 'Area' },
];

export function SegmentSizeChart({ segment }: Props) {
  const [range, setRange] = React.useState<RangeKey>('30');
  const [chart, setChart] = React.useState<ChartType>('area');
  const [data, setData] = React.useState<DataKey>('users');

  const days = range === '7' ? 7 : range === '90' ? 90 : 30;
  const series = React.useMemo(
    () => getSizeTimeSeries(segment.id, days, data),
    [segment.id, days, data],
  );

  // Track inner width so the SVG viewBox stretches to the actual rendered
  // width — without this the default xMidYMid-meet aspect-ratio leaves
  // matching gutters on both sides of the chart on wide screens.
  const canvasWrapRef = React.useRef<HTMLDivElement>(null);
  const [innerWidth, setInnerWidth] = React.useState(760);
  React.useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = Math.round(e.contentRect.width);
        if (w > 0) setInnerWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
      padding: '14px 18px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', marginBottom: 12,
      }}>
        <div style={{
          fontFamily: T.fSans, fontSize: 12.5, fontWeight: 600, color: T.n800,
          letterSpacing: '0.01em',
        }}>
          Segment Size Over Time
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DropdownChip
            label={RANGE_OPTIONS.find(r => r.key === range)?.label ?? 'Range'}
            options={RANGE_OPTIONS}
            value={range}
            onChange={k => setRange(k as RangeKey)}
          />
          <SegmentedControl options={CHART_OPTIONS} value={chart} onChange={k => setChart(k as ChartType)} />
          <DropdownChip
            label={DATA_OPTIONS.find(d => d.key === data)?.label ?? 'Data'}
            options={DATA_OPTIONS}
            value={data}
            onChange={k => setData(k as DataKey)}
          />
        </div>
      </div>

      <div ref={canvasWrapRef} style={{ width: '100%' }}>
        <ChartCanvas data={series} type={chart} height={280} width={innerWidth} />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'flex-end', marginTop: 8,
      }}>
        <button
          style={{
            fontFamily: T.fSans, fontSize: 12, color: T.brand,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: 4,
          }}
          onClick={() => { /* stub navigation */ }}
        >
          Explore Events <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG canvas — line / bar / area
// ---------------------------------------------------------------------------
interface CanvasProps {
  data: Array<{ date: string; count: number }>;
  type: ChartType;
  height: number;
  width: number;
}

const PAD = { t: 12, r: 16, b: 26, l: 50 };

function fmtTick(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function ChartCanvas({ data, type, height, width }: CanvasProps) {
  if (!data.length) return null;
  const W = Math.max(width, PAD.l + PAD.r + 20);
  const innerW = W - PAD.l - PAD.r;
  const innerH = height - PAD.t - PAD.b;
  const counts = data.map(d => d.count);
  const minC = 0;
  const maxC = Math.max(...counts, 1) * 1.15;
  const xOf = (i: number) => PAD.l + (i / Math.max(data.length - 1, 1)) * innerW;
  const yOf = (v: number) => PAD.t + innerH - ((v - minC) / (maxC - minC)) * innerH;

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d.count).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${xOf(data.length - 1).toFixed(1)},${(PAD.t + innerH).toFixed(1)} L${PAD.l},${(PAD.t + innerH).toFixed(1)} Z`;
  const barW = innerW / data.length * 0.7;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => minC + f * (maxC - minC));

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      width={W}
      height={height}
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block' }}
      aria-label="Segment size over time"
    >
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={yOf(v)} x2={PAD.l + innerW} y2={yOf(v)}
            stroke={T.n100} strokeWidth={1} />
          <text x={PAD.l - 6} y={yOf(v) + 4}
            fontFamily={T.fMono} fontSize={9} fill={T.n400} textAnchor="end">
            {fmtTick(Math.round(v))}
          </text>
        </g>
      ))}

      {type === 'area' && (
        <>
          <path d={areaPath} fill={CHART[0]} opacity={0.16} />
          <path d={linePath} fill="none" stroke={CHART[0]} strokeWidth={1.75}
            strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
      {type === 'line' && (
        <path d={linePath} fill="none" stroke={CHART[0]} strokeWidth={2}
          strokeLinejoin="round" strokeLinecap="round" />
      )}
      {type === 'bar' && data.map((d, i) => (
        <rect key={i}
          x={xOf(i) - barW / 2}
          y={yOf(d.count)}
          width={barW}
          height={Math.max(1, (PAD.t + innerH) - yOf(d.count))}
          fill={CHART[0]} opacity={0.7} rx={2} ry={2}
        />
      ))}

      {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
        data[i] ? (
          <text key={i}
            x={xOf(i)} y={PAD.t + innerH + 16}
            fontFamily={T.fMono} fontSize={9} fill={T.n400}
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          >
            {data[i].date.slice(5)}
          </text>
        ) : null
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Compact dropdown / segmented controls
// ---------------------------------------------------------------------------
interface DropdownChipProps {
  label: string;
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (k: string) => void;
}

function DropdownChip({ label, options, value, onChange }: DropdownChipProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily: T.fSans, fontSize: 12, color: T.n700,
          background: '#fff', border: `1px solid ${T.n200}`,
          borderRadius: 7, padding: '6px 10px',
          display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
        }}
      >
        {label} <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          zIndex: 30, minWidth: 140, padding: 4, background: '#fff',
          border: `1px solid ${T.n200}`, borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}>
          {options.map(o => {
            const active = o.key === value;
            return (
              <div
                key={o.key}
                onClick={() => { onChange(o.key); setOpen(false); }}
                style={{
                  fontFamily: T.fSans, fontSize: 12,
                  color: active ? T.brand : T.n700,
                  background: active ? T.brandSoft : 'transparent',
                  padding: '6px 10px', cursor: 'pointer', borderRadius: 5,
                }}
              >
                {o.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SegmentedControlProps {
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (k: string) => void;
}

function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div style={{
      display: 'inline-flex', background: T.n100, borderRadius: 7,
      padding: 2, gap: 2,
    }}>
      {options.map(o => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            style={{
              fontFamily: T.fSans, fontSize: 12, fontWeight: active ? 600 : 500,
              color: active ? T.n900 : T.n600,
              background: active ? '#fff' : 'transparent',
              border: 'none', borderRadius: 5, padding: '4px 10px',
              cursor: 'pointer',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
