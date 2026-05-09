/**
 * Format helpers for the analytics panels — freshness percentage, request
 * counts, and human-friendly date-relative phrases.
 */

/** "99.4%" / "0.4%" — never sci-notation; always 1 decimal for ≤99.9, 2 for >=99.95. */
export function formatPct(fraction: number): string {
  const v = fraction * 100;
  if (v >= 99.95) return `${v.toFixed(2)}%`;
  if (v >= 10) return `${v.toFixed(1)}%`;
  return `${v.toFixed(2)}%`;
}

/** Compact request count: 4_750_000 → "4.7M", 800_000 → "800K", 1234 → "1.2K". */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return `${n}`;
}

/** Format an ISO date as "MMM d, yyyy" (e.g. "Apr 12, 2026"). */
export function formatIsoDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

/** "14 min" / "2.3 hours". */
export function formatLagMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  return `${(min / 60).toFixed(1)} hours`;
}
