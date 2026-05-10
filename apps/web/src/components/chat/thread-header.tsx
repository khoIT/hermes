/**
 * ThreadHeader — H1 question text from first user message in a thread.
 */
import React from 'react';
import { T } from '../../theme';

interface ThreadHeaderProps {
  question: string;
}

export function ThreadHeader({ question }: ThreadHeaderProps) {
  return (
    <h1 style={{
      fontFamily: T.fSans, fontSize: 26, fontWeight: 600,
      color: T.n950, lineHeight: 1.3, letterSpacing: '-0.01em',
      margin: '32px 0 24px', maxWidth: 820,
    }}>
      {question}
    </h1>
  );
}
