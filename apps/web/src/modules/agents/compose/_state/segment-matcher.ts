/**
 * Segment matcher — find an existing HermesSegment whose predicate features
 * have ≥ 0.8 Jaccard overlap with the approved feature set.
 */
import type { HermesSegment } from '@hermes/contracts';

function featureIdsOf(seg: HermesSegment): Set<string> {
  const ids = new Set<string>();
  for (const g of seg.predicate.groups) {
    for (const c of g.conditions) ids.add(c.feature);
  }
  for (const e of seg.predicate.exclusions ?? []) ids.add(e.feature);
  return ids;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersect = 0;
  for (const x of a) if (b.has(x)) intersect++;
  const union = a.size + b.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

export interface SegmentMatch {
  segment: HermesSegment;
  jaccard: number;
}

export function matchSegment(
  approvedFeatureIds: readonly string[],
  segments: readonly HermesSegment[],
  threshold = 0.8,
): SegmentMatch | null {
  if (approvedFeatureIds.length === 0) return null;
  const a = new Set(approvedFeatureIds);
  let best: SegmentMatch | null = null;
  for (const seg of segments) {
    const j = jaccard(a, featureIdsOf(seg));
    if (j >= threshold && (!best || j > best.jaccard)) {
      best = { segment: seg, jaccard: j };
    }
  }
  return best;
}
