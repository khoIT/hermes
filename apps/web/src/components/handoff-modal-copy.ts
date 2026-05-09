/**
 * Handoff modal copy — PRD-verbatim mono substrate copy strings.
 * Centralised here so drift from spec is caught in one place.
 * Validate verbatim against PRD §8.7 (segment) and §9.9 (campaign).
 */

export interface HandoffStep {
  text: string;
  status: string;
}

/** PRD §8.7 — Segment handoff (Substrate B) */
export const SEGMENT_STEPS: HandoffStep[] = [
  { text: 'Hatchet starts BuildSegmentWorkflow',          status: 'queued' },
  { text: 'Predicate compiled to Trino SQL over Iceberg', status: '~2 min' },
  { text: 'UID list materialised to state_user_segments', status: '~3 min' },
  { text: 'Activation API exposes list to Apollo channels', status: 'ready' },
];

export const SEGMENT_SUBSTRATE_LINE = 'Substrate B · Hatchet + Trino + Iceberg';
export const SEGMENT_CONSUMER_PATH  = 'Apollo consumes via: GET /segments/{id}/uids';

/** PRD §9.9 — Campaign handoff (Substrate A) */
export const CAMPAIGN_STEPS: HandoffStep[] = [
  { text: 'Predicate compiled to expr-lang',                        status: 'done'    },
  { text: 'Trigger config written to JourneyDB',                    status: 'done'    },
  { text: 'Apollo TEE picks up on next reload',                     status: '~30 sec' },
  { text: 'TEE evaluates against event_match_end events',           status: 'live'    },
];

export const CAMPAIGN_SUBSTRATE_LINE = 'Substrate A · Apollo TEE + Temporal';

/**
 * PRD §9.9 verbatim multi-line TEE evaluation note.
 * Rendered as a mono pre block below the substrate line.
 */
export const CAMPAIGN_TEE_NOTE = `TEE evaluates @features.consecutive_ranked_losses_streak
  and @features.is_paying_user_lifetime per match_end event;
spawns Temporal workflow on match.`;

export const CAMPAIGN_CONSUMER_PATH = 'Apollo TEE + Temporal';
