/**
 * Ask Hermes panel store — open state + active thread id + page context.
 * No external deps (no zustand). Persists open + threadId to localStorage so
 * cross-page navigations keep the panel hot.
 */
import React from 'react';

const KEY_OPEN = 'hermes.chat.panel.open';
const KEY_THREAD = 'hermes.chat.panel.threadId';

export interface PageContext {
  type: 'segment' | 'feature' | 'campaign' | 'board' | null;
  id?: string;
  name?: string;
}

interface PanelState {
  open: boolean;
  threadId: string | null;
  context: PageContext;
}

type Listener = (state: PanelState) => void;

const state: PanelState = {
  open: read(KEY_OPEN) === '1',
  threadId: localStorage.getItem(KEY_THREAD),
  context: { type: null },
};
const listeners = new Set<Listener>();

function emit() { for (const l of listeners) l(state); }

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* no-op */ }
}

export function usePanel() {
  const [snap, setSnap] = React.useState(state);
  React.useEffect(() => {
    listeners.add(setSnap);
    return () => { listeners.delete(setSnap); };
  }, []);
  return {
    ...snap,
    setOpen(next: boolean) { state.open = next; write(KEY_OPEN, next ? '1' : '0'); emit(); },
    setThread(id: string | null) { state.threadId = id; write(KEY_THREAD, id); emit(); },
    setContext(ctx: PageContext) { state.context = ctx; emit(); },
  };
}
