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
} from '../../data/chat/response-types';
import { NarrativePara } from './narrative-para';
import { ResponseSection } from './response-section';
import { Widget } from './widgets/widget';
import { BulletedInsights } from './bulleted-insights';
import { ResponseActionBar } from './response-action-bar';
import { FollowUps } from './follow-ups';

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
}

export function AssistantResponse({
  message, onFollowUp, onPin, renderActionCard,
}: AssistantResponseProps) {
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
          default:
            return null;
        }
      })}

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
