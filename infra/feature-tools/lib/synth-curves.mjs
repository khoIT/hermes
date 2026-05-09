/**
 * Deterministic curve generators for analytics synth (Phase 1 v2).
 *
 * Composed curves: trend × seasonality × drift events × noise — anchored
 * to a seeded mulberry32 PRNG so re-runs produce identical fixtures.
 *
 * Public API:
 *   - mulberry32(seed): seeded PRNG
 *   - hashSeed(name): stable string-to-uint32
 *   - sparkline180({...}): produce a 180-bucket request-rate array
 *   - driftEvents({...}): produce drift event ISO dates
 */

/** Mulberry32 — fast 32-bit seeded PRNG. */
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable string → uint32 hash (FNV-1a variant). */
export function hashSeed(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Compose a 180-bucket daily request-rate sparkline.
 *
 * Layered curves:
 *   - trend:        linear ramp (gentle growth or decline)
 *   - weekly:       sin wave with period 7 (weekend spike)
 *   - drift events: ±20-40% spikes at 1-3 dates
 *   - noise:        ±5%
 *
 * Returns: Array<number>(180) — quantised to integers, baseline > 0.
 */
export function sparkline180({
  seed,
  baseline = 50_000, // ~50K reqs/day baseline
  trendPct = 0.15, // ±15% over 180 days
  weeklyAmp = 0.25, // 25% peak-to-trough weekly
  driftEventCount = 0,
  driftMagnitude = 0.3, // 30% spike magnitude
  noisePct = 0.05,
}) {
  const rng = mulberry32(seed);
  const buckets = new Array(180);
  const driftDays = new Set();
  for (let i = 0; i < driftEventCount; i++) {
    driftDays.add(Math.floor(rng() * 170) + 5); // not at edges
  }
  const trendSign = rng() < 0.5 ? -1 : 1;

  for (let d = 0; d < 180; d++) {
    const trend = 1 + trendSign * trendPct * (d / 180);
    const weekly = 1 + weeklyAmp * Math.sin((2 * Math.PI * d) / 7);
    let driftMul = 1;
    if (driftDays.has(d)) {
      driftMul = 1 + driftMagnitude * (rng() < 0.5 ? -1 : 1);
    }
    const noise = 1 + noisePct * (rng() * 2 - 1);
    const value = baseline * trend * weekly * driftMul * noise;
    buckets[d] = Math.max(1, Math.round(value));
  }
  return buckets;
}

/**
 * Pick drift event dates within the 180-day window, anchored relative to today.
 * Returns ISO date strings (YYYY-MM-DD) sorted ascending.
 */
export function driftEvents({ seed, count, today }) {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const days = new Set();
  while (days.size < count) {
    days.add(Math.floor(rng() * 170) + 5);
  }
  const todayMs = new Date(today).getTime();
  const dayMs = 86_400_000;
  return Array.from(days)
    .sort((a, b) => a - b)
    .map((d) => new Date(todayMs - (180 - d) * dayMs).toISOString().slice(0, 10));
}

/** Pick a random element from an array using the PRNG. */
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
