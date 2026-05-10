import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { GAMES, SOURCES, METRICS, FRESHNESS, SEGMENTS } from './fixtures';
import { REAL_CFM_BINDINGS, REAL_BINDING_KEYS } from './real-trino-bindings';
import { seedDataCatalog } from './data-catalog/orchestrator';
import { seedDemoMetricPipelines } from './metric-pipelines/demo-pipelines';
import { seedSampleBoards } from './seed-boards';

// Idempotent seed via ON CONFLICT DO NOTHING — re-runnable.
// Run: `pnpm --filter @hermes/catalog-api db:seed`.
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema });

  // eslint-disable-next-line no-console
  console.log('[seed] inserting games:', GAMES.length);
  for (const g of GAMES) {
    await db.insert(schema.games).values(g).onConflictDoNothing();
  }

  // eslint-disable-next-line no-console
  console.log('[seed] inserting sources:', SOURCES.length);
  for (const s of SOURCES) {
    await db.insert(schema.sources).values(s as never).onConflictDoNothing();
  }

  // eslint-disable-next-line no-console
  console.log('[seed] inserting metrics:', METRICS.length);
  for (const m of METRICS) {
    await db.insert(schema.metrics).values(m as never).onConflictDoNothing();
    for (const g of (m.games as string[])) {
      const gameId = g.toLowerCase() === 'all' ? null : g.toLowerCase();
      if (!gameId) continue;
      // Real CFM bindings (post-Trino recon) win over the category default.
      if (gameId === 'cfm' && REAL_BINDING_KEYS.has(`${m.id}::cfm`)) continue;
      await db.insert(schema.metricSourceBindings).values({
        metricId: m.id,
        gameId,
        sourceTable: m.source ?? `master.${m.category}`,
        masterTable: m.masterTable ?? null,
        columnMap: null,
      }).onConflictDoNothing();
    }
  }

  // eslint-disable-next-line no-console
  console.log('[seed] inserting real CFM bindings:', REAL_CFM_BINDINGS.length);
  for (const b of REAL_CFM_BINDINGS) {
    await db.insert(schema.metricSourceBindings).values({
      metricId: b.metricId,
      gameId: b.gameId,
      sourceTable: b.sourceTable,
      masterTable: b.masterTable,
      columnMap: b.columnMap,
    }).onConflictDoNothing();
  }

  // eslint-disable-next-line no-console
  console.log('[seed] inserting freshness:', FRESHNESS.length);
  for (const f of FRESHNESS) {
    await db.insert(schema.freshness).values(f as never).onConflictDoNothing();
  }

  // eslint-disable-next-line no-console
  console.log('[seed] inserting segments:', SEGMENTS.length);
  for (const s of SEGMENTS) {
    await db.insert(schema.segments).values(s as never).onConflictDoNothing();
  }

  // Bedrock mappings + master_tables seed removed in Phase 06 of plan
  // 260509-2223-feature-store-v3-platform-completion.

  await seedDataCatalog(db, pool);

  // ── Demo connectors (3 rows — BigQuery, Stripe, AppsFlyer) ────────
  // Idempotent: ON CONFLICT DO NOTHING keyed on id.
  console.log('[seed] inserting demo connectors');
  const demoConnectors = [
    {
      id: 'conn_demo_bigquery',
      type: 'bigquery',
      name: 'BigQuery · Analytics DW',
      env: 'production',
      host: 'bigquery.googleapis.com',
      port: null,
      db: 'hermes-prod-analytics',
      user: 'sa-hermes-reader@hermes-prod.iam',
      passEncrypted: Buffer.from('mock-service-account-key-json').toString('base64'),
      status: 'ok',
      lastSyncAt: new Date(Date.now() - 7 * 60_000),  // 7 min ago
      datasetCount: 12,
    },
    {
      id: 'conn_demo_appsflyer',
      type: 'kafka',
      name: 'AppsFlyer · Attribution',
      env: 'production',
      host: 'kafka.appsflyer-mirror.internal',
      port: 9092,
      db: null,
      user: 'bedrock-consumer',
      passEncrypted: Buffer.from('mock-sasl-password').toString('base64'),
      status: 'ok',
      lastSyncAt: new Date(Date.now() - 2 * 60_000),  // 2 min ago
      datasetCount: 4,
    },
    {
      id: 'conn_demo_stripe',
      type: 's3',
      name: 'Stripe · Revenue Export',
      env: 'staging',
      host: 's3.ap-southeast-1.amazonaws.com',
      port: null,
      db: 'bedrock-stripe-exports',
      user: 'AKIAMOCKSTRIPEKEY',
      passEncrypted: Buffer.from('mock-stripe-s3-secret').toString('base64'),
      status: 'ok',
      lastSyncAt: new Date(Date.now() - 45 * 60_000), // 45 min ago
      datasetCount: 3,
    },
  ];
  for (const c of demoConnectors) {
    await db.insert(schema.connectors).values(c as never).onConflictDoNothing();
  }

  // eslint-disable-next-line no-console
  console.log('[seed] inserting demo metric pipelines + materialized values');
  await seedDemoMetricPipelines(db, pool);

  // eslint-disable-next-line no-console
  console.log('[seed] inserting sample LiveOps 2026 boards');
  await seedSampleBoards(db);

  // eslint-disable-next-line no-console
  console.log('[seed] done');
  await pool.end();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed', err);
  process.exit(1);
});
