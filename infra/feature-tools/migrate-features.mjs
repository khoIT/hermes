/**
 * Phase 1 migration: inject `games: [...]` into every feature object across
 * the catalog files. One-shot script — run once, commit the rewritten files.
 *
 * Strategy: regex-based. For each catalog file:
 *   1. Find each feature's `domain: 'X',` line
 *   2. Read the feature `name` from the same object (look upward)
 *   3. Insert `games: [...]` line after the `domain:` line, with the same indent
 *   4. Also flips the type annotation from `HermesFeature[]` to `HermesFeatureSource[]`
 *
 * Run via:  node infra/feature-tools/migrate-features.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const catalogDir = join(repoRoot, 'apps', 'web', 'src', 'data', 'catalog', 'features');
const mapping = JSON.parse(
  readFileSync(join(__dirname, 'feature-game-map.json'), 'utf8'),
).features;

const skip = new Set(['index.ts', 'platform-propensity.ts']);
const files = readdirSync(catalogDir).filter(
  (f) => f.endsWith('.ts') && !skip.has(f),
);

let totalFeatures = 0;
let totalSkippedAlreadyHasGames = 0;

for (const file of files) {
  const path = join(catalogDir, file);
  let src = readFileSync(path, 'utf8');

  // 1. Switch the type annotation from HermesFeature[] to HermesFeatureSource[]
  //    and the import alongside.
  src = src.replace(
    /import type \{ HermesFeature \} from '@hermes\/contracts';/,
    `import type { HermesFeatureSource } from '@hermes/contracts';`,
  );
  src = src.replace(/: HermesFeature\[\]/g, ': HermesFeatureSource[]');

  // 2. Walk feature objects: find `name: 'X'` then the next `domain: 'Y',` and
  //    insert games line after domain. Skip if file already has `games:`.
  const lines = src.split('\n');
  const out = [];
  let pendingName = null;
  let injected = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nameMatch = line.match(/^(\s*)name:\s*'([^']+)'/);
    if (nameMatch) {
      pendingName = nameMatch[2];
    }
    out.push(line);
    const domainMatch = line.match(/^(\s*)domain:\s*'[^']+',\s*$/);
    if (domainMatch && pendingName) {
      const indent = domainMatch[1];
      const games = mapping[pendingName];
      if (!games) {
        console.error(`  ✗ no games mapping for ${pendingName}`);
        process.exit(1);
      }
      // Check if next non-blank line is already `games:` (idempotency)
      const peek = lines[i + 1] ?? '';
      if (/^\s*games:\s*\[/.test(peek)) {
        totalSkippedAlreadyHasGames++;
      } else {
        const gamesLine = `${indent}games: [${games.map((g) => `'${g}'`).join(', ')}],`;
        out.push(gamesLine);
        injected++;
      }
      pendingName = null;
    }
  }

  writeFileSync(path, out.join('\n'));
  totalFeatures += injected;
  console.log(`  ✓ ${file}: +${injected} games[] additions`);
}

console.log(
  `\nDone. ${totalFeatures} features migrated; ${totalSkippedAlreadyHasGames} already had games[].`,
);
