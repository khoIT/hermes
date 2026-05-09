/**
 * Sample profiles — 3 anonymised user-card snippets from the playbook.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { CampaignTemplate } from '../_state/compose-types';

interface Props {
  samples: CampaignTemplate['sampleProfiles'];
}

export const SampleProfilesRow: React.FC<Props> = ({ samples }) => (
  <div>
    <div style={{
      fontFamily: T.fMono, fontSize: 10, color: T.n500,
      letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8,
    }}>
      Sample profiles · who would receive this
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {samples.slice(0, 3).map((s) => (
        <div
          key={s.uid}
          style={{
            padding: 12, borderRadius: 10,
            background: '#fff', border: `1px solid ${T.n200}`,
          }}
        >
          <div style={{
            fontFamily: T.fMono, fontSize: 10, color: T.brand,
            letterSpacing: '0.04em', marginBottom: 6,
          }}>
            user · {s.uid}
          </div>
          <div style={{ fontFamily: '"Spectral", Georgia, serif', fontSize: 13, color: T.n800, lineHeight: 1.4 }}>
            {s.oneLiner}
          </div>
        </div>
      ))}
    </div>
  </div>
);
