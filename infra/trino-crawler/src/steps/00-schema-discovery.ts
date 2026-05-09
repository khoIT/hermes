/**
 * Step 0: Schema discovery
 *
 * Connects to Trino, runs:
 *   SHOW SCHEMAS FROM <catalog>
 *   SHOW TABLES IN <catalog>.<schema>      (for each schema matching cfm*)
 *   DESCRIBE <catalog>.<schema>.<table>    (for each table)
 *
 * Writes infra/trino-crawler/schema-audit.md.
 *
 * Access-denied fallback: this user's account has SHOW SCHEMAS denied
 * even when the underlying tables are queryable directly. When SHOW
 * SCHEMAS errors with "Access Denied", we skip the listing step and
 * DESCRIBE the known table set (etl_*, std_master_user_profile)
 * directly so the audit reflects real schemas instead of a stub.
 *
 * VPN-down behaviour: on any network error (ECONNREFUSED / ETIMEDOUT /
 * ENOTFOUND / HTTP 4xx before the query executes), writes a STUB audit
 * and exits with code 0 + a clear "stub mode" message.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Trino } from 'trino-client';
import { runQuery, type TrinoConfig } from '../trino.js';

// tsx runs as CJS; import.meta.dirname may be undefined — fall back to __dirname.
const _dirname: string =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export type ColumnMeta = { name: string; type: string };
export type TableMeta = { schema: string; table: string; columns: ColumnMeta[] };
export type SchemaDiscoveryResult = {
  schemas: string[];
  tables: TableMeta[];
  isStub: boolean;
  stubReason?: string;
};

const OUTPUT_FILE = path.resolve(_dirname, '../../schema-audit.md');

/**
 * Known cfm_vn tables — referenced when SHOW SCHEMAS is access-denied
 * but direct table queries succeed. Mirrors the diagnose-trino probe set.
 */
const KNOWN_CFM_VN_TABLES: readonly string[] = [
  'etl_login',
  'etl_logout',
  'etl_game_detail',
  'etl_recharge',
  'etl_moneyflow',
  'etl_appsflyer_installs_datalocker',
  'std_master_user_profile',
];

function isAccessDenied(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /access denied/i.test(err.message);
}

/** Run full discovery; returns result (stub or real). */
export async function runSchemaDiscovery(
  client: Trino,
  cfg: TrinoConfig,
): Promise<SchemaDiscoveryResult> {
  // ── 1. SHOW SCHEMAS ──────────────────────────────────────────────────────
  // Access-denied is not fatal: this user has SHOW SCHEMAS denied even when
  // direct DESCRIBE on iceberg.cfm_vn.<table> succeeds. Fall through to the
  // known table set rather than emitting a stub audit.
  let schemas: string[] = [];
  let useKnownTablesFallback = false;
  try {
    const res = await runQuery(client, `SHOW SCHEMAS FROM ${cfg.catalog}`);
    schemas = res.rows
      .map((r) => String((r as string[])[0]))
      .filter((s) => /^cfm/i.test(s) || s === cfg.schema);
  } catch (err) {
    if (isAccessDenied(err)) {
      console.warn('[step-00] SHOW SCHEMAS denied — falling back to known table list');
      useKnownTablesFallback = true;
      schemas = [cfg.schema];
    } else {
      return writeStub(cfg, networkMessage(err));
    }
  }

  if (schemas.length === 0) {
    // Fallback: use the default schema name even if not confirmed
    schemas.push(cfg.schema);
  }

  // ── 2. SHOW TABLES per matched schema ────────────────────────────────────
  const tables: TableMeta[] = [];

  for (const schema of schemas) {
    let tableNames: string[];
    if (useKnownTablesFallback) {
      tableNames = [...KNOWN_CFM_VN_TABLES];
    } else {
      let tableRows: unknown[][];
      try {
        const res = await runQuery(client, `SHOW TABLES IN ${cfg.catalog}.${schema}`);
        tableRows = res.rows;
      } catch (err) {
        if (isAccessDenied(err)) {
          console.warn(`[step-00] SHOW TABLES denied on ${schema} — falling back to known list`);
          tableRows = [];
        } else {
          return writeStub(cfg, networkMessage(err));
        }
      }
      tableNames = tableRows.map((r) => String((r as string[])[0]));
      if (tableNames.length === 0) tableNames = [...KNOWN_CFM_VN_TABLES];
    }

    // ── 3. DESCRIBE each table ──────────────────────────────────────────────
    for (const tableName of tableNames) {
      let colRows: unknown[][];
      try {
        const res = await runQuery(
          client,
          `DESCRIBE ${cfg.catalog}.${schema}.${tableName}`,
        );
        colRows = res.rows;
      } catch (err) {
        // Non-fatal: record table with empty columns rather than aborting
        console.warn(`  WARN: could not describe ${schema}.${tableName}: ${String(err)}`);
        tables.push({ schema, table: tableName, columns: [] });
        continue;
      }

      // DESCRIBE returns: Column | Type | Extra | Comment
      const columns: ColumnMeta[] = colRows.map((r) => {
        const row = r as string[];
        return { name: row[0] ?? '', type: row[1] ?? '' };
      });

      tables.push({ schema, table: tableName, columns });
    }
  }

  const result: SchemaDiscoveryResult = { schemas, tables, isStub: false };
  writeAuditMarkdown(result, cfg);
  return result;
}

// ── Stub writer ───────────────────────────────────────────────────────────────

function writeStub(cfg: TrinoConfig, reason: string): SchemaDiscoveryResult {
  const ts = new Date().toISOString();
  const md = [
    `# Trino Schema Audit — STUB (VPN down)`,
    ``,
    `> **Status:** VPN not connected — Trino unreachable.`,
    `> Rerun \`pnpm refresh-cfm-data --schema-only\` after connecting VPN.`,
    ``,
    `| Field | Value |`,
    `|---|---|`,
    `| Generated | ${ts} |`,
    `| Attempted host | ${cfg.host}:${cfg.port} |`,
    `| Catalog | ${cfg.catalog} |`,
    `| Expected schema | ${cfg.schema} |`,
    `| Failure reason | ${reason} |`,
    ``,
    `## Expected Tables (from trino-mock bedrock)`,
    ``,
    `These tables are confirmed to exist in the trino-mock JSONL bedrock`,
    `and are expected to be present in \`iceberg.cfm_vn\` once VPN is connected:`,
    ``,
    `| Table | Notes |`,
    `|---|---|`,
    `| \`etl_login\` | Session start events |`,
    `| \`etl_logout\` | Session end + online time |`,
    `| \`etl_game_detail\` | Per-match stats (kills, ladder score, game result) |`,
    `| \`etl_moneyflow\` | In-game currency flow (balance deltas) |`,
    `| \`etl_recharge\` | Real-money purchase events |`,
    `| \`etl_new_register\` | New user registration events |`,
    `| \`etl_appsflyer_installs_datalocker\` | AppsFlyer install attribution |`,
    `| \`etl_match_net_work_stats\` | Per-match network quality |`,
    `| \`std_master_user_profile\` | Unified user profile (install_time, first/last login, total_rev) |`,
    ``,
    `## Next Steps`,
    ``,
    `1. Connect VPN to reach \`${cfg.host}\``,
    `2. Run: \`pnpm refresh-cfm-data --schema-only\``,
    `3. This stub file will be overwritten with the real audit.`,
  ].join('\n');

  fs.writeFileSync(OUTPUT_FILE, md, 'utf-8');
  return {
    schemas: [cfg.schema],
    tables: [],
    isStub: true,
    stubReason: reason,
  };
}

// ── Real audit writer ─────────────────────────────────────────────────────────

function writeAuditMarkdown(result: SchemaDiscoveryResult, cfg: TrinoConfig): void {
  const ts = new Date().toISOString();
  const lines: string[] = [
    `# Trino Schema Audit — iceberg.${result.schemas.join(', ')}`,
    ``,
    `| Field | Value |`,
    `|---|---|`,
    `| Generated | ${ts} |`,
    `| Host | ${cfg.host}:${cfg.port} |`,
    `| Catalog | ${cfg.catalog} |`,
    `| Schemas found | ${result.schemas.join(', ')} |`,
    `| Total tables | ${result.tables.length} |`,
    ``,
  ];

  for (const schema of result.schemas) {
    const schemaTables = result.tables.filter((t) => t.schema === schema);
    lines.push(`## Schema: ${schema} (${schemaTables.length} tables)`);
    lines.push('');

    for (const t of schemaTables) {
      lines.push(`### \`${t.table}\``);
      lines.push('');
      if (t.columns.length === 0) {
        lines.push('_No columns returned (DESCRIBE failed)_');
      } else {
        lines.push('| Column | Type |');
        lines.push('|---|---|');
        for (const c of t.columns) {
          lines.push(`| \`${c.name}\` | \`${c.type}\` |`);
        }
      }
      lines.push('');
    }
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf-8');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function networkMessage(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ECONNREFUSED') return `ECONNREFUSED — Trino port not reachable`;
    if (code === 'ETIMEDOUT' || code === 'ETIMEOUT') return `ETIMEDOUT — connection timed out`;
    if (code === 'ENOTFOUND') return `ENOTFOUND — host not resolvable (DNS/VPN)`;
    return err.message.slice(0, 200);
  }
  return String(err).slice(0, 200);
}
