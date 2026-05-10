/**
 * UserMessage — sub-heading style for user follow-up turns within a thread.
 * The first user message is rendered as the H1 ThreadHeader instead.
 */
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { T } from '../../theme';

interface UserMessageProps {
  text: string;
}

export function UserMessage({ text }: UserMessageProps) {
  return (
    <h2 style={{
      fontFamily: T.fSans, fontSize: 19, fontWeight: 600,
      color: T.n950, lineHeight: 1.4, letterSpacing: '-0.005em',
      margin: '40px 0 16px', maxWidth: 820,
      display: 'flex', alignItems: 'baseline', gap: 0,
    }}>
      <HelpCircle
        size={14}
        style={{ color: T.n500, marginRight: 6, verticalAlign: 'middle', flexShrink: 0 }}
      />
      {text}
    </h2>
  );
}
