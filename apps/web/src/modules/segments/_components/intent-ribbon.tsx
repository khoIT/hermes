/**
 * IntentRibbon — collapsible top region of the canvas.
 * Hidden by default when predicate is non-empty.
 * Serif italic "what is the intent of this segment?" note.
 * Per PRD §8.3 Region 1.
 */
import React from 'react';
import { T } from '../../../theme';

interface Props {
  intent: string;
  collapsed: boolean;
  onToggle: () => void;
  onIntentChange: (v: string) => void;
}

export const IntentRibbon = React.memo<Props>(({ intent, collapsed, onToggle, onIntentChange }) => {
  if (collapsed) {
    return (
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={onToggle}
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.n400,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <span style={{ fontSize: 9 }}>▸</span> Show intent note
          {intent && (
            <span style={{
              fontFamily: T.fSans, fontSize: 11,
              fontStyle: 'italic', color: T.n500,
              marginLeft: 6,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 240,
            }}>
              "{intent}"
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: T.brandSoft,
      border: `1px solid ${T.brandBorder}`,
      borderRadius: 8, padding: '12px 16px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
          color: T.brand, textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 6,
        }}>
          Segment intent
        </div>
        <button
          onClick={onToggle}
          style={{
            fontFamily: T.fSans, fontSize: 10, color: T.n400,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          ▾ Collapse
        </button>
      </div>
      <textarea
        value={intent}
        onChange={e => onIntentChange(e.target.value)}
        placeholder="e.g. Players at risk of churning after a loss streak — surface an MMR protection offer at the right moment."
        rows={2}
        style={{
          width: '100%', boxSizing: 'border-box',
          fontFamily: T.fSans, fontSize: 13, color: T.n800,
          fontStyle: intent ? 'normal' : 'italic',
          background: 'transparent', border: 'none',
          outline: 'none', resize: 'none',
          lineHeight: 1.5,
        }}
      />
    </div>
  );
});
IntentRibbon.displayName = 'IntentRibbon';
