/**
 * Alignment card — 4R tag, score, and one-line rationale.
 */
import React from 'react';
import { T } from '../../../../theme';
import { FourRTagChip } from './four-r-tag';
import type { CampaignTemplate } from '../_state/compose-types';

interface Props {
  alignment: CampaignTemplate['alignment'];
}

export const AlignmentCard: React.FC<Props> = ({ alignment }) => (
  <div style={{
    padding: 16, borderRadius: 12, background: '#fff',
    border: `1px solid ${T.n200}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <FourRTagChip fourR={{ tag: alignment.tag, alignment: alignment.score }} />
      <span style={{
        fontFamily: T.fMono, fontSize: 11, color: T.n500,
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        Goal alignment
      </span>
    </div>
    <div style={{
      fontFamily: '"Spectral", Georgia, serif', fontSize: 14, color: T.n800, lineHeight: 1.5,
    }}>
      {alignment.rationale}
    </div>
  </div>
);
