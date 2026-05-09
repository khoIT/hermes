/**
 * FilterRail — left sidebar filter panel (Phase 5 v2).
 * Renders chip groups for: type · latency · games · platform-only · status.
 * State is lifted to parent; this component is purely presentational.
 *
 * v2 changes:
 *   - Removed Owner section (replaced by Games + Platform-only)
 *   - Added Games multi-select (CFM/PT/NTH/TF/COS/PG)
 *   - Added Platform-only toggle
 */
import React from 'react';
import { T } from '../../../theme';
import type { FilterState } from '../_logic/filter';
import type { HermesFeature, HermesGame } from '@hermes/contracts';
import { GAME_ORDER, GAME_TINT } from '../../../components/_logic/game-colors';

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
  { tier: '<1s', label: 'Realtime', color: T.green600 },
  { tier: '<1h', label: 'Batch warm', color: T.amber500 },
  { tier: '<1d', label: 'Batch cold', color: T.n500 },
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
  const typeCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of features) map[f.type] = (map[f.type] ?? 0) + 1;
    return map;
  }, [features]);

  const gameCounts = React.useMemo(() => {
    const map: Record<HermesGame, number> = { cfm: 0, pt: 0, nth: 0, tf: 0, cos: 0, ptg: 0 };
    for (const f of features) {
      for (const g of f.games) map[g] = (map[g] ?? 0) + 1;
    }
    return map;
  }, [features]);

  const platformCount = React.useMemo(
    () => features.filter((f) => f.platform).length,
    [features],
  );

  const hasFilters =
    state.types.length > 0 ||
    state.latencyTiers.length > 0 ||
    state.statuses.length > 0 ||
    state.games.length > 0 ||
    state.platformOnly ||
    state.driftedOnly ||
    state.sources.length > 0;

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
          onClick={() =>
            onChange({
              types: [],
              latencyTiers: [],
              statuses: [],
              games: [],
              platformOnly: false,
              driftedOnly: false,
              sources: [],
              query: state.query,
            })
          }
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

      {/* Games */}
      <Section label="Games">
        {GAME_ORDER.map((g) => {
          const tint = GAME_TINT[g];
          return (
            <Chip
              key={g}
              label={tint.label}
              count={gameCounts[g] ?? 0}
              active={state.games.includes(g)}
              color={tint.fg}
              onClick={() => onChange({ ...state, games: toggle(state.games, g) })}
            />
          );
        })}
      </Section>

      {/* Platform-only */}
      <Section label="Platform">
        <Chip
          label="Platform features only"
          count={platformCount}
          active={state.platformOnly}
          color="#9c2e10"
          onClick={() => onChange({ ...state, platformOnly: !state.platformOnly })}
        />
      </Section>

      {/* Source provenance */}
      <Section label="Data source">
        {(['real', 'hybrid', 'synth'] as const).map((s) => {
          const colorMap = { real: '#059669', hybrid: '#f59e0b', synth: '#a3a3a3' };
          return (
            <Chip
              key={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              active={state.sources.includes(s)}
              color={colorMap[s]}
              onClick={() => onChange({ ...state, sources: toggle(state.sources, s) })}
            />
          );
        })}
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
    </aside>
  );
};
