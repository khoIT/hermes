/**
 * CountryCard — top-10 countries with horizontal bar viz.
 */
import React from 'react';
import { T } from '../../../../theme';
import { getCountryBreakdown } from '../../_utils/synth-segment-detail-data';
import { CardShell } from './card-primitives';

interface Props { segmentId: string }

export function CountryCard({ segmentId }: Props) {
  const rows = React.useMemo(() => getCountryBreakdown(segmentId), [segmentId]);
  const top = rows[0]?.pct ?? 1;
  return (
    <CardShell title="Top countries" demo>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {rows.map(r => (
          <div key={r.code} style={{
            display: 'grid', gridTemplateColumns: '32px 1fr 60px 60px',
            alignItems: 'center', columnGap: 8,
          }}>
            <span style={{
              fontFamily: T.fMono, fontSize: 11, color: T.n500,
              fontWeight: 600,
            }}>{r.code}</span>
            <span style={{
              fontFamily: T.fSans, fontSize: 12, color: T.n800,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{r.name}</span>
            <span style={{
              fontFamily: T.fMono, fontSize: 11, color: T.n600,
              textAlign: 'right',
            }}>{r.count.toLocaleString()}</span>
            <div style={{
              height: 8, background: T.n100, borderRadius: 4, overflow: 'hidden',
            }}>
              <div style={{
                width: `${(r.pct / top) * 100}%`, height: '100%',
                background: T.brand, opacity: 0.85,
              }} />
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
