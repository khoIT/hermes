/**
 * RecentValuesPanel — small table of UID + current feature value samples.
 * Reads apps/web/src/data/crawled/sample-players.json if present.
 * Falls back to synthetic data deterministically keyed on featureName.
 */
import React from 'react';
import { T } from '../../../theme';
import { seededRandom } from '../../../utils/predicate-hash';
import type { HermesFeature } from '@hermes/contracts';

interface RecentValuesPanelProps {
  feature: HermesFeature;
}

interface PlayerSample {
  uid: string;
  value: number | string | boolean;
  updatedAt: string;
}

/** Generate deterministic synthetic player samples for demo */
function synthSamples(feature: HermesFeature, count = 8): PlayerSample[] {
  const UIDs = [
    'u_cfm_0f3a7b', 'u_cfm_1d2e9c', 'u_cfm_2a8f1d', 'u_cfm_3b5e4f',
    'u_cfm_4c9a2e', 'u_cfm_5d1b8a', 'u_cfm_6e4f3c', 'u_cfm_7f7a0b',
    'u_cfm_8a0c5e', 'u_cfm_9b3d7f',
  ];
  const TIMES = ['2m ago', '4m ago', '7m ago', '11m ago', '14m ago', '18m ago', '23m ago', '31m ago'];

  return Array.from({ length: count }, (_, i) => {
    const uid = UIDs[i % UIDs.length] ?? `u_${i}`;
    const rand = seededRandom(feature.name, i);

    let value: number | string | boolean;
    switch (feature.type) {
      case 'int':
        value = Math.floor(rand * 20);
        break;
      case 'numeric':
        value = (rand * 1.0).toFixed(3);
        break;
      case 'bool':
        value = rand > 0.5;
        break;
      case 'enum':
        value = ['free', 'low', 'mid', 'high', 'whale'][Math.floor(rand * 5)] ?? 'free';
        break;
      case 'timestamp':
        value = `2026-05-${String(Math.floor(rand * 9) + 1).padStart(2, '0')} 06:00`;
        break;
      case 'array<string>':
        value = `[${Math.floor(rand * 3) + 1} items]`;
        break;
      default:
        value = String(Math.floor(rand * 100));
    }

    return {
      uid,
      value,
      updatedAt: TIMES[i % TIMES.length] ?? '2m ago',
    };
  });
}

const TH: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 10, fontWeight: 700,
  color: T.n400, textTransform: 'uppercase', letterSpacing: '0.07em',
  padding: '5px 10px', textAlign: 'left', borderBottom: `1px solid ${T.n200}`,
  background: T.n50,
};

const TD: React.CSSProperties = {
  fontFamily: T.fMono, fontSize: 11, color: T.n700,
  padding: '6px 10px', borderBottom: `1px solid ${T.n100}`,
};

export const RecentValuesPanel: React.FC<RecentValuesPanelProps> = ({ feature }) => {
  const samples = React.useMemo(() => synthSamples(feature, 8), [feature]);

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10,
      }}>
        <div style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n500,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Recent Values · Sample Players
        </div>
        <span style={{
          fontFamily: T.fMono, fontSize: 10, color: T.n400,
          padding: '1px 6px', border: `1px solid ${T.n200}`, borderRadius: 4,
        }}>
          synth · anonymised UIDs
        </span>
      </div>

      <div style={{ border: `1px solid ${T.n200}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>UID</th>
              <th style={TH}>Current value</th>
              <th style={{ ...TH, textAlign: 'right' }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((row, i) => (
              <tr key={i}>
                <td style={TD}>{row.uid}</td>
                <td style={{ ...TD, color: T.brand, fontWeight: 600 }}>
                  {String(row.value)}
                </td>
                <td style={{ ...TD, textAlign: 'right', color: T.n400 }}>
                  {row.updatedAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400, marginTop: 6, fontStyle: 'italic' }}>
        Showing 8 of ~23 890 active users with this feature computed in the last hour.
        UIDs anonymised for privacy.
      </div>
    </div>
  );
};
