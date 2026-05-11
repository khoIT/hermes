/**
 * SubagentPanel — single named specialized agent. Header (icon + name + task
 * count + chevron) is clickable to expand a 1-line summary into a 5-task list.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { T, Icon } from '../../../theme';
import type { SubagentPanelPayload } from '../../../data/chat/response-types';

type Agent = SubagentPanelPayload['agents'][number];

interface Props {
  agent: Agent;
}

export function SubagentPanel({ agent }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div style={{
      borderTop: `1px solid ${T.n100}`,
      padding: '14px 0',
      maxWidth: 820,
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          all: 'unset', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
        aria-expanded={expanded}
      >
        <AgentAvatar />
        <span style={{ flex: 1, fontFamily: T.fSans, fontSize: 14, fontWeight: 600, color: T.n900 }}>
          {agent.name}
        </span>
        <span style={{
          fontFamily: T.fSans, fontSize: 12, color: T.n500, marginRight: 6,
        }}>{agent.tasks.length} tasks</span>
        <Icon icon={ChevronRight} size={14} color={T.n400} style={{
          transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .12s',
        }} />
      </button>
      <p style={{
        margin: '8px 0 0 36px', fontFamily: T.fSans, fontSize: 12.5,
        color: T.n600, lineHeight: 1.55,
      }}>{agent.summary}</p>
      {expanded && (
        <ul style={{ margin: '10px 0 0 36px', padding: 0, listStyle: 'none' }}>
          {agent.tasks.map((t, i) => (
            <li key={i} style={{
              fontFamily: T.fSans, fontSize: 12.5, color: T.n700,
              padding: '4px 0', lineHeight: 1.5,
            }}>· {t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AgentAvatar() {
  return (
    <span aria-hidden style={{
      width: 22, height: 22, borderRadius: 5, background: T.n100,
      display: 'inline-block', flexShrink: 0,
    }} />
  );
}
