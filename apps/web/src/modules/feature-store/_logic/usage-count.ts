/**
 * Feature backlink usage counts — computes how many segments and campaigns
 * reference a given feature, either directly or transitively via segment refs.
 *
 * Call computeUsageCounts() once at module load and memoise results.
 * In React callers, wrap with useMemo keyed on allSegments + allCampaigns.
 */
import type { HermesFeature } from '@hermes/contracts';
import type { HermesSegment } from '@hermes/contracts';
import type { HermesCampaign } from '@hermes/contracts';

export interface FeatureUsage {
  segments: HermesSegment[];
  campaigns: HermesCampaign[];
  segmentCount: number;
  campaignCount: number;
}

/** Extract all feature names referenced in a segment's predicate */
function featuresInSegment(segment: HermesSegment): string[] {
  const names: string[] = [];
  for (const group of segment.predicate.groups) {
    for (const cond of group.conditions) {
      names.push(cond.feature);
    }
  }
  for (const excl of segment.predicate.exclusions ?? []) {
    names.push(excl.feature);
  }
  return names;
}

/** Extract all feature names referenced in a campaign's trigger predicate (if any) */
function featuresInCampaign(campaign: HermesCampaign): string[] {
  // Campaigns may have triggerPredicate (not modeled yet) — return empty for now
  // Feature references come transitively through audienceRef segments
  return [];
}

/**
 * Build a lookup map: featureName → { segments[], campaigns[] }
 * Campaigns are counted if:
 *   (a) they reference a segment that uses the feature, OR
 *   (b) the campaign itself has a trigger predicate referencing the feature (future)
 */
export function computeUsageCounts(
  features: HermesFeature[],
  segments: HermesSegment[],
  campaigns: HermesCampaign[],
): Map<string, FeatureUsage> {
  const result = new Map<string, FeatureUsage>();

  // Initialise empty entries for all features
  for (const f of features) {
    result.set(f.name, {
      segments: [],
      campaigns: [],
      segmentCount: 0,
      campaignCount: 0,
    });
  }

  // Build segment index: segmentId → feature names it references
  const segFeatures = new Map<string, string[]>();
  for (const seg of segments) {
    segFeatures.set(seg.id, featuresInSegment(seg));
  }

  // Build campaign→segment mapping via audienceRef
  const campBySegment = new Map<string, HermesCampaign[]>();
  for (const camp of campaigns) {
    if (camp.audienceRef) {
      const existing = campBySegment.get(camp.audienceRef) ?? [];
      existing.push(camp);
      campBySegment.set(camp.audienceRef, existing);
    }
  }

  // Match segments to features
  for (const seg of segments) {
    const featureNames = segFeatures.get(seg.id) ?? [];
    const uniqueNames = [...new Set(featureNames)];

    for (const name of uniqueNames) {
      const usage = result.get(name);
      if (!usage) continue;

      // Add segment reference
      usage.segments.push(seg);
      usage.segmentCount++;

      // Transitively add campaigns that reference this segment
      const relatedCamps = campBySegment.get(seg.id) ?? [];
      for (const camp of relatedCamps) {
        // Avoid double-counting the same campaign
        if (!usage.campaigns.some((c) => c.id === camp.id)) {
          usage.campaigns.push(camp);
          usage.campaignCount++;
        }
      }
    }
  }

  // Direct campaign feature references (trigger predicates)
  for (const camp of campaigns) {
    const names = featuresInCampaign(camp);
    for (const name of names) {
      const usage = result.get(name);
      if (!usage) continue;
      if (!usage.campaigns.some((c) => c.id === camp.id)) {
        usage.campaigns.push(camp);
        usage.campaignCount++;
      }
    }
  }

  return result;
}

/** Convenience: get usage for a single feature from the precomputed map */
export function getFeatureUsage(
  usageMap: Map<string, FeatureUsage>,
  featureName: string,
): FeatureUsage {
  return usageMap.get(featureName) ?? {
    segments: [],
    campaigns: [],
    segmentCount: 0,
    campaignCount: 0,
  };
}
