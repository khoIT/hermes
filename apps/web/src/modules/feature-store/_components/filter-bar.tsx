/**
 * FilterBar — horizontal sticky filter strip replacing the old 196px
 * left FilterRail. Layout (top → bottom):
 *   1. Wide search input (full width, '/' shortcut)
 *   2. Six dropdown chips: Type · Latency · Games · Platform · Source · Status
 *   3. Active-filter chips row (renders null when no filters active)
 *
 * Filter logic untouched — same FilterState shape, same applyFilter().
 */
import React from 'react';
import { T } from '../../../theme';
import type { FilterState } from '../_logic/filter';
import type { HermesFeature, HermesGame, HermesLatencyTier } from '@hermes/contracts';
import { GAME_ORDER, GAME_TINT } from '../../../components/_logic/game-colors';
import { FilterSearchInput } from './filter-search-input';
import { FilterDropdownChip, PopoverChip } from './filter-dropdown-chip';
import { ActiveFilterChips } from './active-filter-chips';

interface FilterBarProps {
  features: HermesFeature[];
  state: FilterState;
  onChange: (next: FilterState) => void;
}

const FEATURE_TYPES = ['int', 'numeric', 'bool', 'enum', 'string', 'timestamp', 'array<string>'] as const;
const TYPE_LABELS: Record<string, string> = {
  int: 'Counter', numeric: 'Score', bool: 'Boolean', enum: 'Tag',
  string: 'String', timestamp: 'Timestamp', 'array<string>': 'Array',
};

const LATENCY_OPTIONS: { tier: HermesLatencyTier; label: string; color: string }[] = [
  { tier: '<1s', label: 'Realtime',   color: T.green600 },
  { tier: '<1h', label: 'Batch warm', color: T.amber500 },
  { tier: '<1d', label: 'Batch cold', color: T.n500 },
];

const SOURCES: { key: 'real' | 'hybrid' | 'synth'; label: string; color: string }[] = [
  { key: 'real',   label: 'Real',   color: '#059669' },
  { key: 'hybrid', label: 'Hybrid', color: '#f59e0b' },
  { key: 'synth',  label: 'Synth',  color: '#a3a3a3' },
];

const STATUS_OPTIONS = ['active', 'beta', 'deprecated'] as const;

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

export function FilterBar({ features, state, onChange }: FilterBarProps) {
  // Counts for popover chip badges
  const typeCounts = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const f of features) m[f.type] = (m[f.type] ?? 0) + 1;
    return m;
  }, [features]);

  const gameCounts = React.useMemo(() => {
    const m: Record<HermesGame, number> = { cfm: 0, pt: 0, nth: 0, tf: 0, cos: 0, ptg: 0 };
    for (const f of features) for (const g of f.games) m[g] = (m[g] ?? 0) + 1;
    return m;
  }, [features]);

  const platformCount = React.useMemo(
    () => features.filter(f => f.platform).length,
    [features],
  );

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 14,
      background: '#fff', borderBottom: `1px solid ${T.n200}`,
      padding: '12px 40px',
    }}>
      {/* Row 1 — wide search */}
      <div style={{ marginBottom: 8 }}>
        <FilterSearchInput
          value={state.query}
          onChange={q => onChange({ ...state, query: q })}
        />
      </div>

      {/* Row 2 — dropdowns */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <FilterDropdownChip label="Type" activeCount={state.types.length}>
          {FEATURE_TYPES.map(t => (
            <PopoverChip
              key={t}
              label={TYPE_LABELS[t] ?? t}
              count={typeCounts[t] ?? 0}
              active={state.types.includes(t)}
              onClick={() => onChange({ ...state, types: toggle(state.types, t) })}
            />
          ))}
        </FilterDropdownChip>

        <FilterDropdownChip label="Latency" activeCount={state.latencyTiers.length}>
          {LATENCY_OPTIONS.map(o => (
            <PopoverChip
              key={o.tier}
              label={o.label}
              color={o.color}
              active={state.latencyTiers.includes(o.tier)}
              onClick={() => onChange({ ...state, latencyTiers: toggle(state.latencyTiers, o.tier) })}
            />
          ))}
        </FilterDropdownChip>

        <FilterDropdownChip label="Games" activeCount={state.games.length}>
          {GAME_ORDER.map(g => {
            const tint = GAME_TINT[g];
            return (
              <PopoverChip
                key={g}
                label={tint.label}
                color={tint.fg}
                count={gameCounts[g] ?? 0}
                active={state.games.includes(g)}
                onClick={() => onChange({ ...state, games: toggle(state.games, g) })}
              />
            );
          })}
        </FilterDropdownChip>

        <FilterDropdownChip label="Platform" activeCount={state.platformOnly ? 1 : 0}>
          <PopoverChip
            label="Platform features only"
            color="#9c2e10"
            count={platformCount}
            active={state.platformOnly}
            onClick={() => onChange({ ...state, platformOnly: !state.platformOnly })}
          />
        </FilterDropdownChip>

        <FilterDropdownChip label="Source" activeCount={state.sources.length}>
          {SOURCES.map(s => (
            <PopoverChip
              key={s.key}
              label={s.label}
              color={s.color}
              active={state.sources.includes(s.key)}
              onClick={() => onChange({ ...state, sources: toggle(state.sources, s.key) })}
            />
          ))}
        </FilterDropdownChip>

        <FilterDropdownChip label="Status" activeCount={state.statuses.length}>
          {STATUS_OPTIONS.map(s => (
            <PopoverChip
              key={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              active={state.statuses.includes(s)}
              onClick={() => onChange({ ...state, statuses: toggle(state.statuses, s) })}
            />
          ))}
        </FilterDropdownChip>
      </div>

      {/* Row 3 — active chips (renders null when empty) */}
      <ActiveFilterChips state={state} onChange={onChange} />
    </div>
  );
}
