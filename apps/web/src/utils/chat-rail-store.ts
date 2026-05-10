/**
 * chat-rail-store — open/closed persistence + per-route gating for the
 * contextual right-rail chat surface (replaces ask-hermes-panel).
 *
 * Hidden routes (rail not rendered):  '/', '/chat', '/chat/:id'.
 * Default-open routes (initial open if no stored value): detail pages
 *   (/feature-store/:name, /segments/:id[/...], /canvas/:id, /campaigns/:id).
 * Otherwise default-closed.
 */
import { matchPath } from 'react-router-dom';

const KEY = 'hermes:chat-rail:open';

export const RAIL_WIDTH = 400;

const HIDDEN_ROUTES = new Set<string>(['/', '/chat']);
const HIDDEN_PREFIXES = ['/chat/'];

const DEFAULT_OPEN_PATTERNS = [
  '/feature-store/:name',
  '/segments/:id',
  '/segments/:id/:tab',
  '/canvas/:id',
  '/campaigns/:id',
  '/campaigns/:id/:tab',
];

/** Routes where the rail (and its FAB toggle) must not render. */
export function isRailHidden(pathname: string): boolean {
  if (HIDDEN_ROUTES.has(pathname)) return true;
  if (pathname === '/welcome') return true;
  return HIDDEN_PREFIXES.some(p => pathname.startsWith(p));
}

/** Default open state for the current route when no localStorage value is set. */
export function getDefaultOpen(pathname: string): boolean {
  return DEFAULT_OPEN_PATTERNS.some(p => matchPath(p, pathname) !== null);
}

/** Persisted user preference. Returns null when never set. */
export function getStoredOpen(): boolean | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === null) return null;
    return v === '1';
  } catch {
    return null;
  }
}

export function setStoredOpen(open: boolean): void {
  try {
    localStorage.setItem(KEY, open ? '1' : '0');
  } catch {
    /* no-op */
  }
}
