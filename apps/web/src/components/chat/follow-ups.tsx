/**
 * FollowUps — list of suggested follow-up sentences below an assistant response.
 * Click → onPick (parent appends a new user message + matches intent).
 */
import React from 'react';
import { CornerDownRight } from 'lucide-react';
import { T, Icon } from '../../theme';

interface FollowUpsProps {
  items: string[];
  onPick: (text: string) => void;
}

export function FollowUps({ items, onPick }: FollowUpsProps) {
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 16, maxWidth: 820 }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
        color: T.n500, textTransform: 'uppercase', letterSpacing: '0.06em',
        marginBottom: 6,
      }}>Suggested follow-ups</div>
      {items.map((t, i) => (
        <button
          key={i}
          onClick={() => onPick(t)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%',
            padding: '10px 8px',
            background: 'transparent', border: 'none',
            borderTop: `1px solid ${T.n200}`,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'background .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.n100; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon icon={CornerDownRight} size={13} color={T.n400} />
          <span style={{
            flex: 1, minWidth: 0,
            fontFamily: T.fSans, fontSize: 13, color: T.n800, lineHeight: 1.45,
          }}>{t}</span>
        </button>
      ))}
    </div>
  );
}
