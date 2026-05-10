/**
 * ContinueInChatPill — sticky bottom-right action pill shown on artifact
 * detail pages (boards, segments, campaigns) when the artifact was originated
 * from a chat thread. Clicking navigates back to the source thread.
 *
 * Coexists with Phase 2's header <SourceThreadPill> (informational); this
 * pill is the action-oriented CTA aligned to the viewport corner.
 *
 * Renders nothing when threadId is falsy.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../theme';

export interface ContinueInChatPillProps {
  threadId: string | null | undefined;
  label?: string;
}

export const ContinueInChatPill = React.memo<ContinueInChatPillProps>(
  function ContinueInChatPill({ threadId, label = '← Continue in chat' }) {
    const navigate = useNavigate();

    if (!threadId) return null;

    return (
      <button
        onClick={() => navigate(`/chat/${threadId}`)}
        style={pillStyle}
        title={`Return to chat thread: ${threadId}`}
        aria-label="Return to source chat thread"
        onMouseEnter={e => {
          e.currentTarget.style.background = T.brandHover;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = T.brand;
        }}
      >
        {label}
      </button>
    );
  },
);

const pillStyle: React.CSSProperties = {
  position: 'fixed',
  // bottom: 88 lifts the pill above AskHermesFab (52px height + 24px from bottom = 76px)
  // ensuring no geometric overlap on rail-default-open routes during demo.
  bottom: 88,
  right: 28,
  zIndex: 50,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: T.brand,
  color: '#fff',
  fontFamily: T.fSans,
  fontSize: 13,
  fontWeight: 600,
  padding: '10px 18px',
  borderRadius: 24,
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(240,90,34,0.35)',
  transition: 'background .12s',
  whiteSpace: 'nowrap',
};
