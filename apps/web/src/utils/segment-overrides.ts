/**
 * Segment override map — catalog `allSegments` is a static import, so
 * runtime edits (Save in Predicate tab, Refinement Playbook Apply) write
 * here and consumers read override-then-catalog via `useSegment(id)`.
 *
 * Subscriber pattern is bare-bones: a plain Set of listeners that fire
 * after every applyOverride; React components subscribe via
 * useSyncExternalStore.
 */
import type { PredicateAST } from '@hermes/contracts';

export interface SegmentOverride {
  predicate?: PredicateAST;
  displayName?: string;
  audienceSize?: number;
  lastBuildAt?: string;
}

const overrides = new Map<string, SegmentOverride>();
const listeners = new Set<() => void>();

export function getSegmentOverride(id: string): SegmentOverride | undefined {
  return overrides.get(id);
}

export function applySegmentOverride(id: string, patch: SegmentOverride): void {
  const prev = overrides.get(id) ?? {};
  overrides.set(id, { ...prev, ...patch });
  listeners.forEach(l => l());
}

export function subscribeOverrides(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Snapshot for useSyncExternalStore — version increments on each change. */
let version = 0;
listeners.add(() => { version += 1; });
export function getOverridesVersion(): number { return version; }
