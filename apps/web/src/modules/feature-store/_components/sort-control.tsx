/**
 * SortControl — minimal dropdown for the 4 sort strategies.
 */
import React from 'react';
import { T } from '../../../theme';
import { SORT_LABEL, type SortStrategy } from '../_logic/sort';

interface SortControlProps {
  value: SortStrategy;
  onChange: (next: SortStrategy) => void;
}

const STRATEGIES: SortStrategy[] = ['default', 'most-used', 'most-drifted', 'recently-added'];

export const SortControl: React.FC<SortControlProps> = ({ value, onChange }) => (
  <label
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: T.fSans,
      fontSize: 11,
      color: T.n500,
    }}
  >
    Sort
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortStrategy)}
      style={{
        fontFamily: T.fSans,
        fontSize: 12,
        padding: '4px 8px',
        borderRadius: 6,
        border: `1px solid ${T.n200}`,
        background: '#fff',
        color: T.n800,
        outline: 'none',
      }}
    >
      {STRATEGIES.map((s) => (
        <option key={s} value={s}>
          {SORT_LABEL[s]}
        </option>
      ))}
    </select>
  </label>
);
