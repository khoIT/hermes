/**
 * Stage stepper — three collapsible cards, only the active stage expanded.
 * Completed stages show a one-line summary + Edit affordance (hop-back).
 *
 * Phase 3 only mounts the Stage 1 (Features) content. Phase 4 + 5 will mount
 * their stages by replacing the stage-2 / stage-3 placeholders below.
 */
import React from 'react';
import { T } from '../../../../theme';
import { StageFeatures } from './stage-features';
import { StageSegment } from './stage-segment';
import { StageCampaign } from './stage-campaign';
import type { CampaignTemplate, ComposeSession, StageId } from '../_state/compose-types';
import type { HermesFeature } from '@hermes/contracts';

interface StepperCallbacks {
  onApproveFeature: (rowId: string) => void;
  onSwapFeature: (rowId: string) => void;
  onDropFeature: (rowId: string) => void;
  onViewFeatureDetail: (featureId: string) => void;
  onAdvance: (from: StageId) => void;
  onReopen: (stage: StageId) => void;
  onSegmentDecision: (decision: 'new-draft' | 'use-existing' | 'manual-edit', existingId?: string | null) => void;
  onThresholdChange: (rowId: string, value: number) => void;
  onRefineCampaign: (userText: string, agentReply: string, templatePatch?: Partial<CampaignTemplate['action']>) => void;
}

interface Props extends StepperCallbacks {
  session: ComposeSession;
  features: readonly HermesFeature[];
}

const STAGE_LABEL: Record<StageId, string> = {
  features: 'Stage 1 · Features',
  segment: 'Stage 2 · Segment',
  campaign: 'Stage 3 · Campaign',
};

const STAGE_SUBTITLE: Record<StageId, string> = {
  features: 'Pick the signals that define the cohort',
  segment:  'Compose the predicate · live audience size',
  campaign: 'Trigger event · action · cooldown · A/B',
};

interface CardProps {
  id: StageId;
  isActive: boolean;
  isComplete: boolean;
  isStale: boolean;
  summary?: string;
  onReopen: () => void;
  children: React.ReactNode;
}

const StageCard: React.FC<CardProps> = ({ id, isActive, isComplete, isStale, summary, onReopen, children }) => (
  <div style={{
    border: `1px solid ${isActive ? T.brand : isStale ? '#fde68a' : T.n200}`,
    borderRadius: 12, background: '#fff',
    boxShadow: isActive ? '0 0 0 4px rgba(240,90,34,0.10)' : '0 1px 2px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
      <div>
        <div style={{
          fontFamily: T.fMono, fontSize: 11, color: isActive ? T.brand : T.n500,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {STAGE_LABEL[id]}
        </div>
        <div style={{ fontFamily: '"Spectral", Georgia, serif', fontSize: 18, color: T.n900, marginTop: 4 }}>
          {isComplete && summary ? summary : STAGE_SUBTITLE[id]}
        </div>
      </div>
      {isComplete && !isActive && (
        <button
          onClick={onReopen}
          style={{
            padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
            background: '#fff', color: T.n700, border: `1px solid ${T.n200}`,
            fontFamily: T.fSans, fontSize: 11,
          }}
        >
          Edit
        </button>
      )}
    </div>
    {isActive && (
      <div style={{ padding: '0 18px 18px' }}>{children}</div>
    )}
  </div>
);

function featuresSummary(session: ComposeSession): string {
  const a = session.stages.features.approved;
  if (a.length === 0) return STAGE_SUBTITLE.features;
  const head = a[0];
  return `${a.length} feature${a.length > 1 ? 's' : ''} approved · ${head?.featureId} ${head?.threshold.op} ${head?.threshold.value}`;
}

function segmentSummary(session: ComposeSession): string {
  const s = session.stages.segment;
  if (s.audienceCount == null) return STAGE_SUBTITLE.segment;
  return `${s.audienceCount.toLocaleString()} UIDs · ${s.decision ?? 'pending'}`;
}

function campaignSummary(session: ComposeSession): string {
  const c = session.stages.campaign;
  if (!c.template) return STAGE_SUBTITLE.campaign;
  return `${c.template.action.channel.toUpperCase()} · ${c.template.action.cooldown} · ${c.template.action.platformCap}`;
}

export const StageStepper: React.FC<Props> = ({ session, features, ...cb }) => {
  const f = session.stages.features;
  const seg = session.stages.segment;
  const camp = session.stages.campaign;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <StageCard
        id="features"
        isActive={session.activeStage === 'features'}
        isComplete={f.status === 'approved'}
        isStale={f.status === 'stale'}
        summary={featuresSummary(session)}
        onReopen={() => cb.onReopen('features')}
      >
        <StageFeatures
          stage={f}
          features={features}
          onApprove={cb.onApproveFeature}
          onSwap={cb.onSwapFeature}
          onDrop={cb.onDropFeature}
          onViewDetail={cb.onViewFeatureDetail}
          onAdvance={() => cb.onAdvance('features')}
        />
      </StageCard>

      <StageCard
        id="segment"
        isActive={session.activeStage === 'segment'}
        isComplete={seg.status === 'approved'}
        isStale={seg.status === 'stale'}
        summary={segmentSummary(session)}
        onReopen={() => cb.onReopen('segment')}
      >
        <StageSegment
          session={session}
          features={features}
          onDecision={cb.onSegmentDecision}
          onThresholdChange={cb.onThresholdChange}
          onAdvance={() => cb.onAdvance('segment')}
          onReopenFeatures={() => cb.onReopen('features')}
        />
      </StageCard>

      <StageCard
        id="campaign"
        isActive={session.activeStage === 'campaign'}
        isComplete={camp.status === 'approved'}
        isStale={camp.status === 'stale'}
        summary={campaignSummary(session)}
        onReopen={() => cb.onReopen('campaign')}
      >
        <StageCampaign session={session} onRefine={cb.onRefineCampaign} />
      </StageCard>
    </div>
  );
};
