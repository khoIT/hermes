/**
 * SampleFiresTable — live sample fires for monitoring screen (16).
 * Shows player, event, predicate match detail, variant assigned, outcome.
 */
import React from 'react';
import { T } from '../../../theme';

interface SampleFire {
  playerId: string;
  firedAt: string;
  event: string;
  streak: number;
  passOwner: boolean;
  cooldownSkip: boolean;
  variant: string;
  outcome: string;
}

const SAMPLE_DATA: SampleFire[] = [
  { playerId: 'uid-8a3f', firedAt: '09:42:11', event: 'event_match_end', streak: 4, passOwner: true,  cooldownSkip: false, variant: 'A',       outcome: 'IAM shown · clicked' },
  { playerId: 'uid-2c91', firedAt: '09:44:03', event: 'event_match_end', streak: 5, passOwner: true,  cooldownSkip: false, variant: 'B',       outcome: 'IAM shown · dismissed' },
  { playerId: 'uid-f04d', firedAt: '09:45:59', event: 'event_match_end', streak: 3, passOwner: true,  cooldownSkip: false, variant: 'holdout', outcome: 'No action · measured' },
  { playerId: 'uid-7b22', firedAt: '09:47:21', event: 'event_match_end', streak: 4, passOwner: false, cooldownSkip: false, variant: '—',       outcome: 'Skip: predicate miss' },
  { playerId: 'uid-a1e5', firedAt: '09:49:08', event: 'event_match_end', streak: 6, passOwner: true,  cooldownSkip: true,  variant: '—',       outcome: 'Skip: 24h cooldown' },
  { playerId: 'uid-b3d9', firedAt: '09:51:44', event: 'event_match_end', streak: 4, passOwner: true,  cooldownSkip: false, variant: 'A',       outcome: 'IAM shown · no click' },
  { playerId: 'uid-c0f2', firedAt: '09:53:02', event: 'event_match_end', streak: 3, passOwner: true,  cooldownSkip: false, variant: 'B',       outcome: 'IAM shown · clicked' },
];

interface Props {
  maxRows?: number;
}

export function SampleFiresTable({ maxRows = 7 }: Props) {
  const rows = SAMPLE_DATA.slice(0, maxRows);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fSans }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${T.n200}` }}>
            {['Time', 'Player', 'Streak', 'Pass', 'Variant', 'Outcome'].map(h => (
              <th key={h} style={{
                padding: '6px 10px', textAlign: 'left',
                fontFamily: T.fSans, fontWeight: 700, fontSize: 10,
                color: T.n500, textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isSkip = row.variant === '—';
            return (
              <tr key={i} style={{
                borderBottom: `1px solid ${T.n100}`,
                background: i % 2 === 0 ? '#fff' : T.n50,
                opacity: isSkip ? 0.6 : 1,
              }}>
                <td style={{ padding: '7px 10px', fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>
                  {row.firedAt}
                </td>
                <td style={{ padding: '7px 10px', fontFamily: T.fMono, fontSize: 11, color: T.n700 }}>
                  {row.playerId}
                </td>
                <td style={{ padding: '7px 10px', fontSize: 12, color: T.n800, textAlign: 'center' }}>
                  {row.streak}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                  <span style={{ color: row.passOwner ? T.green600 : T.n400, fontSize: 12 }}>
                    {row.passOwner ? '✓' : '✗'}
                  </span>
                </td>
                <td style={{ padding: '7px 10px' }}>
                  {isSkip ? (
                    <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400 }}>—</span>
                  ) : (
                    <span style={{
                      fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
                      padding: '2px 7px', borderRadius: 4,
                      background: row.variant === 'holdout' ? T.n100 : T.brandSoft,
                      color:      row.variant === 'holdout' ? T.n600  : T.brand,
                    }}>
                      {row.variant}
                    </span>
                  )}
                </td>
                <td style={{ padding: '7px 10px', fontSize: 12, color: isSkip ? T.n400 : T.n800 }}>
                  {row.outcome}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
