/**
 * OrRowPicker — slide-in for "+ Add OR row" within a group.
 * Same feature browser but suggestions narrowed to features that pair well
 * with the existing rows in this group (same domain or complementary).
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

interface Props {
  /** Features already in the target group — used to compute pairing suggestions */
  groupFeatures: string[];
  onSelect: (feature: string, featureType: string) => void;
  onClose: () => void;
}

/** Features known to pair well — keyed by an existing feature in the group */
const PAIRING_MAP: Record<string, string[]> = {
  consecutive_ranked_losses_streak: ['mmr_drift_7d', 'session_count_7d', 'last_login_days_ago'],
  spend_tier_lifetime:              ['purchase_count_30d', 'cf_coin_balance_current', 'daily_login_streak_current'],
  last_login_days_ago:              ['account_age_days', 'session_count_30d', 'is_returning_after_lapse'],
  account_age_days:                 ['lifetime_login_count', 'player_lifecycle_stage', 'ranked_match_count_30d'],
  is_paying_user_lifetime:          ['spend_tier_lifetime', 'purchase_count_30d', 'vip_status'],
};

function getPairingSuggestions(groupFeatures: string[]): HermesFeature[] {
  const suggested = new Set<string>();
  for (const feat of groupFeatures) {
    for (const paired of PAIRING_MAP[feat] ?? []) {
      if (!groupFeatures.includes(paired)) suggested.add(paired);
    }
  }
  // If no specific pairings, fall back to same-domain features
  if (suggested.size === 0 && groupFeatures.length > 0) {
    const firstFeat = allFeatures.find(f => f.name === groupFeatures[0]);
    if (firstFeat) {
      allFeatures
        .filter(f => f.domain === firstFeat.domain && !groupFeatures.includes(f.name))
        .slice(0, 4)
        .forEach(f => suggested.add(f.name));
    }
  }
  return allFeatures.filter(f => suggested.has(f.name)).slice(0, 5);
}

function FeatureCard({ feature, onSelect }: { feature: HermesFeature; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '8px 12px', borderRadius: 7, marginBottom: 4,
        border: `1px solid ${T.n200}`, background: '#fff', cursor: 'pointer',
        transition: 'border-color .1s, background .1s',
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
      </div>
    </div>
  );
}

export const OrRowPicker = React.memo<Props>(({ groupFeatures, onSelect, onClose }) => {
  const [search, setSearch] = React.useState('');

  const suggestions = React.useMemo(
    () => getPairingSuggestions(groupFeatures),
    [groupFeatures],
  );

  const filtered = React.useMemo(() => {
    const term = search.toLowerCase();
    return allFeatures.filter(f =>
      f.domain !== 'test-system' &&
      !groupFeatures.includes(f.name) &&
      (!term || f.name.toLowerCase().includes(term) || f.domain.toLowerCase().includes(term)),
    );
  }, [search, groupFeatures]);

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 380, zIndex: 350,
      background: '#fff', borderLeft: `1px solid ${T.n200}`,
      boxShadow: '-8px 0 24px rgba(0,0,0,0.10)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${T.n100}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: T.fDisp, fontSize: 18, textTransform: 'uppercase', color: T.n950 }}>
            Add OR Row
          </span>
          <button onClick={onClose} style={{
            fontFamily: T.fSans, fontSize: 18, color: T.n400,
            background: 'none', border: 'none', cursor: 'pointer',
          }}>×</button>
        </div>
        <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, margin: '0 0 10px' }}>
          Users matching <em>any</em> row in this group are included.
        </p>
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

      {/* Pairing suggestions */}
      {suggestions.length > 0 && (
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.n100}` }}>
          <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500,
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Pairs well with this group
          </div>
          {suggestions.map(f => (
            <FeatureCard key={f.name} feature={f} onSelect={() => onSelect(f.name, f.type)} />
          ))}
        </div>
      )}

      {/* All features */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 16px' }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500,
          textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          All features
        </div>
        {filtered.map(f => (
          <FeatureCard key={f.name} feature={f} onSelect={() => onSelect(f.name, f.type)} />
        ))}
        {filtered.length === 0 && (
          <p style={{ fontFamily: T.fSans, fontSize: 12, color: T.n400, textAlign: 'center', marginTop: 32 }}>
            No features match "{search}"
          </p>
        )}
      </div>
    </div>
  );
});
OrRowPicker.displayName = 'OrRowPicker';
