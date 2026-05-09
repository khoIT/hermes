/**
 * Shared derivation types.
 *
 * A `Derivation` is a tiny pure function that takes per-uid raw aggregate
 * rows from one source table and returns 0-or-1 FeatureValueRow per uid.
 *
 * Phase 04 wires ~48 derivations grouped by source table (~8 files).
 */

import type { RawAggregateRow } from '../postgres-client.js';
import type { SourceTable } from '../queries/aggregate-queries.js';

export type FeatureValueRow = {
  featureName:    string;
  uid:            string;
  valueText:      string | null;
  valueNumeric:   number | null;
  isSynthesized:  boolean;
};

/**
 * Per-feature derivation. `compute` is invoked with all `RawAggregateRow`s
 * for one uid (across the 30d window), sorted ascending by `eventDate`,
 * filtered to the source tables this derivation declares.
 *
 * Returns null when the derivation cannot produce a value for this uid
 * (e.g. all rows synthesised and feature requires real-data).
 */
export type Derivation = {
  feature:        string;
  sourceTables:   readonly SourceTable[];
  /** When true, this derivation is approximate / proxy SQL (T4 features). */
  approximate?:   boolean;
  compute: (uidRows: RawAggregateRow[], today: Date) => Omit<FeatureValueRow, 'featureName' | 'isSynthesized'> | null;
};

/** Helper: filter rows by `is_synthesized` flag. */
export const onlyReal = (rows: RawAggregateRow[]): RawAggregateRow[] => rows.filter((r) => !r.isSynthesized);

/** Helper: filter rows whose `eventDate` is within the past N days of `today`. */
export function rowsWithinDays(rows: RawAggregateRow[], today: Date, days: number): RawAggregateRow[] {
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  return rows.filter((r) => r.eventDate >= cutoffIso);
}

/** Helper: parse last_value JSON safely. */
export function readLast<T = Record<string, unknown>>(rows: RawAggregateRow[]): T | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const v = rows[i].lastValue;
    if (v && typeof v === 'object') return v as T;
  }
  return null;
}
