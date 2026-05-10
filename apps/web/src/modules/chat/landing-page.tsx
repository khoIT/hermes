/**
 * Chat landing page — root `/` route in chat-first IA.
 * Centered Hermes brand mark + tagline + ChatInputBox + 5 SuggestedPromptList.
 * Submitting creates a new thread + navigates to /chat/:id.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import { ChatInputBox } from '../../components/chat/chat-input-box';
import { SuggestedPromptList } from '../../components/chat/suggested-prompt-list';
import type { SuggestedPrompt } from '../../data/chat/suggested-prompts';
import { createThread, appendMessage, getThread } from '../../utils/chat-store';
import { respondToText } from '../../utils/chat-respond';
import { pushRecent } from '../../utils/recent-items-store';
import { notifyRecentChanged } from '../../components/sidebar/recent-items';

export default function ChatLandingPage() {
  const navigate = useNavigate();

  const handleSubmit = React.useCallback((text: string) => {
    const id = createThread(text);
    appendMessage(id, respondToText(text));
    pushRecent('chats', { id, title: text, updatedAt: new Date().toISOString() });
    notifyRecentChanged();
    navigate(`/chat/${id}`);
  }, [navigate]);

  // Scripted prompts have a canonical pre-seeded thread; route to it instead
  // of forking a duplicate `t-XXXXX` clone every click.
  const handlePromptPick = React.useCallback((prompt: SuggestedPrompt) => {
    const seeded = getThread(prompt.threadId);
    if (seeded) {
      pushRecent('chats', { id: seeded.id, title: seeded.title, updatedAt: seeded.updatedAt });
      notifyRecentChanged();
      navigate(`/chat/${seeded.id}`);
      return;
    }
    handleSubmit(prompt.text);
  }, [handleSubmit, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 32px',
      maxWidth: 880, margin: '0 auto',
    }}>
      {/* Brand mark */}
      <div style={{
        width: 56, height: 56, borderRadius: 12, background: T.n900,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
      }}>
        <span style={{
          fontFamily: T.fDisp, fontSize: 26, fontWeight: 400,
          color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em',
          lineHeight: 1,
        }}>VG</span>
      </div>

      <div style={{
        fontFamily: T.fDisp, fontSize: 38, fontWeight: 400, color: T.n950,
        textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1,
        marginBottom: 14,
      }}>HERMES</div>

      <p style={{
        fontFamily: T.fSans, fontSize: 14, color: T.n500,
        margin: '0 0 36px', textAlign: 'center', maxWidth: 540, lineHeight: 1.55,
      }}>
        Ask anything about your players, retention, segments, or campaigns.
      </p>

      <div style={{ width: '100%', maxWidth: 820 }}>
        <ChatInputBox onSubmit={handleSubmit} autoFocus />
      </div>

      <div style={{ width: '100%', maxWidth: 820, marginTop: 28 }}>
        <SuggestedPromptList onPick={handlePromptPick} />
      </div>
    </div>
  );
}
