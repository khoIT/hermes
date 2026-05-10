/**
 * Format an ISO timestamp into a compact relative-time string for the
 * Feature Store row's freshness column.
 *
 *   null/undefined → '—'
 *   < 60s          → '<1m'
 *   < 60m          → 'Nm'
 *   < 24h          → 'Nh'
 *   same day       → 'today'
 *   < 7d           → 'Nd'
 *   < 28d          → 'Nw'
 *   else           → ISO date 'YYYY-MM-DD'
 *
 * `now` is injected for testability — defaults to the current wall clock.
 */
export function formatFreshness(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return '—';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '—';

  const diffMs = now.getTime() - then.getTime();
  if (diffMs < 0) return 'just now';

  const sec = diffMs / 1000;
  if (sec < 60) return '<1m';
  const min = sec / 60;
  if (min < 60) return `${Math.round(min)}m`;
  const hr = min / 60;
  if (hr < 24) return `${Math.round(hr)}h`;

  // Same calendar day check
  if (
    then.getFullYear() === now.getFullYear() &&
    then.getMonth() === now.getMonth() &&
    then.getDate() === now.getDate()
  ) return 'today';

  const day = hr / 24;
  if (day < 7) return `${Math.round(day)}d`;
  if (day < 28) return `${Math.round(day / 7)}w`;
  return then.toISOString().slice(0, 10);
}
