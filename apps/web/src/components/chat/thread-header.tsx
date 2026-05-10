/**
 * ThreadHeader — H1 question text from first user message in a thread.
 * When threadId matches the demo thread, renders a RestartDemoChip inline.
 */
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { T } from '../../theme';
import { RestartDemoChip } from '../chat-rail/restart-demo-chip';

interface ThreadHeaderProps {
  question: string;
  /** Thread id — used to conditionally render RestartDemoChip. */
  threadId?: string;
}

export function ThreadHeader({ question, threadId }: ThreadHeaderProps) {
  return (
    <div style={{ margin: '32px 0 24px', maxWidth: 820 }}>
      <h1 style={{
        fontFamily: T.fSans, fontSize: 26, fontWeight: 600,
        color: T.n950, lineHeight: 1.3, letterSpacing: '-0.01em',
        margin: 0,
        display: 'flex', alignItems: 'baseline', gap: 0,
      }}>
        <HelpCircle
          size={18}
          style={{ color: T.n500, marginRight: 8, verticalAlign: 'middle', flexShrink: 0 }}
        />
        {question}
      </h1>
      {threadId && (
        <div style={{ marginTop: 8 }}>
          <RestartDemoChip threadId={threadId} />
        </div>
      )}
    </div>
  );
}
