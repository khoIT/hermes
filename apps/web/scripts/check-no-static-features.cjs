#!/usr/bin/env node
/**
 * Postbuild guard: fail the build if `feature-analytics-180d` reappears
 * anywhere in the dist bundle. Phase 06 hard cut deleted the static JSON
 * — re-introducing it (e.g. via accidental import) would silently mask
 * an outage of the catalog-api dependency.
 */
const fs = require('node:fs');
const path = require('node:path');

const NEEDLE = 'feature-analytics-180d';
const DIST_ROOT = path.resolve(__dirname, '..', 'dist');

function walk(dir, hits) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, hits);
    } else if (entry.isFile() && /\.(js|json|html|css|map)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf-8');
      if (content.includes(NEEDLE)) hits.push(full);
    }
  }
}

if (!fs.existsSync(DIST_ROOT)) {
  console.error(`[guard] ${DIST_ROOT} not found — nothing to check.`);
  process.exit(0);
}

const hits = [];
walk(DIST_ROOT, hits);

if (hits.length > 0) {
  console.error(`[guard] FAIL: \`${NEEDLE}\` reappeared in dist:`);
  for (const h of hits) console.error(`  - ${h}`);
  console.error('Phase 06 hard cut deleted the static JSON. Remove the import that re-introduced it.');
  process.exit(1);
}

console.log(`[guard] OK: \`${NEEDLE}\` absent from dist.`);
