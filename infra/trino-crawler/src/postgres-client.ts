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

// ── feature_values ──────────────────────────────────────────────────

export type FeatureValueRow = {
  featureName:    string;
  uid:            string;
  valueText:      string | null;
  valueNumeric:   number | null;
  isSynthesized:  boolean;
};

/** Wipe all rows for a feature; used for idempotent rewrites. */
export async function deleteFeatureValues(featureName: string): Promise<number> {
  const pool = getPool();
  const res = await pool.query('DELETE FROM feature_values WHERE feature_name = $1', [featureName]);
  return res.rowCount ?? 0;
}

export async function bulkUpsertFeatureValues(rows: FeatureValueRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const pool = getPool();
  let total = 0;
  const client = await pool.connect();
  try {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const placeholders: string[] = [];
      const params: unknown[] = [];
      let p = 1;
      for (const r of batch) {
        placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, NOW())`);
        params.push(r.featureName, r.uid, r.valueText, r.valueNumeric, r.isSynthesized);
      }
      await client.query(
        `INSERT INTO feature_values (feature_name, uid, value_text, value_numeric, is_synthesized, computed_at)
         VALUES ${placeholders.join(',')}
         ON CONFLICT (feature_name, uid) DO UPDATE SET
           value_text     = EXCLUDED.value_text,
           value_numeric  = EXCLUDED.value_numeric,
           is_synthesized = EXCLUDED.is_synthesized,
           computed_at    = NOW()`,
        params,
      );
      total += batch.length;
    }
  } finally {
    client.release();
  }
  return total;
}

// ── feature_distributions_daily ────────────────────────────────────

export type FeatureDistributionRow = {
  featureName:    string;
  snapshotDate:   string;
  bucketKind:     'numeric' | 'categorical';
  buckets:        unknown;
  totalUids:      number;
  nullCount:      number;
  distinctCount:  number;
  isSynthesized:  boolean;
};

export async function deleteFeatureDistributions(featureName: string): Promise<number> {
  const pool = getPool();
  const res = await pool.query('DELETE FROM feature_distributions_daily WHERE feature_name = $1', [featureName]);
  return res.rowCount ?? 0;
}

export async function bulkUpsertFeatureDistributions(rows: FeatureDistributionRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const pool = getPool();
  const client = await pool.connect();
  try {
    const placeholders: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    for (const r of rows) {
      placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, NOW())`);
      params.push(
        r.featureName, r.snapshotDate, r.bucketKind,
        JSON.stringify(r.buckets),
        r.totalUids, r.nullCount, r.distinctCount, r.isSynthesized,
      );
    }
    await client.query(
      `INSERT INTO feature_distributions_daily (
         feature_name, snapshot_date, bucket_kind, buckets,
         total_uids, null_count, distinct_count, is_synthesized, computed_at
       ) VALUES ${placeholders.join(',')}
       ON CONFLICT (feature_name, snapshot_date) DO UPDATE SET
         bucket_kind     = EXCLUDED.bucket_kind,
         buckets         = EXCLUDED.buckets,
         total_uids      = EXCLUDED.total_uids,
         null_count      = EXCLUDED.null_count,
         distinct_count  = EXCLUDED.distinct_count,
         is_synthesized  = EXCLUDED.is_synthesized,
         computed_at     = NOW()`,
      params,
    );
  } finally {
    client.release();
  }
  return rows.length;
}

// ── feature_analytics_180d ─────────────────────────────────────────

export type FeatureAnalyticsRow = {
  featureName:           string;
  usageCount180d:        number;
  driftScore:            number;
  driftEventDates:       string[];
  freshnessSlaMet:       number;
  nullRate:              number;
  distinctValuesP50:     number;
  topConsumingCampaigns: unknown;
  requestRateSparkline:  number[];
  lastBackfillAt:        Date | null;
  p99LookupLatencyMs:    number | null;
  coverageOfMau:         number | null;
  medianLagMinutes:      number | null;
  lastSlaMissAt:         Date | null;
  source:                'real' | 'hybrid' | 'synth';
};

// ── feature_pipeline_runs ──────────────────────────────────────────

export type PipelineRunStart = {
  featureName:  string;
  sourceTable:  string | null;
};

/**
 * Record a pipeline run row. Returns id; close() the run when done.
 * Used by step 08 (per derivation) and step 09 (per analytics rollup).
 */
export async function startPipelineRun(args: PipelineRunStart): Promise<{
  id: string;
  startedAt: number;
  finish: (rowsWritten: number, error?: string | null) => Promise<void>;
}> {
  const pool = getPool();
  const startedAt = Date.now();
  const res = await pool.query<{ id: string }>(
    `INSERT INTO feature_pipeline_runs (feature_name, source_table) VALUES ($1, $2) RETURNING id`,
    [args.featureName, args.sourceTable],
  );
  const id = res.rows[0]?.id;
  if (!id) throw new Error('feature_pipeline_runs INSERT did not return id');
  return {
    id,
    startedAt,
    finish: async (rowsWritten: number, error: string | null = null) => {
      const durationMs = Date.now() - startedAt;
      await pool.query(
        `UPDATE feature_pipeline_runs SET finished_at = NOW(), rows_written = $2, duration_ms = $3, error = $4 WHERE id = $1`,
        [id, rowsWritten, durationMs, error],
      );
    },
  };
}

export async function upsertFeatureAnalytics(row: FeatureAnalyticsRow): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO feature_analytics_180d (
       feature_name, usage_count_180d, drift_score, drift_event_dates,
       freshness_sla_met, null_rate, distinct_values_p50,
       top_consuming_campaigns, request_rate_sparkline, last_backfill_at,
       p99_lookup_latency_ms, coverage_of_mau, median_lag_minutes,
       last_sla_miss_at, source, computed_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
     ON CONFLICT (feature_name) DO UPDATE SET
       usage_count_180d        = EXCLUDED.usage_count_180d,
       drift_score             = EXCLUDED.drift_score,
       drift_event_dates       = EXCLUDED.drift_event_dates,
       freshness_sla_met       = EXCLUDED.freshness_sla_met,
       null_rate               = EXCLUDED.null_rate,
       distinct_values_p50     = EXCLUDED.distinct_values_p50,
       top_consuming_campaigns = EXCLUDED.top_consuming_campaigns,
       request_rate_sparkline  = EXCLUDED.request_rate_sparkline,
       last_backfill_at        = EXCLUDED.last_backfill_at,
       p99_lookup_latency_ms   = EXCLUDED.p99_lookup_latency_ms,
       coverage_of_mau         = EXCLUDED.coverage_of_mau,
       median_lag_minutes      = EXCLUDED.median_lag_minutes,
       last_sla_miss_at        = EXCLUDED.last_sla_miss_at,
       source                  = EXCLUDED.source,
       computed_at             = NOW()`,
    [
      row.featureName, row.usageCount180d, row.driftScore,
      JSON.stringify(row.driftEventDates),
      row.freshnessSlaMet, row.nullRate, row.distinctValuesP50,
      JSON.stringify(row.topConsumingCampaigns),
      JSON.stringify(row.requestRateSparkline),
      row.lastBackfillAt,
      row.p99LookupLatencyMs, row.coverageOfMau, row.medianLagMinutes,
      row.lastSlaMissAt, row.source,
    ],
  );
}

/**
 * Stream ALL aggregates (real + synth) for a source table, sorted by
 * (uid, event_date) so consumers can group by uid in O(1) memory.
 */
export async function* streamAllAggregates(sourceTable: string): AsyncGenerator<RawAggregateRow[]> {
  const pool = getPool();
  const CHUNK = 10_000;
  let lastUid = '';
  let lastEventDate = '1970-01-01';

  while (true) {
    const res = await pool.query(
      `SELECT source_table, uid, event_date::text AS event_date, row_count,
              numeric_sum, numeric_max, numeric_min, last_value, is_synthesized
       FROM raw_event_aggregates
       WHERE source_table = $1
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
