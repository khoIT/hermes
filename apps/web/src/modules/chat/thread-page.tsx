/**
 * Chat thread page — `/chat/:id` route. Renders thread by id from chat-store.
 * First user message becomes the H1 header; subsequent messages render below.
 * Phase 2: bottom input appends user message only. Phase 4 hooks intent matcher
 * to append a canned assistant response.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import {
  getThread, appendMessage, type Conversation,
} from '../../utils/chat-store';
import { respondToText } from '../../utils/chat-respond';
import { pushRecent } from '../../utils/recent-items-store';
import { notifyRecentChanged } from '../../components/sidebar/recent-items';
import { ThreadHeader } from '../../components/chat/thread-header';
import { UserMessage } from '../../components/chat/user-message';
import { AssistantResponse } from '../../components/chat/assistant-response';
import { ChatInputBox } from '../../components/chat/chat-input-box';
import { ActionCardSegment } from '../../components/chat/action-cards/action-card-segment';
import { ActionCardCampaign } from '../../components/chat/action-cards/action-card-campaign';
import type {
  ActionCardSegmentPayload, ActionCardCampaignPayload,
} from '../../data/chat/response-types';

function useThread(id: string | undefined): [Conversation | null, () => void] {
  const [version, setVersion] = React.useState(0);
  const conv = React.useMemo(
    () => (id ? getThread(id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, version]
  );
  return [conv, () => setVersion(v => v + 1)];
}

export default function ChatThreadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conv, refresh] = useThread(id);

  // Push to recent on mount + every refresh, so sidebar All Chats highlights this thread.
  React.useEffect(() => {
    if (conv) {
      pushRecent('chats', {
        id: conv.id,
        title: conv.title,
        updatedAt: conv.updatedAt,
      });
      notifyRecentChanged();
    }
  }, [conv]);

  if (!id) {
    return (
      <div style={{ padding: 40, fontFamily: T.fSans, color: T.n600 }}>
        Missing thread id.
      </div>
    );
  }

  if (!conv) {
    return (
      <div style={{ padding: 40, fontFamily: T.fSans }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: T.n900, marginBottom: 8 }}>
          Thread not found
        </div>
        <div style={{ color: T.n500, marginBottom: 16 }}>
          The conversation may have been deleted.
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            background: T.brand, color: '#fff', border: 'none',
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
            fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
          }}
        >
          Back to chat landing
        </button>
      </div>
    );
  }

  const handleSubmit = (text: string) => {
    appendMessage(conv.id, { role: 'user', text });
    // Append a scripted assistant response on the next tick so the user
    // message renders first and the thread layout settles before the
    // (potentially large) widget body lands.
    setTimeout(() => {
      const response = respondToText(text, conv.id);
      appendMessage(conv.id, response);
      refresh();
    }, 250);
    pushRecent('chats', {
      id: conv.id, title: conv.title, updatedAt: new Date().toISOString(),
    });
    notifyRecentChanged();
    refresh();
  };

  const [first, ...rest] = conv.messages;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh',
      maxWidth: 920, margin: '0 auto',
      padding: '0 32px 24px',
    }}>
      <div style={{ flex: 1, paddingBottom: 80 }}>
        {first?.role === 'user' && first.text && (
          <ThreadHeader question={first.text} />
        )}
        {rest.map(m =>
          m.role === 'user'
            ? <UserMessage key={m.id} text={m.text ?? ''} />
            : (
              <AssistantResponse
                key={m.id}
                message={m}
                threadMessages={conv.messages}
                onFollowUp={handleSubmit}
                renderActionCard={(type, payload) =>
                  type === 'action_card_segment'
                    ? <ActionCardSegment payload={payload as ActionCardSegmentPayload} />
                    : <ActionCardCampaign payload={payload as ActionCardCampaignPayload} />
                }
              />
            )
        )}
      </div>

      {/* Sticky bottom input */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'linear-gradient(to bottom, transparent, ' + T.n50 + ' 30%)',
        paddingTop: 12, paddingBottom: 12,
      }}>
        <ChatInputBox
          onSubmit={handleSubmit}
          showDeepResearch={false}
          placeholder="Ask a follow-up..."
        />
      </div>
    </div>
  );
}
