/**
 * FilterRail — left sidebar filter panel for Feature Store library.
 * Renders chip groups for: type, latency tier, status, owner.
 * State is lifted to parent; this component is purely presentational.
 */
import React from 'react';
import { T } from '../../../theme';
import type { FilterState } from '../_logic/filter';
import type { HermesFeature } from '@hermes/contracts';

interface FilterRailProps {
  features: HermesFeature[];
  state: FilterState;
  onChange: (next: FilterState) => void;
}

const FEATURE_TYPES = ['int', 'numeric', 'bool', 'enum', 'string', 'timestamp', 'array<string>'] as const;
const TYPE_LABELS: Record<string, string> = {
  'int': 'Counter',
  'numeric': 'Score',
  'bool': 'Boolean',
  'enum': 'Tag',
  'string': 'String',
  'timestamp': 'Timestamp',
  'array<string>': 'Array',
};

const LATENCY_OPTIONS: { tier: string; label: string; color: string }[] = [
  { tier: '<1s', label: '[<1s] hot', color: T.green600 },
  { tier: '<1h', label: '[<1h] warm', color: T.amber500 },
  { tier: '<1d', label: '[<1d] cold', color: T.n500 },
];

const STATUS_OPTIONS = ['active', 'beta', 'deprecated'] as const;

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  count?: number;
}

const Chip: React.FC<ChipProps> = ({ label, active, onClick, color, count }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
      fontFamily: T.fMono, fontSize: 11, lineHeight: 1.5,
      border: `1px solid ${active ? (color ?? T.brand) : T.n200}`,
      background: active ? (color ? `${color}18` : T.brandSoft) : '#fff',
      color: active ? (color ?? T.brand) : T.n600,
      transition: 'all .1s',
    }}
  >
    {label}
    {count !== undefined && (
      <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400, marginLeft: 2 }}>
        {count}
      </span>
    )}
  </button>
);

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      fontFamily: T.fSans, fontSize: 10, fontWeight: 700,
      color: T.n400, textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: 8,
    }}>
      {label}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {children}
    </div>
  </div>
);

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export const FilterRail: React.FC<FilterRailProps> = ({ features, state, onChange }) => {
  // Compute owner options from the features list
  const owners = React.useMemo(() => {
    const set = new Set(features.map((f) => f.owner));
    return [...set].sort();
  }, [features]);

  // Count per type
  const typeCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of features) map[f.type] = (map[f.type] ?? 0) + 1;
    return map;
  }, [features]);

  // Count per owner
  const ownerCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of features) map[f.owner] = (map[f.owner] ?? 0) + 1;
    return map;
  }, [features]);

  const hasFilters = state.types.length > 0 || state.latencyTiers.length > 0
    || state.statuses.length > 0 || state.owners.length > 0;

  return (
    <aside style={{
      width: 196, flexShrink: 0, paddingRight: 24,
      position: 'sticky', top: 80, alignSelf: 'flex-start',
    }}>
      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 10px', height: 30, borderRadius: 6,
          border: `1px solid ${T.n200}`, background: '#fff',
        }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={T.n400} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={state.query}
            onChange={(e) => onChange({ ...state, query: e.target.value })}
            placeholder="Search features…"
            style={{
              flex: 1, border: 0, outline: 0, background: 'transparent',
              fontFamily: T.fSans, fontSize: 12, color: T.n900,
            }}
          />
        </div>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={() => onChange({ types: [], latencyTiers: [], statuses: [], owners: [], query: '' })}
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.brand,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, marginBottom: 16, display: 'block',
          }}
        >
          Clear all filters
        </button>
      )}

      {/* Type chips */}
      <Section label="Type">
        {FEATURE_TYPES.map((type) => (
          <Chip
            key={type}
            label={TYPE_LABELS[type] ?? type}
            active={state.types.includes(type)}
            count={typeCounts[type] ?? 0}
            onClick={() => onChange({ ...state, types: toggle(state.types, type) })}
          />
        ))}
      </Section>

      {/* Latency tier */}
      <Section label="Latency">
        {LATENCY_OPTIONS.map(({ tier, label, color }) => (
          <Chip
            key={tier}
            label={label}
            active={(state.latencyTiers as string[]).includes(tier)}
            color={color}
            onClick={() => onChange({
              ...state,
              latencyTiers: toggle(state.latencyTiers, tier as '<1s' | '<1h' | '<1d'),
            })}
          />
        ))}
      </Section>

      {/* Status */}
      <Section label="Status">
        {STATUS_OPTIONS.map((s) => (
          <Chip
            key={s}
            label={s.charAt(0).toUpperCase() + s.slice(1)}
            active={state.statuses.includes(s)}
            onClick={() => onChange({ ...state, statuses: toggle(state.statuses, s) })}
          />
        ))}
      </Section>

      {/* Owner */}
      <Section label="Owner">
        {owners.map((owner) => (
          <Chip
            key={owner}
            label={owner}
            count={ownerCounts[owner]}
            active={state.owners.includes(owner)}
            onClick={() => onChange({ ...state, owners: toggle(state.owners, owner) })}
          />
        ))}
      </Section>
    </aside>
  );
};
