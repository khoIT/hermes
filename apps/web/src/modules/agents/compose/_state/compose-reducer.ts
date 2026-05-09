/**
 * Compose canvas — pure reducer for the three-stage authoring session.
 * No React, no effects, no fetches.
 * See compose-types.ts for the canonical state shape; compose-reducer-helpers
 * for the initial session factory + chat helper + stale propagation.
 */
import type { ComposeAction, ComposeSession, Playbook, ProposedFeatureRow, StageId } from './compose-types';
import { chat, markDownstreamStale } from './compose-reducer-helpers';
export { makeInitialSession } from './compose-reducer-helpers';

/** Build the reducer with a closure over the playbook catalog. */
export function makeReducer(playbooks: readonly Playbook[]) {
  return function reducer(session: ComposeSession, action: ComposeAction): ComposeSession {
    switch (action.type) {
      case 'INTENT_SUBMIT': {
        const pb = action.playbookId ? playbooks.find((p) => p.id === action.playbookId) ?? null : null;
        const userMsg = chat('user', action.intent);
        const agentMsg = pb
          ? chat('agent', pb.intro)
          : chat('agent', "I don't recognize that pattern yet — try one of these.");
        return {
          ...session,
          intent: action.intent,
          matchedPlaybook: pb?.id ?? null,
          fourR: pb?.fourR ?? session.fourR,
          activeStage: 'features',
          stages: pb
            ? {
                ...session.stages,
                features: { status: 'reviewing', proposed: pb.proposedFeatures.map((r) => ({ ...r })), approved: [] },
              }
            : session.stages,
          chatLog: [...session.chatLog, userMsg, agentMsg],
        };
      }

      case 'INTENT_FROM_OPPORTUNITY': {
        const pb = playbooks.find((p) => p.id === action.playbookId);
        if (!pb) return session;
        const userMsg = chat('user', action.intent);
        const threadMsg = chat('system', `From opportunity ${action.opportunityId}\n${action.agentThread.join('\n')}`);
        const agentMsg = chat('agent', pb.intro);
        return {
          ...session,
          intent: action.intent,
          matchedPlaybook: pb.id,
          fourR: action.fourR,
          activeStage: 'features',
          stages: {
            ...session.stages,
            features: { status: 'reviewing', proposed: pb.proposedFeatures.map((r) => ({ ...r })), approved: [] },
          },
          chatLog: [...session.chatLog, userMsg, threadMsg, agentMsg],
        };
      }

      case 'FEATURE_APPROVE': {
        const f = session.stages.features;
        const row = f.proposed.find((r) => r.id === action.rowId);
        if (!row) return session;
        const next = markDownstreamStale(session, 'features');
        return {
          ...next,
          stages: {
            ...next.stages,
            features: {
              ...f,
              proposed: f.proposed.filter((r) => r.id !== action.rowId),
              approved: [...f.approved, { ...row, approvedAt: new Date().toISOString() }],
            },
          },
        };
      }

      case 'FEATURE_DROP': {
        const f = session.stages.features;
        const next = markDownstreamStale(session, 'features');
        return {
          ...next,
          stages: {
            ...next.stages,
            features: { ...f, proposed: f.proposed.filter((r) => r.id !== action.rowId) },
          },
        };
      }

      case 'FEATURE_SWAP': {
        const f = session.stages.features;
        const swap = (r: ProposedFeatureRow): ProposedFeatureRow =>
          r.id === action.rowId
            ? { ...r, featureId: action.newFeatureId, rephrase: action.newRephrase, rationale: action.newRationale }
            : r;
        const next = markDownstreamStale(session, 'features');
        return {
          ...next,
          stages: {
            ...next.stages,
            features: { ...f, proposed: f.proposed.map(swap) },
          },
        };
      }

      case 'STAGE_ADVANCE': {
        const order: StageId[] = ['features', 'segment', 'campaign'];
        const idx = order.indexOf(action.from);
        const nextStage = idx >= 0 ? order[idx + 1] : undefined;
        if (!nextStage) {
          const cur = session.stages[action.from];
          return { ...session, stages: { ...session.stages, [action.from]: { ...cur, status: 'approved' } } };
        }
        const cur = session.stages[action.from];
        const next = session.stages[nextStage];
        return {
          ...session,
          activeStage: nextStage,
          stages: {
            ...session.stages,
            [action.from]: { ...cur, status: 'approved' },
            [nextStage]: { ...next, status: nextStage === 'segment' ? 'computing' : 'reviewing' },
          },
        };
      }

      case 'STAGE_REOPEN': {
        const cur = session.stages[action.stage];
        const next = markDownstreamStale(session, action.stage);
        return {
          ...next,
          activeStage: action.stage,
          stages: { ...next.stages, [action.stage]: { ...cur, status: 'reviewing' } },
        };
      }

      case 'SEGMENT_AUDIENCE_FETCH_START':
        return {
          ...session,
          stages: { ...session.stages, segment: { ...session.stages.segment, status: 'computing', audienceCount: null } },
        };

      case 'SEGMENT_AUDIENCE_RESULT':
        return {
          ...session,
          stages: { ...session.stages, segment: { ...session.stages.segment, status: 'reviewing', audienceCount: action.count } },
        };

      case 'SEGMENT_THRESHOLD_CHANGE': {
        const f = session.stages.features;
        const updateRow = (r: ProposedFeatureRow): ProposedFeatureRow =>
          r.id === action.rowId ? { ...r, threshold: { ...r.threshold, value: action.value } } : r;
        const next = markDownstreamStale(session, 'features');
        return {
          ...next,
          stages: {
            ...next.stages,
            features: {
              ...f,
              proposed: f.proposed.map(updateRow),
              approved: f.approved.map(updateRow) as typeof f.approved,
            },
            segment: { ...next.stages.segment, status: 'computing', audienceCount: null },
          },
        };
      }

      case 'SEGMENT_DECISION':
        return {
          ...session,
          stages: {
            ...session.stages,
            segment: {
              ...session.stages.segment,
              decision: action.decision,
              matchedExistingSegmentId: action.existingId ?? session.stages.segment.matchedExistingSegmentId,
            },
          },
        };

      case 'CAMPAIGN_REFINE': {
        const c = session.stages.campaign;
        const nextTemplate = c.template && action.templatePatch
          ? { ...c.template, action: { ...c.template.action, ...action.templatePatch } }
          : c.template;
        return {
          ...session,
          stages: {
            ...session.stages,
            campaign: { ...c, template: nextTemplate, refinements: [...c.refinements, action.userText] },
          },
          chatLog: [...session.chatLog, chat('user', action.userText), chat('agent', action.agentReply)],
        };
      }

      case 'CHAT_USER_REPLY':
        return { ...session, chatLog: [...session.chatLog, chat('user', action.text)] };

      default:
        return session;
    }
  };
}
