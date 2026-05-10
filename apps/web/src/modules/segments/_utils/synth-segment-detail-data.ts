/**
 * Deterministic synthetic data generators for segment detail surfaces.
 * Every generator instantiates a fresh PRNG seeded from the segment id
 * — never share module-level PRNG state, that would couple call order
 * across Composition + Users + Overview generators.
 */
import { allSegments } from '../../../data/catalog/segments';

// ---------------------------------------------------------------------------
// PRNG + seed helpers
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSegmentId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Size time-series for the Overview chart
// ---------------------------------------------------------------------------
export type DataKey = 'users' | 'dau' | 'wau';

export interface SizePoint { date: string; count: number }

export function getSizeTimeSeries(
  segmentId: string,
  days: number,
  dataKey: DataKey,
): SizePoint[] {
  const rng = mulberry32(hashSegmentId(segmentId) ^ days);
  const seg = allSegments.find(s => s.id === segmentId);
  const baseUsers = seg?.audienceSize ?? 24000;
  const scale = dataKey === 'dau' ? 0.6 : dataKey === 'wau' ? 0.85 : 1;
  const base = baseUsers * scale;

  const today = new Date('2026-05-09');
  const result: SizePoint[] = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const trend = 1 + Math.sin(i * 0.32) * 0.05;
    const jitter = 1 + (rng() - 0.5) * 0.16;
    result.push({
      date: d.toISOString().slice(0, 10),
      count: Math.max(50, Math.round(base * trend * jitter)),
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// vs-All-Users stats
// ---------------------------------------------------------------------------
export interface VsAllRow {
  metric: string;
  segment: string;
  all: string;
  diff: string;
  diffDir: 'up' | 'down' | 'flat';
}

export function getVsAllStats(segmentId: string): VsAllRow[] {
  const rng = mulberry32(hashSegmentId(segmentId));
  const seg = allSegments.find(s => s.id === segmentId);
  const segUsers = seg?.audienceSize ?? 24000;
  const allUsers = segUsers * (6 + rng() * 4);
  const segSessions = 4 + rng() * 4;
  const allSessions = 2 + rng() * 2;
  const segArpdau = 0.18 + rng() * 0.45;
  const allArpdau = 0.08 + rng() * 0.12;

  const pct = (a: number, b: number) => {
    const d = ((a - b) / b) * 100;
    const dir: VsAllRow['diffDir'] = d > 1 ? 'up' : d < -1 ? 'down' : 'flat';
    return { txt: `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`, dir };
  };

  const sP = pct(segSessions, allSessions);
  const aP = pct(segArpdau, allArpdau);
  return [
    {
      metric: 'Users',
      segment: segUsers.toLocaleString(),
      all: Math.round(allUsers).toLocaleString(),
      diff: `${((segUsers / allUsers) * 100).toFixed(2)}% of base`,
      diffDir: 'flat',
    },
    {
      metric: 'Avg sessions / week',
      segment: segSessions.toFixed(1),
      all: allSessions.toFixed(1),
      diff: sP.txt, diffDir: sP.dir,
    },
    {
      metric: 'ARPDAU (USD)',
      segment: `$${segArpdau.toFixed(2)}`,
      all: `$${allArpdau.toFixed(2)}`,
      diff: aP.txt, diffDir: aP.dir,
    },
  ];
}

// ---------------------------------------------------------------------------
// Trend Over Time
// ---------------------------------------------------------------------------
export interface TrendRow {
  metric: string;
  now: string;
  d30: string;
  d60: string;
  d90: string;
}

export function getTrendOverTime(segmentId: string): TrendRow[] {
  const rng = mulberry32(hashSegmentId(segmentId) ^ 0xdeadbeef);
  const seg = allSegments.find(s => s.id === segmentId);
  const baseUsers = seg?.audienceSize ?? 24000;
  const wauNow = Math.round(baseUsers * (0.78 + rng() * 0.1));
  const decay = (factor: number) => Math.round(wauNow * factor);
  const sessNow = 240 + Math.round(rng() * 90);
  const sessAt = (factor: number) => Math.round(sessNow * factor);
  return [
    {
      metric: 'Weekly Active in Segment',
      now: wauNow.toLocaleString(),
      d30: decay(0.96).toLocaleString(),
      d60: decay(0.91).toLocaleString(),
      d90: decay(0.87).toLocaleString(),
    },
    {
      metric: 'Avg session length (s)',
      now: String(sessNow),
      d30: String(sessAt(0.97)),
      d60: String(sessAt(0.94)),
      d90: String(sessAt(0.92)),
    },
  ];
}

// ---------------------------------------------------------------------------
// Segment Overlap
// ---------------------------------------------------------------------------
export interface OverlapRow {
  segmentId: string;
  name: string;
  sharedUsers: number;
  pct: number;
}

export function getSegmentOverlap(segmentId: string): OverlapRow[] {
  const rng = mulberry32(hashSegmentId(segmentId) ^ 0xa1b2c3);
  const seg = allSegments.find(s => s.id === segmentId);
  const audSize = seg?.audienceSize ?? 24000;
  const siblings = allSegments
    .filter(s => s.id !== segmentId)
    .map(s => {
      const pct = 0.03 + rng() * 0.45;
      return {
        segmentId: s.id,
        name: s.displayName,
        sharedUsers: Math.round(audSize * pct),
        pct,
      };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
  return siblings;
}

// ---------------------------------------------------------------------------
// Composition: Country, Device, Lifecycle/Spend fallbacks
// ---------------------------------------------------------------------------
const COUNTRY_POOL: Array<{ code: string; name: string }> = [
  { code: 'VN', name: 'Vietnam' }, { code: 'US', name: 'United States' },
  { code: 'ID', name: 'Indonesia' }, { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' }, { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'FR', name: 'France' },
  { code: 'RU', name: 'Russia' }, { code: 'CN', name: 'China' },
  { code: 'MX', name: 'Mexico' }, { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' }, { code: 'TR', name: 'Turkey' },
  { code: 'PH', name: 'Philippines' }, { code: 'TH', name: 'Thailand' },
  { code: 'MY', name: 'Malaysia' }, { code: 'SG', name: 'Singapore' },
  { code: 'AU', name: 'Australia' }, { code: 'CA', name: 'Canada' },
  { code: 'NL', name: 'Netherlands' }, { code: 'PL', name: 'Poland' },
  { code: 'AR', name: 'Argentina' },
];

export interface CountryRow {
  code: string; name: string; count: number; pct: number;
}

export function getCountryBreakdown(segmentId: string): CountryRow[] {
  const rng = mulberry32(hashSegmentId(segmentId) ^ 0xc0ffee);
  const seg = allSegments.find(s => s.id === segmentId);
  const audSize = seg?.audienceSize ?? 24000;

  const pool = [...COUNTRY_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const top10 = pool.slice(0, 10);

  let weights = top10.map((_, i) => Math.pow(0.78, i) + rng() * 0.05);
  const sum = weights.reduce((a, b) => a + b, 0);
  weights = weights.map(w => w / sum);

  return top10.map((c, i) => ({
    code: c.code,
    name: c.name,
    pct: weights[i]!,
    count: Math.round(audSize * weights[i]!),
  }));
}

export function synthLifecycleBreakdown(segmentId: string) {
  const rng = mulberry32(hashSegmentId(segmentId) ^ 0x1f1f);
  const nru = 0.10 + rng() * 0.18;
  const lapsed = 0.05 + rng() * 0.12;
  const veteran = 0.30 + rng() * 0.20;
  const mid = Math.max(0.05, 1 - nru - lapsed - veteran);
  return { nru, mid, veteran, lapsed };
}

export function synthSpendTierBreakdown(segmentId: string) {
  const rng = mulberry32(hashSegmentId(segmentId) ^ 0x2e2e);
  const free = 0.40 + rng() * 0.22;
  const low = 0.20 + rng() * 0.12;
  const mid = 0.10 + rng() * 0.10;
  const high = 0.05 + rng() * 0.08;
  const total = free + low + mid + high;
  const whale = Math.max(0.005, 1 - total);
  return { free, low, mid, high, whale };
}

export interface DeviceRow {
  platform: 'ios' | 'android' | 'web';
  count: number;
  pct: number;
}

export function getDeviceBreakdown(segmentId: string): DeviceRow[] {
  const rng = mulberry32(hashSegmentId(segmentId) ^ 0xfacefeed);
  const seg = allSegments.find(s => s.id === segmentId);
  const audSize = seg?.audienceSize ?? 24000;
  const ios = 0.34 + rng() * 0.18;
  const android = 0.48 + rng() * 0.14;
  const total = ios + android;
  const remain = 1 - total;
  const iosPct = ios + Math.max(0, -remain) * 0.5;
  const aPct = android + Math.max(0, -remain) * 0.5;
  const webPct = Math.max(0.02, remain);
  const norm = iosPct + aPct + webPct;
  const splits: Array<DeviceRow['platform']> = ['ios', 'android', 'web'];
  const pcts = [iosPct / norm, aPct / norm, webPct / norm];
  return splits.map((p, i) => ({
    platform: p,
    pct: pcts[i]!,
    count: Math.round(audSize * pcts[i]!),
  }));
}

// ---------------------------------------------------------------------------
// User sample (Phase 4)
// ---------------------------------------------------------------------------
export interface UserSampleRow {
  uid: string;
  lastSeenISO: string;
  lifecycle: 'new' | 'active' | 'at-risk' | 'churned';
  spendTier: 'whale' | 'dolphin' | 'minnow' | 'f2p';
  country: string;
  device: 'ios' | 'android' | 'web';
}

function weightedPick<T>(rng: () => number, items: T[], weights: number[]): T {
  let r = rng();
  for (let i = 0; i < items.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

export function getUserSample(segmentId: string): UserSampleRow[] {
  const rng = mulberry32(hashSegmentId(segmentId) ^ 0x55aa55aa);
  const today = Date.parse('2026-05-09T12:00:00Z');
  const lifecycles: UserSampleRow['lifecycle'][] = ['new', 'active', 'at-risk', 'churned'];
  const lwt = [0.20, 0.50, 0.20, 0.10];
  const tiers: UserSampleRow['spendTier'][] = ['whale', 'dolphin', 'minnow', 'f2p'];
  const twt = [0.05, 0.15, 0.30, 0.50];
  const devices: UserSampleRow['device'][] = ['ios', 'android', 'web'];
  const dwt = [0.40, 0.50, 0.10];
  const countries = COUNTRY_POOL.slice(0, 12).map(c => c.code);
  const cwt = countries.map((_, i) => Math.pow(0.78, i));
  const cwSum = cwt.reduce((a, b) => a + b, 0);
  const cwn = cwt.map(w => w / cwSum);

  const rows: UserSampleRow[] = [];
  for (let i = 0; i < 50; i++) {
    const hex = Math.floor(rng() * 0xffffffff).toString(16).padStart(8, '0');
    const lastSeen = today - Math.floor(rng() * 14 * 86400 * 1000);
    rows.push({
      uid: `usr-${hex}`,
      lastSeenISO: new Date(lastSeen).toISOString(),
      lifecycle: weightedPick(rng, lifecycles, lwt),
      spendTier: weightedPick(rng, tiers, twt),
      country: weightedPick(rng, countries, cwn),
      device: weightedPick(rng, devices, dwt),
    });
  }
  return rows;
}
