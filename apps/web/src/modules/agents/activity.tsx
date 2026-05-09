/**
 * 21 — Agent Activity Log (ag_activity)
 * Chronological feed of every agent action across the workspace.
 * Filterable by: agent · action type · outcome
 * Capped at 30 entries per v1 decision.
 * Per PRD_Hermes_Agentic.md §5.5
 */
import React from 'react';
import { T } from '../../theme';
import { ActivityRow } from './_components/activity-row';
import { allActivity } from '../../data/catalog/agents/activity';
import type { AgentActivityAgent, AgentActivityAction, AgentActivityOutcome } from '@hermes/contracts';

type AgentFilter  = 'all' | AgentActivityAgent;
type ActionFilter = 'all' | AgentActivityAction;
type OutcomeFilter = 'all' | AgentActivityOutcome;

const selectStyle: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 12, color: T.n800,
  border: `1px solid ${T.n200}`, borderRadius: 6,
  padding: '4px 8px', outline: 'none', background: '#fff', cursor: 'pointer',
};

export default function AgentsActivityPage() {
  const [agentFilter,   setAgentFilter]   = React.useState<AgentFilter>('all');
  const [actionFilter,  setActionFilter]  = React.useState<ActionFilter>('all');
  const [outcomeFilter, setOutcomeFilter] = React.useState<OutcomeFilter>('all');

  const filtered = React.useMemo(() => {
    return allActivity
      .filter(a => agentFilter  === 'all' || a.agent   === agentFilter)
      .filter(a => actionFilter === 'all' || a.action  === actionFilter)
      .filter(a => outcomeFilter === 'all' || a.outcome === outcomeFilter)
      .slice(0, 30); // v1 cap
  }, [agentFilter, actionFilter, outcomeFilter]);

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* Page header */}
      <div style={{ padding: '28px 40px 0', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          05 · Agents · Activity
        </div>
        <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 6 }}>
          Activity Log
        </div>
        <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginBottom: 16 }}>
          Chronological record of all agent actions · showing {filtered.length} entries
        </div>

        {/* Filter rail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>Agent</span>
            <select value={agentFilter} onChange={e => setAgentFilter(e.target.value as AgentFilter)} style={selectStyle}>
              <option value="all">All agents</option>
              <option value="insight">Insight</option>
              <option value="authoring">Authoring</option>
              <option value="experiment">Experiment</option>
            </select>
          </div>

          <div style={{ width: 1, height: 16, background: T.n200 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>Action</span>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value as ActionFilter)} style={selectStyle}>
              <option value="all">All actions</option>
              <option value="proposed">Proposed</option>
              <option value="drafted">Drafted</option>
              <option value="recommended">Recommended</option>
              <option value="auto-archived">Auto-archived</option>
            </select>
          </div>

          <div style={{ width: 1, height: 16, background: T.n200 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>Outcome</span>
            <select value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value as OutcomeFilter)} style={selectStyle}>
              <option value="all">All outcomes</option>
              <option value="approved">Approved</option>
              <option value="approved-with-edits">Approved with edits</option>
              <option value="rejected">Rejected</option>
              <option value="dismissed">Dismissed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div style={{ padding: '20px 40px', maxWidth: 1100 }}>
        <div style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8 }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '140px 100px 90px 130px 1fr',
            gap: 12, padding: '8px 12px',
            fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
            color: T.n400, textTransform: 'uppercase', letterSpacing: '0.07em',
            borderBottom: `1px solid ${T.n200}`,
          }}>
            <span>Timestamp</span>
            <span>Agent</span>
            <span>Action</span>
            <span>Outcome</span>
            <span>Description</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n400, textAlign: 'center', padding: '40px 0' }}>
              No activity matches the current filters.
            </div>
          ) : (
            filtered.map(a => <ActivityRow key={a.id} activity={a} />)
          )}
        </div>
      </div>
    </div>
  );
}
