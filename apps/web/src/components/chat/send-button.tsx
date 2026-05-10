/**
 * SendButton — circular dark button with white arrow. Disabled when input empty.
 */
import React from 'react';
import { ArrowUp } from 'lucide-react';
import { T, Icon } from '../../theme';

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
  size?: number;
}

export function SendButton({ onClick, disabled, size = 32 }: SendButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Send message"
      style={{
        width: size, height: size, borderRadius: 9999,
        background: disabled ? T.n300 : T.n900,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'background .12s, opacity .12s',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = T.n800; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = T.n900; }}
    >
      <Icon icon={ArrowUp} size={size > 30 ? 16 : 14} color="#fff" strokeWidth={2.25} />
    </button>
  );
}
