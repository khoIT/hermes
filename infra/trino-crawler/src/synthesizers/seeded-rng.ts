/**
 * Deterministic seeded pseudo-random number generator (mulberry32).
 * Seed string → stable number stream for reproducible synth fixtures.
 */

/** Hash a string to a 32-bit seed integer (djb2 variant). */
function hashSeed(seed: string): number {
  let h = 0x12345678;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x9e3779b9);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0; // unsigned 32-bit
}

/** Returns a factory that produces [0,1) floats deterministically. */
export function makeRng(seed: string): () => number {
  let s = hashSeed(seed);
  return function rng(): number {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Normal variate via Box-Muller, using the seeded rng. */
export function normalVariate(rng: () => number, mu: number, sigma: number): number {
  const u1 = Math.max(rng(), 1e-10);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mu + sigma * z;
}
