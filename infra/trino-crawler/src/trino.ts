/**
 * Trino client wrapper for the crawler.
 *
 * Constructs the client directly from env vars (dotenv already loaded in
 * main.ts) without requiring NestJS ConfigService, since this is a plain
 * CLI tool. The query execution logic mirrors apps/query-svc/src/driver/
 * trino-client.ts but is intentionally standalone so the crawler has no
 * workspace-import boundary issues.
 */

import { Trino, BasicAuth } from 'trino-client';

export type TrinoQueryResult = {
  columns: string[];
  rows: unknown[][];
  ms: number;
};

export type TrinoConfig = {
  host: string;
  port: string;
  user: string;
  password: string;
  catalog: string;
  schema: string;
  connectTimeoutMs: number;
};

/** Build config from process.env — throws with a clear message if required vars are missing. */
export function loadTrinoConfig(): TrinoConfig {
  const host = process.env['TRINO_HOST_FQDN'];
  const port = process.env['TRINO_PORT'] ?? '443';
  const user = process.env['TRINO_USER'];
  const password = process.env['TRINO_PASSWORD'];
  const catalog = process.env['TRINO_CATALOG'] ?? 'iceberg';
  const schema = process.env['TRINO_DEFAULT_SCHEMA'] ?? 'cfm_vn';
  const timeoutMs = parseInt(process.env['TRINO_CONNECT_TIMEOUT_MS'] ?? '10000', 10);

  if (!host) throw new Error('TRINO_HOST_FQDN is not set in .env');
  if (!user) throw new Error('TRINO_USER is not set in .env');
  if (!password) throw new Error('TRINO_PASSWORD is not set in .env');

  return { host, port, user, password, catalog, schema, connectTimeoutMs: timeoutMs };
}

/** Create a Trino client from the loaded config. */
export function createTrinoClient(cfg: TrinoConfig): Trino {
  return Trino.create({
    server: `https://${cfg.host}:${cfg.port}`,
    catalog: cfg.catalog,
    schema: cfg.schema,
    auth: new BasicAuth(cfg.user, cfg.password),
  });
}

/**
 * Execute a SQL query and collect up to `cap` rows.
 * Propagates Trino-level errors (`.error` chunk field) as thrown Errors.
 */
export async function runQuery(
  client: Trino,
  sql: string,
  cap = 10_000,
): Promise<TrinoQueryResult> {
  const start = Date.now();
  const iter = await client.query(sql);

  const rows: unknown[][] = [];
  let columns: string[] = [];

  for await (const result of iter) {
    // Trino sends errors inside the result chunk rather than as thrown exceptions.
    const err = (result as unknown as { error?: { message?: string; errorName?: string } }).error;
    if (err) {
      const msg = err.message ?? err.errorName ?? 'Trino query failed';
      throw new Error(`[trino] ${msg}\nSQL: ${sql.slice(0, 400)}`);
    }
    if (result.columns && !columns.length) {
      columns = result.columns.map((c) => c.name);
    }
    if (result.data) {
      for (const row of result.data) {
        rows.push(row as unknown[]);
        if (rows.length >= cap) return { columns, rows, ms: Date.now() - start };
      }
    }
  }

  return { columns, rows, ms: Date.now() - start };
}
