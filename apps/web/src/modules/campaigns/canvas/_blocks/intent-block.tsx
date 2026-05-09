/**
 * IntentBlock — serif italic intent statement editor for campaign canvas.
 * Matches segment canvas intent ribbon style per PRD §9.
 */
import React from 'react';
import { T } from '../../../../theme';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export const IntentBlock = React.memo<Props>(({
  value, onChange,
  placeholder = 'Describe the intent of this campaign in one sentence…',
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={{
      borderLeft: `3px solid ${T.brand}`,
      paddingLeft: 14,
      marginBottom: 4,
    }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
      }}>
        Intent
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        rows={2}
        style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: 16,
          color: value ? T.n800 : T.n400,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          width: '100%',
          lineHeight: 1.5,
          padding: 0,
          caretColor: T.brand,
          boxShadow: focused ? `0 1px 0 ${T.brand}` : 'none',
          transition: 'box-shadow .12s',
        }}
      />
    </div>
  );
});
IntentBlock.displayName = 'IntentBlock';
