/**
 * Tiny shared fetch hook for persona panels.
 * Returns { status, data, error } — no caching, refetch on URL change.
 */
import * as React from 'react';

export type FetchStatus = 'loading' | 'ready' | 'error' | 'empty';

export function useApiFetch<T>(url: string | null, deps: unknown[] = []): {
  status: FetchStatus;
  data:   T | null;
  error:  string | null;
} {
  const [state, setState] = React.useState<{ status: FetchStatus; data: T | null; error: string | null }>({
    status: url ? 'loading' : 'empty',
    data:   null,
    error:  null,
  });

  React.useEffect(() => {
    if (!url) {
      setState({ status: 'empty', data: null, error: null });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading', data: null, error: null });
    fetch(url, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = (await r.json()) as T;
        if (controller.signal.aborted) return;
        setState({ status: 'ready', data: json, error: null });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', data: null, error: err instanceof Error ? err.message : String(err) });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  return state;
}
