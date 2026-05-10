/**
 * BoardsSeederService — runs the sample-boards seed on app boot.
 *
 * Why on boot (and not in seed.ts only): the heavy `db:seed` script depends
 * on Trino raw tables that don't exist in local dev, so it crashes before
 * reaching the boards step. Seeding here keeps the demo boards present after
 * any `pnpm dev` restart, no manual command needed. Idempotent — won't dupe
 * cards on subsequent boots (guarded by board id + card-count check inside
 * `seedSampleBoards`).
 */
import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectDb } from '../db/client';
import type { Db } from '../db/client';
import { seedSampleBoards } from '../seed/seed-boards';

@Injectable()
export class BoardsSeederService implements OnApplicationBootstrap {
  private readonly log = new Logger('BoardsSeeder');

  constructor(@InjectDb() private readonly db: Db) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await seedSampleBoards(this.db);
      this.log.log('sample LiveOps 2026 boards ensured');
    } catch (err) {
      // Don't break boot — DB may be unreachable during early dev cycles.
      this.log.warn(`sample boards seed skipped: ${(err as Error).message}`);
    }
  }
}
