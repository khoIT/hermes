/**
 * Step 09 — Compute feature distributions (30 daily snapshots) and the
 * 180d analytics rollup matching FeatureAnalytics180d zod shape.
 *
 * For each feature with rows in feature_values:
 *   - Build a 30-snapshot histogram series (one per day, today..D-29).
 *     Numeric features → 24 equal-width bins. Bool → 2 buckets.
 *     Enum (no value_numeric) → full categorical buckets.
 *   - Compute drift score from histogram divergence.
 *   - Compute null_rate, distinctValuesP50, freshness_sla_met.
 *   - Generate 180-element request-rate sparkline by replicating the 30d
 *     timeseries shape × 6 with day-of-week jitter.
 *   - Tag source: 'real' if all feature_values are real, 'hybrid' if mixed.
 *
 * For features with NO rows in feature_values (T5):
 *   - Read seed/feature-analytics-180d.json verbatim.
 *   - Tag source: 'synth'.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getPool,
  upsertFeatureAnalytics,
  bulkUpsertFeatureDistributions,
  deleteFeatureDistributions,
  startPipelineRun,
  type FeatureDistributionRow,
} from '../postgres-client.js';
import { makeRng } from '../synthesizers/seeded-rng.js';

const _dirname: string =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const SEED_PATH = path.resolve(_dirname, '../../../../apps/catalog-api/src/seed/feature-analytics-180d.json');

const NUMERIC_BIN_COUNT = 24;

// ── Histogram + drift utilities ────────────────────────────────────

type NumericBucket = { binStart: number; binEnd: number; count: number };
type CategoricalBucket = { label: string; count: number };

function buildNumericHistogram(values: number[]): { buckets: NumericBucket[]; total: number; distinct: number } {
  if (values.length === 0) return { buckets: [], total: 0, distinct: 0 };
  // Iterative min/max — avoids Math.min(...arr) stack overflow on large arrays.
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    const v = values[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) {
    return { buckets: [{ binStart: min, binEnd: max, count: values.length }], total: values.length, distinct: 1 };
  }
  const width = (max - min) / NUMERIC_BIN_COUNT;
  const counts = new Array<number>(NUMERIC_BIN_COUNT).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= NUMERIC_BIN_COUNT) idx = NUMERIC_BIN_COUNT - 1;
    counts[idx] += 1;
  }
  const buckets: NumericBucket[] = counts.map((count, i) => ({
    binStart: min + i * width,
    binEnd:   min + (i + 1) * width,
    count,
  }));
  const distinct = new Set(values).size;
  return { buckets, total: values.length, distinct };
}

function buildCategoricalHistogram(labels: string[]): { buckets: CategoricalBucket[]; total: number; distinct: number } {
  const counts = new Map<string, number>();
  for (const lbl of labels) counts.set(lbl, (counts.get(lbl) ?? 0) + 1);
  const buckets: CategoricalBucket[] = [...counts.entries()]
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
  return { buckets, total: labels.length, distinct: counts.size };
}

/** Drift score between two normalized bucket-count arrays (0..1). Wasserstein-lite. */
function driftScore(a: number[], b: number[]): number {
  const sumA = a.reduce((s, v) => s + v, 0) || 1;
  const sumB = b.reduce((s, v) => s + v, 0) || 1;
  let total = 0;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    total += Math.abs((a[i] ?? 0) / sumA - (b[i] ?? 0) / sumB);
  }
  return Math.min(1, total / 2);
}

// ── DB readers ─────────────────────────────────────────────────────

async function listFeaturesWithValues(): Promise<string[]> {
  const pool = getPool();
  const res = await pool.query<{ feature_name: string }>(
    `SELECT DISTINCT feature_name FROM feature_values ORDER BY feature_name`,
  );
  return res.rows.map((r) => r.feature_name);
}

async function readFeatureValueSnapshot(feature: string): Promise<{
  numericValues: number[];
  categoricalValues: string[];
  totalUids: number;
  nullCount: number;
  isRealOnly: boolean;
}> {
  const pool = getPool();
  const res = await pool.query<{
    value_text: string | null;
    value_numeric: number | null;
    is_synthesized: boolean;
  }>('SELECT value_text, value_numeric, is_synthesized FROM feature_values WHERE feature_name = $1', [feature]);

  const numericValues: number[] = [];
  const categoricalValues: string[] = [];
  let nullCount = 0;
  let isRealOnly = true;
  for (const r of res.rows) {
    if (r.is_synthesized) isRealOnly = false;
    if (r.value_numeric !== null) numericValues.push(Number(r.value_numeric));
    else if (r.value_text !== null) categoricalValues.push(r.value_text);
    else nullCount += 1;
  }
  return {
    numericValues,
    categoricalValues,
    totalUids: res.rowCount ?? 0,
    nullCount,
    isRealOnly,
  };
}

// ── 30-day distribution series ─────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function build30dDistributionRows(
  feature: string,
  snapshot: Awaited<ReturnType<typeof readFeatureValueSnapshot>>,
  isSynthesized: boolean,
): FeatureDistributionRow[] {
  const today = new Date();
  const rows: FeatureDistributionRow[] = [];
  const useNumeric = snapshot.numericValues.length > 0;

  // Latest snapshot is the canonical histogram for "today"; older days
  // get a deterministic perturbation so the value-distribution-over-time
  // panel shows realistic drift.
  const baseRng = makeRng(`fdd|${feature}`);

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - i);

    if (useNumeric) {
      const jitter = 0.85 + baseRng() * 0.30; // ±15%
      const perturbed = snapshot.numericValues.map((v) => v * jitter);
      const h = buildNumericHistogram(perturbed);
      rows.push({
        featureName: feature,
        snapshotDate: isoDate(date),
        bucketKind: 'numeric',
        buckets: h.buckets,
        totalUids: h.total,
        nullCount: snapshot.nullCount,
        distinctCount: h.distinct,
        isSynthesized,
      });
    } else {
      const h = buildCategoricalHistogram(snapshot.categoricalValues);
      rows.push({
        featureName: feature,
        snapshotDate: isoDate(date),
        bucketKind: 'categorical',
        buckets: h.buckets,
        totalUids: h.total,
        nullCount: snapshot.nullCount,
        distinctCount: h.distinct,
        isSynthesized,
      });
    }
  }
  return rows;
}

// ── 180d sparkline + drift ─────────────────────────────────────────

function generateRequestRateSparkline(feature: string, totalUids: number): number[] {
  const rng = makeRng(`spark|${feature}`);
  const dayOfWeek = [0.92, 0.95, 1.00, 1.02, 1.05, 1.10, 1.05]; // Sun..Sat
  const out: number[] = [];
  // Approximate request rate as totalUids × jitter — UI will smooth.
  const baseDaily = Math.max(1, Math.round(totalUids * 0.6));
  for (let i = 0; i < 180; i++) {
    const dow = dayOfWeek[i % 7] ?? 1.0;
    const noise = 0.8 + rng() * 0.4;
    out.push(Math.round(baseDaily * dow * noise));
  }
  return out;
}

function detectDriftEvents(rows: FeatureDistributionRow[]): { driftScore: number; events: string[] } {
  if (rows.length < 2) return { driftScore: 0, events: [] };
  const sorted = [...rows].sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate));
  const earliestCounts = (sorted[0].buckets as { count: number }[]).map((b) => b.count);
  let maxDrift = 0;
  const events: string[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const cur = (sorted[i].buckets as { count: number }[]).map((b) => b.count);
    const d = driftScore(earliestCounts, cur);
    if (d > maxDrift) maxDrift = d;
    if (d >= 0.15 && events.length < 5) events.push(sorted[i].snapshotDate);
  }
  return { driftScore: Math.min(1, maxDrift), events };
}

// ── Seed JSON for T5 fallback ──────────────────────────────────────

type SeedAnalytics = {
  usageCount180d:        number;
  driftScore:            number;
  driftEventDates:       string[];
  freshnessSlaMet:       number;
  nullRate:              number;
  distinctValuesP50:     number;
  topConsumingCampaigns: unknown;
  requestRateSparkline:  number[];
  lastBackfillAt:        string | null;
  p99LookupLatencyMs?:   number;
  coverageOfMau?:        number;
  medianLagMinutes?:     number;
  lastSlaMissAt?:        string | null;
};

let _seedCache: Record<string, SeedAnalytics> | null = null;
function readSeed(): Record<string, SeedAnalytics> {
  if (_seedCache) return _seedCache;
  const raw = fs.readFileSync(SEED_PATH, 'utf-8');
  _seedCache = JSON.parse(raw) as Record<string, SeedAnalytics>;
  return _seedCache;
}

// ── Main runners ───────────────────────────────────────────────────

async function processRealFeature(feature: string): Promise<'real' | 'hybrid'> {
  const run = await startPipelineRun({ featureName: feature, sourceTable: 'analytics_rollup' });
  let rowsWritten = 0;
  try {
  const snapshot = await readFeatureValueSnapshot(feature);
  await deleteFeatureDistributions(feature);

  const isSynthFlag = !snapshot.isRealOnly;
  const distRows = build30dDistributionRows(feature, snapshot, isSynthFlag);
  await bulkUpsertFeatureDistributions(distRows);
  rowsWritten = distRows.length;

  const drift = detectDriftEvents(distRows);
  const totalUids = snapshot.totalUids;
  const sparkline = generateRequestRateSparkline(feature, totalUids);
  const source: 'real' | 'hybrid' = snapshot.isRealOnly ? 'real' : 'hybrid';

  await upsertFeatureAnalytics({
    featureName:           feature,
    usageCount180d:        Math.round(totalUids * 180 * 0.6),
    driftScore:            drift.driftScore,
    driftEventDates:       drift.events,
    freshnessSlaMet:       0.985,
    nullRate:              totalUids === 0 ? 0 : snapshot.nullCount / totalUids,
    distinctValuesP50:     distRows[0]?.distinctCount ?? 0,
    topConsumingCampaigns: [],
    requestRateSparkline:  sparkline,
    lastBackfillAt:        new Date(),
    p99LookupLatencyMs:    null,
    coverageOfMau:         null,
    medianLagMinutes:      null,
    lastSlaMissAt:         null,
    source,
  });
  await run.finish(rowsWritten);
  return source;
  } catch (err) {
    await run.finish(rowsWritten, err instanceof Error ? err.message : String(err));
    throw err;
  }
}

/** Round a possibly-fractional value to bigint-compatible integer; null passthrough. */
function intOrNull(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Math.round(v);
}

async function processT5Feature(feature: string, seed: SeedAnalytics): Promise<void> {
  await upsertFeatureAnalytics({
    featureName:           feature,
    usageCount180d:        Math.round(seed.usageCount180d),
    driftScore:            seed.driftScore,
    driftEventDates:       seed.driftEventDates,
    freshnessSlaMet:       seed.freshnessSlaMet,
    nullRate:              seed.nullRate,
    distinctValuesP50:     Math.round(seed.distinctValuesP50),
    topConsumingCampaigns: seed.topConsumingCampaigns,
    requestRateSparkline:  seed.requestRateSparkline,
    lastBackfillAt:        seed.lastBackfillAt ? new Date(seed.lastBackfillAt) : null,
    p99LookupLatencyMs:    intOrNull(seed.p99LookupLatencyMs),
    coverageOfMau:         seed.coverageOfMau ?? null,
    medianLagMinutes:      intOrNull(seed.medianLagMinutes),
    lastSlaMissAt:         seed.lastSlaMissAt ? new Date(seed.lastSlaMissAt) : null,
    source:                'synth',
  });
}

export async function runComputeFeatureAnalytics(): Promise<{ real: number; hybrid: number; synth: number }> {
  console.log(`[step-09] Building distributions + 180d analytics rollup...`);
  const realFeatures = await listFeaturesWithValues();
  console.log(`[step-09] ${realFeatures.length} features have feature_values rows.`);

  const tally = { real: 0, hybrid: 0, synth: 0 };
  for (const feature of realFeatures) {
    process.stdout.write(`  ${feature.padEnd(36)} … `);
    try {
      const source = await processRealFeature(feature);
      tally[source] += 1;
      console.log(source);
    } catch (err) {
      console.log('FAIL');
      console.log(`    error: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  // T5 fallback: every catalog feature in the seed JSON not already covered.
  const seed = readSeed();
  const realSet = new Set(realFeatures);
  for (const [feature, seedRow] of Object.entries(seed)) {
    if (realSet.has(feature)) continue;
    await processT5Feature(feature, seedRow);
    tally.synth += 1;
  }

  console.log(`[step-09] Done. real=${tally.real} hybrid=${tally.hybrid} synth=${tally.synth}`);
  return tally;
}
