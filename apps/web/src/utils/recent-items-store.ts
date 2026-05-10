/**
 * Recent items LRU store, persisted in localStorage.
 * Used by sidebar Feature Store / Segments / Campaigns / Boards / All Chats sections.
 *
 * Key shape: hermes.recent.v1.{module}
 * Max items: 8 (oldest evicted on push).
 */

const VERSION = 'v1';
const MAX = 8;

export type RecentModule =
  | 'chats'
  | 'features'
  | 'segments'
  | 'campaigns'
  | 'boards';

export interface RecentItem {
  /** Stable id (route param) */
  id: string;
  /** Visible label */
  title: string;
  /** ISO timestamp of last activity — used for sort tie-break */
  updatedAt: string;
  /** Optional href override; defaults to module route */
  href?: string;
}

const key = (m: RecentModule) => `hermes.recent.${VERSION}.${m}`;

export function getRecent(module: RecentModule): RecentItem[] {
  try {
    const raw = localStorage.getItem(key(module));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecent(module: RecentModule, item: RecentItem): void {
  try {
    const cur = getRecent(module).filter(i => i.id !== item.id);
    const next = [item, ...cur].slice(0, MAX);
    localStorage.setItem(key(module), JSON.stringify(next));
  } catch {
    /* localStorage unavailable — silently ignore */
  }
}

export function clearRecent(module: RecentModule): void {
  try {
    localStorage.removeItem(key(module));
  } catch {
    /* no-op */
  }
}

/** Read sidebar section expand state (default: expanded). */
export function getSectionExpanded(section: string): boolean {
  try {
    const v = localStorage.getItem(`hermes.sidebar.expand.${section}`);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

export function setSectionExpanded(section: string, expanded: boolean): void {
  try {
    localStorage.setItem(`hermes.sidebar.expand.${section}`, expanded ? '1' : '0');
  } catch {
    /* no-op */
  }
}
