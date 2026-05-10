/**
 * useSegment — read a segment from the runtime override map first, then
 * fall back to the static `allSegments` catalog. Re-renders when overrides
 * change (Save in Predicate tab, Refinement Playbook Apply).
 *
 * Snapshot stability: caches the merged segment per (base, override) pair
 * so React's useSyncExternalStore doesn't see spurious changes.
 */
import React from 'react';
import type { HermesSegment } from '@hermes/contracts';
import { allSegments } from '../data/catalog/segments';
import {
  getSegmentOverride, subscribeOverrides, type SegmentOverride,
} from './segment-overrides';

const cache = new WeakMap<HermesSegment, { override: SegmentOverride | undefined; merged: HermesSegment }>();

function mergedSnapshot(id: string): HermesSegment | undefined {
  const base = allSegments.find(s => s.id === id);
  if (!base) return undefined;
  const ov = getSegmentOverride(id);
  if (!ov) return base;
  const cached = cache.get(base);
  if (cached && cached.override === ov) return cached.merged;
  const merged = { ...base, ...ov };
  cache.set(base, { override: ov, merged });
  return merged;
}

export function useSegment(id: string): HermesSegment | undefined {
  const subscribe = React.useCallback(
    (cb: () => void) => subscribeOverrides(cb),
    [],
  );
  const getSnapshot = React.useCallback(() => mergedSnapshot(id), [id]);
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
