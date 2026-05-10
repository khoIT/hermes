/**
 * Toast — minimal global toast queue, fixed bottom-right, 4000ms auto-dismiss.
 * Exposes a singleton `toast(text, opts?)` callable from anywhere.
 * Mount <ToastHost /> once in App.
 */
import React from 'react';
import { T } from '../../theme';

export interface ToastEntry {
  id: number;
  text: string;
  /** Optional CTA shown on the right. */
  action?: { label: string; onClick: () => void };
  /** Tone affects accent line. */
  tone?: 'neutral' | 'success' | 'error';
  /** Lifetime in ms (default 4000). */
  ttl?: number;
}

type Listener = (entries: ToastEntry[]) => void;
const queue: ToastEntry[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function emit() {
  for (const l of listeners) l([...queue]);
}

export function toast(text: string, opts: Omit<ToastEntry, 'id' | 'text'> = {}) {
  const entry: ToastEntry = { id: nextId++, text, ttl: 4000, tone: 'neutral', ...opts };
  queue.push(entry);
  emit();
  setTimeout(() => {
    const idx = queue.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      queue.splice(idx, 1);
      emit();
    }
  }, entry.ttl);
}

export function ToastHost() {
  const [entries, setEntries] = React.useState<ToastEntry[]>([]);
  React.useEffect(() => {
    listeners.add(setEntries);
    return () => { listeners.delete(setEntries); };
  }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 1100,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {entries.map(e => (
        <div
          key={e.id}
          style={{
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', gap: 12,
            background: T.n900, color: '#fff',
            borderLeft: `3px solid ${
              e.tone === 'success' ? T.green600
              : e.tone === 'error' ? T.red500
              : T.brand
            }`,
            padding: '10px 14px', borderRadius: 8,
            boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            fontFamily: T.fSans, fontSize: 13,
            maxWidth: 420,
          }}
        >
          <span style={{ flex: 1 }}>{e.text}</span>
          {e.action && (
            <button
              onClick={() => { e.action!.onClick(); }}
              style={{
                background: 'transparent', color: T.brand, border: 'none',
                fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', padding: 0,
              }}
            >{e.action.label}</button>
          )}
        </div>
      ))}
    </div>
  );
}
