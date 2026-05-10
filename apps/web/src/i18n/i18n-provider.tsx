/**
 * I18nProvider — language toggle, persisted to localStorage.
 *
 * Dictionary is statically imported (no async lazy-load) — total payload is
 * ~6 kB which is fine for the demo's two-language scope. Keys missing in the
 * active language fall back to English (and warn in dev).
 *
 * Usage:
 *   const t = useT();
 *   <button>{t('common.save')}</button>
 *
 * To add new strings: extend both `en` and `vi` objects in `dictionary.ts`.
 * TypeScript prevents calling `t()` with an unknown key.
 */
import React from 'react';
import { en, vi, type TranslationKey } from './dictionary';

export type Language = 'en' | 'vi';

const STORAGE_KEY = 'hermes.i18n.language';
const DICTS: Record<Language, Record<TranslationKey, string>> = { en, vi };

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

function readInitialLang(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'vi') return stored;
  } catch { /* unavailable */ }
  // Heuristic: navigator.language starts with 'vi' → Vietnamese
  const nav = window.navigator?.language ?? '';
  if (nav.toLowerCase().startsWith('vi')) return 'vi';
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Language>(readInitialLang);

  React.useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch { /* no-op */ }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = React.useCallback((next: Language) => setLangState(next), []);

  const t = React.useCallback((key: TranslationKey): string => {
    const dict = DICTS[lang];
    const value = dict[key];
    if (value !== undefined) return value;
    // Fallback to English (dev-mode warn elided to keep ImportMeta clean)
    return en[key] ?? key;
  }, [lang]);

  const value = React.useMemo<I18nContextValue>(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be called inside <I18nProvider>');
  return ctx;
}

/** Shorthand: returns just the translator function. */
export function useT(): (key: TranslationKey) => string {
  return useI18n().t;
}
