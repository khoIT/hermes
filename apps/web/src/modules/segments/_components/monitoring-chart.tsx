/**
 * MonitoringChart — audience size over time with rebuild markers,
 * campaign fire windows, and expected envelope band.
 * Per PRD §8.8 (segment monitoring tab).
 */
import React from 'react';
import { T, CHART } from '../../../theme';

interface RebuildMarker { date: string; label?: string }
interface CampaignWindow  { startDate: string; endDate: string; label: string }

interface Props {
  /** ISO date strings + audience counts, chronological */
  data: Array<{ date: string; count: number }>;
  rebuildMarkers?: RebuildMarker[];
  campaignWindows?: CampaignWindow[];
  /** Upper/lower envelope (model-predicted range) */
  envelope?: Array<{ date: string; lo: number; hi: number }>;
  height?: number;
  style?: React.CSSProperties;
}

const W = 520;
const PAD = { t: 12, r: 16, b: 28, l: 48 };

function fmtCount(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(0)}k`
    : String(n);
}

export const MonitoringChart = React.memo<Props>(({
  data, rebuildMarkers = [], campaignWindows = [], envelope,
  height = 160, style,
}) => {
  if (!data.length) return null;

  const innerW = W - PAD.l - PAD.r;
  const innerH = height - PAD.t - PAD.b;

  const counts = data.map(d => d.count);
  const minC = 0;
  const maxC = Math.max(...counts, ...(envelope?.flatMap(e => [e.lo, e.hi]) ?? []), 1) * 1.1;

  const xOf = (i: number) => PAD.l + (i / Math.max(data.length - 1, 1)) * innerW;
  const yOf = (v: number) => PAD.t + innerH - ((v - minC) / (maxC - minC)) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d.count).toFixed(1)}`).join(' ');
  const areaPath = linePath + ` L${xOf(data.length - 1).toFixed(1)},${(PAD.t + innerH).toFixed(1)} L${PAD.l},${(PAD.t + innerH).toFixed(1)} Z`;

  // Envelope band
  const envPath = envelope?.length
    ? [
        ...envelope.map((e, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(e.hi).toFixed(1)}`),
        ...[...envelope].reverse().map((e, i) => `L${xOf(envelope.length - 1 - i).toFixed(1)},${yOf(e.lo).toFixed(1)}`),
        'Z',
      ].join(' ')
    : null;

  // Y-axis tick values
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => minC + f * (maxC - minC));

  return (
    <div style={style}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        style={{ width: '100%', height, display: 'block' }}
        aria-label="Audience size over time"
      >
        {/* Y-axis grid + labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.l} y1={yOf(v)} x2={PAD.l + innerW} y2={yOf(v)}
              stroke={T.n100} strokeWidth={1}
            />
            <text
              x={PAD.l - 6} y={yOf(v) + 4}
              fontFamily={T.fMono} fontSize={9} fill={T.n400}
              textAnchor="end"
            >
              {fmtCount(Math.round(v))}
            </text>
          </g>
        ))}

        {/* Campaign windows */}
        {campaignWindows.map((w, i) => {
          const x0 = xOf(data.findIndex(d => d.date >= w.startDate));
          const x1 = xOf(data.findIndex(d => d.date >= w.endDate));
          if (x0 < 0 || x1 < 0) return null;
          return (
            <rect key={i}
              x={x0} y={PAD.t} width={Math.max(2, x1 - x0)} height={innerH}
              fill={T.amber500} opacity={0.08}
            />
          );
        })}

        {/* Envelope band */}
        {envPath && (
          <path d={envPath} fill={CHART[0]} opacity={0.08} />
        )}

        {/* Area fill */}
        <path d={areaPath} fill={CHART[0]} opacity={0.10} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={CHART[0]} strokeWidth={1.75}
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Rebuild markers */}
        {rebuildMarkers.map((m, i) => {
          const idx = data.findIndex(d => d.date >= m.date);
          if (idx < 0) return null;
          const x = xOf(idx);
          return (
            <g key={i}>
              <line x1={x} y1={PAD.t} x2={x} y2={PAD.t + innerH}
                stroke={T.green600} strokeWidth={1} strokeDasharray="3,2" />
              <text x={x + 2} y={PAD.t + 9}
                fontFamily={T.fMono} fontSize={8} fill={T.green600}>
                {m.label ?? 'rebuild'}
              </text>
            </g>
          );
        })}

        {/* X-axis date labels (first, mid, last) */}
        {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
          data[i] ? (
            <text key={i}
              x={xOf(i)} y={PAD.t + innerH + 16}
              fontFamily={T.fMono} fontSize={9} fill={T.n400}
              textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
            >
              {data[i].date.slice(5)} {/* MM-DD */}
            </text>
          ) : null
        ))}
      </svg>
    </div>
  );
});
MonitoringChart.displayName = 'MonitoringChart';
