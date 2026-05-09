/**
 * Goal4R — Retain · Revenue · Reactivate · Recruit chip selector.
 * Single-select. Active chip uses brand color.
 */
import React from 'react';
import { T } from '../../../../theme';

export type Goal4R = 'retain' | 'revenue' | 'reactivate' | 'recruit';

interface Props {
  value: Goal4R;
  onChange: (v: Goal4R) => void;
}

const GOALS: Array<{ value: Goal4R; label: string; color: string; bg: string }> = [
  { value: 'retain',     label: 'Retain',     color: T.brand,    bg: T.brandSoft },
  { value: 'revenue',    label: 'Revenue',    color: T.green600, bg: T.greenSoft },
  { value: 'reactivate', label: 'Reactivate', color: T.blue600,  bg: T.blueSoft  },
  { value: 'recruit',    label: 'Recruit',    color: T.purple500,bg: T.purpleSoft},
];

export const Goal4R = React.memo<Props>(({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 6 }}>
    {GOALS.map(g => {
      const active = value === g.value;
      return (
        <button
          key={g.value}
          onClick={() => onChange(g.value)}
          style={{
            fontFamily: T.fSans, fontWeight: 600, fontSize: 11,
            padding: '4px 12px', borderRadius: 9999, cursor: 'pointer',
            border: `1px solid ${active ? g.color : T.n200}`,
            background: active ? g.bg : '#fff',
            color: active ? g.color : T.n500,
            transition: 'all .12s',
          }}
        >
          {g.label}
        </button>
      );
    })}
  </div>
));
Goal4R.displayName = 'Goal4R';

/** Read-only badge variant (used in library rows) */
export function Goal4RBadge({ value }: { value: Goal4R }) {
  const g = GOALS.find(x => x.value === value);
  if (!g) return null;
  return (
    <span style={{
      fontFamily: T.fSans, fontWeight: 600, fontSize: 11,
      padding: '2px 8px', borderRadius: 9999,
      border: `1px solid ${g.color}`,
      background: g.bg, color: g.color,
      display: 'inline-block',
    }}>
      {g.label}
    </span>
  );
}
