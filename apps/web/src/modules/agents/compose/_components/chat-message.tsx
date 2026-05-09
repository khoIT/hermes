/**
 * Single chat message — user (right, dark), agent (left, serif), system (centered, mono).
 */
import React from 'react';
import { T } from '../../../../theme';
import type { ChatEntry } from '../_state/compose-types';

interface Props {
  entry: ChatEntry;
}

const SERIF = '"Spectral", "Iowan Old Style", Georgia, serif';

export const ChatMessage: React.FC<Props> = ({ entry }) => {
  if (entry.role === 'system') {
    return (
      <div style={{
        margin: '12px 0', padding: '8px 12px', borderRadius: 6,
        background: T.n50, border: `1px dashed ${T.n200}`,
        fontFamily: T.fMono, fontSize: 10.5, color: T.n500,
        whiteSpace: 'pre-line', lineHeight: 1.55,
      }}>
        {entry.text}
      </div>
    );
  }

  const isUser = entry.role === 'user';
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      margin: '10px 0',
    }}>
      <div style={{
        maxWidth: '88%',
        padding: '10px 14px', borderRadius: 12,
        background: isUser ? T.n900 : '#fff7ed',
        color: isUser ? '#fff' : T.n900,
        border: isUser ? 'none' : `1px solid ${T.brandBorder}`,
        fontFamily: isUser ? T.fSans : SERIF,
        fontSize: isUser ? 13 : 14,
        lineHeight: 1.55,
      }}>
        {!isUser && (
          <div style={{
            fontFamily: T.fMono, fontSize: 10, color: T.brand,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            ✦ agent
          </div>
        )}
        {entry.text}
      </div>
    </div>
  );
};
