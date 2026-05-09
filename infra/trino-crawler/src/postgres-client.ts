/**
 * Postgres client wrapper for the crawler.
 *
 * Receives bulk batches of `raw_event_aggregates` rows from each step-06
 * per-table aggregator and upserts them into the local hermes DB. ON
 * CONFLICT (source_table, uid, event_date) DO UPDATE keeps re-runs
 * idempotent — only `computed_at` and the numeric metrics change between
 * crawls.
 *
 * Connection string defaults to the same DATABASE_URL the catalog-api uses;
 * env-fallback chain mirrors apps/catalog-api/drizzle.config.ts.
 */

import { Pool, type PoolClient } from 'pg';

export type RawAggregateRow = {
  sourceTable:    string;
  uid:            string;
  eventDate:      string;          // ISO yyyy-mm-dd
  rowCount:       number;
  numericSum:     number | null;
  numericMax:     number | null;
  numericMin:     number | null;
  lastValue:      Record<string, unknown> | null;
  isSynthesized?: boolean;
};

const DEFAULT_DATABASE_URL = 'postgres://hermes:dev@localhost:5432/hermes';
const BATCH_SIZE = 5_000;

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (_pool) return _pool;
  const url = process.env['DATABASE_URL'] ?? DEFAULT_DATABASE_URL;
  _pool = new Pool({ connectionString: url, max: 4 });
  return _pool;
}

export async function endPool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

/**
 * Bulk upsert raw_event_aggregates rows. Batches at BATCH_SIZE (5k) to
 * keep the parameter count under Postgres' 65535-bind-param limit.
 *
 * Returns total rows upserted.
 */
export async function bulkUpsertRawAggregates(rows: RawAggregateRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const pool = getPool();
  let total = 0;

  const client: PoolClient = await pool.connect();
  try {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const placeholders: string[] = [];
      const params: unknown[] = [];
      let p = 1;

      for (const r of batch) {
        placeholders.push(
          `($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, NOW())`,
        );
        params.push(
          r.sourceTable, r.uid, r.eventDate, r.rowCount,
          r.numericSum, r.numericMax, r.numericMin,
          r.lastValue === null ? null : JSON.stringify(r.lastValue),
          r.isSynthesized ?? false,
        );
      }

      const sql = `
        INSERT INTO raw_event_aggregates (
          source_table, uid, event_date, row_count,
          numeric_sum, numeric_max, numeric_min, last_value,
          is_synthesized, computed_at
        ) VALUES ${placeholders.join(',')}
        ON CONFLICT (source_table, uid, event_date) DO UPDATE SET
          row_count      = EXCLUDED.row_count,
          numeric_sum    = EXCLUDED.numeric_sum,
          numeric_max    = EXCLUDED.numeric_max,
          numeric_min    = EXCLUDED.numeric_min,
          last_value     = EXCLUDED.last_value,
          is_synthesized = EXCLUDED.is_synthesized,
          computed_at    = NOW()
      `;
      await client.query(sql, params);
      total += batch.length;
    }
  } finally {
    client.release();
  }

  return total;
}

/**
 * Delete all rows for a given source_table + is_synthesized flag.
 * Used by the synth backfill step to wipe its prior projection before
 * re-projecting.
 */
export async function deleteRawAggregates(sourceTable: string, isSynthesized: boolean): Promise<number> {
  const pool = getPool();
  const res = await pool.query(
    'DELETE FROM raw_event_aggregates WHERE source_table = $1 AND is_synthesized = $2',
    [sourceTable, isSynthesized],
  );
  return res.rowCount ?? 0;
}

/**
 * Stream all real (is_synthesized=false) aggregates for a source table.
 * Used by the synth backfill step. Cursor-style chunks of 10k rows.
 */
export async function* streamRealAggregates(sourceTable: string): AsyncGenerator<RawAggregateRow[]> {
  const pool = getPool();
  const CHUNK = 10_000;
  let lastUid = '';
  let lastEventDate = '1970-01-01';

  while (true) {
    const res = await pool.query(
      `SELECT source_table, uid, event_date::text AS event_date, row_count,
              numeric_sum, numeric_max, numeric_min, last_value, is_synthesized
       FROM raw_event_aggregates
       WHERE source_table = $1 AND is_synthesized = false
         AND (uid, event_date) > ($2, $3)
       ORDER BY uid, event_date
       LIMIT $4`,
      [sourceTable, lastUid, lastEventDate, CHUNK],
    );
    const rowCount = res.rowCount ?? 0;
    if (rowCount === 0) return;
    yield res.rows.map((r): RawAggregateRow => ({
      sourceTable: r.source_table,
      uid: r.uid,
      eventDate: r.event_date,
      rowCount: Number(r.row_count),
      numericSum: r.numeric_sum,
      numericMax: r.numeric_max,
      numericMin: r.numeric_min,
      lastValue: r.last_value,
      isSynthesized: r.is_synthesized,
    }));
    const last = res.rows[res.rows.length - 1];
    lastUid = last.uid;
    lastEventDate = last.event_date;
    if (rowCount < CHUNK) return;
  }
}
