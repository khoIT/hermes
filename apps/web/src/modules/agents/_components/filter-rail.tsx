/**
 * FilterRail — filter controls for Opportunities tab in the Agents inbox.
 * Filters: agent · 4R goal · game · window · confidence threshold
 * Per PRD_Hermes_Agentic.md §5.2
 */
import React from 'react';
import { T } from '../../../theme';

export type WindowFilter = 'all' | 'today' | 'this-week' | 'this-month' | 'evergreen';
export type ConfidenceFilter = 'all' | '0.6' | '0.8';

export interface OpportunityFilters {
  agent: string;       // 'all' | 'insight' | 'authoring' | 'experiment'
  goal4r: string;      // 'all' | 'retain' | 'revenue' | 'reactivate' | 'recruit'
  game: string;        // 'all' | specific game
  window: WindowFilter;
  confidence: ConfidenceFilter;
}

interface FilterRailProps {
  filters: OpportunityFilters;
  onChange: (filters: OpportunityFilters) => void;
  availableGames: string[];
}

const selectStyle: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 12, color: T.n800,
  border: `1px solid ${T.n200}`, borderRadius: 6,
  padding: '4px 24px 4px 8px', outline: 'none',
  background: '#fff', cursor: 'pointer',
  appearance: 'none', WebkitAppearance: 'none',
};

function FilterSelect({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {/* chevron */}
        <svg
          width={12} height={12} viewBox="0 0 24 24" fill="none"
          stroke={T.n400} strokeWidth={2} strokeLinecap="round"
          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}

export const FilterRail = React.memo<FilterRailProps>(({ filters, onChange, availableGames }) => {
  const set = <K extends keyof OpportunityFilters>(key: K, value: OpportunityFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const gameOptions = [
    { value: 'all', label: 'All games' },
    ...availableGames.map(g => ({ value: g, label: g })),
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '10px 0', marginBottom: 4,
    }}>
      <FilterSelect
        label="Agent"
        value={filters.agent}
        options={[
          { value: 'all', label: 'All agents' },
          { value: 'insight', label: 'Insight Agent' },
          { value: 'authoring', label: 'Authoring Agent' },
          { value: 'experiment', label: 'Experiment Agent' },
        ]}
        onChange={v => set('agent', v)}
      />

      <div style={{ width: 1, height: 16, background: T.n200 }} />

      <FilterSelect
        label="4R Goal"
        value={filters.goal4r}
        options={[
          { value: 'all', label: 'All goals' },
          { value: 'retain', label: 'Retain' },
          { value: 'revenue', label: 'Revenue' },
          { value: 'reactivate', label: 'Reactivate' },
          { value: 'recruit', label: 'Recruit' },
        ]}
        onChange={v => set('goal4r', v)}
      />

      <div style={{ width: 1, height: 16, background: T.n200 }} />

      <FilterSelect
        label="Game"
        value={filters.game}
        options={gameOptions}
        onChange={v => set('game', v)}
      />

      <div style={{ width: 1, height: 16, background: T.n200 }} />

      <FilterSelect
        label="Window"
        value={filters.window}
        options={[
          { value: 'all', label: 'Any window' },
          { value: 'today', label: 'Today' },
          { value: 'this-week', label: 'This week' },
          { value: 'this-month', label: 'This month' },
          { value: 'evergreen', label: 'No time pressure' },
        ]}
        onChange={v => set('window', v as WindowFilter)}
      />

      <div style={{ width: 1, height: 16, background: T.n200 }} />

      <FilterSelect
        label="Confidence"
        value={filters.confidence}
        options={[
          { value: 'all', label: 'All' },
          { value: '0.6', label: '≥ 0.60' },
          { value: '0.8', label: '≥ 0.80' },
        ]}
        onChange={v => set('confidence', v as ConfidenceFilter)}
      />
    </div>
  );
});
FilterRail.displayName = 'FilterRail';
