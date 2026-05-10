/**
 * thread-title-lookup — synchronous helpers to resolve a chat thread id to its
 * human-readable title from the in-memory (localStorage) chat-store index.
 *
 * No API call — reads the same index that the sidebar "All Chats" list uses.
 * Returns null when the thread is not found (orphan-safe: UI callers should
 * hide or show a fallback "chat thread" label in that case).
 */
import React from 'react';
import { listThreads } from './chat-store';

/**
 * Resolve a thread id to its title.
 * Returns null when the id is not in the in-memory index (e.g. orphaned ref).
 */
export function getThreadTitle(threadId: string): string | null {
  const entry = listThreads().find(t => t.id === threadId);
  return entry?.title ?? null;
}

/**
 * React hook variant — re-evaluates on every render (the index is tiny and
 * reads from localStorage synchronously so this is cheap).
 */
export function useThreadTitle(threadId: string | null | undefined): string | null {
  return React.useMemo(
    () => (threadId ? getThreadTitle(threadId) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threadId],
  );
}
