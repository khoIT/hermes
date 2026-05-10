/**
 * Feature loader — fetches the live feature catalog (with analytics)
 * from catalog-api at app boot, parses with the HermesFeature zod
 * schema, and populates the in-process snapshot consumed by
 * `getAllFeatures()` / `subscribeFeatures()`.
 *
 * Phase 06 hard cut: there is NO static-JSON fallback. If the API
 * fetch fails the snapshot stays empty and Feature Store routes
 * render `<FeaturesUnavailable />`. Other modules read whatever the
 * snapshot holds at the time of subscription.
 *
 * Boot semantics: the awaited promise resolves after the FIRST
 * attempt (success or failure) so React render isn't blocked. On
 * failure, status flips to 'error' immediately AND a background
 * retry chain is scheduled (1s, 2s, 4s) — common case is a transient
 * race between Vite-up and catalog-api-up at startup. If a retry
 * succeeds, status flips to 'ready' and subscribers re-render
 * automatically. A new bootFeatureLoader() call (e.g. from the
 * Retry button) cancels any pending retry and starts fresh.
 */

import type { HermesFeature } from '@hermes/contracts';

const FEATURES_URL = '/api/v1/features';
const DEFAULT_BOOT_TIMEOUT_MS = 8_000;
const RETRY_BACKOFF_MS = [1_000, 2_000, 4_000];

export type LoadStatus = 'loading' | 'ready' | 'error';

type Listener = (status: LoadStatus, error?: string) => void;
const statusListeners = new Set<Listener>();
let currentStatus: LoadStatus = 'loading';
let currentError: string | undefined;

let retryTimer: ReturnType<typeof setTimeout> | null = null;

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
  await runAttempt(opts, 0);
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
        try {
          const body = await res.json() as { message?: string; code?: string };
          if (body.message) throw new Error(`${res.status} · ${body.message}`);
        } catch (parseErr) {
          if (parseErr instanceof Error && /^\d{3} ·/.test(parseErr.message)) {
            throw parseErr;
          }
          // body wasn't JSON — fall through to canonical message
        }
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
    const attemptLabel = retryIdx === 0 ? 'boot fetch' : `retry ${retryIdx}/${RETRY_BACKOFF_MS.length}`;
    // eslint-disable-next-line no-console
    console.error(`[features] ${attemptLabel} failed: ${reason}`);
    setStatus('error', reason);
    opts.onError?.(reason);
    scheduleNextRetry(opts, retryIdx);
  }
}

function scheduleNextRetry(opts: LoaderOpts, completedRetryIdx: number): void {
  if (completedRetryIdx >= RETRY_BACKOFF_MS.length) return;
  const delay = RETRY_BACKOFF_MS[completedRetryIdx];
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
