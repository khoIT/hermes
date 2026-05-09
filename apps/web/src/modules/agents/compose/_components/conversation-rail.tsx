/**
 * Conversation rail — left column. Scrollable chat thread + sticky IntentInput.
 */
import React from 'react';
import { T } from '../../../../theme';
import { ChatMessage } from './chat-message';
import { IntentInput } from './intent-input';
import type { ChatEntry } from '../_state/compose-types';

interface Props {
  chatLog: ChatEntry[];
  intentSubmitted: boolean;
  onUserSubmit: (text: string) => void;
}

export const ConversationRail: React.FC<Props> = ({ chatLog, intentSubmitted, onUserSubmit }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatLog.length]);

  return (
    <aside style={{
      display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${T.n200}`, background: '#fafafa',
      height: '100%', minHeight: 0,
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${T.n200}`, background: '#fff',
        fontFamily: T.fMono, fontSize: 11, color: T.n500, letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        ✦ Authoring agent · conversation
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', minHeight: 0 }}>
        {chatLog.length === 0 ? (
          <div style={{
            margin: '20px 0', padding: 14, borderRadius: 10,
            background: '#fff7ed', border: `1px solid ${T.brandBorder}`,
            fontFamily: '"Spectral", Georgia, serif', fontSize: 14, color: T.n800, lineHeight: 1.55,
          }}>
            <div style={{
              fontFamily: T.fMono, fontSize: 10, color: T.brand,
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4,
            }}>
              ✦ agent
            </div>
            Describe a problem and I'll help you build a campaign — features, segment, action.
          </div>
        ) : (
          chatLog.map((entry) => <ChatMessage key={entry.id} entry={entry} />)
        )}
      </div>
      <IntentInput
        onSubmit={onUserSubmit}
        showStarters={!intentSubmitted}
        placeholder={intentSubmitted ? 'Refine, ask, or hop back to a stage…' : undefined}
      />
    </aside>
  );
};
