import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Reads the static feature-catalog JSON exported by
 * apps/web/scripts/export-feature-catalog.ts. The shape mirrors
 * `HermesFeatureSource[]` (analytics field stripped). Catalog metadata
 * is immutable per deploy; we cache in-process at first read.
 *
 * Search order:
 *   1. apps/web/src/data/catalog/features/_catalog.json (dev / monorepo)
 *   2. apps/catalog-api/dist/seed/_catalog.json         (prod bundle)
 *   3. apps/catalog-api/src/seed/_catalog.json          (committed fallback)
 *
 * If none found, throws on first read so the failure is loud.
 */
@Injectable()
export class FeatureCatalogLoader {
  private readonly log = new Logger(FeatureCatalogLoader.name);
  private cached: unknown[] | null = null;

  read(): unknown[] {
    if (this.cached) return this.cached;
    // __dirname is one of:
    //   .../apps/catalog-api/src/features         (tsx dev)
    //   .../apps/catalog-api/dist/src/features    (nest build)
    //   .../apps/catalog-api/dist/features        (production bundle)
    // Walk up looking for the monorepo root (presence of pnpm-workspace.yaml),
    // then resolve the canonical path under apps/web.
    const candidates: string[] = [];
    let cursor = __dirname;
    for (let i = 0; i < 8; i++) {
      candidates.push(path.resolve(cursor, 'apps/web/src/data/catalog/features/_catalog.json'));
      candidates.push(path.resolve(cursor, 'apps/catalog-api/src/seed/_catalog.json'));
      cursor = path.dirname(cursor);
    }
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        const raw = fs.readFileSync(candidate, 'utf-8');
        const parsed = JSON.parse(raw) as unknown[];
        this.log.log(`Loaded ${parsed.length} features from ${candidate}`);
        this.cached = parsed;
        return parsed;
      }
    }
    throw new Error(
      `feature catalog JSON not found. Run \`pnpm --filter @hermes/web exec tsx scripts/export-feature-catalog.ts\` first.`,
    );
  }
}
