/**
 * Hooks + pure helpers for localised entity display names.
 *
 * Pattern: hook variants (`useLocalized*`) read the active language from
 * `useI18n` and resolve the lookup; pure variants (`localized*Name`) accept
 * `lang` directly so they can be called inside `.map(...)` callbacks that
 * shouldn't violate the rules of hooks.
 *
 * All paths fall back to the entity's English `displayName`/`title` if the
 * id is missing from the translation map — that's correct behaviour for
 * ad-hoc / user-created entities and for items already in Vietnamese.
 */
import { useI18n, type Language } from './i18n-provider';
import {
  SEGMENT_NAMES_VI, CAMPAIGN_NAMES_VI, THREAD_TITLES_VI,
} from './entity-names';

interface NamedEntity { id: string; displayName: string }
interface TitledEntity { id: string; title: string }

// ── Pure helpers (lang-explicit) ────────────────────────────────────────────

export function localizedSegmentName(
  seg: NamedEntity | undefined | null,
  lang: Language,
): string {
  if (!seg) return '';
  if (lang === 'vi') return SEGMENT_NAMES_VI[seg.id] ?? seg.displayName;
  return seg.displayName;
}

export function localizedCampaignName(
  cmp: NamedEntity | undefined | null,
  lang: Language,
): string {
  if (!cmp) return '';
  if (lang === 'vi') return CAMPAIGN_NAMES_VI[cmp.id] ?? cmp.displayName;
  return cmp.displayName;
}

export function localizedThreadTitle(
  thread: TitledEntity | undefined | null,
  lang: Language,
): string {
  if (!thread) return '';
  if (lang === 'vi') return THREAD_TITLES_VI[thread.id] ?? thread.title;
  return thread.title;
}

/** Resolve by id alone — used when only the id is in scope (sidebar recents). */
export function localizedThreadTitleById(
  id: string,
  fallback: string,
  lang: Language,
): string {
  if (lang === 'vi') return THREAD_TITLES_VI[id] ?? fallback;
  return fallback;
}

export function localizedSegmentNameById(
  id: string,
  fallback: string,
  lang: Language,
): string {
  if (lang === 'vi') return SEGMENT_NAMES_VI[id] ?? fallback;
  return fallback;
}

export function localizedCampaignNameById(
  id: string,
  fallback: string,
  lang: Language,
): string {
  if (lang === 'vi') return CAMPAIGN_NAMES_VI[id] ?? fallback;
  return fallback;
}

// ── Hook variants ───────────────────────────────────────────────────────────

export function useLocalizedSegmentName(seg: NamedEntity | undefined | null): string {
  const { lang } = useI18n();
  return localizedSegmentName(seg, lang);
}

export function useLocalizedCampaignName(cmp: NamedEntity | undefined | null): string {
  const { lang } = useI18n();
  return localizedCampaignName(cmp, lang);
}

export function useLocalizedThreadTitle(thread: TitledEntity | undefined | null): string {
  const { lang } = useI18n();
  return localizedThreadTitle(thread, lang);
}
