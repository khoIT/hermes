/**
 * segments-client — minimal fetch wrapper for catalog-api segments.
 * Falls back to a localStorage stub when the backend is unavailable so
 * the demo still produces a navigable /segments/:id page.
 */
import { authFetch } from './auth-fetch';

const API_BASE = '/api/v1';

export interface CreateSegmentPayload {
  name: string;
  description?: string;
  /** Predicate JSON; loosely typed at this layer. */
  predicate?: unknown;
  /** Chat thread that originated this segment via action card. */
  sourceThreadId?: string;
}

export interface CreateSegmentResult {
  id: string;
  name: string;
  /** True when the response came from the live backend, false when stubbed. */
  live: boolean;
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
