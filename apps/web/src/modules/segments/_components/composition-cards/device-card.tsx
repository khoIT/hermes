/**
 * DeviceCard — donut chart with iOS / Android / Web slices via SVG circle
 * stroke-dasharray (avoids brittle arc-path math).
 */
import React from 'react';
import { T } from '../../../../theme';
import { getDeviceBreakdown } from '../../_utils/synth-segment-detail-data';
import { CardShell } from './card-primitives';

const COLORS = {
  ios: '#0a0a0a',
  android: '#3ddc84',
  web: T.n500,
};
const LABELS = { ios: 'iOS', android: 'Android', web: 'Web' };

interface Props { segmentId: string }

export function DeviceCard({ segmentId }: Props) {
  const rows = React.useMemo(() => getDeviceBreakdown(segmentId), [segmentId]);
  const total = rows.reduce((acc, r) => acc + r.count, 0);
  const cx = 60, cy = 60, r = 42;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = rows.map(row => {
    const dash = row.pct * circumference;
    const arc = {
      row,
      stroke: COLORS[row.platform],
      dasharray: `${dash} ${circumference - dash}`,
      offset: -offset * circumference,
    };
    offset += row.pct;
    return arc;
  });

  return (
    <CardShell title="Device platform" demo>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <svg width={120} height={120} viewBox="0 0 120 120">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.n100} strokeWidth={16} />
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {arcs.map(a => (
              <circle key={a.row.platform}
                cx={cx} cy={cy} r={r} fill="none"
                stroke={a.stroke} strokeWidth={16}
                strokeDasharray={a.dasharray}
                strokeDashoffset={a.offset}
              />
            ))}
          </g>
          <text x={cx} y={cy - 2} textAnchor="middle"
            fontFamily={T.fMono} fontSize={10} fill={T.n500}>users</text>
          <text x={cx} y={cy + 12} textAnchor="middle"
            fontFamily={T.fMono} fontSize={13} fontWeight={600} fill={T.n900}>
            {total.toLocaleString()}
          </text>
        </svg>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map(row => (
            <div key={row.platform} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: T.fSans, fontSize: 12,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 9, height: 9, borderRadius: 2,
                  background: COLORS[row.platform],
                }} />
                <span style={{ color: T.n800 }}>{LABELS[row.platform]}</span>
              </span>
              <span style={{ color: T.n600, fontFamily: T.fMono }}>
                {(row.pct * 100).toFixed(1)}% ({row.count.toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}
