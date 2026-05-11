/**
 * CompactThreadView — wraps the existing message renderer in a CSS scope
 * that constrains chart widths and table overflow. Reuses
 * <UserMessage> + <AssistantResponse>; does NOT fork them.
 */
import React from 'react';
import { T } from '../../theme';
import type { Conversation } from '../../utils/chat-store';
import type {
  ActionCardSegmentPayload, ActionCardCampaignPayload,
} from '../../data/chat/response-types';
import { UserMessage } from '../chat/user-message';
import { AssistantResponse } from '../chat/assistant-response';
import { ActionCardSegment } from '../chat/action-cards/action-card-segment';
import { ActionCardCampaign } from '../chat/action-cards/action-card-campaign';
import { MessageArtifactBadge } from '../chat/message-artifact-badge';
import { TypingDots } from './typing-dots';

interface CompactThreadViewProps {
  conversation: Conversation;
  /** Caller submits a follow-up; must append a user message + scripted response. */
  onFollowUp: (text: string) => void;
  /** When true, render TypingDots after the last message (assistant pending). */
  pending?: boolean;
}

export function CompactThreadView({ conversation, onFollowUp, pending }: CompactThreadViewProps) {
  return (
    <div className="hermes-rail-compact" style={{
      padding: '12px 14px',
      // Scoped CSS for nested widget bodies — narrow chart canvas,
      // overflow tables horizontally, and tighten font sizes.
    }}>
      <style>{COMPACT_CSS}</style>
      {conversation.messages.map((m, idx) => {
        if (m.role === 'user') {
          return idx === 0 ? (
            <div key={m.id} style={{ margin: '0 0 12px' }}>
              {m.artifact && <MessageArtifactBadge artifact={m.artifact} />}
              <div style={{
                fontFamily: T.fSans, fontSize: 14, fontWeight: 600,
                color: T.n900,
              }}>
                {m.text}
              </div>
            </div>
          ) : (
            <UserMessage key={m.id} text={m.text ?? ''} artifact={m.artifact} />
          );
        }
        return (
          <AssistantResponse
            key={m.id}
            message={m}
            threadId={conversation.id}
            threadMessages={conversation.messages}
            onFollowUp={onFollowUp}
            renderActionCard={(type, payload) =>
              type === 'action_card_segment'
                ? <ActionCardSegment payload={payload as ActionCardSegmentPayload} />
                : <ActionCardCampaign payload={payload as ActionCardCampaignPayload} />
            }
          />
        );
      })}
      {pending && <TypingDots />}
    </div>
  );
}

const COMPACT_CSS = `
.hermes-rail-compact > div { max-width: 100% !important; }
.hermes-rail-compact svg { max-width: 100%; }
.hermes-rail-compact table { width: 100%; font-size: 11px; }
.hermes-rail-compact .recharts-wrapper,
.hermes-rail-compact .recharts-surface { max-width: 100% !important; }
`;
