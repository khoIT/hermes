/**
 * GroupByControl — segmented control for Feature Store library grouping (Phase 5 v2).
 * Options: Domain (default) · Game · Tier · Status · Platform · Used-in-prod · None
 * Owner option removed (replaced by Game attribution).
 */
import React from 'react';
import { T } from '../../../theme';
import type { GroupByStrategy } from '../_logic/group';

interface GroupByControlProps {
  value: GroupByStrategy;
  onChange: (strategy: GroupByStrategy) => void;
  style?: React.CSSProperties;
}

const OPTIONS: { value: GroupByStrategy; label: string }[] = [
  { value: 'domain', label: 'Domain' },
  { value: 'game', label: 'Game' },
  { value: 'tier', label: 'Tier' },
  { value: 'status', label: 'Status' },
  { value: 'platform', label: 'Platform' },
  { value: 'usedInProd', label: 'In prod' },
  { value: 'none', label: 'None' },
];

export const GroupByControl: React.FC<GroupByControlProps> = ({ value, onChange, style }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 6, ...style,
  }}>
    <span style={{
      fontFamily: T.fSans, fontSize: 11, color: T.n500, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4,
    }}>
      Group by
    </span>
    <div style={{
      display: 'inline-flex', background: 'rgba(10,10,10,0.05)',
      borderRadius: 8, padding: 3, gap: 2,
    }}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              fontFamily: T.fSans, fontWeight: 500, fontSize: 12,
              color: active ? T.n950 : T.n500,
              padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
              background: active ? '#fff' : 'transparent',
              border: 'none',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'all .1s',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);
