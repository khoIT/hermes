/**
 * ThemeProvider — light/dark toggle, persisted to localStorage.
 *
 * Toggles the `dark` class on <html>. Theme tokens in theme-tokens.css are
 * defined as CSS custom properties under `:root` (light) and `html.dark`
 * (dark); flipping the class instantly re-renders every consumer of T.
 *
 * Initial value: localStorage > prefers-color-scheme > 'light'.
 */
import React from 'react';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'hermes.theme.mode';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function readInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch { /* localStorage unavailable */ }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

function applyMode(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ThemeMode>(readInitialMode);

  // Apply class on every mode change. Run synchronously on mount to avoid
  // a flash of light theme on first paint.
  React.useLayoutEffect(() => {
    applyMode(mode);
    try { window.localStorage.setItem(STORAGE_KEY, mode); } catch { /* no-op */ }
  }, [mode]);

  const setMode = React.useCallback((next: ThemeMode) => setModeState(next), []);
  const toggle = React.useCallback(
    () => setModeState(m => m === 'light' ? 'dark' : 'light'),
    [],
  );

  const value = React.useMemo<ThemeContextValue>(
    () => ({ mode, setMode, toggle }),
    [mode, setMode, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be called inside <ThemeProvider>');
  return ctx;
}
