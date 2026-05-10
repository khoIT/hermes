/**
 * UsersTable — paginated 50-row sample with 6 columns + relative-time UID.
 */
import React from 'react';
import { Smartphone, Globe } from 'lucide-react';
import { T } from '../../../theme';
import type { UserSampleRow } from '../_utils/synth-segment-detail-data';

interface Props { rows: UserSampleRow[] }

const PAGE_SIZE = 25;

const LIFECYCLE_COLORS: Record<UserSampleRow['lifecycle'], string> = {
  new: '#3f8dff',
  active: '#10b981',
  'at-risk': '#f59e0b',
  churned: '#ef4444',
};
const SPEND_COLORS: Record<UserSampleRow['spendTier'], string> = {
  whale: '#7c3aed',
  dolphin: '#3f8dff',
  minnow: '#10b981',
  f2p: T.n400,
};

function relativeTime(iso: string): string {
  const d = new Date(iso).getTime();
  const now = Date.parse('2026-05-09T12:00:00Z');
  const diffM = Math.max(1, Math.round((now - d) / 60000));
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.round(diffM / 60);
  if (diffH < 48) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}

export function UsersTable({ rows }: Props) {
  const [page, setPage] = React.useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const slice = rows.slice(start, start + PAGE_SIZE);
  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.n50 }}>
            {['UID', 'Last seen', 'Lifecycle', 'Spend tier', 'Country', 'Device'].map(h => (
              <th key={h} style={{
                fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '10px 12px', textAlign: 'left',
                borderBottom: `1px solid ${T.n100}`,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slice.map((r, i) => (
            <tr key={r.uid} style={{
              background: i % 2 === 0 ? '#fff' : 'rgba(0,0,0,0.015)',
            }}>
              <td style={{
                fontFamily: T.fMono, fontSize: 11, color: T.n900,
                padding: '8px 12px',
              }}>{r.uid}</td>
              <td style={{
                fontFamily: T.fSans, fontSize: 12, color: T.n600,
                padding: '8px 12px',
              }} title={new Date(r.lastSeenISO).toISOString()}>
                {relativeTime(r.lastSeenISO)}
              </td>
              <td style={{ padding: '8px 12px' }}>
                <Pill color={LIFECYCLE_COLORS[r.lifecycle]} text={r.lifecycle} />
              </td>
              <td style={{ padding: '8px 12px' }}>
                <Pill color={SPEND_COLORS[r.spendTier]} text={r.spendTier} />
              </td>
              <td style={{
                fontFamily: T.fMono, fontSize: 11.5, color: T.n700,
                padding: '8px 12px',
              }}>{r.country}</td>
              <td style={{
                fontFamily: T.fSans, fontSize: 12, color: T.n700,
                padding: '8px 12px',
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {r.device === 'web' ? <Globe size={12} /> : <Smartphone size={12} />}
                  {r.device}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 8, padding: '10px 14px', borderTop: `1px solid ${T.n100}`,
        fontFamily: T.fSans, fontSize: 12, color: T.n600,
      }}>
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          style={{
            fontFamily: T.fSans, fontSize: 12, color: page === 0 ? T.n300 : T.n700,
            background: '#fff', border: `1px solid ${T.n200}`,
            borderRadius: 6, padding: '4px 10px',
            cursor: page === 0 ? 'not-allowed' : 'pointer',
          }}
        >Prev</button>
        <span style={{ fontFamily: T.fMono }}>
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          style={{
            fontFamily: T.fSans, fontSize: 12,
            color: page >= totalPages - 1 ? T.n300 : T.n700,
            background: '#fff', border: `1px solid ${T.n200}`,
            borderRadius: 6, padding: '4px 10px',
            cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
          }}
        >Next</button>
      </div>
    </div>
  );
}

function Pill({ color, text }: { color: string; text: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n800,
      background: '#fff', border: `1px solid ${T.n200}`,
      borderRadius: 999, padding: '2px 8px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
      {text}
    </span>
  );
}
