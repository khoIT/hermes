/**
 * AgentAttribution — one-line attribution shown in handoff modals and
 * canvas right-rail when artifact was agent-drafted.
 * Format: "Drafted by Authoring Agent · approved by Khoi · thread #ag-1042"
 * Per PRD_Hermes_Agentic.md §6.4
 */
import React from 'react';
import { T } from '../theme';

interface AgentAttributionProps {
  agentLabel?: string;
  approvedBy?: string;
  threadId?: string;
  /** Called when thread link is clicked — opens reasoning panel */
  onOpenThread?: () => void;
  style?: React.CSSProperties;
}

export const AgentAttribution = React.memo<AgentAttributionProps>(({
  agentLabel = 'Authoring Agent',
  approvedBy,
  threadId,
  onOpenThread,
  style,
}) => (
  <div style={{
    fontFamily: T.fSans,
    fontSize: 12,
    color: T.n500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    ...style,
  }}>
    <span>Drafted by <strong style={{ color: T.brand, fontWeight: 600 }}>{agentLabel}</strong></span>
    {approvedBy && (
      <>
        <span style={{ color: T.n300 }}>·</span>
        <span>approved by <strong style={{ color: T.n700, fontWeight: 600 }}>{approvedBy}</strong></span>
      </>
    )}
    {threadId && (
      <>
        <span style={{ color: T.n300 }}>·</span>
        <button
          onClick={onOpenThread}
          style={{
            fontFamily: T.fMono, fontSize: 11, color: T.brand,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            textDecoration: 'underline', textDecorationStyle: 'dotted',
          }}
        >
          thread #{threadId}
        </button>
      </>
    )}
  </div>
));
AgentAttribution.displayName = 'AgentAttribution';
