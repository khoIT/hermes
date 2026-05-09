/**
 * Step 08 — Compute per-uid feature values.
 *
 * For each registered Derivation:
 *   1. Wipe prior feature_values rows for that feature.
 *   2. Stream raw_event_aggregates rows ordered by (uid, event_date) for
 *      the source table the derivation reads.
 *   3. Group by uid (rows arrive contiguously thanks to ORDER BY).
 *   4. Apply derivation.compute(rowsForOneUid) to produce a single
 *      FeatureValueRow per uid.
 *   5. Bulk upsert into feature_values.
 *
 * The derivation framework currently assumes each Derivation reads from
 * exactly one source table — keeps the streaming logic simple. If a future
 * derivation needs multi-source joins, swap in a Map<uid, RawAggregateRow[]>
 * pre-load at the top.
 */

import {
  bulkUpsertFeatureValues,
  deleteFeatureValues,
  streamAllAggregates,
  type FeatureValueRow,
  type RawAggregateRow,
} from '../postgres-client.js';
import { ALL_DERIVATIONS, type Derivation } from '../derivations/index.js';

const TODAY = new Date(); // captured once so all derivations agree on "now"
const FLUSH_BATCH = 5_000;

type PerFeatureResult = {
  feature:      string;
  sourceTables: readonly string[];
  uidsScanned:  number;
  valuesWritten: number;
  durationMs:   number;
};

async function emitForUid(
  d: Derivation,
  bufferRowsByUid: { uid: string; rows: RawAggregateRow[] },
  outBuffer: FeatureValueRow[],
): Promise<void> {
  if (bufferRowsByUid.rows.length === 0) return;
  const result = d.compute(bufferRowsByUid.rows, TODAY);
  if (!result) return;
  // Provenance: a feature value is "synth" only when ALL underlying
  // aggregate rows for this uid are synth. Mixed → real (real anchors win).
  const allSynth = bufferRowsByUid.rows.every((r) => r.isSynthesized);
  outBuffer.push({
    featureName: d.feature,
    uid: result.uid || bufferRowsByUid.uid,
    valueText: result.valueText,
    valueNumeric: result.valueNumeric,
    isSynthesized: allSynth,
  });
}

async function runOneDerivation(d: Derivation): Promise<PerFeatureResult> {
  const start = Date.now();
  await deleteFeatureValues(d.feature);

  const sourceTable = d.sourceTables[0]; // single-source assumption (see header)

  let uidsScanned = 0;
  let valuesWritten = 0;
  let outBuffer: FeatureValueRow[] = [];
  let currentUid = '';
  let currentRows: RawAggregateRow[] = [];

  for await (const chunk of streamAllAggregates(sourceTable)) {
    for (const row of chunk) {
      if (row.uid !== currentUid) {
        // boundary: flush previous uid's accumulator
        if (currentUid) {
          await emitForUid(d, { uid: currentUid, rows: currentRows }, outBuffer);
          uidsScanned += 1;
        }
        currentUid = row.uid;
        currentRows = [row];
      } else {
        currentRows.push(row);
      }
      if (outBuffer.length >= FLUSH_BATCH) {
        valuesWritten += await bulkUpsertFeatureValues(outBuffer);
        outBuffer = [];
      }
    }
  }
  // flush last uid + any remaining buffered values
  if (currentUid) {
    await emitForUid(d, { uid: currentUid, rows: currentRows }, outBuffer);
    uidsScanned += 1;
  }
  if (outBuffer.length > 0) {
    valuesWritten += await bulkUpsertFeatureValues(outBuffer);
  }

  return {
    feature: d.feature,
    sourceTables: d.sourceTables,
    uidsScanned,
    valuesWritten,
    durationMs: Date.now() - start,
  };
}

export async function runComputeFeatureValues(): Promise<PerFeatureResult[]> {
  console.log(`[step-08] Computing per-uid feature values for ${ALL_DERIVATIONS.length} derivations...`);
  const results: PerFeatureResult[] = [];
  for (const d of ALL_DERIVATIONS) {
    process.stdout.write(`  ${d.feature.padEnd(36)} … `);
    const r = await runOneDerivation(d);
    results.push(r);
    console.log(`${r.valuesWritten.toLocaleString('en-US')} values · ${r.uidsScanned.toLocaleString('en-US')} uids scanned · ${r.durationMs}ms`);
  }
  const total = results.reduce((s, r) => s + r.valuesWritten, 0);
  console.log(`[step-08] Done. ${total.toLocaleString('en-US')} feature values written.`);
  return results;
}
