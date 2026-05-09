/**
 * Stage 3 — Campaign. Assembles trigger headline + event banner + action card +
 * alignment + fire metrics + lifecycle strip + sample profiles + refinement.
 * Three CTAs in sticky footer: Test in shadow · Save draft · Continue in Campaigns →.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../../../theme';
import { TriggerHeadline } from './trigger-headline';
import { EventSourceBanner } from './event-source-banner';
import { ActionCard } from './action-card';
import { AlignmentCard } from './alignment-card';
import { FireMetricsRow } from './fire-metrics-row';
import { TriggerLifecycleStrip } from './trigger-lifecycle-strip';
import { SampleProfilesRow } from './sample-profiles-row';
import { RefinementInput } from './refinement-input';
import { buildCampaignTemplate } from '../_state/campaign-builder';
import { buildPredicate } from '../_state/predicate-builder';
import { buildHandoff, writeHandoff } from '../_state/campaign-handoff';
import type { CampaignTemplate, ComposeSession } from '../_state/compose-types';

interface Props {
  session: ComposeSession;
  onRefine: (userText: string, agentReply: string, templatePatch?: Partial<CampaignTemplate['action']>) => void;
}

export const StageCampaign: React.FC<Props> = ({ session, onRefine }) => {
  const navigate = useNavigate();
  const [toast, setToast] = React.useState<string | null>(null);

  const camp = session.stages.campaign;
  if (camp.status === 'idle' && session.activeStage !== 'campaign') {
    return (
      <div style={{ padding: 16, fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
        Approve a segment to compose the campaign.
      </div>
    );
  }

  const template = camp.template ?? buildCampaignTemplate(session);
  if (!template) {
    return (
      <div style={{ padding: 16, fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
        No campaign template available — try one of the canonical playbooks.
      </div>
    );
  }

  const handoffToCampaigns = () => {
    const predicate = buildPredicate(session.stages.features.approved);
    const handoff = buildHandoff(session, template, predicate);
    writeHandoff(handoff);
    navigate(`/campaigns/new/realtime?from=compose-${session.id}`);
  };

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <TriggerHeadline headline={template.headline} />
      <EventSourceBanner source={template.eventSource} />
      <ActionCard action={template.action} />
      <AlignmentCard alignment={template.alignment} />
      <FireMetricsRow metrics={template.fireMetrics} />
      <TriggerLifecycleStrip steps={template.triggerLifecycle} />
      <SampleProfilesRow samples={template.sampleProfiles} />
      <RefinementInput playbookId={session.matchedPlaybook} onRefine={onRefine} />

      <div style={{
        position: 'sticky', bottom: 0, background: '#fff',
        padding: 12, borderRadius: 10,
        border: `1px solid ${T.n200}`,
        display: 'flex', gap: 8, justifyContent: 'flex-end',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.04)',
      }}>
        <button
          onClick={() => flashToast('Shadow test queued · ~12 min')}
          style={{
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
            background: '#fff', color: T.n800, border: `1px solid ${T.n200}`,
            fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
          }}
        >
          Test in shadow
        </button>
        <button
          onClick={() => flashToast('Draft saved · /agents/drafts')}
          style={{
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
            background: '#fff', color: T.n800, border: `1px solid ${T.n200}`,
            fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
          }}
        >
          Save draft
        </button>
        <button
          onClick={handoffToCampaigns}
          style={{
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            background: T.brand, color: '#fff', border: 0,
            fontFamily: T.fSans, fontSize: 13, fontWeight: 600,
          }}
        >
          Continue in Campaigns →
        </button>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          padding: '10px 14px', borderRadius: 8,
          background: T.n900, color: '#fff',
          fontFamily: T.fSans, fontSize: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)', zIndex: 50,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};
