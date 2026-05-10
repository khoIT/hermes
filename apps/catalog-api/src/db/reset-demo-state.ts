import 'dotenv/config';
import { Pool } from 'pg';

// CLI: `pnpm db:reset-demo` — clears artifacts created by walking through
// the LiveOps 2026 demo thread (rehearsal litter). Safe to re-run.
//
// Scope:
//  - board_cards pinned from `thread-demo-livops-2026`
//  - campaigns created from that thread (excluding the static seed `cmp-cfm-407`
//    which is the demo's anchor — referenced by id, not deleted)
//  - segments created from that thread (target-bound segments via the
//    targetSegmentId fixture path don't hit the API, so this only matches
//    pre-fix rehearsal rows; harmless if zero)
//
// Does NOT touch:
//  - browser localStorage (open in incognito or use the Restart-demo chip)
//  - seeded artifacts in the static catalog (cmp-cfm-407, segCfm…)
const DEMO_THREAD = 'thread-demo-livops-2026';
const ANCHOR_CAMPAIGN_ID = 'cmp-cfm-407';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required (copy .env.example to .env)');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const cards = await pool.query(
      'DELETE FROM board_cards WHERE source_thread_id = $1',
      [DEMO_THREAD],
    );
    const campaigns = await pool.query(
      'DELETE FROM campaigns WHERE source_thread_id = $1 AND id <> $2',
      [DEMO_THREAD, ANCHOR_CAMPAIGN_ID],
    );
    const segments = await pool.query(
      'DELETE FROM segments WHERE source_thread_id = $1',
      [DEMO_THREAD],
    );

    console.log('[reset-demo] cleanup complete');
    console.log(`  board_cards:  ${cards.rowCount ?? 0} removed`);
    console.log(`  campaigns:    ${campaigns.rowCount ?? 0} removed (excluded ${ANCHOR_CAMPAIGN_ID})`);
    console.log(`  segments:     ${segments.rowCount ?? 0} removed`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[reset-demo] failed', err);
  process.exit(1);
});
