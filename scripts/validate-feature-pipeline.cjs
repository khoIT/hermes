#!/usr/bin/env node
/**
 * End-to-end validation for the Real Trino Feature Pipeline.
 *
 * Usage:
 *   pnpm --filter @hermes/catalog-api dev   # in another terminal
 *   node scripts/validate-feature-pipeline.cjs
 *
 * Asserts:
 *   - raw_event_aggregates has both real (is_synthesized=false) and synth rows
 *     across all 7 source tables.
 *   - feature_values has rows for ≥40 derivations.
 *   - feature_distributions_daily has ~30 rows per derivation feature.
 *   - feature_analytics_180d has 76 rows (48 real/hybrid + 28 synth).
 *   - GET /api/v1/features returns 76 features.
 *   - GET /api/v1/features/<sample>/distribution?days=30 returns 30 snapshots.
 *
 * Side effect: writes plans/260509-2032-real-trino-feature-pipeline/reports/
 *   feature-provenance-audit.md listing per-feature source + uid count.
 */

const { Client } = require('pg');
const fs = require('node:fs');
const path = require('node:path');

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://hermes:dev@localhost:5432/hermes';
const API = process.env.API_URL ?? 'http://127.0.0.1:3001/api/v1';
const QUERY_API = process.env.QUERY_API_URL ?? 'http://127.0.0.1:3002/api/v1';

const SAMPLE_FEATURES = [
  'account_first_login_ts',     // T1 real
  'account_age_days',           // T2 real
  'mmr_drift_7d',               // T3 real
  'avg_session_duration_30d',   // T4 hybrid (proxy)
  'weapon_count_owned',         // T5 synth
];

const ASSERTIONS = [];
function assert(name, cond, detail) {
  ASSERTIONS.push({ name, ok: !!cond, detail });
  const tag = cond ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log(`[validate] DB: ${DATABASE_URL.replace(/:[^:@/]+@/, ':***@')}`);
  console.log(`[validate] API: ${API}`);
  console.log('');

  const pg = new Client({ connectionString: DATABASE_URL });
  await pg.connect();

  // ── DB layer ───────────────────────────────────────────────────────
  const rea = await pg.query(`
    SELECT source_table,
           COUNT(*) FILTER (WHERE is_synthesized = false) AS real_rows,
           COUNT(*) FILTER (WHERE is_synthesized = true)  AS synth_rows
    FROM raw_event_aggregates
    GROUP BY source_table
    ORDER BY source_table
  `);
  assert(
    'raw_event_aggregates · 7 source tables present',
    rea.rows.length === 7,
    `${rea.rows.length} table(s) found`,
  );
  for (const row of rea.rows) {
    const ok = Number(row.real_rows) > 0 && Number(row.synth_rows) > 0;
    assert(`${row.source_table} has real + synth rows`, ok, `real=${row.real_rows} synth=${row.synth_rows}`);
  }

  const fvCount = await pg.query(`SELECT COUNT(DISTINCT feature_name) AS c, COUNT(*) AS rows FROM feature_values`);
  assert(
    'feature_values · ≥40 features computed',
    Number(fvCount.rows[0].c) >= 40,
    `${fvCount.rows[0].c} features · ${Number(fvCount.rows[0].rows).toLocaleString('en-US')} rows`,
  );

  const fdd = await pg.query(`SELECT COUNT(*) AS rows FROM feature_distributions_daily`);
  assert(
    'feature_distributions_daily has rows',
    Number(fdd.rows[0].rows) > 1000,
    `${Number(fdd.rows[0].rows).toLocaleString('en-US')} rows`,
  );

  const fa = await pg.query(`SELECT source, COUNT(*) AS c FROM feature_analytics_180d GROUP BY source ORDER BY source`);
  const sources = Object.fromEntries(fa.rows.map((r) => [r.source, Number(r.c)]));
  const total = Object.values(sources).reduce((s, n) => s + n, 0);
  assert(
    'feature_analytics_180d · 76 rows across real/hybrid/synth',
    total === 76,
    `real=${sources.real ?? 0} hybrid=${sources.hybrid ?? 0} synth=${sources.synth ?? 0}`,
  );
  assert(
    'feature_analytics_180d · ≥40 sourced from real Trino',
    (sources.real ?? 0) + (sources.hybrid ?? 0) >= 40,
    `real+hybrid=${(sources.real ?? 0) + (sources.hybrid ?? 0)}`,
  );

  // ── API layer ──────────────────────────────────────────────────────
  let apiOk = true;
  try {
    const list = await fetchJson(`${API}/features`);
    assert('GET /features returns 76', Array.isArray(list) && list.length === 76, `count=${list.length}`);

    for (const sample of SAMPLE_FEATURES) {
      try {
        const one = await fetchJson(`${API}/features/${sample}`);
        const ok = one && one.name === sample && one.analytics?.source;
        assert(`GET /features/${sample}`, ok, `source=${one.analytics?.source}`);
      } catch (err) {
        apiOk = false;
        assert(`GET /features/${sample}`, false, err.message);
      }
    }

    try {
      const dist = await fetchJson(`${API}/features/${SAMPLE_FEATURES[1]}/distribution?days=30`);
      assert(
        `GET /features/${SAMPLE_FEATURES[1]}/distribution?days=30 · 30 snapshots`,
        dist?.snapshots?.length === 30,
        `snapshots=${dist?.snapshots?.length}`,
      );
    } catch (err) {
      apiOk = false;
      assert('distribution endpoint', false, err.message);
    }

    // v3 persona endpoints
    try {
      const ac = await fetchJson(`${API}/features/account_age_days/audience-count?op=gt&value=30`);
      assert('GET /features/:n/audience-count', typeof ac.count === 'number' && ac.count > 0, `count=${ac.count} · ${ac.durationMs}ms`);
      assert('audience-count under 500ms', ac.durationMs < 500, `actual=${ac.durationMs}ms`);

      const q = await fetchJson(`${API}/features/account_age_days/quantiles`);
      assert('GET /features/:n/quantiles · 6 percentiles', q.quantiles?.length === 6);

      const s = await fetchJson(`${API}/features/account_age_days/samples?limit=5`);
      assert('GET /features/:n/samples · returns 5', s.samples?.length === 5);

      const ph = await fetchJson(`${API}/features/account_age_days/pipeline-health`);
      assert('GET /features/:n/pipeline-health', Array.isArray(ph.runs));

      const ol = await fetchJson(`${API}/features/account_age_days/outliers?topK=3`);
      assert('GET /features/:n/outliers', ol.outliers?.length > 0, `${ol.outliers?.length} outliers`);

      const cs = await fetchJson(`${API}/features/account_age_days/coverage-segmentation`);
      assert('GET /features/:n/coverage-segmentation', cs.byLifecycle && cs.byRegion && cs.bySpendTier);

      const ts = await fetchJson(`${API}/features/account_age_days/top-segments-using`);
      assert('GET /features/:n/top-segments-using', Array.isArray(ts.segments));

      const corr = await fetchJson(`${API}/features/account_age_days/correlations?topK=3`);
      assert('GET /features/:n/correlations', ['warm','cold','computing'].includes(corr.cacheStatus));
    } catch (err) {
      apiOk = false;
      assert('persona endpoints', false, err.message);
    }
  } catch (err) {
    apiOk = false;
    assert('GET /features (api up)', false, err.message);
    console.log('  hint: start it with `pnpm --filter @hermes/catalog-api dev`');
  }

  // ── query-svc audience-count (Phase 07) ────────────────────────────
  try {
    const res = await fetch(`${QUERY_API}/audience/count`, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ predicate: { leaf: { feature: 'account_age_days', op: 'gt', value: 3000 } } }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    assert('query-svc /audience/count single-leaf', typeof body.count === 'number' && body.count > 0, `count=${body.count} · ${body.durationMs}ms`);

    const r2 = await fetch(`${QUERY_API}/audience/count`, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({
        predicate: {
          all: [
            { leaf: { feature: 'account_age_days', op: 'gt',  value: 2000 } },
            { leaf: { feature: 'vip_status',       op: 'eq',  value: 'vip_max' } },
          ],
        },
      }),
    });
    const body2 = await r2.json();
    assert('query-svc /audience/count AND-of-leafs', typeof body2.count === 'number', `count=${body2.count} · ${body2.durationMs}ms`);
    assert('AND query under 1000ms', body2.durationMs < 1000, `actual=${body2.durationMs}ms`);
  } catch (err) {
    apiOk = false;
    assert('query-svc audience-count', false, err.message);
    console.log('  hint: start it with `pnpm --filter @hermes/query-svc dev`');
  }

  // ── Phase 02 game_id schema ───────────────────────────────────────
  try {
    const r = await pg.query(`SELECT count(*) FILTER (WHERE game_id = 'cfm') AS cfm FROM feature_values`);
    assert('feature_values · game_id populated', Number(r.rows[0].cfm) > 0, `cfm rows=${r.rows[0].cfm}`);
  } catch (err) {
    assert('feature_values game_id check', false, err.message);
  }

  // ── Phase 06 Bedrock cleanup ──────────────────────────────────────
  const fs = require('node:fs');
  const path = require('node:path');
  const bedrockDirs = [
    path.resolve(__dirname, '..', 'apps/catalog-api/src/mappings'),
    path.resolve(__dirname, '..', 'apps/catalog-api/src/master-tables'),
  ];
  for (const dir of bedrockDirs) {
    assert(`bedrock dir absent: ${path.basename(dir)}`, !fs.existsSync(dir));
  }
  try {
    const r = await pg.query(`SELECT to_regclass('public.mappings') AS t1, to_regclass('public.master_tables') AS t2`);
    assert('public.mappings dropped', r.rows[0].t1 === null);
    assert('public.master_tables dropped', r.rows[0].t2 === null);
  } catch (err) {
    assert('bedrock tables dropped', false, err.message);
  }

  // ── Provenance audit ───────────────────────────────────────────────
  const audit = await pg.query(`
    SELECT a.feature_name, a.source, a.drift_score, a.last_backfill_at,
           COUNT(v.uid) FILTER (WHERE v.is_synthesized = false) AS real_uids,
           COUNT(v.uid) FILTER (WHERE v.is_synthesized = true)  AS synth_uids
    FROM feature_analytics_180d a
    LEFT JOIN feature_values v ON v.feature_name = a.feature_name
    GROUP BY a.feature_name, a.source, a.drift_score, a.last_backfill_at
    ORDER BY a.source, a.feature_name
  `);
  const reportPath = path.resolve(
    __dirname,
    '..',
    'plans/260509-2032-real-trino-feature-pipeline/reports/feature-provenance-audit.md',
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const lines = [
    `# Feature Provenance Audit`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `| feature | source | uids (real) | uids (synth) | drift | last backfill |`,
    `|---|---|---|---|---|---|`,
    ...audit.rows.map((r) =>
      `| \`${r.feature_name}\` | ${r.source} | ${Number(r.real_uids).toLocaleString('en-US')} | ${Number(r.synth_uids).toLocaleString('en-US')} | ${Number(r.drift_score).toFixed(4)} | ${r.last_backfill_at?.toISOString?.()?.slice(0, 19) ?? '—'} |`,
    ),
    ``,
    `## Summary`,
    ``,
    `| source | count |`,
    `|---|---|`,
    ...Object.entries(sources).map(([k, v]) => `| ${k} | ${v} |`),
  ];
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  console.log(`\n[validate] provenance audit → ${reportPath}`);

  // ── Final tally ────────────────────────────────────────────────────
  const failed = ASSERTIONS.filter((a) => !a.ok);
  console.log('');
  console.log(`[validate] ${ASSERTIONS.length - failed.length}/${ASSERTIONS.length} assertions passed.`);

  await pg.end();

  if (failed.length > 0) {
    console.error(`[validate] ${failed.length} FAILED:`);
    for (const f of failed) console.error(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`);
    process.exit(1);
  }
  if (!apiOk) process.exit(2);
}

main().catch((err) => {
  console.error('[validate] fatal:', err);
  process.exit(1);
});
