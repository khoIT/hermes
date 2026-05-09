/**
 * 22 — Agent Settings (ag_settings)
 * Per-agent enable/disable · frequency picker · scope (games + 4R goals)
 * Studio Agent slot with "Coming in Phase 2" empty state.
 * NO model picker, NO prompt editor, NO training UI (per Agentic §11).
 * Per PRD_Hermes_Agentic.md §5.5 settings spec.
 */
import React from 'react';
import { T } from '../../theme';
import { AgentConfigSection, type AgentConfig } from './_components/agent-config-section';

const DEFAULT_INSIGHT: AgentConfig = {
  enabled: true,
  frequency: 'continuous',
  games: ['CFM', 'NTH', 'COS', 'PT', 'TF'],
  goals: ['retain', 'revenue', 'reactivate', 'recruit'],
};

const DEFAULT_AUTHORING: AgentConfig = {
  enabled: true,
  frequency: 'hourly',
  games: ['CFM', 'NTH', 'TF'],
  goals: ['retain', 'revenue', 'reactivate'],
};

const DEFAULT_EXPERIMENT: AgentConfig = {
  enabled: true,
  frequency: 'daily',
  games: ['CFM', 'NTH'],
  goals: ['retain', 'revenue'],
};

export default function AgentsSettingsPage() {
  const [insightCfg,    setInsightCfg]    = React.useState<AgentConfig>(DEFAULT_INSIGHT);
  const [authoringCfg,  setAuthoringCfg]  = React.useState<AgentConfig>(DEFAULT_AUTHORING);
  const [experimentCfg, setExperimentCfg] = React.useState<AgentConfig>(DEFAULT_EXPERIMENT);

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* Page header */}
      <div style={{ padding: '28px 40px 20px', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          05 · Agents · Settings
        </div>
        <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 6 }}>
          Agent Settings
        </div>
        <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
          Configure scan frequency and scope per agent. Approvals remain explicit — agents never act autonomously.
        </div>
      </div>

      {/* Agent sections */}
      <div style={{ padding: '24px 40px', maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <AgentConfigSection
          agentId="insight"
          agentLabel="Insight Agent"
          description="Continuously scans feature drift, campaign gaps, and cohort patterns. Surfaces opportunities with evidence and proposed artifacts for PM review."
          config={insightCfg}
          onChange={setInsightCfg}
        />

        <AgentConfigSection
          agentId="authoring"
          agentLabel="Authoring Agent"
          description="Produces draft Segments and Campaigns from approved opportunities or typed intents. All drafts enter the review queue before activation."
          config={authoringCfg}
          onChange={setAuthoringCfg}
        />

        <AgentConfigSection
          agentId="experiment"
          agentLabel="Experiment Agent"
          description="Monitors running A/B experiments and recommends scale, extend, kill, or drop-variant actions when statistical thresholds are reached."
          config={experimentCfg}
          onChange={setExperimentCfg}
        />

        {/* Studio Agent — Phase 2 reserved slot */}
        <div style={{
          background: '#fff',
          border: `1px dashed ${T.n300}`,
          borderRadius: 10,
          padding: '20px 24px',
          borderLeft: `3px dashed ${T.n300}`,
          opacity: 0.65,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: T.fSans, fontSize: 14, fontWeight: 700, color: T.n600, marginBottom: 4 }}>
                Studio Agent
              </div>
              <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n400, maxWidth: 480, lineHeight: 1.5 }}>
                Assists with creative asset generation and localisation for push notifications and in-game messages.
              </div>
            </div>
            <span style={{
              fontFamily: T.fMono, fontSize: 11, fontWeight: 600,
              color: T.n500, background: T.n100,
              border: `1px solid ${T.n200}`, borderRadius: 6,
              padding: '4px 12px', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 24,
            }}>
              Coming in Phase 2 ·
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
