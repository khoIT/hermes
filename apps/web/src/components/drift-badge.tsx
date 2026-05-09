/**
 * DriftBadge — small amber chip rendered when a feature's drift score
 * crosses 0.4. Phase 6 v2: warns Studio PMs that they're picking a feature
 * the analytics tab has flagged.
 */
import React from 'react';
import { T } from '../theme';

interface DriftBadgeProps {
  score: number;
}

export const DriftBadge: React.FC<DriftBadgeProps> = ({ score }) => {
  if (score < 0.4) return null;
  return (
    <span
      title={`Drift score ${score.toFixed(2)}`}
      style={{
        fontFamily: T.fMono,
        fontSize: 9,
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: 4,
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      ! drift
    </span>
  );
};
