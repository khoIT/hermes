/**
 * SubagentList — iterates the agents[] payload, rendering a SubagentPanel
 * per entry. Pure presenter; no thread-fixture imports.
 */
import React from 'react';
import { SubagentPanel } from './subagent-panel';
import type { SubagentPanelPayload } from '../../../data/chat/response-types';

interface Props {
  payload: SubagentPanelPayload;
}

export function SubagentList({ payload }: Props) {
  return (
    <div data-hermes-section="subagent-list" style={{ marginTop: 4 }}>
      {payload.agents.map((a, i) => (
        <SubagentPanel key={a.name + i} agent={a} />
      ))}
    </div>
  );
}
