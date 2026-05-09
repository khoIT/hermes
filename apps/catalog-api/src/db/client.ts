import { Module, Global, Inject, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');
export type Db = NodePgDatabase<typeof schema>;

const log = new Logger('DbPool');

// Reads DATABASE_URL from env; one Pool per process.
//
// Resilience: pool emits 'error' on stale-connection detection (e.g. when
// the docker-postgres container restarts mid-session). Without a handler,
// `pg` rethrows and crashes the process. We log + drop the bad client; the
// pool transparently establishes a new connection on the next query.
//
// `idleTimeoutMillis` (default 10s) recycles long-idle clients so we don't
// hold onto a connection that the DB has already closed; `connectionTimeoutMillis`
// fails fast on a fully-down DB instead of hanging requests.
const dbProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (cfg: ConfigService): Db => {
    const url = cfg.getOrThrow<string>('DATABASE_URL');
    const pool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    pool.on('error', (err) => {
      // Bad client in the pool — pg has already evicted it; we just log.
      // Next query will check out a fresh client (auto-reconnect).
      log.warn(`pool client errored (auto-recovering): ${err.message}`);
    });
    return drizzle(pool, { schema, logger: cfg.get('LOG_LEVEL') === 'debug' });
  },
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DbModule {}

// Convenience decorator for injecting the drizzle client.
export const InjectDb = () => Inject(DRIZZLE);
