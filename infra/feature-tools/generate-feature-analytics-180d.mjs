/**
 * Phase 1 v2: Generate `feature-analytics-180d.json` deterministically for
 * every feature in the catalog (73 migrated + 3 platform = 76 features).
 *
 * Strategy:
 *   - Read each catalog .ts file, regex-extract `name: 'X',` and the
 *     accompanying `games: [...]` line. (No TS import — keeps the script free
 *     of compile/runtime tooling.)
 *   - Per feature: deterministic synth analytics (seeded by hash of name).
 *     Drift score, freshness SLA, null rate, distinct values, top-3 campaigns,
 *     180-bucket request-rate sparkline, p99 latency, coverage.
 *   - CFM-only features get a tighter freshness SLA + higher request rate
 *     (anchor to "real" CFM data signal). Platform features get higher usage.
 *
 * Run:  node infra/feature-tools/generate-feature-analytics-180d.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mulberry32, hashSeed, sparkline180, driftEvents, pick } from './lib/synth-curves.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const catalogDir = join(repoRoot, 'apps', 'web', 'src', 'data', 'catalog', 'features');
const outputPath = join(repoRoot, 'apps', 'web', 'src', 'data', 'catalog', 'feature-analytics-180d.json');

// Anchor synth to a fixed "today" so re-runs are stable.
const TODAY = '2026-05-09';

// Campaign-id pool keyed by game — sourced from liveops_2026_campaign_requirements.md.
const CAMPAIGN_POOL = {
  cfm: ['CFM-13', 'CFM-9', 'CFM-7', 'CFM-3', 'CFM-1', 'CFM-11'],
  pt: ['PT-6', 'PT-10', 'PT-3', 'PT-8', 'PT-12'],
  nth: ['NTH-9', 'NTH-4', 'NTH-7', 'NTH-2'],
  tf: ['TF-5', 'TF-8', 'TF-2', 'TF-11'],
  cos: ['COS-3', 'COS-6', 'COS-1'],
  ptg: ['PTG-2', 'PTG-7', 'PTG-4'],
};

// Discover catalog files and parse out (name, games, isPlatform).
const skip = new Set(['index.ts']);
const files = readdirSync(catalogDir).filter((f) => f.endsWith('.ts') && !skip.has(f));

const catalogEntries = [];

for (const file of files) {
  const src = readFileSync(join(catalogDir, file), 'utf8');
  const lines = src.split('\n');
  let pendingName = null;
  let pendingGames = null;
  let pendingPlatform = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nameMatch = line.match(/^\s*name:\s*'([^']+)'/);
    if (nameMatch) {
      pendingName = nameMatch[1];
      pendingGames = null;
      pendingPlatform = false;
    }
    const gamesMatch = line.match(/^\s*games:\s*\[(.*)\]/);
    if (gamesMatch && pendingName) {
      pendingGames = gamesMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/['"\s]/g, ''))
        .map((s) => (s.startsWith('...') ? null : s))
        .filter(Boolean);
      // Handle the platform-propensity special case: `games: [...ALL_GAMES]`
      if (pendingGames.length === 0) {
        pendingGames = ['cfm', 'pt', 'nth', 'tf', 'cos', 'ptg'];
      }
    }
    if (line.includes('platform: true')) {
      pendingPlatform = true;
    }
    // Close the feature object: a single closing `},` at the next outer indent.
    if (line.match(/^\s\s},?\s*$/) && pendingName) {
      catalogEntries.push({
        name: pendingName,
        games: pendingGames || ['cfm'],
        platform: pendingPlatform,
        file,
      });
      pendingName = null;
      pendingGames = null;
      pendingPlatform = false;
    }
  }
}

console.log(`Discovered ${catalogEntries.length} features across ${files.length} files`);
if (catalogEntries.length !== 76) {
  console.error(`  ✗ expected 76 features, got ${catalogEntries.length}`);
  process.exit(1);
}

// Synth per-feature analytics.
const analytics = {};

for (const entry of catalogEntries) {
  const seed = hashSeed(entry.name);
  const rng = mulberry32(seed);

  // Platform features → higher usage, tighter SLA, lower drift on average.
  // CFM-anchored features → realistic CFM-shaped curves.
  const isPlatform = entry.platform;
  const isCfmOnly = entry.games.length === 1 && entry.games[0] === 'cfm';

  const baseline = isPlatform ? 800_000 : isCfmOnly ? 120_000 : 60_000 + Math.floor(rng() * 80_000);

  // Drift score: bias toward stability (most features cluster <0.3); 12% chance of drift event >=0.4.
  const driftRoll = rng();
  let driftScore;
  if (driftRoll < 0.12) {
    driftScore = 0.4 + rng() * 0.45; // mild-severe drift
  } else if (driftRoll < 0.4) {
    driftScore = 0.2 + rng() * 0.2; // mild
  } else {
    driftScore = rng() * 0.2; // stable
  }
  driftScore = Math.round(driftScore * 100) / 100;
  const driftEventCount = driftScore >= 0.4 ? 2 + Math.floor(rng() * 2) : driftScore >= 0.2 ? 1 : 0;

  const freshnessSlaMet = isPlatform
    ? 0.985 + rng() * 0.015
    : isCfmOnly
      ? 0.99 + rng() * 0.01
      : 0.97 + rng() * 0.02;
  const nullRate = isPlatform ? rng() * 0.005 : rng() * 0.02;
  const distinctValuesP50 = Math.floor(50 + rng() * 5000);

  // Top-3 consuming campaigns: sample from the union of campaign pools for the feature's games.
  const campaignCandidates = [];
  for (const g of entry.games) {
    for (const cid of CAMPAIGN_POOL[g] || []) {
      campaignCandidates.push({ campaignId: cid, game: g });
    }
  }
  // Shuffle deterministically and take top-3.
  for (let i = campaignCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [campaignCandidates[i], campaignCandidates[j]] = [campaignCandidates[j], campaignCandidates[i]];
  }
  const topConsumingCampaigns = campaignCandidates.slice(0, 3).map((c, idx) => ({
    campaignId: c.campaignId,
    game: c.game,
    fires180d: Math.floor((1.5 - idx * 0.4) * (200_000 + rng() * 1_000_000)),
  }));

  const driftEventDates = driftEvents({
    seed,
    count: driftEventCount,
    today: TODAY,
  });

  const requestRateSparkline = sparkline180({
    seed,
    baseline,
    trendPct: 0.15,
    weeklyAmp: isPlatform ? 0.18 : 0.28,
    driftEventCount,
    driftMagnitude: 0.35,
    noisePct: 0.05,
  });

  const usageCount180d = requestRateSparkline.reduce((a, b) => a + b, 0);

  const p99LookupLatencyMs = isPlatform
    ? 8 + rng() * 6 // platform features served from offline cache (fast)
    : isCfmOnly
      ? 28 + rng() * 18
      : 15 + rng() * 25;

  const coverageOfMau = isPlatform
    ? 0.85 + rng() * 0.13
    : isCfmOnly
      ? 0.7 + rng() * 0.25
      : 0.55 + rng() * 0.4;

  const medianLagMinutes = isPlatform ? 30 + rng() * 60 : isCfmOnly ? 5 + rng() * 25 : 10 + rng() * 50;

  // Last SLA miss timestamp: only if freshnessSlaMet < 0.99
  const dayMs = 86_400_000;
  const todayMs = new Date(TODAY).getTime();
  const lastSlaMissAt =
    freshnessSlaMet < 0.99
      ? new Date(todayMs - Math.floor(7 + rng() * 60) * dayMs).toISOString()
      : null;

  // Last backfill at: yesterday at 06:00 ICT for active features.
  const yesterday = new Date(todayMs - dayMs);
  yesterday.setUTCHours(23, 0, 0, 0); // 06:00 ICT next-day = 23:00 UTC prev-day
  const lastBackfillAt = yesterday.toISOString();

  analytics[entry.name] = {
    usageCount180d,
    driftScore,
    driftEventDates,
    freshnessSlaMet: Math.round(freshnessSlaMet * 10000) / 10000,
    nullRate: Math.round(nullRate * 10000) / 10000,
    distinctValuesP50,
    topConsumingCampaigns,
    requestRateSparkline,
    lastBackfillAt,
    p99LookupLatencyMs: Math.round(p99LookupLatencyMs * 10) / 10,
    coverageOfMau: Math.round(coverageOfMau * 10000) / 10000,
    medianLagMinutes: Math.round(medianLagMinutes * 10) / 10,
    lastSlaMissAt,
  };
}

writeFileSync(outputPath, JSON.stringify(analytics, null, 2));
const sizeKb = (Buffer.byteLength(JSON.stringify(analytics)) / 1024).toFixed(1);
console.log(`✓ Wrote ${outputPath}`);
console.log(`  ${Object.keys(analytics).length} features × 180 buckets · ${sizeKb} KB`);
