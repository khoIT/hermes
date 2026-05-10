/**
 * SegmentOverlapTable — top-5 sibling segments by deterministic
 * shared-user count + overlap bar viz. Click sibling name to jump.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../../theme';
import { getSegmentOverlap } from '../_utils/synth-segment-detail-data';
import { CardHeader, Td, Th } from './vs-all-users-table';

interface Props { segmentId: string }

export function SegmentOverlapTable({ segmentId }: Props) {
  const rows = React.useMemo(() => getSegmentOverlap(segmentId), [segmentId]);
  const navigate = useNavigate();
  if (rows.length === 0) return null;
  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
      padding: '12px 14px',
    }}>
      <CardHeader title="Segment Overlap" />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.n50 }}>
            <Th>Segment</Th>
            <Th align="right">Shared Users</Th>
            <Th align="right">% of This Segment</Th>
            <Th>Overlap</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.segmentId}
              onClick={() => navigate(`/segments/${r.segmentId}`)}
              style={{
                borderTop: `1px solid ${T.n100}`, cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.n50; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <Td>
                <span style={{ color: T.brand }}>{r.name}</span>
              </Td>
              <Td align="right" mono>{r.sharedUsers.toLocaleString()}</Td>
              <Td align="right" mono color={T.n600}>{(r.pct * 100).toFixed(1)}%</Td>
              <td style={{ padding: '8px', width: 220 }}>
                <div style={{
                  height: 6, background: T.n100, borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${r.pct * 100}%`, height: '100%',
                    background: T.brand,
                  }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
