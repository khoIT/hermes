/**
 * AgentBadge — mono pill for agent-authored artifacts.
 * variant "agent":        filled #f05a22 (deep red) — pure agent draft
 * variant "agent-edited": outlined #f05a22 — agent draft edited by PM
 * Per PRD_Hermes_Agentic.md §6.1
 */
import React from 'react';
import { T } from '../theme';

export type AgentBadgeVariant = 'agent' | 'agent-edited';

interface AgentBadgeProps {
  variant?: AgentBadgeVariant;
  agentName?: string;
  style?: React.CSSProperties;
}

const LABEL: Record<AgentBadgeVariant, string> = {
  'agent':        'agent',
  'agent-edited': 'agent · ed',
};

export const AgentBadge = React.memo<AgentBadgeProps>(({
  variant = 'agent',
  agentName,
  style,
}) => {
  const filled = variant === 'agent';
  return (
    <span
      title={agentName ? `Drafted by ${agentName}` : undefined}
      style={{
        fontFamily: T.fMono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        padding: '2px 7px',
        borderRadius: 4,
        border: `1px solid ${T.brand}`,
        background: filled ? T.brand : 'transparent',
        color: filled ? '#fff' : T.brand,
        whiteSpace: 'nowrap',
        cursor: agentName ? 'help' : 'default',
        ...style,
      }}
    >
      {LABEL[variant]}
    </span>
  );
});
AgentBadge.displayName = 'AgentBadge';
