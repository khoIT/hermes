/**
 * VsAllUsersTable — segment-vs-base comparison strip on Overview.
 * 4 columns × 3 rows. Synth values get a "Demo data" pill so they're
 * not mistaken for real telemetry next to the segment's actual count.
 */
import React from 'react';
import type { HermesSegment } from '@hermes/contracts';
import { T } from '../../../theme';
import { getVsAllStats } from '../_utils/synth-segment-detail-data';

interface Props { segmentId: string; segment: HermesSegment }

export function VsAllUsersTable({ segmentId }: Props) {
  const rows = React.useMemo(() => getVsAllStats(segmentId), [segmentId]);
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.n200}`, borderRadius: 10,
      padding: '12px 14px',
    }}>
      <CardHeader title="vs. All Users" />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.n50 }}>
            <Th>Metric</Th>
            <Th align="right">Segment</Th>
            <Th align="right">All</Th>
            <Th align="right">Diff</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.metric} style={{
              borderTop: i === 0 ? `1px solid ${T.n100}` : `1px solid ${T.n100}`,
            }}>
              <Td>{r.metric}</Td>
              <Td align="right" mono>{r.segment}</Td>
              <Td align="right" mono>{r.all}</Td>
              <Td align="right" mono color={
                r.diffDir === 'up' ? T.green600 :
                r.diffDir === 'down' ? T.red600 : T.n500
              }>{r.diff}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardHeader({ title }: { title: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 10,
    }}>
      <span style={{
        fontFamily: T.fSans, fontSize: 12.5, fontWeight: 600, color: T.n800,
      }}>{title}</span>
      <span style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500,
        background: T.n100, padding: '2px 8px', borderRadius: 999,
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        Demo data
      </span>
    </div>
  );
}

export function Th({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th style={{
      fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '6px 8px', textAlign: align ?? 'left',
    }}>{children}</th>
  );
}

interface TdProps {
  children: React.ReactNode;
  align?: 'left' | 'right';
  mono?: boolean;
  color?: string;
}

export function Td({ children, align, mono, color }: TdProps) {
  return (
    <td style={{
      fontFamily: mono ? T.fMono : T.fSans,
      fontSize: 12.5, color: color ?? T.n900,
      padding: '8px', textAlign: align ?? 'left',
    }}>{children}</td>
  );
}
