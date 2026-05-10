/**
 * Shared numeric thresholds for the Feature Store. Imported by:
 *   - drift-indicator.tsx (row glyph color band)
 *   - library.tsx (entry-point chip count + driftedOnly filter)
 *   - filter.ts (driftedOnly predicate — currently inlines 0.4)
 *
 * Keep the chip count and the row indicator in sync via this single source.
 */
export const DRIFT_THRESHOLD = 0.4;
export const DRIFT_WATCH_THRESHOLD = 0.2;
