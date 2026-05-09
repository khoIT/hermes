/**
 * Live audience-count via query-svc /api/v1/audience/count.
 *
 * Phase 07 wiring entry-point. Async counterpart to the synchronous
 * `lookupAudience()` (which still backs the threshold-grid fast paths).
 * Consumers opt in by switching to the async hook; the sync path stays
 * compiled in for offline / API-down scenarios and existing flows that
 * aren't ready for an async refactor.
 *
 * Adapter: translates the segments composer's `Predicate` (groups × rows)
 * into the API's predicate AST (`{ all, any, leaf }`).
 */

import * as React from 'react';
import type { Predicate as ComposerPredicate, Row } from './predicate-types';

const ENDPOINT = '/api/v1/audience/count';

export type ApiPredicate =
  | { all:  ApiPredicate[] }
  | { any:  ApiPredicate[] }
  | { not:  ApiPredicate }
  | { leaf: { feature: string; op: ApiOp; value: number | string | string[] } };

export type ApiOp = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'in';

export type ApiCountResult = {
  count:        number;
  sampledUids:  string[];
  durationMs:   number;
};

export type LookupStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Translate composer Row.op (e.g. '>', '>=', '=') to API op.
 * Composer ops live in Row.op; if drift, the predicate is rejected.
 */
function rowOpToApiOp(op: string): ApiOp | null {
  switch (op) {
    case '>':  return 'gt';
    case '>=': return 'gte';
    case '<':  return 'lt';
    case '<=': return 'lte';
    case '=':  return 'eq';
    case 'in': return 'in';
    default:   return null;
  }
}

function rowToApi(row: Row): ApiPredicate | null {
  const apiOp = rowOpToApiOp(String((row as unknown as { op?: string }).op ?? ''));
  if (!apiOp) return null;
  const feature = String((row as unknown as { feature?: string }).feature ?? '');
  const value   = (row as unknown as { value?: unknown }).value;
  if (!feature || value === undefined) return null;
  return { leaf: { feature, op: apiOp, value: value as number | string | string[] } };
}

/**
 * Composer Predicate is AND-of-OR (groups join with AND; rows within a
 * group join with OR). Convert to nested all/any.
 */
export function composerToApiPredicate(p: ComposerPredicate): ApiPredicate | null {
  if (!p.groups.length) return null;
  const groupNodes: ApiPredicate[] = [];
  for (const g of p.groups) {
    const rows = g.rows.map(rowToApi).filter((r): r is ApiPredicate => r !== null);
    if (rows.length === 0) return null;
    const head = rows[0];
    if (!head) return null;
    groupNodes.push(rows.length === 1 ? head : { any: rows });
  }
  const first = groupNodes[0];
  if (!first) return null;
  return groupNodes.length === 1 ? first : { all: groupNodes };
}

/** Direct call, no React. Returns null on translation failure. */
export async function fetchAudienceCount(predicate: ApiPredicate, signal?: AbortSignal): Promise<ApiCountResult | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ predicate, limit: 100 }),
      signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as ApiCountResult;
  } catch {
    return null;
  }
}

/**
 * React hook — debounces predicate changes (200ms) and re-fetches.
 * Returns `{ status, count, durationMs }`. `error` indicates the API
 * call failed (consumers can fall back to the sync lookup).
 */
export function useAudienceCount(predicate: ApiPredicate | null, debounceMs = 200): {
  status:     LookupStatus;
  count:      number | null;
  durationMs: number | null;
} {
  const [state, setState] = React.useState<{ status: LookupStatus; count: number | null; durationMs: number | null }>({
    status:     predicate ? 'loading' : 'idle',
    count:      null,
    durationMs: null,
  });

  React.useEffect(() => {
    if (!predicate) {
      setState({ status: 'idle', count: null, durationMs: null });
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, status: 'loading' }));
      const r = await fetchAudienceCount(predicate, controller.signal);
      if (controller.signal.aborted) return;
      if (r) {
        setState({ status: 'ready', count: r.count, durationMs: r.durationMs });
      } else {
        setState({ status: 'error', count: null, durationMs: null });
      }
    }, debounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [JSON.stringify(predicate), debounceMs]);

  return state;
}
