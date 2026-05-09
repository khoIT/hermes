/**
 * Threshold slider — bound to the headline numeric feature in the predicate.
 * Debounced 300ms; calls onChange(value) on idle. Shows pulsing "..." while
 * waiting for the audience-count refetch.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { ApprovedFeatureRow } from '../_state/compose-types';

interface Props {
  row: ApprovedFeatureRow;
  min?: number;
  max?: number;
  step?: number;
  pending: boolean;
  onChange: (value: number) => void;
}

const DEFAULT_RANGE: Record<string, { min: number; max: number; step: number }> = {
  consecutive_ranked_losses_streak: { min: 1, max: 20, step: 1 },
  tenure_days: { min: 0, max: 90, step: 1 },
  last_login_days_ago: { min: 0, max: 60, step: 1 },
  session_count_7d: { min: 0, max: 30, step: 1 },
  account_age_hours: { min: 0, max: 168, step: 1 },
  account_age_days: { min: 1, max: 365, step: 1 },
  lifetime_revenue_local: { min: 0, max: 5_000_000, step: 50_000 },
};

export const ThresholdSlider: React.FC<Props> = ({ row, min, max, step, pending, onChange }) => {
  const range = DEFAULT_RANGE[row.featureId] ?? { min: 0, max: 100, step: 1 };
  const lo = min ?? range.min, hi = max ?? range.max, stp = step ?? range.step;
  const initial = typeof row.threshold.value === 'number' ? row.threshold.value : lo;
  const [val, setVal] = React.useState(initial);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (typeof row.threshold.value === 'number') setVal(row.threshold.value);
  }, [row.threshold.value]);

  const onSlide = (next: number) => {
    setVal(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(next), 300);
  };

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      background: '#fff', border: `1px solid ${T.n200}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{
          fontFamily: T.fMono, fontSize: 11, color: T.n600, fontWeight: 600,
        }}>
          {row.featureId}
        </span>
        <span style={{
          fontFamily: '"Spectral", Georgia, serif', fontSize: 24, color: T.brand, lineHeight: 1,
        }}>
          {row.threshold.op} {val.toLocaleString()}
          {pending && <span style={{ marginLeft: 6, fontSize: 12, color: T.n400 }}>…</span>}
        </span>
      </div>
      <input
        type="range"
        min={lo}
        max={hi}
        step={stp}
        value={val}
        onChange={(e) => onSlide(Number(e.target.value))}
        style={{ width: '100%', accentColor: T.brand }}
      />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: T.fMono, fontSize: 10, color: T.n400, marginTop: 4,
      }}>
        <span>{lo.toLocaleString()}</span>
        <span>{hi.toLocaleString()}</span>
      </div>
    </div>
  );
};
