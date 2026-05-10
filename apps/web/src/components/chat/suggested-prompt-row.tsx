/**
 * SuggestedPromptRow — single row with curved arrow icon + prompt text.
 * Full-width clickable row used in landing-page suggested list.
 */
import React from 'react';
import { CornerDownRight } from 'lucide-react';
import { T, Icon } from '../../theme';

interface SuggestedPromptRowProps {
  text: string;
  onClick: () => void;
}

export function SuggestedPromptRow({ text, onClick }: SuggestedPromptRowProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%',
        padding: '14px 8px',
        background: 'transparent', border: 'none',
        borderTop: `1px solid ${T.n200}`,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background .12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = T.n100; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon icon={CornerDownRight} size={14} color={T.n400} />
      <span style={{
        flex: 1, minWidth: 0,
        fontFamily: T.fSans, fontSize: 14, color: T.n800, lineHeight: 1.45,
      }}>{text}</span>
    </button>
  );
}
