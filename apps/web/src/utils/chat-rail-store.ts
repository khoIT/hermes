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
const WIDTH_KEY = 'hermes:chat-rail:width';

export const RAIL_WIDTH_DEFAULT = 400;
export const RAIL_WIDTH_MIN = 320;
export const RAIL_WIDTH_MAX = 720;

export function getStoredWidth(): number {
  try {
    const v = localStorage.getItem(WIDTH_KEY);
    if (v === null) return RAIL_WIDTH_DEFAULT;
    const n = Number(v);
    if (!Number.isFinite(n)) return RAIL_WIDTH_DEFAULT;
    return clampWidth(n);
  } catch {
    return RAIL_WIDTH_DEFAULT;
  }
}

export function setStoredWidth(width: number): void {
  try {
    localStorage.setItem(WIDTH_KEY, String(clampWidth(width)));
  } catch {
    /* no-op */
  }
}

export function clampWidth(width: number): number {
  return Math.min(RAIL_WIDTH_MAX, Math.max(RAIL_WIDTH_MIN, Math.round(width)));
}

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
