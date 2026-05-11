/**
 * AssistantResponse — full structured response renderer.
 *   Identity header → Sections (narrative / h2 / widget / insights / action card)
 *   → ResponseActionBar → FollowUps
 *
 * Section renderers consume payloads defined in data/chat/response-types.ts.
 */
import React from 'react';
import { T } from '../../theme';
import type { ChatMessage } from '../../utils/chat-store';
import type {
  NarrativePayload, H2Payload, WidgetPayload, InsightsPayload,
  ActionCardSegmentPayload, ActionCardCampaignPayload,
  FeatureChipPayload, PinToBoardPayload, SoftHintPayload,
  ToolCallPayload, ProvenancePayload,
  WorkingStatusPayload, TaskProgressPayload, SubagentPanelPayload,
} from '../../data/chat/response-types';
import { NarrativePara } from './narrative-para';
import { ResponseSection } from './response-section';
import { Widget } from './widgets/widget';
import { FeatureChip } from './widgets/feature-chip';
import { BulletedInsights } from './bulleted-insights';
import { ResponseActionBar } from './response-action-bar';
import { FollowUps } from './follow-ups';
import { PinToBoardSection } from './sections/pin-to-board-section';
import { SoftHint } from './sections/soft-hint';
import { ToolCallChip, ProvenanceCaption } from './tool-call-chip';
import { WorkingStatusBlock } from './sections/working-status-block';
import { TaskProgressPanel } from './sections/task-progress-panel';
import { SubagentList } from './sections/subagent-list';
import { UniversalCtaRow } from './universal-cta-row';
import { useDeepResearch } from './deep-research-toggle';
import { isAgentFirstThread } from '../../utils/agent-first-thread-ids';

interface AssistantResponseProps {
  message: ChatMessage;
  /** Click handler for follow-ups (and action-card View nav from Phase 5). */
  onFollowUp?: (text: string) => void;
  /** Pin-to-board handler — Phase 6 wires real popover. */
  onPin?: (widgetId: string) => void;
  /** Phase 5 plugs in real action-card render here; Phase 3 renders a placeholder. */
  renderActionCard?: (
    type: 'action_card_segment' | 'action_card_campaign',
    payload: ActionCardSegmentPayload | ActionCardCampaignPayload,
    messageId: string,
  ) => React.ReactNode;
  /** Full thread message list — used by pin_to_board to look up upstream widget snapshots. */
  threadMessages?: ChatMessage[];
  /** Owning thread id — drives the deep-research render gate. Optional;
   *  when absent the gate falls through to OFF-state (tool_call) rendering. */
  threadId?: string;
}

export function AssistantResponse({
  message, onFollowUp, onPin, renderActionCard, threadMessages, threadId,
}: AssistantResponseProps) {
  // Deep-research render gate. ON in agent-first threads + toggle ON →
  // render working_status / task_progress / subagent_panel and skip
  // tool_call. Otherwise render tool_call as today and skip the new
  // deep-trace sections.
  const [deepResearchOn] = useDeepResearch();
  const showDeepTrace = deepResearchOn && isAgentFirstThread(threadId);
  // Compute which universal CTAs are already covered by explicit sections
  const hiddenCtas = React.useMemo(() => {
    const hidden = new Set<'segment' | 'board' | 'campaign'>();
    for (const s of message.sections ?? []) {
      if (s.type === 'action_card_segment') hidden.add('segment');
      if (s.type === 'pin_to_board') hidden.add('board');
      if (s.type === 'action_card_campaign') hidden.add('campaign');
    }
    return hidden;
  }, [message.sections]);

  // Aggregate narrative text for Copy action
  const copyText = React.useMemo(() => {
    const parts: string[] = [];
    if (message.text) parts.push(message.text);
    for (const s of message.sections ?? []) {
      if (s.type === 'narrative') parts.push((s.payload as NarrativePayload).text);
      if (s.type === 'h2') parts.push(`## ${(s.payload as H2Payload).text}`);
      if (s.type === 'insights') parts.push(...(s.payload as InsightsPayload).items);
    }
    return parts.join('\n\n');
  }, [message]);

  return (
    <div style={{ maxWidth: 820, margin: '8px 0 24px' }}>
      {/* Identity header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5, background: T.n900,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.fDisp, fontSize: 11, lineHeight: 1, letterSpacing: '0.02em',
        }}>VG</div>
        <span style={{
          fontFamily: T.fSans, fontSize: 12, fontWeight: 600, color: T.n800,
          letterSpacing: '-0.005em',
        }}>Hermes</span>
      </div>

      {/* Top-level text fallback (used by simple responses without sections). */}
      {message.text && !message.sections?.length && (
        <NarrativePara text={message.text} />
      )}

      {/* Sections */}
      {message.sections?.map((s, i) => {
        switch (s.type) {
          case 'narrative':
            return <NarrativePara key={i} text={(s.payload as NarrativePayload).text} />;
          case 'h2':
            return <ResponseSection key={i} title={(s.payload as H2Payload).text} />;
          case 'widget': {
            const w = (s.payload as WidgetPayload).widget;
            return <Widget key={i} widget={w} onPin={onPin ? () => onPin(w.id) : undefined} />;
          }
          case 'insights':
            return <BulletedInsights key={i} items={(s.payload as InsightsPayload).items} />;
          case 'action_card_segment':
          case 'action_card_campaign':
            return renderActionCard
              ? <React.Fragment key={i}>{renderActionCard(s.type, s.payload as any, message.id)}</React.Fragment>
              : <ActionCardPlaceholder key={i} kind={s.type} />;
          case 'feature_chip': {
            const p = s.payload as FeatureChipPayload;
            return <FeatureChip key={i} name={p.featureName} />;
          }
          case 'pin_to_board':
            return (
              <PinToBoardSection
                key={i}
                payload={s.payload as PinToBoardPayload}
                message={message}
                threadMessages={threadMessages}
              />
            );
          case 'soft_hint':
            return <SoftHint key={i} text={(s.payload as SoftHintPayload).text} />;
          case 'tool_call':
            if (showDeepTrace) return null;
            return <ToolCallChip key={i} {...(s.payload as ToolCallPayload)} />;
          case 'provenance':
            return <ProvenanceCaption key={i} text={(s.payload as ProvenancePayload).text} />;
          case 'working_status':
            if (!showDeepTrace) return null;
            return <WorkingStatusBlock key={i} payload={s.payload as WorkingStatusPayload} />;
          case 'task_progress':
            if (!showDeepTrace) return null;
            return <TaskProgressPanel key={i} payload={s.payload as TaskProgressPayload} />;
          case 'subagent_panel':
            if (!showDeepTrace) return null;
            return <SubagentList key={i} payload={s.payload as SubagentPanelPayload} />;
          default:
            return null;
        }
      })}

      {/* Universal CTA row — smart-hides when redundant sections present */}
      <UniversalCtaRow response={message} hiddenCtas={hiddenCtas} />

      {/* Action bar */}
      <ResponseActionBar copyText={copyText} credits={message.credits} />

      {/* Follow-ups */}
      {message.followUps && onFollowUp && (
        <FollowUps items={message.followUps} onPick={onFollowUp} />
      )}
    </div>
  );
}

function ActionCardPlaceholder({ kind }: { kind: string }) {
  return (
    <div style={{
      border: `1px dashed ${T.brandBorder}`, background: T.brandSoft,
      borderRadius: 10, padding: 14, margin: '12px 0', maxWidth: 820,
      fontFamily: T.fSans, fontSize: 13, color: T.brand,
    }}>
      [{kind} placeholder — wired in Phase 5]
    </div>
  );
}
