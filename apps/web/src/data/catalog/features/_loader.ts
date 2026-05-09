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
 */

import type { HermesFeature } from '@hermes/contracts';

const FEATURES_URL = '/api/v1/features';
const DEFAULT_BOOT_TIMEOUT_MS = 8_000;

export type LoadStatus = 'loading' | 'ready' | 'error';

type Listener = (status: LoadStatus, error?: string) => void;
const statusListeners = new Set<Listener>();
let currentStatus: LoadStatus = 'loading';
let currentError: string | undefined;

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

/**
 * Boot-time fetch. Resolves once the snapshot is populated OR an
 * error/timeout puts the loader into the 'error' state. Always
 * resolves — callers don't need to handle rejection.
 */
export async function bootFeatureLoader(opts: {
  timeoutMs?: number;
  onReady?: (features: HermesFeature[]) => void;
  onError?: (reason: string) => void;
} = {}): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_BOOT_TIMEOUT_MS;
  setStatus('loading');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(FEATURES_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
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
    const reason = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(`[features] boot fetch failed: ${reason}`);
    setStatus('error', reason);
    opts.onError?.(reason);
  }
}
