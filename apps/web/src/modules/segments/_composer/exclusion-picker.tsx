/**
 * ExclusionPicker — slide-in for "+ Add exclusion AND NOT".
 * Same feature browser as ConditionPicker plus a Templates strip
 * with one-click common exclusions (paying users, test accounts, etc.).
 * Per PRD §8.3.
 */
import React from 'react';
import { T } from '../../../theme';
import { allFeatures } from '../../../data/catalog/features/index';
import type { HermesFeature } from '@hermes/contracts';
import { LatencyBadge } from '../../../components/latency-badge';

const EXCLUSION_TEMPLATES: Array<{ label: string; feature: string; featureType: string; operator: string; value: unknown }> = [
  { label: 'Paying users',          feature: 'is_paying_user_lifetime',  featureType: 'bool',   operator: 'is_true',  value: true },
  { label: 'Test accounts',         feature: 'is_test_account',          featureType: 'bool',   operator: 'is_true',  value: true },
  { label: 'Opted-out users',       feature: 'iam_opt_out',              featureType: 'bool',   operator: 'is_true',  value: true },
  { label: 'Churned (>90d)',        feature: 'last_login_days_ago',      featureType: 'int',    operator: '>=',       value: 90 },
  { label: 'Active in campaign',    feature: 'active_campaign_count',    featureType: 'int',    operator: '>=',       value: 1 },
];

interface Props {
  existingFeatures?: string[];
  onSelect: (feature: string, featureType: string) => void;
  onClose: () => void;
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
        d.style.borderColor = T.red500; d.style.background = T.redSoft;
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
      <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500, marginTop: 2 }}>
        {feature.domain} · {feature.owner}
      </div>
    </div>
  );
}

export const ExclusionPicker = React.memo<Props>(({ existingFeatures = [], onSelect, onClose }) => {
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    const term = search.toLowerCase();
    return allFeatures.filter(f =>
      f.domain !== 'test-system' &&
      !existingFeatures.includes(f.name) &&
      (!term || f.name.toLowerCase().includes(term) || f.domain.toLowerCase().includes(term)),
    );
  }, [search, existingFeatures]);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontFamily: T.fDisp, fontSize: 18, textTransform: 'uppercase', color: T.red600 }}>
            AND NOT — Exclusion
          </span>
          <button onClick={onClose} style={{
            fontFamily: T.fSans, fontSize: 18, color: T.n400,
            background: 'none', border: 'none', cursor: 'pointer',
          }}>×</button>
        </div>
        <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, margin: '0 0 10px' }}>
          Users matching any exclusion are removed from the final segment.
        </p>
        <input
          autoFocus
          placeholder="Search features to exclude…"
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

      {/* Templates strip */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.n100}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500,
          textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          Quick templates
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {EXCLUSION_TEMPLATES.map(t => (
            <button
              key={t.feature}
              onClick={() => onSelect(t.feature, t.featureType)}
              style={{
                fontFamily: T.fSans, fontSize: 11, color: T.red600,
                background: T.redSoft, border: `1px solid #fecaca`,
                borderRadius: 5, padding: '3px 9px', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 16px' }}>
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
ExclusionPicker.displayName = 'ExclusionPicker';
