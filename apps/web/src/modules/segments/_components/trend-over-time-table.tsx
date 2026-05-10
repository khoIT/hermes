/**
 * TrendOverTimeTable — segment metrics decay across now/30d/60d/90d.
 */
import React from 'react';
import { T } from '../../../theme';
import { getTrendOverTime } from '../_utils/synth-segment-detail-data';
import { CardHeader, Td, Th } from './vs-all-users-table';

interface Props { segmentId: string }

export function TrendOverTimeTable({ segmentId }: Props) {
  const rows = React.useMemo(() => getTrendOverTime(segmentId), [segmentId]);
  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
      padding: '12px 14px',
    }}>
      <CardHeader title="Trend Over Time" />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.n50 }}>
            <Th>Metric</Th>
            <Th align="right">Now</Th>
            <Th align="right">30d</Th>
            <Th align="right">60d</Th>
            <Th align="right">90d</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.metric} style={{
              borderTop: i === 0 ? `1px solid ${T.n100}` : `1px solid ${T.n100}`,
            }}>
              <Td>{r.metric}</Td>
              <Td align="right" mono>{r.now}</Td>
              <Td align="right" mono color={T.n600}>{r.d30}</Td>
              <Td align="right" mono color={T.n600}>{r.d60}</Td>
              <Td align="right" mono color={T.n600}>{r.d90}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
