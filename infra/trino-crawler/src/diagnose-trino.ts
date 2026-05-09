/**
 * Trino reachability diagnostic.
 *
 * Bypasses SHOW SCHEMAS (access-denied for cfm_vn user) and probes each
 * expected source table directly with a bounded count query.
 *
 * Usage:
 *   pnpm --filter @hermes/trino-crawler diagnose
 *
 * Exit codes:
 *   0  — at least one table reachable (continue Phase 01+)
 *   1  — config / credentials missing
 *   2  — every table query failed (escalate; VPN/auth blocker)
 *
 * Output: writes infra/trino-crawler/trino-diagnostic.md with a per-table
 * reachability + latency + recent-row-count summary that downstream phases
 * can read to know which features to keep on the synth path.
 */

import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTrinoConfig, createTrinoClient, runQuery, type TrinoConfig } from './trino.js';

const _dirname: string =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(_dirname, '../../../.env') });

const OUTPUT_FILE = path.resolve(_dirname, '../trino-diagnostic.md');

// Tables we expect in iceberg.cfm_vn. Each entry encodes the date column
// to use for the bounded count, so we never do an unbounded SELECT.
type TableProbe = {
  table: string;
  dateColumn: string;
  notes: string;
};

const PROBES: TableProbe[] = [
  { table: 'etl_login',                           dateColumn: 'dteventtime',      notes: 'Session start events' },
  { table: 'etl_logout',                          dateColumn: 'dteventtime',      notes: 'Session end + online time' },
  { table: 'etl_game_detail',                     dateColumn: 'dteventtime',      notes: 'Per-match stats' },
  { table: 'etl_recharge',                        dateColumn: 'dteventtime',      notes: 'Real-money purchases' },
  { table: 'etl_moneyflow',                       dateColumn: 'dteventtime',      notes: 'In-game currency flow' },
  { table: 'etl_appsflyer_installs_datalocker',   dateColumn: 'install_time',     notes: 'AppsFlyer install attribution' },
  { table: 'std_master_user_profile',             dateColumn: 'last_login_time',  notes: 'Unified user profile' },
];

type ProbeResult = {
  table: string;
  ok: boolean;
  latencyMs: number;
  rowsLast7d: number | null;
  error: string | null;
};

async function probe(client: ReturnType<typeof createTrinoClient>, cfg: TrinoConfig, p: TableProbe): Promise<ProbeResult> {
  const sql = `SELECT count(*) AS c FROM ${cfg.catalog}.${cfg.schema}.${p.table} WHERE ${p.dateColumn} >= current_date - INTERVAL '7' DAY`;
  const start = Date.now();
  try {
    const res = await runQuery(client, sql, 1);
    const latencyMs = Date.now() - start;
    const c = res.rows[0]?.[0];
    const rowsLast7d = typeof c === 'number' ? c : Number(String(c));
    return {
      table: p.table,
      ok: true,
      latencyMs,
      rowsLast7d: Number.isFinite(rowsLast7d) ? rowsLast7d : null,
      error: null,
    };
  } catch (err) {
    return {
      table: p.table,
      ok: false,
      latencyMs: Date.now() - start,
      rowsLast7d: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function writeMarkdown(cfg: TrinoConfig, results: ProbeResult[]): void {
  const reachable = results.filter((r) => r.ok).length;
  const ts = new Date().toISOString();
  const fmt = (n: number | null): string => (n === null ? '—' : n.toLocaleString('en-US'));

  const lines: string[] = [
    `# Trino Reachability Diagnostic`,
    ``,
    `| Field | Value |`,
    `|---|---|`,
    `| Generated | ${ts} |`,
    `| Host | ${cfg.host}:${cfg.port} |`,
    `| Catalog | ${cfg.catalog} |`,
    `| Schema | ${cfg.schema} |`,
    `| Tables reachable | ${reachable} / ${results.length} |`,
    ``,
    `## Per-table probe (last-7d row count)`,
    ``,
    `| Table | OK | Latency (ms) | Rows last 7d | Error |`,
    `|---|---|---|---|---|`,
    ...results.map((r) =>
      `| \`${r.table}\` | ${r.ok ? '✓' : '✗'} | ${r.latencyMs} | ${fmt(r.rowsLast7d)} | ${r.error ? r.error.slice(0, 200) : '—'} |`,
    ),
    ``,
    reachable === 0
      ? `> **Blocker:** zero tables reachable. Check VPN + Trino credentials. Phase 02+ cannot proceed.`
      : reachable < results.length
        ? `> **Partial:** ${results.length - reachable} table(s) unreachable. Features sourced from those tables will fall back to the synth path.`
        : `> **All tables reachable.** Phase 02 (7d real pull) can proceed.`,
  ];

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf-8');
}

async function main(): Promise<void> {
  let cfg: TrinoConfig;
  try {
    cfg = loadTrinoConfig();
  } catch (err) {
    console.error(`[diagnose] Config error: ${String(err)}`);
    process.exit(1);
  }

  console.log(`[diagnose] Probing ${cfg.catalog}.${cfg.schema} @ ${cfg.host}:${cfg.port}`);
  const client = createTrinoClient(cfg);

  const results: ProbeResult[] = [];
  for (const p of PROBES) {
    process.stdout.write(`  ${p.table.padEnd(40)} … `);
    const r = await probe(client, cfg, p);
    results.push(r);
    if (r.ok) {
      console.log(`OK (${r.latencyMs}ms · ${r.rowsLast7d?.toLocaleString('en-US') ?? '?'} rows)`);
    } else {
      console.log(`FAIL (${r.error?.slice(0, 120) ?? 'unknown'})`);
    }
  }

  writeMarkdown(cfg, results);
  console.log('');
  console.log(`[diagnose] Report written: ${OUTPUT_FILE}`);

  const reachable = results.filter((r) => r.ok).length;
  if (reachable === 0) {
    console.error(`[diagnose] BLOCKER: zero tables reachable. Phase 02+ cannot proceed.`);
    process.exit(2);
  }
  console.log(`[diagnose] ${reachable}/${results.length} tables reachable.`);
}

main().catch((err: unknown) => {
  console.error('[diagnose] Fatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
