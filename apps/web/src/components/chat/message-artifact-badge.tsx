/**
 * MessageArtifactBadge — small clickable pill rendered above a user message,
 * indicating which artifact the user was viewing when the message was sent.
 * Click navigates to that artifact.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import type { MessageArtifact } from '../../utils/chat-store';

interface Props { artifact: MessageArtifact }

function hrefFor(a: MessageArtifact): string {
  switch (a.kind) {
    case 'segment':  return `/segments/${a.entityId}`;
    case 'campaign': return `/campaigns/${a.entityId}`;
    case 'board':    return `/canvas/${a.entityId}`;
    case 'feature':  return `/feature-store/${a.entityId}`;
  }
}

export function MessageArtifactBadge({ artifact }: Props) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(hrefFor(artifact))}
      title={`Open ${artifact.label}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: T.n100, color: T.n700,
        border: `1px solid ${T.n200}`,
        padding: '2px 8px', borderRadius: 999,
        fontFamily: T.fSans, fontSize: 11, fontWeight: 500,
        cursor: 'pointer', maxWidth: '100%',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        marginBottom: 6,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = T.n200; }}
      onMouseLeave={e => { e.currentTarget.style.background = T.n100; }}
    >
      {artifact.label}
    </button>
  );
}
