/**
 * FeatureRowCard — dense single-line row (~32px) for the Feature Store list.
 *
 * Columns (CSS-grid):
 *   1. Name + source-dot prefix + status suffix
 *   2. Type chip
 *   3. Latency badge
 *   4. Games (+ optional Platform chip)
 *   5. Drift indicator (— / ◷ / ⚠)
 *   6. Usage counts (Ns · Mc)
 *   7. Freshness (relative time)
 *   8. Pin button (★) — opacity 0 unless row hover OR pinned
 *   9. Overflow menu (⋯) — opacity 0 unless row hover
 *
 * Trailing pin + overflow are reserved-width to avoid layout shift on hover.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { T, Icon } from '../../../theme';
import { LatencyBadge } from '../../../components/latency-badge';
import type { HermesFeature } from '@hermes/contracts';
import type { FeatureUsage } from '../_logic/usage-count';
import { GamesChipCluster } from './games-chip-cluster';
import { PlatformPropensityChip } from './platform-propensity-chip';
import { DriftIndicator } from './drift-indicator';
import { FeatureRowOverflowMenu } from './feature-row-overflow-menu';
import { formatFreshness } from '../../../utils/format-freshness';
import { isPinned, togglePin, subscribePinned } from '../../../utils/pinned-features-store';

interface FeatureRowCardProps {
  feature: HermesFeature;
  usage: FeatureUsage;
  isLast?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  int: 'Counter',
  numeric: 'Score',
  bool: 'Boolean',
  enum: 'Tag',
  string: 'String',
  timestamp: 'Timestamp',
  'array<string>': 'Array',
};

const TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  int: { bg: '#dbeafe', fg: '#1e40af' },
  numeric: { bg: '#ede9fe', fg: '#5b21b6' },
  bool: { bg: '#dcfce7', fg: '#166534' },
  enum: { bg: '#fef3c7', fg: '#92400e' },
  string: { bg: '#f1f5f9', fg: '#475569' },
  timestamp: { bg: '#fce7f3', fg: '#9d174d' },
  'array<string>': { bg: '#f0fdf4', fg: '#065f46' },
};

const SOURCE_COLOR: Record<string, string> = {
  real: '#059669',
  hybrid: '#f59e0b',
  synth: '#a3a3a3',
};

const GRID_TEMPLATE = 'minmax(0, 1fr) 72px 180px 140px 24px 72px 60px 24px 24px';

export const FeatureRowCard: React.FC<FeatureRowCardProps> = ({ feature, usage, isLast }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);

  // Subscribe to pin store so star state stays in sync across rows.
  const pinned = React.useSyncExternalStore(
    subscribePinned,
    () => isPinned(feature.name),
    () => isPinned(feature.name),
  );

  const typeStyle = TYPE_COLOR[feature.type] ?? { bg: T.n100, fg: T.n600 };
  const source = (feature.analytics as unknown as { source?: string }).source ?? 'synth';
  const sourceColor = SOURCE_COLOR[source] ?? SOURCE_COLOR.synth!;
  const fresh = formatFreshness(feature.analytics.lastBackfillAt);
  const statusSuffix = feature.status === 'beta' ? ' (β)'
    : feature.status === 'deprecated' ? ' (deprecated)'
    : '';

  return (
    <div
      onClick={() => navigate(`/feature-store/${encodeURIComponent(feature.name)}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: GRID_TEMPLATE,
        alignItems: 'center',
        gap: 12,
        padding: '5px 18px',
        minHeight: 32,
        cursor: 'pointer',
        background: hovered ? T.n50 : 'transparent',
        borderBottom: isLast ? 'none' : `1px solid ${T.n100}`,
        transition: 'background .1s',
      }}
    >
      {/* 1. Name */}
      <div
        title={feature.displayName}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
          fontFamily: T.fMono, fontSize: 12, color: T.n950, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        <span
          aria-label={`source: ${source}`}
          style={{
            display: 'inline-block', width: 7, height: 7, borderRadius: 9999,
            background: sourceColor, flexShrink: 0,
          }}
        />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {feature.name}
          {statusSuffix && (
            <span style={{ color: feature.status === 'deprecated' ? T.red600 : T.amber500, marginLeft: 2 }}>
              {statusSuffix}
            </span>
          )}
        </span>
      </div>

      {/* 2. Type */}
      <span style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
        padding: '2px 6px', borderRadius: 4,
        background: typeStyle.bg, color: typeStyle.fg,
        whiteSpace: 'nowrap', textAlign: 'center', justifySelf: 'start',
      }}>
        {TYPE_LABEL[feature.type] ?? feature.type}
      </span>

      {/* 3. Latency */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {feature.dualTier ? (
          <LatencyBadge tiers={[
            { tier: '<1s', substrate: 'A' },
            { tier: '<1h', substrate: 'B' },
          ]} />
        ) : (
          <LatencyBadge tier={feature.latencyTier} substrate={feature.substrate} />
        )}
      </div>

      {/* 4. Games + Platform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
        {feature.platform && (
          <PlatformPropensityChip propensity={feature.propensityModel} size="sm" />
        )}
        <GamesChipCluster games={feature.games} size="sm" />
      </div>

      {/* 5. Drift */}
      <DriftIndicator score={feature.analytics.driftScore} />

      {/* 6. Usage */}
      <div style={{
        fontFamily: T.fSans, fontSize: 11, color: T.n500,
        whiteSpace: 'nowrap', textAlign: 'right',
      }}>
        <span style={{ color: T.n800, fontWeight: 600 }}>{usage.segmentCount}</span>s ·{' '}
        <span style={{ color: T.n800, fontWeight: 600 }}>{usage.campaignCount}</span>c
      </div>

      {/* 7. Freshness */}
      <div style={{
        fontFamily: T.fMono, fontSize: 10.5, color: T.n500, textAlign: 'right',
      }}>
        {fresh}
      </div>

      {/* 8. Pin */}
      <button
        type="button"
        title={pinned ? 'Unpin feature' : 'Pin feature'}
        aria-label={pinned ? 'Unpin feature' : 'Pin feature'}
        onClick={e => { e.stopPropagation(); togglePin(feature.name); }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: 4,
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: pinned ? T.brand : T.n500,
          opacity: pinned || hovered ? 1 : 0,
          transition: 'opacity .12s, background .12s',
          justifySelf: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon
          icon={Star}
          size={13}
          color={pinned ? T.brand : T.n500}
          style={{ fill: pinned ? T.brand : 'transparent' }}
        />
      </button>

      {/* 9. Overflow */}
      <div style={{ justifySelf: 'center' }}>
        <FeatureRowOverflowMenu
          feature={feature}
          usage={usage}
          isPinned={pinned}
          visible={hovered}
          onTogglePin={() => togglePin(feature.name)}
        />
      </div>
    </div>
  );
};
