import { Injectable, Logger } from '@nestjs/common';
import { ProfilePgClient } from '../trino-explorer/profile-pg-client';
import { buildCountQuery, type Predicate } from './predicate-translator';

/**
 * Resolves audience predicates against the local feature_values table.
 *
 * Re-uses ProfilePgClient's pg.Pool — same DATABASE_URL the rest of
 * query-svc uses. Postgres set-algebra (INTERSECT / UNION / EXCEPT)
 * does the heavy lifting; the predicate translator emits parameterized
 * SQL.
 */
@Injectable()
export class AudienceService {
  private readonly log = new Logger(AudienceService.name);
  constructor(private readonly pg: ProfilePgClient) {}

  async count(predicate: Predicate, sampleLimit = 100): Promise<{
    count: number;
    sampledUids: string[];
    durationMs: number;
    predicateSql: string;
  }> {
    const compiled = buildCountQuery(predicate, sampleLimit);
    const start = Date.now();
    const res = await this.pg.pg().query<{ count: string; sample_uids: string[] | null }>(
      compiled.text,
      compiled.params,
    );
    const durationMs = Date.now() - start;
    const row = res.rows[0];
    return {
      count: Number(row?.count ?? 0),
      sampledUids: row?.sample_uids ?? [],
      durationMs,
      predicateSql: compiled.text.trim(),
    };
  }
}
