/**
 * AskHermesPanel — 380px right slide-in chat panel. Resumes the latest active
 * thread by default; "+ New chat" creates a fresh one (also added to sidebar).
 * Page-context chip injects current artifact on first send per page.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { T, Icon } from '../../theme';
import { usePanel } from '../../utils/panel-store';
import { describeContext } from '../../utils/page-context';
import {
  appendMessage, createThread, getThread, listThreads,
} from '../../utils/chat-store';
import { respondToText } from '../../utils/chat-respond';
import { pushRecent } from '../../utils/recent-items-store';
import { notifyRecentChanged } from '../sidebar/recent-items';
import { useGlobalShortcut } from '../../utils/keyboard-shortcut';
import { ChatInputBox } from '../chat/chat-input-box';
import { UserMessage } from '../chat/user-message';
import { AssistantResponse } from '../chat/assistant-response';

const DISMISS_KEY = 'hermes.chat.panel.chipDismissed';

function chipDismissedFor(id: string | undefined): boolean {
  if (!id) return false;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const set = JSON.parse(raw);
    return Array.isArray(set) && set.includes(id);
  } catch { return false; }
}

function dismissChip(id: string) {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    if (!set.includes(id)) set.push(id);
    localStorage.setItem(DISMISS_KEY, JSON.stringify(set));
  } catch { /* no-op */ }
}

export function AskHermesPanel() {
  const navigate = useNavigate();
  const { open, threadId, context, setOpen, setThread } = usePanel();
  const [tick, setTick] = React.useState(0);
  const refresh = () => setTick(t => t + 1);

  // Default thread: most recent
  React.useEffect(() => {
    if (open && !threadId) {
      const idx = listThreads();
      if (idx[0]) setThread(idx[0].id);
    }
  }, [open, threadId, setThread]);

  // Esc closes
  useGlobalShortcut('escape', () => { if (open) setOpen(false); });

  const conv = threadId ? getThread(threadId) : null;
  const [chipDismissed, setChipDismissed] = React.useState(
    () => chipDismissedFor(context.id),
  );
  React.useEffect(() => {
    setChipDismissed(chipDismissedFor(context.id));
  }, [context.id]);

  if (!open) return null;

  const submit = (text: string) => {
    let activeId = threadId;
    const ctxLabel = describeContext(context);
    const finalText = ctxLabel && !chipDismissed
      ? `[${ctxLabel}]\n${text}`
      : text;
    if (!activeId) {
      activeId = createThread(finalText);
      setThread(activeId);
      pushRecent('chats', { id: activeId, title: finalText, updatedAt: new Date().toISOString() });
    } else {
      appendMessage(activeId, { role: 'user', text: finalText });
    }
    appendMessage(activeId, respondToText(text));
    if (context.id) { dismissChip(context.id); setChipDismissed(true); }
    notifyRecentChanged();
    refresh();
  };

  const onNewChat = () => {
    const id = createThread('New conversation');
    setThread(id);
    pushRecent('chats', { id, title: 'New conversation', updatedAt: new Date().toISOString() });
    notifyRecentChanged();
    refresh();
  };

  const ctxLabel = describeContext(context);

  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
      background: '#fff', borderLeft: `1px solid ${T.n200}`,
      boxShadow: '-6px 0 20px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', zIndex: 1000,
      animation: 'panelSlideIn .2s ease-out',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px', borderBottom: `1px solid ${T.n200}`,
        fontFamily: T.fSans,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5, background: T.n900,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.fDisp, fontSize: 11, lineHeight: 1, letterSpacing: '0.02em',
        }}>VG</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.n900, flex: 1 }}>
          Ask Hermes
        </span>
        <button onClick={onNewChat} aria-label="New chat" style={iconBtn}>
          <Icon icon={Plus} size={14} color={T.n600} />
        </button>
        <button onClick={() => setOpen(false)} aria-label="Close" style={iconBtn}>
          <Icon icon={X} size={14} color={T.n600} />
        </button>
      </div>

      {/* Context chip */}
      {ctxLabel && !chipDismissed && (
        <div style={{
          background: T.brandSoft, color: T.brand, padding: '8px 14px',
          fontFamily: T.fSans, fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: `1px solid ${T.brandBorder}`,
        }}>
          <span style={{ flex: 1 }}>{ctxLabel}</span>
          <button
            onClick={() => { if (context.id) { dismissChip(context.id); setChipDismissed(true); } }}
            aria-label="Dismiss context"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.brand }}
          >
            <Icon icon={X} size={12} color={T.brand} />
          </button>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }} key={tick}>
        {!conv ? (
          <div style={{ padding: 16, fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
            Start a new chat below or pick one from All Chats.
          </div>
        ) : (
          conv.messages.map((m, i) => {
            if (m.role === 'user') {
              return i === 0 ? (
                <div key={m.id} style={{ fontFamily: T.fSans, fontSize: 14, fontWeight: 600, color: T.n900, margin: '8px 0' }}>
                  {m.text}
                </div>
              ) : <UserMessage key={m.id} text={m.text ?? ''} />;
            }
            return <AssistantResponse key={m.id} message={m} onFollowUp={submit} />;
          })
        )}
      </div>

      {/* Footer link to full thread */}
      {conv && (
        <button
          onClick={() => { setOpen(false); navigate(`/chat/${conv.id}`); }}
          style={{
            background: 'transparent', border: 'none', borderTop: `1px solid ${T.n100}`,
            padding: '8px 14px', fontFamily: T.fSans, fontSize: 11, color: T.n500,
            textAlign: 'left', cursor: 'pointer',
          }}
        >Open in full chat ↗</button>
      )}

      {/* Input */}
      <div style={{ borderTop: `1px solid ${T.n200}`, padding: 10 }}>
        <ChatInputBox onSubmit={submit} compact placeholder="Ask Hermes..." showDeepResearch={false} />
      </div>
    </aside>
  );
}

const iconBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28, borderRadius: 6,
  background: 'transparent', border: 'none', cursor: 'pointer',
};
