/**
 * TriggerTypeControl — segmented control for One-time / Scheduled / Real-time.
 * Sits at the top of the campaign canvas.
 */
import React from 'react';
import { T } from '../../../../theme';

export type TriggerType = 'one-time' | 'scheduled' | 'real-time';

interface Props {
  value: TriggerType;
  onChange: (v: TriggerType) => void;
}

const OPTIONS: Array<{ value: TriggerType; label: string }> = [
  { value: 'one-time',   label: 'One-time' },
  { value: 'scheduled',  label: 'Scheduled' },
  { value: 'real-time',  label: 'Real-time' },
];

export const TriggerTypeControl = React.memo<Props>(({ value, onChange }) => (
  <div style={{
    display: 'inline-flex', background: T.n100, borderRadius: 9,
    padding: 3, gap: 2,
  }}>
    {OPTIONS.map(o => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        style={{
          fontFamily: T.fSans, fontWeight: 500, fontSize: 12,
          padding: '5px 14px', borderRadius: 7, border: 'none',
          cursor: 'pointer', transition: 'background .12s, color .12s, box-shadow .12s',
          background: value === o.value ? '#fff' : 'transparent',
          color: value === o.value ? T.n900 : T.n500,
          boxShadow: value === o.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
));
TriggerTypeControl.displayName = 'TriggerTypeControl';
