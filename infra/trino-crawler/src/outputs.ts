/**
 * Stable JSON writer for crawled fixture files.
 *
 * Writes to apps/web/src/data/crawled/*.json with:
 *   - Alphabetically sorted top-level keys (minimal git diffs across runs)
 *   - 2-space indent
 *   - UTF-8 encoding
 *   - Atomic write (write to tmp, then rename) to avoid partial reads
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname: string =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// Resolve repo-root → apps/web/src/data/crawled/
// infra/trino-crawler/src/ → infra/trino-crawler/ → infra/ → repo-root
const CRAWLED_DIR = path.resolve(_dirname, '../../../apps/web/src/data/crawled');

/** Sort object keys recursively for stable diff output. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/** Write a crawled fixture JSON. Key ordering is stable (alphabetical). */
export function writeCrawledJson(filename: string, data: unknown): void {
  fs.mkdirSync(CRAWLED_DIR, { recursive: true });

  const outPath = path.join(CRAWLED_DIR, filename);
  const tmpPath = outPath + '.tmp';

  const json = JSON.stringify(sortKeys(data), null, 2) + '\n';

  // Size guard: warn if approaching Vite static asset limit (2 MB)
  const bytes = Buffer.byteLength(json, 'utf-8');
  if (bytes > 2 * 1024 * 1024) {
    console.warn(
      `[outputs] WARNING: ${filename} is ${(bytes / 1024 / 1024).toFixed(2)} MB — may cause Vite issues`,
    );
  }

  fs.writeFileSync(tmpPath, json, 'utf-8');
  fs.renameSync(tmpPath, outPath);

  console.log(`[outputs] wrote ${filename} (${(bytes / 1024).toFixed(1)} KB)`);
}

/** Resolve absolute path to a crawled fixture — useful for smoke-checks. */
export function crawledPath(filename: string): string {
  return path.join(CRAWLED_DIR, filename);
}
