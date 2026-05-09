/**
 * Agents Compose canvas — three-stage AI authoring page.
 * Two-column layout: persistent conversation rail (left) + stage stepper (right).
 * No real LLM — replies routed through the keyword matcher + scripted playbooks.
 */
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { T } from '../../../theme';
import { ConversationRail } from './_components/conversation-rail';
import { FourRTagChip } from './_components/four-r-tag';
import { StageStepper } from './_components/stage-stepper';
import { FeatureSwapDrawer } from './_components/feature-swap-drawer';
import { FeatureDetailDrawer } from './_components/feature-detail-drawer';
import { makeInitialSession, makeReducer } from './_state/compose-reducer';
import { matchPlaybook } from './_state/keyword-matcher';
import { allPlaybooks, opportunityToPlaybookMap } from '../../../data/catalog/agents/compose-playbooks';
import { getAllFeatures, subscribeFeatures } from '../../../data/catalog/features';
import { allOpportunities } from '../../../data/catalog/agents/opportunities';
import type { FourRTag, StageId } from './_state/compose-types';

type DrawerState =
  | { kind: 'closed' }
  | { kind: 'detail'; featureId: string }
  | { kind: 'swap'; replacingRowId: string };

const GOAL_TO_TAG: Record<string, FourRTag> = {
  retain: '4r-retain', revenue: '4r-revenue', reactivate: '4r-reactivate', recruit: '4r-recruit',
};

export default function AgentsComposePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromOp = searchParams.get('fromOp');
  const reducer = React.useMemo(() => makeReducer(allPlaybooks), []);
  const [session, dispatch] = React.useReducer(reducer, undefined, makeInitialSession);
  const [drawer, setDrawer] = React.useState<DrawerState>({ kind: 'closed' });

  const features = React.useSyncExternalStore(subscribeFeatures, getAllFeatures, getAllFeatures);

  // Pre-load from opportunity (?fromOp=ag-op-…) — once on mount.
  const preloadRanRef = React.useRef(false);
  React.useEffect(() => {
    if (preloadRanRef.current || !fromOp) return;
    preloadRanRef.current = true;
    const op = allOpportunities.find((o) => o.id === fromOp);
    if (!op) return;
    const playbookId = opportunityToPlaybookMap[fromOp];
    if (!playbookId) return;
    dispatch({
      type: 'INTENT_FROM_OPPORTUNITY',
      opportunityId: op.id,
      intent: op.intent,
      playbookId,
      agentThread: op.agentThread ?? [],
      fourR: { tag: GOAL_TO_TAG[op.goal4r] ?? '4r-retain', alignment: op.confidence },
    });
  }, [fromOp]);

  const handleUserSubmit = (text: string) => {
    // Treat as a new intent submission until a playbook is matched.
    if (session.intent === '' || session.matchedPlaybook === null) {
      const playbookId = matchPlaybook(text, allPlaybooks);
      dispatch({ type: 'INTENT_SUBMIT', intent: text, playbookId });
    } else {
      dispatch({ type: 'CHAT_USER_REPLY', text });
    }
  };

  const swappingRow = drawer.kind === 'swap'
    ? [...session.stages.features.proposed, ...session.stages.features.approved].find((r) => r.id === drawer.replacingRowId) ?? null
    : null;

  const detailFeature = drawer.kind === 'detail'
    ? features.find((f) => f.name === drawer.featureId)
    : undefined;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '380px 1fr',
      height: '100vh', minHeight: 0, background: T.n50,
      fontFamily: T.fSans, color: T.n900,
    }}>
      <ConversationRail
        chatLog={session.chatLog}
        intentSubmitted={session.intent !== '' && session.matchedPlaybook !== null}
        onUserSubmit={handleUserSubmit}
      />
      <main style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px', borderBottom: `1px solid ${T.n200}`, background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => navigate('/agents')}
              style={{
                padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.n200}`,
                background: '#fff', cursor: 'pointer', fontFamily: T.fSans, fontSize: 12, color: T.n600,
              }}
            >
              ← Inbox
            </button>
            <div>
              <div style={{
                fontFamily: T.fMono, fontSize: 10, color: T.n400,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                Authoring agent
              </div>
              <div style={{ fontFamily: '"Spectral", Georgia, serif', fontSize: 22, color: T.n900, lineHeight: 1.1 }}>
                Compose canvas
                <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400, marginLeft: 10 }}>
                  · {session.id}
                </span>
              </div>
            </div>
          </div>
          <FourRTagChip fourR={session.fourR} />
        </header>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 24 }}>
          <StageStepper
            session={session}
            features={features}
            onApproveFeature={(rowId) => dispatch({ type: 'FEATURE_APPROVE', rowId })}
            onSwapFeature={(rowId) => setDrawer({ kind: 'swap', replacingRowId: rowId })}
            onDropFeature={(rowId) => dispatch({ type: 'FEATURE_DROP', rowId })}
            onViewFeatureDetail={(featureId) => setDrawer({ kind: 'detail', featureId })}
            onAdvance={(from: StageId) => dispatch({ type: 'STAGE_ADVANCE', from })}
            onReopen={(stage: StageId) => dispatch({ type: 'STAGE_REOPEN', stage })}
            onSegmentDecision={(decision, existingId) => dispatch({ type: 'SEGMENT_DECISION', decision, existingId })}
            onThresholdChange={(rowId, value) => dispatch({ type: 'SEGMENT_THRESHOLD_CHANGE', rowId, value })}
            onRefineCampaign={(userText, agentReply, templatePatch) =>
              dispatch({ type: 'CAMPAIGN_REFINE', userText, agentReply, templatePatch })
            }
          />
        </div>
      </main>

      <FeatureDetailDrawer
        open={drawer.kind === 'detail'}
        feature={detailFeature}
        onClose={() => setDrawer({ kind: 'closed' })}
      />
      <FeatureSwapDrawer
        open={drawer.kind === 'swap'}
        currentRow={swappingRow}
        allFeatures={features}
        onClose={() => setDrawer({ kind: 'closed' })}
        onSwap={(newFeatureId, newRephrase, newRationale) => {
          if (drawer.kind !== 'swap') return;
          dispatch({
            type: 'FEATURE_SWAP',
            rowId: drawer.replacingRowId,
            newFeatureId, newRephrase, newRationale,
          });
        }}
      />
    </div>
  );
}
