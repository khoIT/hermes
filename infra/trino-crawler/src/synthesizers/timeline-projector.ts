/**
 * Timeline projector — extends a 7d window of per-uid raw aggregates
 * back by `daysToProject` (default 23) days to produce a 30d trajectory.
 *
 * The projection preserves per-uid mean behaviour while overlaying:
 *   - day-of-week scaling (weekend +10%)
 *   - one seeded drift event per uid×source per ~60d at ±25%
 *   - ±15% Gaussian-ish jitter for realism
 *
 * Pure function. Same input → same output. No I/O.
 *
 * Invariant: never invents new uids; only existing uid signatures get
 * projected. Output rows carry `isSynthesized: true`.
 */

import { makeRng } from './seeded-rng.js';
import type { RawAggregateRow } from '../postgres-client.js';

// Mon=1 .. Sun=7 → multiplier; matches the existing event-volumes synth.
const DAY_OF_WEEK_FACTOR: readonly number[] = [
  0.95, // Sun (Date#getDay returns 0)
  0.95, // Mon
  0.97, // Tue
  1.00, // Wed
  1.02, // Thu
  1.05, // Fri
  1.10, // Sat
];

function dayOfWeekFactor(date: Date): number {
  return DAY_OF_WEEK_FACTOR[date.getUTCDay()] ?? 1.0;
}

/**
 * Add `delta` days (negative for past) to an ISO date string. Stays in UTC.
 */
function addDays(isoDate: string, delta: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Compute mean numeric metrics for a uid's 7d window.
 * Null inputs stay null; falsy zeroes count as 0.
 */
function uidMeanSignature(rows: RawAggregateRow[]): {
  rowCountMean: number;
  numericSumMean: number | null;
  numericMaxMean: number | null;
  numericMinMean: number | null;
  lastValue: Record<string, unknown> | null;
} {
  const n = rows.length;
  let rowCount = 0;
  let sumCount = 0, sumSum = 0;
  let maxCount = 0, sumMax = 0;
  let minCount = 0, sumMin = 0;

  for (const r of rows) {
    rowCount += r.rowCount;
    if (r.numericSum !== null && Number.isFinite(r.numericSum)) { sumSum += r.numericSum; sumCount += 1; }
    if (r.numericMax !== null && Number.isFinite(r.numericMax)) { sumMax += r.numericMax; maxCount += 1; }
    if (r.numericMin !== null && Number.isFinite(r.numericMin)) { sumMin += r.numericMin; minCount += 1; }
  }

  return {
    rowCountMean:    n > 0 ? rowCount / n : 0,
    numericSumMean:  sumCount > 0 ? sumSum / sumCount : null,
    numericMaxMean:  maxCount > 0 ? sumMax / maxCount : null,
    numericMinMean:  minCount > 0 ? sumMin / minCount : null,
    lastValue:       rows[rows.length - 1]?.lastValue ?? null,
  };
}

/**
 * Project a single uid's 7d window backwards. Produces `daysToProject`
 * synthesized rows tagged is_synthesized=true. Uid + source-table pair
 * forms the RNG seed so the same input is reproducible.
 */
export function projectUidBackwards(
  sourceTable: string,
  uid: string,
  realRows: RawAggregateRow[],
  options: { daysToProject?: number; anchorDate?: string } = {},
): RawAggregateRow[] {
  if (realRows.length === 0) return [];

  const daysToProject = options.daysToProject ?? 23;

  // Anchor at the earliest real day; we project further into the past.
  // realRows.minDate - 1d, realRows.minDate - 2d, ... etc.
  const minRealDate = realRows.reduce<string>(
    (min, r) => (r.eventDate < min ? r.eventDate : min),
    options.anchorDate ?? realRows[0].eventDate,
  );

  const sig = uidMeanSignature(realRows);
  const rng = makeRng(`${sourceTable}|${uid}`);

  // Pick one drift event date deterministically within the projected window.
  const driftOffsetFromAnchor = Math.floor(rng() * daysToProject);

  const out: RawAggregateRow[] = [];
  for (let i = 1; i <= daysToProject; i++) {
    const d = addDays(minRealDate, -i);
    const dow = dayOfWeekFactor(new Date(`${d}T00:00:00Z`));
    const isDrift = i === driftOffsetFromAnchor + 1;
    const driftMul = isDrift ? (rng() < 0.5 ? 0.75 : 1.25) : 1.0;
    const jitter = 1 + (rng() - 0.5) * 0.30; // ±15%
    const mul = dow * driftMul * jitter;

    out.push({
      sourceTable,
      uid,
      eventDate: d,
      rowCount: Math.max(0, Math.round(sig.rowCountMean * mul)),
      numericSum: sig.numericSumMean === null ? null : sig.numericSumMean * mul,
      numericMax: sig.numericMaxMean === null ? null : sig.numericMaxMean * mul,
      numericMin: sig.numericMinMean === null ? null : sig.numericMinMean * mul,
      lastValue: sig.lastValue,
      isSynthesized: true,
    });
  }
  return out;
}

/**
 * Convenience: group rows by uid, then project each uid backwards in turn.
 * Yields chunks of N synthesized rows so the caller can stream them into
 * Postgres without holding the entire projection in memory.
 */
export function* projectChunked(
  sourceTable: string,
  realRowsByUid: Map<string, RawAggregateRow[]>,
  daysToProject: number,
  chunkSize: number,
): Generator<RawAggregateRow[]> {
  let buffer: RawAggregateRow[] = [];
  for (const [uid, rows] of realRowsByUid) {
    const projected = projectUidBackwards(sourceTable, uid, rows, { daysToProject });
    buffer.push(...projected);
    while (buffer.length >= chunkSize) {
      yield buffer.slice(0, chunkSize);
      buffer = buffer.slice(chunkSize);
    }
  }
  if (buffer.length > 0) yield buffer;
}
