/**
 * Rationale chip — small pill labeling WHY a feature is in the cohort.
 * 4 variants: core signal · filter bots · avoid spam · cohort filter.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { ProposedFeatureRow } from '../_state/compose-types';

interface Props {
  rationale: ProposedFeatureRow['rationale'];
}

const STYLE: Record<ProposedFeatureRow['rationale'], { bg: string; fg: string; bd: string }> = {
  'core signal':   { bg: '#fff7ed', fg: '#9a3412', bd: '#fed7aa' },
  'filter bots':   { bg: '#f5f5f5', fg: T.n700,    bd: T.n200 },
  'avoid spam':    { bg: '#eff6ff', fg: '#1e3a8a', bd: '#bfdbfe' },
  'cohort filter': { bg: '#faf5ff', fg: '#6b21a8', bd: '#e9d5ff' },
};

export const RationaleChip: React.FC<Props> = ({ rationale }) => {
  const s = STYLE[rationale];
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 9999,
      fontFamily: T.fMono, fontSize: 10, fontWeight: 600,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      background: s.bg, color: s.fg, border: `1px solid ${s.bd}`,
      display: 'inline-flex', alignItems: 'center',
    }}>
      {rationale}
    </span>
  );
};
