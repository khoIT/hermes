/**
 * Audience-count fetch — POST /api/v1/audience/count via query-svc proxy.
 * 5s timeout, AbortController, simple in-memory cache by predicate JSON.
 */
import type { QueryPredicate } from './predicate-builder';

const ENDPOINT = '/api/v1/audience/count';
const TIMEOUT_MS = 5_000;

export interface AudienceCountResult {
  count: number;
  durationMs: number;
  fetchedAt: string;
}

const CACHE = new Map<string, AudienceCountResult>();

export async function fetchAudienceCount(predicate: QueryPredicate): Promise<AudienceCountResult> {
  const key = JSON.stringify(predicate);
  const cached = CACHE.get(key);
  if (cached) return cached;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ predicate, limit: 1 }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`audience-count ${res.status}`);
    const json = (await res.json()) as { count: number; durationMs: number };
    const result: AudienceCountResult = {
      count: json.count,
      durationMs: json.durationMs,
      fetchedAt: new Date().toISOString(),
    };
    CACHE.set(key, result);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export function clearAudienceCache(): void {
  CACHE.clear();
}
