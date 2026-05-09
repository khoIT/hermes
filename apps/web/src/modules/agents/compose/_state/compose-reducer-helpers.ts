/**
 * Helpers for the compose reducer — initial session factory, ID generator,
 * chat-entry constructor, and the downstream-stale propagation rule.
 */
import type { ChatEntry, ComposeSession, StageId } from './compose-types';

let nanoSeed = 0;
export const nano = (): string => `${Date.now().toString(36)}-${(nanoSeed++).toString(36)}`;

export function makeInitialSession(): ComposeSession {
  return {
    id: `sa-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nano()}`,
    intent: '',
    matchedPlaybook: null,
    fourR: null,
    activeStage: 'features',
    stages: {
      features: { status: 'idle', proposed: [], approved: [] },
      segment: { status: 'idle', predicate: null, audienceCount: null, matchedExistingSegmentId: null, decision: null },
      campaign: { status: 'idle', template: null, refinements: [] },
    },
    chatLog: [],
    startedAt: new Date().toISOString(),
  };
}

export const chat = (role: ChatEntry['role'], text: string): ChatEntry => ({
  id: nano(), role, text, timestamp: new Date().toISOString(),
});

/** Mark stages downstream of `from` as stale if they were already approved / reviewing / computing. */
export function markDownstreamStale(session: ComposeSession, from: StageId): ComposeSession {
  const order: StageId[] = ['features', 'segment', 'campaign'];
  const startIdx = order.indexOf(from) + 1;
  if (startIdx <= 0 || startIdx >= order.length) return session;
  const next = { ...session, stages: { ...session.stages } };
  for (let i = startIdx; i < order.length; i++) {
    const s = order[i];
    if (!s) continue;
    const prev = next.stages[s];
    if (prev.status === 'approved' || prev.status === 'reviewing' || prev.status === 'computing') {
      (next.stages as Record<StageId, unknown>)[s] = { ...prev, status: 'stale' };
    }
  }
  return next;
}
