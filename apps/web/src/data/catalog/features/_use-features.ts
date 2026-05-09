import * as React from 'react';
import type { HermesFeature } from '@hermes/contracts';
import {
  getAllFeatures,
  subscribeFeatures,
  getLoadStatus,
  subscribeLoadStatus,
  type LoadStatus,
} from './index';

/**
 * Re-renders when the boot loader resolves OR when `registerFeature()`
 * mutates the snapshot. Returns the live array + load status.
 */
export function useFeatures(): { status: LoadStatus; features: readonly HermesFeature[] } {
  const features = React.useSyncExternalStore(
    subscribeFeatures,
    () => getAllFeatures(),
    () => getAllFeatures(),
  );
  const status = React.useSyncExternalStore(
    subscribeLoadStatus,
    () => getLoadStatus().status,
    () => getLoadStatus().status,
  );
  return { status, features };
}

export function useFeatureLoadStatus(): LoadStatus {
  return React.useSyncExternalStore(
    subscribeLoadStatus,
    () => getLoadStatus().status,
    () => getLoadStatus().status,
  );
}
