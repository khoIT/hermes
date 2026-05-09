/**
 * Stable canonicalisation for audience-counts lookup keys.
 * Produces a deterministic string key from a predicate AST so the same
 * logical predicate always maps to the same fixture row in distributions.json.
 *
 * Algorithm: JSON-stringify with sorted keys → base64url of first 12 chars
 * No crypto — this is fixtures-only, not a security primitive.
 */
import type { PredicateAST } from '@hermes/contracts';

/** Sort object keys recursively for stable serialisation. */
function sortKeys(val: unknown): unknown {
  if (Array.isArray(val)) return val.map(sortKeys);
  if (val !== null && typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)])
    );
  }
  return val;
}

/** Returns a short stable key string suitable as a distributions.json lookup. */
export function predicateHash(ast: PredicateAST): string {
  const canonical = JSON.stringify(sortKeys(ast));
  // Simple djb2 hash — deterministic, no crypto dependency
  let hash = 5381;
  for (let i = 0; i < canonical.length; i++) {
    hash = ((hash << 5) + hash) ^ canonical.charCodeAt(i);
    hash = hash >>> 0; // force unsigned 32-bit
  }
  return hash.toString(16).padStart(8, '0');
}

/** Feature-name-seeded deterministic number in [0, 1) for synth data generation. */
export function seededRandom(seed: string, index: number): number {
  let h = 5381;
  const s = seed + String(index);
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  return (h % 10000) / 10000;
}
