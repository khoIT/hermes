/**
 * Four-R tag — header chip showing the auto-tagged 4R goal + alignment %.
 * Empty (dotted) until intent submitted; animates in once populated.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { FourRTag } from '../_state/compose-types';

interface Props {
  fourR: { tag: FourRTag; alignment: number } | null;
}

const LABEL: Record<FourRTag, string> = {
  '4r-retain': 'Retain',
  '4r-revenue': 'Revenue',
  '4r-reactivate': 'Reactivate',
  '4r-recruit': 'Recruit',
};

const COLOR: Record<FourRTag, { bg: string; fg: string; bd: string }> = {
  '4r-retain': { bg: '#fff7ed', fg: '#9a3412', bd: '#fed7aa' },
  '4r-revenue': { bg: '#ecfdf5', fg: '#065f46', bd: '#a7f3d0' },
  '4r-reactivate': { bg: '#eff6ff', fg: '#1e3a8a', bd: '#bfdbfe' },
  '4r-recruit': { bg: '#faf5ff', fg: '#6b21a8', bd: '#e9d5ff' },
};

export const FourRTagChip: React.FC<Props> = ({ fourR }) => {
  if (!fourR) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 9999,
        fontFamily: T.fMono, fontSize: 11, color: T.n400,
        border: `1px dashed ${T.n300}`, background: '#fff',
      }}>
        4R · awaiting intent…
      </span>
    );
  }
  const c = COLOR[fourR.tag];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 9999,
      fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
      background: c.bg, color: c.fg, border: `1px solid ${c.bd}`,
      animation: 'fourR-fade-in 220ms ease-out',
    }}>
      <span style={{ fontFamily: T.fMono, fontSize: 10, opacity: 0.7 }}>4R ·</span>
      {LABEL[fourR.tag]}
      <span style={{ fontFamily: T.fMono, fontSize: 11, opacity: 0.85 }}>
        · {Math.round(fourR.alignment * 100)}%
      </span>
      <style>{`@keyframes fourR-fade-in { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: none; } }`}</style>
    </span>
  );
};
