/**
 * AgentConfigSection — per-agent settings card for screen 22.
 * Shows: enable/disable toggle · frequency picker · scope picker (games + 4R goals)
 * Per PRD_Hermes_Agentic.md §11 (no model picker, no prompt editor, no training UI)
 */
import React from 'react';
import { T, Switch } from '../../../theme';

export type AgentFrequency = 'continuous' | 'hourly' | 'daily' | 'weekly';

export interface AgentConfig {
  enabled: boolean;
  frequency: AgentFrequency;
  games: string[];
  goals: string[];
}

interface AgentConfigSectionProps {
  agentId: 'insight' | 'authoring' | 'experiment';
  agentLabel: string;
  description: string;
  config: AgentConfig;
  onChange: (next: AgentConfig) => void;
}

const ALL_GAMES = ['CFM', 'NTH', 'COS', 'PT', 'TF'];
const ALL_GOALS = ['retain', 'revenue', 'reactivate', 'recruit'];

const FREQ_OPTIONS: { value: AgentFrequency; label: string }[] = [
  { value: 'continuous', label: 'Continuous' },
  { value: 'hourly',     label: 'Hourly scan' },
  { value: 'daily',      label: 'Daily scan'  },
  { value: 'weekly',     label: 'Weekly scan' },
];

const AGENT_ACCENT: Record<string, string> = {
  insight:    T.brand,
  authoring:  T.blue600,
  experiment: T.purple500,
};

function MultiSelectChips({
  options, selected, onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            onClick={() => toggle(o)}
            style={{
              fontFamily: T.fSans, fontSize: 11, fontWeight: 500,
              padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
              background: active ? T.n900 : T.n100,
              color: active ? '#fff' : T.n700,
              border: 'none', textTransform: 'capitalize',
              transition: 'background .1s',
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export const AgentConfigSection = React.memo<AgentConfigSectionProps>(({
  agentId, agentLabel, description, config, onChange,
}) => {
  const accent = AGENT_ACCENT[agentId] ?? T.brand;
  const set = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
      padding: '20px 24px',
      borderLeft: `3px solid ${accent}`,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{
            fontFamily: T.fSans, fontSize: 14, fontWeight: 700, color: T.n900,
            marginBottom: 4,
          }}>
            {agentLabel}
          </div>
          <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, maxWidth: 520, lineHeight: 1.5 }}>
            {description}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 24 }}>
          <span style={{
            fontFamily: T.fSans, fontSize: 12,
            color: config.enabled ? T.green600 : T.n500,
            fontWeight: 600,
          }}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <Switch checked={config.enabled} onChange={v => set('enabled', v)} />
        </div>
      </div>

      {config.enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Frequency */}
          <div>
            <div style={{
              fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500,
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
            }}>
              Scan frequency
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {FREQ_OPTIONS.map(f => (
                <button
                  key={f.value}
                  onClick={() => set('frequency', f.value)}
                  style={{
                    fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
                    padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                    background: config.frequency === f.value ? accent : T.n100,
                    color: config.frequency === f.value ? '#fff' : T.n700,
                    border: 'none', transition: 'background .1s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scope — games */}
          <div>
            <div style={{
              fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500,
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
            }}>
              Scope · Games
            </div>
            <MultiSelectChips
              options={ALL_GAMES}
              selected={config.games}
              onChange={v => set('games', v)}
            />
          </div>

          {/* Scope — 4R goals */}
          <div>
            <div style={{
              fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500,
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
            }}>
              Scope · 4R Goals
            </div>
            <MultiSelectChips
              options={ALL_GOALS}
              selected={config.goals}
              onChange={v => set('goals', v)}
            />
          </div>
        </div>
      )}
    </div>
  );
});
AgentConfigSection.displayName = 'AgentConfigSection';
