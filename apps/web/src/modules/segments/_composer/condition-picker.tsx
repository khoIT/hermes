/**
 * ConditionPicker — slide-in panel for "+ Add condition".
 * 3 modes: Browse by category / Search / AI assist.
 * Feature cards with name, type, latency, owner, usage counts.
 * Smart suggestions panel at bottom.
 * Per PRD §8.3.
 */
import React from 'react';
import { T } from '../../../theme';
import { allFeatures } from '../../../data/catalog/features/index';
import type { HermesFeature } from '@hermes/contracts';
import { LatencyBadge } from '../../../components/latency-badge';
import { DriftBadge } from '../../../components/drift-badge';
import { GamesChipCluster } from '../../feature-store/_components/games-chip-cluster';
import { PlatformPropensityChip } from '../../feature-store/_components/platform-propensity-chip';

const DOMAIN_ORDER = [
  'identity-lifecycle', 'monetization', 'currency', 'engagement',
  'gameplay-cfm', 'stateful-streaks', 'inventory', 'promotion-config',
  'social-playstyle', 'test-system', 'campaign-engagement',
];

/** Hardcoded smart suggestions for common segment patterns */
const SMART_SUGGESTIONS = [
  'consecutive_ranked_losses_streak',
  'last_login_days_ago',
  'spend_tier_lifetime',
  'session_count_30d',
  'is_paying_user_lifetime',
];

interface Props {
  /** Features already in the predicate — excluded from suggestions */
  existingFeatures?: string[];
  onSelect: (feature: string, featureType: string) => void;
  onClose: () => void;
}

type Mode = 'browse' | 'search' | 'ai';

function FeatureCard({ feature, onSelect }: { feature: HermesFeature; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '8px 12px', borderRadius: 7, marginBottom: 4,
        border: `1px solid ${T.n200}`, background: '#fff',
        cursor: 'pointer', transition: 'border-color .1s, background .1s',
      }}
      onMouseEnter={e => {
        const d = e.currentTarget as HTMLDivElement;
        d.style.borderColor = T.brand; d.style.background = T.brandSoft;
      }}
      onMouseLeave={e => {
        const d = e.currentTarget as HTMLDivElement;
        d.style.borderColor = T.n200; d.style.background = '#fff';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: T.fMono, fontSize: 11, fontWeight: 600, color: T.n900, flex: 1 }}>
          {feature.name}
        </span>
        <LatencyBadge tier={feature.latencyTier} substrate={feature.substrate ?? 'B'} />
        <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400,
          background: T.n100, borderRadius: 3, padding: '1px 5px' }}>
          {feature.type}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
        {feature.platform && (
          <PlatformPropensityChip propensity={feature.propensityModel} size="sm" />
        )}
        <GamesChipCluster games={feature.games} size="sm" />
        <DriftBadge score={feature.analytics.driftScore} />
      </div>
      <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500, marginTop: 4 }}>
        {feature.domain}
        {(feature.usedBySegments ?? 0) > 0 &&
          ` · used by ${feature.usedBySegments} segment${feature.usedBySegments === 1 ? '' : 's'}`}
      </div>
    </div>
  );
}

export const ConditionPicker = React.memo<Props>(({ existingFeatures = [], onSelect, onClose }) => {
  const [mode, setMode] = React.useState<Mode>('browse');
  const [search, setSearch] = React.useState('');
  const [activeDomain, setActiveDomain] = React.useState(DOMAIN_ORDER[0]);

  const filtered = React.useMemo(() => {
    const term = search.toLowerCase();
    return allFeatures.filter(f =>
      f.domain !== 'test-system' &&
      (mode !== 'search' || f.name.toLowerCase().includes(term) ||
        f.displayName.toLowerCase().includes(term) ||
        f.domain.toLowerCase().includes(term)),
    );
  }, [mode, search]);

  const byDomain = React.useMemo(() =>
    DOMAIN_ORDER.reduce<Record<string, HermesFeature[]>>((acc, d) => {
      acc[d] = filtered.filter(f => f.domain === d);
      return acc;
    }, {}),
  [filtered]);

  const suggestions = allFeatures.filter(
    f => SMART_SUGGESTIONS.includes(f.name) && !existingFeatures.includes(f.name),
  );

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 380, zIndex: 350,
      background: '#fff', borderLeft: `1px solid ${T.n200}`,
      boxShadow: '-8px 0 24px rgba(0,0,0,0.10)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', borderBottom: `1px solid ${T.n100}`, paddingBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontFamily: T.fDisp, fontSize: 18, textTransform: 'uppercase', color: T.n950 }}>
            Add Condition
          </span>
          <button onClick={onClose} style={{
            fontFamily: T.fSans, fontSize: 18, color: T.n400,
            background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['browse', 'search', 'ai'] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              fontFamily: T.fSans, fontSize: 11, fontWeight: 500,
              padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
              background: mode === m ? T.n900 : T.n100,
              color: mode === m ? '#fff' : T.n700,
              border: 'none', textTransform: 'capitalize',
            }}>
              {m === 'ai' ? 'AI Assist' : m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search input */}
      {mode === 'search' && (
        <div style={{ padding: '10px 16px 0' }}>
          <input
            autoFocus
            placeholder="Search features…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: T.fSans, fontSize: 13, color: T.n900,
              border: `1px solid ${T.n300}`, borderRadius: 7,
              padding: '7px 12px', outline: 'none',
            }}
          />
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 16px' }}>
        {mode === 'ai' ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: T.n500,
            fontFamily: T.fSans, fontSize: 13, fontStyle: 'italic' }}>
            AI Assist · Powered by Authoring Agent<br />
            <span style={{ fontSize: 11 }}>Suggests features based on your intent and current predicate.</span>
            <div style={{ marginTop: 16 }}>
              {suggestions.map(f => <FeatureCard key={f.name} feature={f} onSelect={() => onSelect(f.name, f.type)} />)}
            </div>
          </div>
        ) : mode === 'search' ? (
          filtered.filter(f =>
            search ? (f.name.toLowerCase().includes(search.toLowerCase()) ||
              f.displayName.toLowerCase().includes(search.toLowerCase())) : true,
          ).map(f => (
            <FeatureCard key={f.name} feature={f} onSelect={() => onSelect(f.name, f.type)} />
          ))
        ) : (
          /* Browse by domain */
          <>
            {/* Domain tabs (horizontal scroll) */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 10, paddingBottom: 4 }}>
              {DOMAIN_ORDER.filter(d => d !== 'test-system').map(d => (
                <button key={d} onClick={() => setActiveDomain(d)} style={{
                  fontFamily: T.fSans, fontSize: 10, fontWeight: 500,
                  padding: '3px 8px', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: activeDomain === d ? T.n900 : T.n100,
                  color: activeDomain === d ? '#fff' : T.n700,
                  border: 'none',
                }}>
                  {d.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
            {(byDomain[activeDomain as keyof typeof byDomain] ?? []).map((f: HermesFeature) => (
              <FeatureCard key={f.name} feature={f} onSelect={() => onSelect(f.name, f.type)} />
            ))}
          </>
        )}
      </div>

      {/* Smart suggestions footer */}
      {suggestions.length > 0 && mode !== 'ai' && (
        <div style={{ borderTop: `1px solid ${T.n100}`, padding: '10px 16px' }}>
          <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500,
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Suggested
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {suggestions.slice(0, 4).map(f => (
              <button key={f.name} onClick={() => onSelect(f.name, f.type)} style={{
                fontFamily: T.fMono, fontSize: 10, color: T.brand,
                background: T.brandSoft, border: `1px solid ${T.brandBorder}`,
                borderRadius: 4, padding: '2px 7px', cursor: 'pointer',
              }}>
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
ConditionPicker.displayName = 'ConditionPicker';
