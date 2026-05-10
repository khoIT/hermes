/**
 * campaigns-client — POST /api/v1/campaigns wrapper. Backend lives at
 * apps/catalog-api/src/campaigns/. Live POST is tried first; a localStorage
 * stub is used only when the backend is unreachable so the demo can still
 * navigate to /campaigns/:id during catalog-api restarts.
 */
import { authFetch } from './auth-fetch';

const API_BASE = '/api/v1';

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  type: 'realtime' | 'scheduled' | 'onetime';
  segmentId?: string;
}

export interface CreateCampaignResult {
  id: string;
  name: string;
  type: CreateCampaignPayload['type'];
  live: boolean;
}

const STUB_KEY = 'hermes.stub.campaigns';

function stubCreate(payload: CreateCampaignPayload): CreateCampaignResult {
  const id = `cmp-stub-${Date.now().toString(36)}`;
  try {
    const cur = JSON.parse(localStorage.getItem(STUB_KEY) || '[]');
    cur.unshift({ id, ...payload, createdAt: new Date().toISOString() });
    localStorage.setItem(STUB_KEY, JSON.stringify(cur.slice(0, 50)));
  } catch { /* no-op */ }
  return { id, name: payload.name, type: payload.type, live: false };
}

export async function createCampaign(payload: CreateCampaignPayload): Promise<CreateCampaignResult> {
  try {
    const res = await authFetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`POST /campaigns ${res.status}: ${text}`);
    }
    const data = (await res.json()) as { id: string; name?: string };
    return {
      id: data.id, name: data.name ?? payload.name, type: payload.type, live: true,
    };
  } catch (err) {
    console.warn('[campaigns-client] live POST failed, stubbing:', err);
    return stubCreate(payload);
  }
}
