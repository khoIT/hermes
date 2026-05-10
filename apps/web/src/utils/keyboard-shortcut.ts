/**
 * Global keyboard shortcut helper. Handles Cmd vs Ctrl per platform,
 * ignores presses while focused on input/textarea/contenteditable.
 */
import React from 'react';

/** Combo strings: "mod+k" → Cmd on macOS, Ctrl elsewhere. */
export function useGlobalShortcut(combo: string, handler: () => void) {
  React.useEffect(() => {
    const parts = combo.toLowerCase().split('+');
    const wantsMod = parts.includes('mod');
    const wantsShift = parts.includes('shift');
    const wantsAlt = parts.includes('alt');
    const key = parts[parts.length - 1] ?? '';

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && isEditable(target) && key !== 'escape') return;
      if (e.key.toLowerCase() !== key) return;
      if (wantsMod && !(e.metaKey || e.ctrlKey)) return;
      if (wantsShift !== e.shiftKey) return;
      if (wantsAlt !== e.altKey) return;
      e.preventDefault();
      handler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [combo, handler]);
}

function isEditable(el: HTMLElement): boolean {
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}
