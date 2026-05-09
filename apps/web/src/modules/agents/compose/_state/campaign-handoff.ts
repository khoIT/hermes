/**
 * Campaign handoff — serialise compose session to sessionStorage so the
 * /campaigns/new/realtime canvas can pre-fill its blocks when opened with
 * ?from=compose-{sessionId}.
 */
import type { ComposeSession, CampaignTemplate, FourRTag } from './compose-types';
import type { QueryPredicate } from './predicate-builder';

const STORAGE_PREFIX = 'compose-handoff-';

export interface ComposeHandoff {
  sessionId: string;
  intent: string;
  predicate: QueryPredicate | null;
  segmentId: string | null;
  audienceCount: number | null;
  campaignTemplate: CampaignTemplate | null;
  fourR: { tag: FourRTag; alignment: number } | null;
}

export function writeHandoff(handoff: ComposeHandoff): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(STORAGE_PREFIX + handoff.sessionId, JSON.stringify(handoff));
}

export function readHandoff(sessionId: string): ComposeHandoff | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_PREFIX + sessionId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ComposeHandoff;
  } catch {
    return null;
  }
}

export function buildHandoff(
  session: ComposeSession,
  template: CampaignTemplate | null,
  predicate: QueryPredicate | null,
): ComposeHandoff {
  return {
    sessionId: session.id,
    intent: session.intent,
    predicate,
    segmentId: session.stages.segment.matchedExistingSegmentId,
    audienceCount: session.stages.segment.audienceCount,
    campaignTemplate: template,
    fourR: session.fourR,
  };
}
