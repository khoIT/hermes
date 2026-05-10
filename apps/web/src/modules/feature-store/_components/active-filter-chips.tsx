/**
 * ActiveFilterChips — flat row of removable chips for every active selection
 * across all filter categories, plus a "Clear all" button. Returns null when
 * no filters are active so the row collapses (~28px saved).
 */
import React from 'react';
import { X } from 'lucide-react';
import { T, Icon } from '../../../theme';
import type { FilterState } from '../_logic/filter';
import { EMPTY_FILTER } from '../_logic/filter';
import { GAME_TINT } from '../../../components/_logic/game-colors';

interface ActiveFilterChipsProps {
  state: FilterState;
  onChange: (next: FilterState) => void;
}

interface ActiveEntry {
  label: string;
  color?: string;
  remove: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  int: 'Counter',
  numeric: 'Score',
  bool: 'Boolean',
  enum: 'Tag',
  string: 'String',
  timestamp: 'Timestamp',
  'array<string>': 'Array',
};

const LATENCY_LABELS: Record<string, string> = {
  '<1s': 'Realtime',
  '<1h': 'Batch warm',
  '<1d': 'Batch cold',
};

const SOURCE_COLOR: Record<string, string> = {
  real: '#059669',
  hybrid: '#f59e0b',
  synth: '#a3a3a3',
};

export function ActiveFilterChips({ state, onChange }: ActiveFilterChipsProps) {
  const entries: ActiveEntry[] = [];

  state.types.forEach(t => entries.push({
    label: TYPE_LABELS[t] ?? t,
    remove: () => onChange({ ...state, types: state.types.filter(x => x !== t) }),
  }));

  state.latencyTiers.forEach(t => entries.push({
    label: LATENCY_LABELS[t] ?? t,
    remove: () => onChange({ ...state, latencyTiers: state.latencyTiers.filter(x => x !== t) }),
  }));

  state.games.forEach(g => entries.push({
    label: GAME_TINT[g]?.label ?? String(g).toUpperCase(),
    color: GAME_TINT[g]?.fg,
    remove: () => onChange({ ...state, games: state.games.filter(x => x !== g) }),
  }));

  if (state.platformOnly) entries.push({
    label: 'Platform only',
    color: '#9c2e10',
    remove: () => onChange({ ...state, platformOnly: false }),
  });

  state.sources.forEach(s => entries.push({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    color: SOURCE_COLOR[s],
    remove: () => onChange({ ...state, sources: state.sources.filter(x => x !== s) }),
  }));

  state.statuses.forEach(s => entries.push({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    remove: () => onChange({ ...state, statuses: state.statuses.filter(x => x !== s) }),
  }));

  if (state.driftedOnly) entries.push({
    label: 'Drift detected',
    color: T.red600,
    remove: () => onChange({ ...state, driftedOnly: false }),
  });

  if (entries.length === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      paddingTop: 8,
    }}>
      {entries.map((e, i) => (
        <span
          key={`${e.label}-${i}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 4px 2px 10px', borderRadius: 9999,
            fontFamily: T.fSans, fontSize: 11, fontWeight: 500,
            color: e.color ?? T.n700,
            background: e.color ? `${e.color}14` : T.n100,
            border: `1px solid ${e.color ? `${e.color}33` : T.n200}`,
          }}
        >
          {e.label}
          <button
            type="button"
            onClick={e.remove}
            aria-label={`Remove ${e.label} filter`}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 16, height: 16, borderRadius: 9999,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'inherit',
            }}
            onMouseEnter={ev => { ev.currentTarget.style.background = 'rgba(0,0,0,0.08)'; }}
            onMouseLeave={ev => { ev.currentTarget.style.background = 'transparent'; }}
          >
            <Icon icon={X} size={11} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...EMPTY_FILTER, query: state.query })}
        style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 500,
          color: T.n500, background: 'none', border: 'none',
          cursor: 'pointer', padding: '2px 6px', marginLeft: 2,
        }}
        onMouseEnter={ev => { ev.currentTarget.style.color = T.brand; }}
        onMouseLeave={ev => { ev.currentTarget.style.color = T.n500; }}
      >
        Clear all
      </button>
    </div>
  );
}
