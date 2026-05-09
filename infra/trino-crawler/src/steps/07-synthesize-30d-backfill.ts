/**
 * Step 07 — 30d synthesis backfill.
 *
 * Reads the 7d real (is_synthesized=false) rows from raw_event_aggregates,
 * projects 23 days backwards per uid via the timeline-projector, and
 * upserts the synthesized rows tagged is_synthesized=true.
 *
 * Idempotent: deletes prior synth rows for each source_table before
 * re-inserting. Real rows are untouched.
 *
 * Per-source streaming: never holds the full projection in memory; chunks
 * at 5_000 rows when bulk-upserting.
 */

import {
  bulkUpsertRawAggregates,
  deleteRawAggregates,
  streamRealAggregates,
  type RawAggregateRow,
} from '../postgres-client.js';
import { projectChunked } from '../synthesizers/timeline-projector.js';
import { SOURCE_TABLES, type SourceTable } from '../queries/aggregate-queries.js';

const PROJECT_DAYS = 23;
const UPSERT_CHUNK = 5_000;

export type RunOpts = { daysToProject?: number };

type PerTableResult = {
  table:       SourceTable;
  realRows:    number;
  uids:        number;
  synthRows:   number;
  durationMs:  number;
};

function groupByUid(rows: RawAggregateRow[]): Map<string, RawAggregateRow[]> {
  const m = new Map<string, RawAggregateRow[]>();
  for (const r of rows) {
    const arr = m.get(r.uid);
    if (arr) arr.push(r); else m.set(r.uid, [r]);
  }
  return m;
}

async function runOne(table: SourceTable, daysToProject: number): Promise<PerTableResult> {
  const start = Date.now();

  // Step 1: wipe prior synth rows for this table — keeps re-runs clean.
  await deleteRawAggregates(table, true);

  // Step 2: stream real aggregates, group by uid in memory per chunk.
  // 10k-row chunks from streamRealAggregates ⇒ ~5-7k unique uids/chunk.
  let realRows = 0;
  let synthRows = 0;
  let uidsTotal = 0;

  for await (const chunk of streamRealAggregates(table)) {
    realRows += chunk.length;
    const byUid = groupByUid(chunk);
    uidsTotal += byUid.size;

    for (const projected of projectChunked(table, byUid, daysToProject, UPSERT_CHUNK)) {
      const upserted = await bulkUpsertRawAggregates(projected);
      synthRows += upserted;
    }
  }

  return { table, realRows, uids: uidsTotal, synthRows, durationMs: Date.now() - start };
}

export async function runSynthesize30dBackfill(opts: RunOpts = {}): Promise<PerTableResult[]> {
  const days = opts.daysToProject ?? PROJECT_DAYS;
  console.log(`[step-07] Projecting ${days}d of synth backfill from real 7d window...`);

  const results: PerTableResult[] = [];
  for (const table of SOURCE_TABLES) {
    process.stdout.write(`  ${table.padEnd(40)} … `);
    const r = await runOne(table, days);
    results.push(r);
    console.log(
      `${r.realRows.toLocaleString('en-US')} real → ${r.synthRows.toLocaleString('en-US')} synth (${r.uids.toLocaleString('en-US')} uids · ${r.durationMs}ms)`,
    );
  }

  const totalSynth = results.reduce((s, r) => s + r.synthRows, 0);
  const totalReal  = results.reduce((s, r) => s + r.realRows, 0);
  console.log(`[step-07] Done. ${totalReal.toLocaleString('en-US')} real → ${totalSynth.toLocaleString('en-US')} synth rows.`);
  return results;
}
