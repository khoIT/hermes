/**
 * SoftHint — muted inline message used when free-text mid-flow doesn't match
 * any registered scripted follow-up. Encourages the user to use the suggested
 * chips while still allowing the legacy intent matcher to respond below it.
 */
import React from 'react';
import { Info } from 'lucide-react';
import { T, Icon } from '../../../theme';

interface SoftHintProps {
  text: string;
}

export function SoftHint({ text }: SoftHintProps) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 10px',
      background: T.n100, color: T.n500,
      borderRadius: 6, margin: '4px 0 8px',
      fontFamily: T.fSans, fontSize: 12, lineHeight: 1.4,
    }}>
      <Icon icon={Info} size={12} color={T.n500} />
      <span>{text}</span>
    </div>
  );
}
