/**
 * RestartDemoChip — small recovery chip rendered in the demo thread header
 * when threadId is one of the canonical demo threads. Resets the thread to
 * its canonical fixture state without relying on bootstrap (bootstrapped flag
 * stays true across remounts so re-bootstrap never fires).
 *
 * Implementation: delete thread from localStorage, re-seed via putThread
 * from the fixture, then navigate to a fresh thread view.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import { deleteThread, putThread, type Conversation } from '../../utils/chat-store';
import { threadDemoLivops2026 } from '../../data/chat/threads/thread-demo-livops-2026';
import { threadDemoAgentLivops2026 } from '../../data/chat/threads/thread-demo-agent-livops-2026';

const DEMO_FIXTURES: Record<string, Conversation> = {
  'thread-demo-livops-2026':       threadDemoLivops2026,
  'thread-demo-agent-livops-2026': threadDemoAgentLivops2026,
};

interface RestartDemoChipProps {
  /** Only renders when the active thread is one of the canonical demo threads. */
  threadId: string;
}

export const RestartDemoChip = React.memo<RestartDemoChipProps>(
  function RestartDemoChip({ threadId }) {
    const navigate = useNavigate();

    const fixture = DEMO_FIXTURES[threadId];
    if (!fixture) return null;

    const handleRestart = () => {
      // Delete accumulated state, re-seed from fixture directly (no bootstrap
      // dependency — bootstrapped flag persists across remounts and prevents
      // re-bootstrap from running, causing "Thread not found" otherwise).
      deleteThread(threadId);
      putThread(fixture);
      navigate(`/chat/${threadId}`);
    };

    return (
      <button
        onClick={handleRestart}
        style={chipStyle}
        title="Reset this demo to the beginning"
        aria-label="Restart demo thread"
        onMouseEnter={e => { e.currentTarget.style.background = T.n100; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.surface; }}
      >
        ↻ Restart demo
      </button>
    );
  },
);

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: T.surface,
  border: `1px solid ${T.n200}`,
  color: T.n600,
  fontFamily: T.fSans,
  fontSize: 11,
  fontWeight: 500,
  padding: '3px 10px',
  borderRadius: 20,
  cursor: 'pointer',
  transition: 'background .12s',
  whiteSpace: 'nowrap',
};
