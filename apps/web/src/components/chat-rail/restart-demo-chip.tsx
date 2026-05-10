/**
 * RestartDemoChip — small recovery chip rendered in the demo thread header
 * when threadId === 'thread-demo-livops-2026'. Resets the thread to its
 * canonical fixture state without relying on bootstrap (bootstrapped flag
 * stays true across remounts so re-bootstrap never fires).
 *
 * Implementation: delete thread from localStorage, re-seed via putThread
 * from the fixture, then navigate to a fresh thread view.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import { deleteThread, putThread } from '../../utils/chat-store';
import { threadDemoLivops2026 } from '../../data/chat/threads/thread-demo-livops-2026';

const DEMO_THREAD_ID = 'thread-demo-livops-2026';

interface RestartDemoChipProps {
  /** Only renders when the active thread is the demo thread. */
  threadId: string;
}

export const RestartDemoChip = React.memo<RestartDemoChipProps>(
  function RestartDemoChip({ threadId }) {
    const navigate = useNavigate();

    if (threadId !== DEMO_THREAD_ID) return null;

    const handleRestart = () => {
      // Delete accumulated state, re-seed from fixture directly (no bootstrap
      // dependency — bootstrapped flag persists across remounts and prevents
      // re-bootstrap from running, causing "Thread not found" otherwise).
      deleteThread(DEMO_THREAD_ID);
      putThread(threadDemoLivops2026);
      navigate(`/chat/${DEMO_THREAD_ID}`);
    };

    return (
      <button
        onClick={handleRestart}
        style={chipStyle}
        title="Reset this demo to the beginning"
        aria-label="Restart demo thread"
        onMouseEnter={e => { e.currentTarget.style.background = T.n100; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
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
  background: '#fff',
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
