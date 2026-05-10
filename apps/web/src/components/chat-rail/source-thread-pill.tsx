/**
 * SourceThreadPill — reverse-navigation chip shown on artifact detail pages
 * (segments, campaigns, board cards) when the artifact was created from a
 * chat thread. Clicking navigates back to the originating thread.
 *
 * Props:
 *   threadId  — the source thread id (required; render nothing when falsy)
 *   variant   — 'header' (inline in page header) | 'card-overlay' (abs positioned on board card)
 *   prefix    — label before the title, default "💬 from"
 *
 * Title is resolved synchronously from the in-memory chat-store index via
 * thread-title-lookup. Falls back to "chat thread" when the id is orphaned.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import { useThreadTitle } from '../../utils/thread-title-lookup';

export interface SourceThreadPillProps {
  threadId: string | null | undefined;
  variant?: 'header' | 'card-overlay';
  prefix?: string;
}

const MAX_TITLE_CHARS = 40;

function truncate(s: string): string {
  return s.length > MAX_TITLE_CHARS ? `${s.slice(0, MAX_TITLE_CHARS - 1)}…` : s;
}

export const SourceThreadPill = React.memo<SourceThreadPillProps>(
  function SourceThreadPill({ threadId, variant = 'header', prefix = '💬 from' }) {
    const navigate = useNavigate();
    const rawTitle = useThreadTitle(threadId);

    // Render nothing when threadId is absent — clean null-state for seeded data
    if (!threadId) return null;

    const label = rawTitle ? truncate(rawTitle) : 'chat thread';

    const pillStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: T.n50,
      border: `1px solid ${T.n200}`,
      color: T.n800,
      fontSize: 12,
      fontFamily: T.fSans,
      fontWeight: 500,
      padding: '4px 10px',
      borderRadius: 10,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      // card-overlay: absolute bottom-left so it doesn't clash with the
      // top-right unpin button
      ...(variant === 'card-overlay' && {
        position: 'absolute',
        bottom: 10,
        left: 10,
        zIndex: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
      }),
    };

    return (
      <button
        style={pillStyle}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/chat/${threadId}`);
        }}
        title={`Go to source thread: ${rawTitle ?? threadId}`}
        aria-label={`Navigate to source chat thread${rawTitle ? `: ${rawTitle}` : ''}`}
      >
        <span style={{ opacity: 0.75 }}>{prefix}</span>
        <span style={{ color: T.n800, fontWeight: 600 }}>{label}</span>
      </button>
    );
  },
);
