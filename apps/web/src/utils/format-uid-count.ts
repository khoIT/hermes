/**
 * Format a raw UID integer count into a human-readable string.
 * Examples: 23890 → "23,890 UIDs"  |  1000000 → "1,000,000 UIDs"
 */
export function formatUidCount(n: number): string {
  return `${n.toLocaleString('en-US')} UIDs`;
}

/** Compact version: 23890 → "23.9k UIDs" for badges/pills */
export function formatUidCountCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M UIDs`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k UIDs`;
  return `${n} UIDs`;
}
