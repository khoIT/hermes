/**
 * Trino Crawler CLI entry point
 *
 * Usage (via root package.json):
 *   pnpm refresh-cfm-data                   — all steps (synth-only when VPN down)
 *   pnpm refresh-cfm-data --schema-only      — step 0 only
 *   pnpm refresh-cfm-data --features-only    — coverage builder only
 *   pnpm refresh-cfm-data --distributions-only
 *   pnpm refresh-cfm-data --audience-only
 *   pnpm refresh-cfm-data --samples-only
 *   pnpm refresh-cfm-data --events-only
 *   pnpm refresh-cfm-data --demographics-only
 *
 * VPN-down behaviour: steps 1-5 run in synth-only mode (no Trino needed).
 * Credentials are read from the root .env file (two levels up from package).
 */

import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// tsx may run as CJS; handle both ESM and CJS dirname resolution.
const _mainDirname: string =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// Load root .env (repo-root, two dirs above src/).
// infra/trino-crawler/src/ -> infra/trino-crawler/ -> infra/ -> repo-root
dotenv.config({ path: path.resolve(_mainDirname, '../../../.env') });
import { loadTrinoConfig, createTrinoClient } from './trino.js';
import { runSchemaDiscovery } from './steps/00-schema-discovery.js';
import { buildDerivationCoverage, printTierSummary } from './derivation-coverage-builder.js';
import { runFeatureDistributions } from './steps/01-feature-distributions.js';
import { runAudienceCounts } from './steps/02-audience-counts.js';
import { runSamplePlayers } from './steps/03-sample-players.js';
import { runEventVolumes } from './steps/04-event-volumes.js';
import { runSegmentDemographics } from './steps/05-segment-demographics.js';
import { runRawEventAggregates } from './steps/06-raw-event-aggregates.js';
import { runSynthesize30dBackfill } from './steps/07-synthesize-30d-backfill.js';
import { endPool } from './postgres-client.js';

// ── CLI flag parsing ──────────────────────────────────────────────────────────

type RunMode =
  | 'schema-only'
  | 'features-only'
  | 'distributions-only'
  | 'audience-only'
  | 'samples-only'
  | 'events-only'
  | 'demographics-only'
  | 'raw-events-only'
  | 'synth-backfill-only'
  | 'all';

type ParsedArgs = {
  mode: RunMode;
  days: number;
  capRows: number;
};

function parseArgs(argv: string[]): ParsedArgs {
  let mode: RunMode = 'all';
  if (argv.includes('--schema-only'))        mode = 'schema-only';
  else if (argv.includes('--features-only'))      mode = 'features-only';
  else if (argv.includes('--distributions-only')) mode = 'distributions-only';
  else if (argv.includes('--audience-only'))      mode = 'audience-only';
  else if (argv.includes('--samples-only'))       mode = 'samples-only';
  else if (argv.includes('--events-only'))        mode = 'events-only';
  else if (argv.includes('--demographics-only'))  mode = 'demographics-only';
  else if (argv.includes('--raw-events-only'))    mode = 'raw-events-only';
  else if (argv.includes('--synth-backfill-only')) mode = 'synth-backfill-only';

  // Parse --days=N  and --cap=N  from argv. Defaults: 7d, 500k rows/table.
  const findVal = (flag: string, fallback: number): number => {
    const arg = argv.find((a) => a.startsWith(`${flag}=`));
    if (!arg) return fallback;
    const n = Number(arg.split('=')[1]);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  return {
    mode,
    days:    findVal('--days', 7),
    capRows: findVal('--cap', 500_000),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { mode, days, capRows } = parseArgs(process.argv.slice(2));

  // Steps 1-5 are synth-only (no Trino connection needed).
  // Run them first when a step-specific flag is given.
  if (mode === 'distributions-only') {
    await runFeatureDistributions();
    console.log('\n[crawler] Done.');
    return;
  }
  if (mode === 'audience-only') {
    await runAudienceCounts();
    console.log('\n[crawler] Done.');
    return;
  }
  if (mode === 'samples-only') {
    await runSamplePlayers();
    console.log('\n[crawler] Done.');
    return;
  }
  if (mode === 'events-only') {
    await runEventVolumes();
    console.log('\n[crawler] Done.');
    return;
  }
  if (mode === 'demographics-only') {
    await runSegmentDemographics();
    console.log('\n[crawler] Done.');
    return;
  }
  if (mode === 'raw-events-only') {
    await runRawEventAggregates({ days, capRows });
    await endPool();
    console.log('\n[crawler] Done.');
    return;
  }
  if (mode === 'synth-backfill-only') {
    await runSynthesize30dBackfill();
    await endPool();
    console.log('\n[crawler] Done.');
    return;
  }

  // Load Trino config from env — throws with clear message if vars are missing.
  let cfg;
  try {
    cfg = loadTrinoConfig();
  } catch (err) {
    console.error(`[crawler] Config error: ${String(err)}`);
    process.exit(1);
  }

  console.log(`[crawler] Connecting to Trino @ ${cfg.host}:${cfg.port} ...`);
  console.log(`[crawler] Catalog: ${cfg.catalog}  Schema: ${cfg.schema}`);
  console.log(`[crawler] Mode: ${mode}`);
  console.log('');

  const client = createTrinoClient(cfg);

  // ── Step 0: Schema discovery ────────────────────────────────────────────
  const runSchema = mode === 'schema-only' || mode === 'all';
  const runFeatures = mode === 'features-only' || mode === 'all';

  let discoveryResult;

  if (runSchema || runFeatures) {
    // Schema discovery is always needed — even in features-only mode —
    // because the coverage builder uses discovered tables for tier validation.
    discoveryResult = await runSchemaDiscovery(client, cfg);

    if (discoveryResult.isStub) {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  VPN-down · stub mode · schema-audit.md written as placeholder');
      console.log(`  Reason: ${discoveryResult.stubReason ?? 'unknown'}`);
      console.log('  Rerun after connecting VPN:');
      console.log('    pnpm refresh-cfm-data --schema-only');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      const tableCount = discoveryResult.tables.length;
      const schemaList = discoveryResult.schemas.join(', ');
      console.log(`[crawler] Connected · schemas found: ${schemaList}`);
      console.log(`[crawler] Tables discovered: ${tableCount}`);
      if (runSchema) {
        console.log(`[crawler] schema-audit.md written`);
      }
    }
  }

  // ── Derivation coverage builder ─────────────────────────────────────────
  if (runFeatures) {
    if (!discoveryResult) {
      discoveryResult = await runSchemaDiscovery(client, cfg);
    }

    const coverage = buildDerivationCoverage(discoveryResult);
    console.log(`[crawler] derivation-coverage.json written (${coverage.length} features)`);
    printTierSummary(coverage);

    if (discoveryResult.isStub) {
      console.log('');
      console.log('  Coverage tiers are HEURISTIC (VPN down). Rerun with VPN');
      console.log('  connected to confirm against real iceberg.cfm_vn schema.');
    }
  }

  // ── Step 06: Real raw aggregates from Trino (always in 'all' mode) ─────
  // Runs BEFORE steps 1-5 so synth steps can reference real distributions.
  if (mode === 'all' && !discoveryResult?.isStub) {
    console.log('');
    console.log(`[crawler] Step 06: pulling ${days}d real aggregates into Postgres...`);
    await runRawEventAggregates({ days, capRows });

    console.log('');
    console.log('[crawler] Step 07: projecting 23d synth backfill...');
    await runSynthesize30dBackfill();
  }

  // ── Steps 1-5: Synth fixtures (always run in 'all' mode) ───────────────
  if (mode === 'all') {
    console.log('');
    console.log('[crawler] Running steps 1-5 (synth-only mode — VPN not required)...');
    await runFeatureDistributions();
    await runAudienceCounts();
    await runSamplePlayers();
    await runEventVolumes();
    await runSegmentDemographics();
  }

  await endPool();
  console.log('');
  console.log('[crawler] Done.');
}

main().catch((err: unknown) => {
  console.error('[crawler] Fatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
