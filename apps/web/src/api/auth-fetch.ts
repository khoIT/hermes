/**
 * auth-fetch — wraps `fetch` with the catalog-api dev-login token.
 *
 * Catalog-api's JwtGuard rejects requests without a `Bearer …` header.
 * The web app has no real SSO yet, so on first call we POST
 * /api/v1/auth/dev-login (which is dev-only, refused in production) and
 * cache the resulting token in sessionStorage. A 401 response invalidates
 * the cache and triggers a single retry — this absorbs token expiry
 * without surfacing a login prompt during the demo.
 *
 * Used by segments-client, campaigns-client, boards-client. Other live
 * fetches (feature distributions, audience count) hit query-svc which
 * is currently unauthenticated.
 */
const TOKEN_KEY = 'hermes.auth.token.v1';
const DEV_LOGIN = '/api/v1/auth/dev-login';

let inFlight: Promise<string> | null = null;

function getCached(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function setCached(token: string) {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* no-op */ }
}

function clearCached() {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* no-op */ }
}

async function freshToken(): Promise<string> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const res = await fetch(DEV_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`dev-login failed: ${res.status}`);
    const data = (await res.json()) as { token: string };
    setCached(data.token);
    return data.token;
  })();
  try { return await inFlight; }
  finally { inFlight = null; }
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const exec = async (token: string) => {
    const headers = new Headers(init.headers ?? {});
    headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return fetch(input, { ...init, headers });
  };
  let token = getCached() ?? await freshToken();
  let res = await exec(token);
  if (res.status === 401) {
    clearCached();
    token = await freshToken();
    res = await exec(token);
  }
  return res;
}
