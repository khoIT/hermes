/**
 * Feature loader — fetches the live feature catalog (with analytics)
 * from catalog-api at app boot, parses with the HermesFeature zod
 * schema, and populates the in-process snapshot consumed by
 * `getAllFeatures()` / `subscribeFeatures()`.
 *
 * Two failure modes:
 *   1. Netlify (frontend-only deploy): /api/v1/features returns 502 with
 *      envelope `{ code: 'DEMO_MODE_API_DISABLED' }`. Loader switches to
 *      the build-time-baked /_catalog.json (synthetic analytics, see
 *      apps/web/scripts/export-feature-catalog.ts). Demo stays interactive.
 *   2. Dev/local (catalog-api down): /api/v1/features returns 502 with
 *      envelope `{ code: 'UPSTREAM_UNREACHABLE' }` from the Vite proxy,
 *      OR network error. No static fallback — snapshot stays empty,
 *      Feature Store routes render `<FeaturesUnavailable />` so the
 *      operator sees the actionable "run pnpm dev" guidance.
 *
 * Boot semantics: the awaited promise resolves after the FIRST
 * attempt (success or failure) so React render isn't blocked. On
 * failure, status flips to 'error' immediately AND a background
 * retry chain is scheduled (1s, 2s, 4s, then 8s indefinitely) —
 * common case is a transient race between Vite-up and catalog-api-up
 * at startup. The unbounded 8s tail prevents long-tail boot starvation
 * (catalog-api cold start >7s) from sticking the user on the
 * "unavailable" page forever. If a retry succeeds, status flips to
 * 'ready' and subscribers re-render automatically. A new
 * bootFeatureLoader() call (e.g. from the Retry button) cancels any
 * pending retry and starts fresh.
 *
 * Recovery hooks: the loader also re-runs an immediate attempt on
 * `visibilitychange` (tab refocus) and `online` events while in
 * 'error' state — common case is user alt-tabbed while waiting for
 * catalog-api to come up.
 */

import type { HermesFeature } from '@hermes/contracts';

const FEATURES_URL = '/api/v1/features';
const STATIC_FALLBACK_URL = '/_catalog.json';
const DEFAULT_BOOT_TIMEOUT_MS = 8_000;
const RETRY_BACKOFF_MS = [1_000, 2_000, 4_000];
const STEADY_RETRY_MS = 8_000;

export type LoadStatus = 'loading' | 'ready' | 'error';

type Listener = (status: LoadStatus, error?: string) => void;
const statusListeners = new Set<Listener>();
let currentStatus: LoadStatus = 'loading';
let currentError: string | undefined;

let retryTimer: ReturnType<typeof setTimeout> | null = null;
let recoveryHooksInstalled = false;
let lastOpts: LoaderOpts = {};

export function getLoadStatus(): { status: LoadStatus; error?: string } {
  return { status: currentStatus, error: currentError };
}

export function subscribeLoadStatus(cb: Listener): () => void {
  statusListeners.add(cb);
  return () => {
    statusListeners.delete(cb);
  };
}

function setStatus(next: LoadStatus, err?: string): void {
  currentStatus = next;
  currentError = err;
  statusListeners.forEach((cb) => cb(next, err));
}

type LoaderOpts = {
  timeoutMs?: number;
  onReady?: (features: HermesFeature[]) => void;
  onError?: (reason: string) => void;
};

/**
 * Kick off the boot fetch. Resolves after the FIRST attempt resolves
 * (so render isn't blocked by background retries). Always resolves —
 * callers don't need to handle rejection.
 */
export async function bootFeatureLoader(opts: LoaderOpts = {}): Promise<void> {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  lastOpts = opts;
  installRecoveryHooks();
  await runAttempt(opts, 0);
}

/**
 * Browser-event recovery hooks — re-trigger an immediate fetch when the
 * user alt-tabs back or network comes online while we're stuck in 'error'.
 * Idempotent — installed once for the lifetime of the page.
 */
function installRecoveryHooks(): void {
  if (recoveryHooksInstalled) return;
  if (typeof window === 'undefined') return;
  recoveryHooksInstalled = true;

  const tryNow = () => {
    if (currentStatus !== 'error') return;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    void runAttempt(lastOpts, 0);
  };

  window.addEventListener('online', tryNow);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tryNow();
  });
}

/**
 * Fetch the build-time-baked catalog from /_catalog.json. Used when
 * /api/v1/features returns DEMO_MODE_API_DISABLED (Netlify frontend-only
 * deploy). Returns true if the static catalog loaded successfully; false
 * lets the caller emit the canonical error.
 */
async function loadStaticFallback(opts: LoaderOpts): Promise<boolean> {
  try {
    const res = await fetch(STATIC_FALLBACK_URL);
    if (!res.ok) return false;
    const json = await res.json();
    if (!Array.isArray(json)) return false;
    setStatus('ready');
    opts.onReady?.(json as HermesFeature[]);
    return true;
  } catch {
    return false;
  }
}

async function runAttempt(opts: LoaderOpts, retryIdx: number): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_BOOT_TIMEOUT_MS;
  setStatus('loading');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(FEATURES_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      // Catalog-api emits 503 + DB_UNAVAILABLE envelope when Postgres is
      // restarting. Vite's proxy emits 502 (with our UPSTREAM_UNREACHABLE
      // envelope, configured in vite.config.ts) when catalog-api itself
      // isn't listening on :3001. 500/504 fall back here as a safety net
      // in case some env still emits Vite's default ECONNREFUSED→500.
      if ([500, 502, 503, 504].includes(res.status)) {
        let body: { message?: string; code?: string } | null = null;
        try {
          body = await res.json() as { message?: string; code?: string };
        } catch {
          // body wasn't JSON — fall through to canonical message
        }
        // Netlify (frontend-only) returns 502 with this envelope from
        // /api-disabled.json. There's no catalog-api host — switch to the
        // static catalog shipped at /_catalog.json instead of erroring out.
        if (body?.code === 'DEMO_MODE_API_DISABLED') {
          const ok = await loadStaticFallback(opts);
          if (ok) return;
        }
        if (body?.message) throw new Error(`${res.status} · ${body.message}`);
        throw new Error(`${res.status} · catalog-api not reachable on :3001 · run \`pnpm --filter @hermes/catalog-api dev\``);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    if (!Array.isArray(json)) {
      throw new Error('expected an array');
    }
    setStatus('ready');
    opts.onReady?.(json as HermesFeature[]);
  } catch (err) {
    clearTimeout(timer);
    const reason = describeFetchFailure(err);
    const attemptLabel = retryIdx === 0
      ? 'boot fetch'
      : retryIdx <= RETRY_BACKOFF_MS.length
        ? `retry ${retryIdx}/${RETRY_BACKOFF_MS.length}`
        : `retry ${retryIdx} (steady)`;
    // eslint-disable-next-line no-console
    console.error(`[features] ${attemptLabel} failed: ${reason}`);
    setStatus('error', reason);
    opts.onError?.(reason);
    scheduleNextRetry(opts, retryIdx);
  }
}

function scheduleNextRetry(opts: LoaderOpts, completedRetryIdx: number): void {
  // Initial burst (1s/2s/4s) covers the common Vite-vs-catalog-api race;
  // unbounded 8s tail recovers from long catalog-api cold starts (>7s)
  // so the user is never permanently stuck on the "unavailable" page.
  const delay = completedRetryIdx < RETRY_BACKOFF_MS.length
    ? RETRY_BACKOFF_MS[completedRetryIdx]
    : STEADY_RETRY_MS;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void runAttempt(opts, completedRetryIdx + 1);
  }, delay);
}

/**
 * Translate raw fetch failures into actionable reasons. The browser throws
 * TypeError for network-level failures (DNS, ECONNREFUSED, proxy refused) —
 * the default message ("Failed to fetch") hides the actual cause, which is
 * almost always "catalog-api isn't running".
 */
function describeFetchFailure(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  if (err.name === 'AbortError') {
    return 'timed out · is `pnpm --filter @hermes/catalog-api dev` running?';
  }
  if (err.name === 'TypeError') {
    return `${err.message} · catalog-api not reachable on :3001 · run \`pnpm --filter @hermes/catalog-api dev\``;
  }
  return err.message;
}
