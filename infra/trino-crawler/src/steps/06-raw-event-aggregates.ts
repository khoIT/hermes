/**
 * Step 06 — Raw event aggregates.
 *
 * Pulls per-uid daily rollups for each of the 7 source tables in
 * iceberg.cfm_vn over the last `days` days (default 7) into the local
 * Postgres `raw_event_aggregates` table.
 *
 * Idempotent: ON CONFLICT DO UPDATE updates numeric metrics +
 * computed_at without changing rowcount.
 *
 * Per-table failures are logged and skipped — the run continues so a
 * single access-denied table doesn't block the others (Phase 04 will
 * see those features fall back to the synth path).
 */

import { createTrinoClient, loadTrinoConfig, runQuery } from '../trino.js';
import { bulkUpsertRawAggregates, type RawAggregateRow } from '../postgres-client.js';
import { AGGREGATE_BUILDERS, SOURCE_TABLES, type SourceTable } from '../queries/aggregate-queries.js';

export type RunOpts = {
  days?:    number;   // default 7
  capRows?: number;   // default 500_000 per table
};

type PerTableResult = {
  table:        SourceTable;
  ok:           boolean;
  rowsFromTrino: number;
  rowsUpserted: number;
  trinoMs:      number;
  pgMs:         number;
  error:        string | null;
};

/**
 * Convert a Trino result row (as returned by trino-client — array of
 * untyped values in column order) into a RawAggregateRow. Column order
 * is fixed by all builders: uid, event_date, row_count, numeric_sum,
 * numeric_max, numeric_min, last_value.
 */
function trinoRowToAggregate(table: SourceTable, row: unknown[]): RawAggregateRow {
  const [uid, eventDate, rowCount, numSum, numMax, numMin, lastValue] = row;

  // last_value comes back as a JSON string from json_format; we leave
  // it as already-encoded JSON inside the JSONB column. Normalize null.
  let lastValueParsed: Record<string, unknown> | null = null;
  if (typeof lastValue === 'string' && lastValue.length > 0) {
    try {
      lastValueParsed = JSON.parse(lastValue) as Record<string, unknown>;
    } catch {
      lastValueParsed = { raw: lastValue };
    }
  } else if (lastValue !== null && typeof lastValue === 'object') {
    lastValueParsed = lastValue as Record<string, unknown>;
  }

  return {
    sourceTable:    table,
    uid:            String(uid),
    eventDate:      typeof eventDate === 'string' ? eventDate : String(eventDate),
    rowCount:       Number(rowCount) || 0,
    numericSum:     numSum === null ? null : Number(numSum),
    numericMax:     numMax === null ? null : Number(numMax),
    numericMin:     numMin === null ? null : Number(numMin),
    lastValue:      lastValueParsed,
    isSynthesized:  false,
  };
}

async function pullOneTable(
  client: ReturnType<typeof createTrinoClient>,
  table: SourceTable,
  days: number,
  capRows: number,
): Promise<PerTableResult> {
  const sql = AGGREGATE_BUILDERS[table](days, capRows);

  const trinoStart = Date.now();
  let trinoRows: unknown[][] = [];
  try {
    const res = await runQuery(client, sql, capRows);
    trinoRows = res.rows;
  } catch (err) {
    return {
      table,
      ok: false,
      rowsFromTrino: 0,
      rowsUpserted: 0,
      trinoMs: Date.now() - trinoStart,
      pgMs: 0,
      error: err instanceof Error ? err.message.slice(0, 300) : String(err),
    };
  }
  const trinoMs = Date.now() - trinoStart;

  const aggregates = trinoRows.map((r) => trinoRowToAggregate(table, r));

  const pgStart = Date.now();
  const upserted = await bulkUpsertRawAggregates(aggregates);
  const pgMs = Date.now() - pgStart;

  return {
    table,
    ok: true,
    rowsFromTrino: trinoRows.length,
    rowsUpserted: upserted,
    trinoMs,
    pgMs,
    error: null,
  };
}

export async function runRawEventAggregates(opts: RunOpts = {}): Promise<PerTableResult[]> {
  const days = opts.days ?? 7;
  const capRows = opts.capRows ?? 500_000;

  const cfg = loadTrinoConfig();
  console.log(`[step-06] Pulling ${days}d of aggregates from ${cfg.catalog}.${cfg.schema} (cap ${capRows.toLocaleString('en-US')} rows/table)`);
  const client = createTrinoClient(cfg);

  const results: PerTableResult[] = [];
  for (const table of SOURCE_TABLES) {
    process.stdout.write(`  ${table.padEnd(40)} … `);
    const r = await pullOneTable(client, table, days, capRows);
    results.push(r);
    if (r.ok) {
      console.log(
        `OK · trino ${r.trinoMs}ms · pg ${r.pgMs}ms · ${r.rowsUpserted.toLocaleString('en-US')} rows`,
      );
    } else {
      console.log(`FAIL (${r.error?.slice(0, 120)})`);
    }
  }

  const reachable = results.filter((r) => r.ok).length;
  console.log(`[step-06] ${reachable}/${results.length} tables ingested.`);
  return results;
}
