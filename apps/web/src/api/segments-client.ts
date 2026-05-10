/**
 * segments-client — fetch wrapper for catalog-api segments.
 * Falls back to a localStorage stub when the backend is unavailable so
 * the demo still produces a navigable /segments/:id page.
 *
 * Override map: catalog `allSegments` is a static module import, so
 * predicate edits must round-trip through `segmentOverrides` to be
 * visible to consumers. `useSegment(id)` (in segment-overrides.ts)
 * reads override-then-catalog.
 */
import { authFetch } from './auth-fetch';
import type { PredicateAST } from '@hermes/contracts';
import { applySegmentOverride } from '../utils/segment-overrides';

const API_BASE = '/api/v1';

export interface CreateSegmentPayload {
  name: string;
  description?: string;
  predicate?: unknown;
  sourceThreadId?: string;
}

export interface CreateSegmentResult {
  id: string;
  name: string;
  live: boolean;
}

export interface UpdateSegmentPayload {
  predicate?: PredicateAST;
  displayName?: string;
}

const STUB_KEY = 'hermes.stub.segments';

function stubCreate(payload: CreateSegmentPayload): CreateSegmentResult {
  const id = `seg-stub-${Date.now().toString(36)}`;
  try {
    const cur = JSON.parse(localStorage.getItem(STUB_KEY) || '[]');
    cur.unshift({ id, ...payload, createdAt: new Date().toISOString() });
    localStorage.setItem(STUB_KEY, JSON.stringify(cur.slice(0, 50)));
  } catch { /* no-op */ }
  return { id, name: payload.name, live: false };
}

export async function createSegment(payload: CreateSegmentPayload): Promise<CreateSegmentResult> {
  try {
    const res = await authFetch(`${API_BASE}/segments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`POST /segments ${res.status}: ${text}`);
    }
    const data = (await res.json()) as { id: string; name?: string };
    return { id: data.id, name: data.name ?? payload.name, live: true };
  } catch (err) {
    console.warn('[segments-client] live POST failed, stubbing:', err);
    return stubCreate(payload);
  }
}

/**
 * PATCH /api/v1/segments/:id with the new predicate (or other patch fields).
 * Always writes the override map locally so the UI re-renders even when the
 * backend route isn't available — demo machines stay navigable.
 */
export async function updateSegment(id: string, patch: UpdateSegmentPayload): Promise<{ live: boolean }> {
  applySegmentOverride(id, patch);
  try {
    const res = await authFetch(`${API_BASE}/segments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      throw new Error(`PATCH /segments/${id} ${res.status}`);
    }
    return { live: true };
  } catch (err) {
    console.warn('[segments-client] live PATCH failed, override-only:', err);
    return { live: false };
  }
}

/** Trigger a backend rebuild — best-effort; falls back to no-op for the demo. */
export async function rebuildSegment(id: string): Promise<{ live: boolean }> {
  try {
    const res = await authFetch(`${API_BASE}/segments/${id}/rebuild`, {
      method: 'POST',
    });
    return { live: res.ok };
  } catch {
    return { live: false };
  }
}
