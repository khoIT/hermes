/**
 * Pinned features — small localStorage-backed store with subscribe pattern.
 * Pins are FIFO-evicted when MAX_PINS is exceeded; subscribers fire on every
 * mutation so sidebar surfaces re-render within one tick.
 *
 * Storage key: `hermes.feature-store.pinned` → JSON `string[]` of feature names.
 * Cross-tab sync is out of scope for May 12 demo (single-tab assumption).
 */
const KEY = 'hermes.feature-store.pinned';
export const MAX_PINS = 5;

let pinned: string[] = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
})();

const subscribers = new Set<() => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(pinned)); } catch { /* noop */ }
}

function notify() {
  subscribers.forEach(cb => cb());
}

/** Returns a defensive copy of the current pin list (most-recent first). */
export function getPinned(): string[] {
  return pinned.slice();
}

/**
 * Toggle a feature's pin state. Returns true if the feature is now pinned.
 * Newly-pinned features are prepended; if the list exceeds MAX_PINS the
 * oldest entry is dropped.
 */
export function togglePin(name: string): boolean {
  const idx = pinned.indexOf(name);
  if (idx >= 0) {
    pinned = pinned.filter(n => n !== name);
    persist(); notify();
    return false;
  }
  pinned = [name, ...pinned].slice(0, MAX_PINS);
  persist(); notify();
  return true;
}

export function isPinned(name: string): boolean {
  return pinned.includes(name);
}

export function subscribePinned(cb: () => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}
