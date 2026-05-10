/**
 * active-thread-context — provides the currently-viewed chat thread id to any
 * descendant component. Used by action cards to stamp sourceThreadId on the
 * artifacts they create, so detail pages can navigate back to the originating
 * thread.
 *
 * Usage:
 *   // Provider (in thread-page.tsx):
 *   <ActiveThreadProvider threadId={id}>...</ActiveThreadProvider>
 *
 *   // Consumer (in any action card):
 *   const threadId = useActiveThreadId();  // string | null
 */
import React from 'react';

const ActiveThreadContext = React.createContext<string | null>(null);

interface Props {
  threadId: string;
  children: React.ReactNode;
}

export function ActiveThreadProvider({ threadId, children }: Props) {
  return (
    <ActiveThreadContext.Provider value={threadId}>
      {children}
    </ActiveThreadContext.Provider>
  );
}

/** Returns the active thread id, or null when rendered outside a thread page. */
export function useActiveThreadId(): string | null {
  return React.useContext(ActiveThreadContext);
}
