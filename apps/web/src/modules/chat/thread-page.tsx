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
  getThread, appendMessage, putThread, type Conversation,
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
import { TypingDots } from '../../components/chat-rail/typing-dots';
import { ActiveThreadProvider } from '../../utils/active-thread-context';
import { threadDemoLivops2026Turns } from '../../data/chat/threads/thread-demo-livops-2026';
import { threadDemoAgentLivops2026Turns } from '../../data/chat/threads/thread-demo-agent-livops-2026';
import { threadDemoAgentD7FbCohort2026Turns } from '../../data/chat/threads/thread-demo-agent-d7-fb-cohort-2026';
import { threadDemoAgentWhaleRecall2026Turns } from '../../data/chat/threads/thread-demo-agent-whale-recall-2026';
import type {
  ActionCardSegmentPayload, ActionCardCampaignPayload,
} from '../../data/chat/response-types';
import { isAgentFirstThread } from '../../utils/agent-first-thread-ids';

/** Threads that hard-reset to slim shape on entry and auto-play T1. The
 *  canonical analyst arc + the agent-first arc both follow this pattern. */
const DEMO_THREAD_T1: Record<string, typeof threadDemoLivops2026Turns.t1> = {
  'thread-demo-livops-2026':              threadDemoLivops2026Turns.t1,
  'thread-demo-agent-livops-2026':        threadDemoAgentLivops2026Turns.t1,
  'thread-demo-agent-d7-fb-cohort-2026':  threadDemoAgentD7FbCohort2026Turns.t1,
  'thread-demo-agent-whale-recall-2026':  threadDemoAgentWhaleRecall2026Turns.t1,
};
/** First-user-message id used as the hard-reset anchor, per-thread. */
const DEMO_FIRST_USER_MSG_ID: Record<string, string> = {
  'thread-demo-livops-2026':              'm-demo-u1',
  'thread-demo-agent-livops-2026':        'm-agent-u1',
  'thread-demo-agent-d7-fb-cohort-2026':  'm-agent-b-u1',
  'thread-demo-agent-whale-recall-2026':  'm-agent-c-u1',
};

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

  /** Thread id where an assistant turn is pending (typing dots showing). */
  const [pendingThreadId, setPendingThreadId] = React.useState<string | null>(null);
  const pendingTimerRef = React.useRef<number | null>(null);

  /**
   * Append `msg` to `threadId` after `delayMs`, showing typing dots in between.
   * Mirrors the chat-rail flow so /chat/:id has the same interactive feel.
   */
  const delayedAppend = React.useCallback((
    threadId: string,
    msg: Parameters<typeof appendMessage>[1],
    delayMs = 800,
  ) => {
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    setPendingThreadId(threadId);
    pendingTimerRef.current = window.setTimeout(() => {
      appendMessage(threadId, msg);
      pendingTimerRef.current = null;
      setPendingThreadId(null);
      notifyRecentChanged();
      refresh();
    }, delayMs);
  }, [refresh]);

  // Demo arcs: every entry hard-resets the thread to slim shape (just the
  // initial user prompt) so the demo is repeatable. Covers both the canonical
  // analyst arc and the agent-first arc. Guard ref prevents the reset from
  // firing again as the user advances T1 → T2 → T3 within the same mount.
  const lastResetIdRef = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    if (!id || !DEMO_THREAD_T1[id]) return;
    if (lastResetIdRef.current === id) return;
    lastResetIdRef.current = id;
    const current = getThread(id);
    if (!current || current.messages.length <= 1) return;
    const firstMsgId = DEMO_FIRST_USER_MSG_ID[id];
    putThread({
      ...current,
      messages: current.messages.filter(m => m.id === firstMsgId),
      updatedAt: current.createdAt,
    });
    refresh();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Demo arc auto-play: when a demo thread is in slim shape, schedule T1
  // with the typing-dot delay. Per-thread T1 lookup.
  React.useEffect(() => {
    if (!id) return;
    const t1 = DEMO_THREAD_T1[id];
    if (!t1) return;
    if (pendingThreadId === id) return;
    if (!conv || conv.messages.length !== 1) return;
    const { id: _id, createdAt: _ca, ...t1Rest } = t1;
    delayedAppend(id, t1Rest);
  }, [id, conv, pendingThreadId, delayedAppend]);

  // Cleanup pending timer on unmount.
  React.useEffect(() => () => {
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
  }, []);

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
    pushRecent('chats', {
      id: conv.id, title: conv.title, updatedAt: new Date().toISOString(),
    });
    notifyRecentChanged();
    refresh();
    // Assistant response plays after typing-dot delay for the "loading" feel.
    delayedAppend(conv.id, respondToText(text, conv.id));
  };

  const [first, ...rest] = conv.messages;

  return (
    <ActiveThreadProvider threadId={id}>
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh',
      maxWidth: 920, margin: '0 auto',
      padding: '0 32px 24px',
    }}>
      <div style={{ flex: 1, paddingBottom: 80 }}>
        {first?.role === 'user' && first.text && (
          <ThreadHeader question={first.text} threadId={id} artifact={first.artifact} />
        )}
        {rest.map(m =>
          m.role === 'user'
            ? <UserMessage key={m.id} text={m.text ?? ''} artifact={m.artifact} />
            : (
              <AssistantResponse
                key={m.id}
                message={m}
                threadId={id}
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
        {pendingThreadId === conv.id && <TypingDots />}
      </div>

      {/* Sticky bottom input */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'linear-gradient(to bottom, transparent, ' + T.n50 + ' 30%)',
        paddingTop: 12, paddingBottom: 12,
      }}>
        <ChatInputBox
          onSubmit={handleSubmit}
          showDeepResearch={isAgentFirstThread(id)}
          placeholder="Ask a follow-up..."
        />
      </div>
    </div>
    </ActiveThreadProvider>
  );
}
