/**
 * FeatureRowCard — Phase 5 v2 row, table-style.
 * CSS-grid columns ensure every row's cells align vertically across the
 * group container (Counter / Batch / Games / Sparkline / Usage / Freshness).
 *
 * Group-level chrome (border + dividers) lives in FeatureGroupSection — this
 * component only paints the row contents + a thin bottom divider.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, Badge } from '../../../theme';
import { LatencyBadge } from '../../../components/latency-badge';
import { synthSparkline } from '../../../components/sparkline';
import type { HermesFeature } from '@hermes/contracts';
import type { FeatureUsage } from '../_logic/usage-count';
import { GamesChipCluster } from './games-chip-cluster';
import { PlatformPropensityChip } from './platform-propensity-chip';

interface FeatureRowCardProps {
  feature: HermesFeature;
  usage: FeatureUsage;
  /** True for the last row in a group — drops the bottom divider. */
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

function formatFreshness(slaMet: number, isEmpty: boolean): string {
  if (isEmpty) return 'no data';
  return `${(slaMet * 100).toFixed(slaMet >= 0.999 ? 2 : 1)}%`;
}

/**
 * Source-provenance dot — at-a-glance "is this real Trino-derived data?"
 * signal in the library list. Green = real, amber = hybrid (proxy SQL),
 * gray = synth (no upstream source). Tooltip explains what each means.
 */
const SOURCE_DOT_COPY: Record<string, { color: string; tip: string }> = {
  real:   { color: '#059669', tip: 'real · Trino-derived from cfm_vn raw events' },
  hybrid: { color: '#f59e0b', tip: 'hybrid · proxy SQL approximation against real aggregates' },
  synth:  { color: '#a3a3a3', tip: 'synthetic · no upstream source · preview only' },
};
const SOURCE_DOT_FALLBACK = { color: '#a3a3a3', tip: 'synthetic · no upstream source · preview only' };
const SourceDot: React.FC<{ source: string | undefined }> = ({ source }) => {
  const s = SOURCE_DOT_COPY[source ?? 'synth'] ?? SOURCE_DOT_FALLBACK;
  return (
    <span
      title={s.tip}
      aria-label={s.tip}
      style={{
        display:    'inline-block',
        width:      8,
        height:     8,
        borderRadius: 999,
        background: s.color,
        marginRight: 6,
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    />
  );
};

/** 7 vertical bars — matches the original v1 design aesthetic. */
const BarSparkline: React.FC<{ data: number[]; width?: number; height?: number; color?: string }> = ({
  data,
  width = 64,
  height = 20,
  color = T.brand,
}) => {
  const max = Math.max(...data, 1);
  const barWidth = (width - (data.length - 1) * 2) / data.length;
  return (
    <svg width={width} height={height} style={{ display: 'block' }} aria-hidden>
      {data.map((v, i) => {
        const h = Math.max(1, (v / max) * height);
        return (
          <rect
            key={i}
            x={i * (barWidth + 2)}
            y={height - h}
            width={barWidth}
            height={h}
            fill={color}
            opacity={0.85}
            rx={1}
          />
        );
      })}
    </svg>
  );
};

/**
 * Grid template — keep these column widths in sync with FeatureGroupSection's
 * header row if/when one is added. Each column has a fixed (or min) width so
 * Counter/Batch/Sparkline lock onto a vertical baseline across rows.
 *
 *   1. Name (flex)              — mono name + serif italic display
 *   2. Type chip                — Counter / Boolean / Tag / Score / ...
 *   3. Latency badge(s)         — Realtime / Batch warm / Batch cold (dual ok)
 *   4. Games + Platform chip    — replaces v1 owner avatar
 *   5. Sparkline                — 7-day distribution bars
 *   6. Usage counts             — N seg · M cmp
 *   7. Freshness %              — analytics.freshnessSlaMet
 *   8. Status (optional)        — only shown for non-active
 */
const GRID_TEMPLATE = 'minmax(0, 1fr) 88px 196px 156px 70px 100px 56px 60px';

export const FeatureRowCard: React.FC<FeatureRowCardProps> = ({ feature, usage, isLast }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);

  const sparkData = React.useMemo(
    () => synthSparkline(feature.sparklineKey ?? feature.name, 7),
    [feature.name, feature.sparklineKey],
  );

  const typeStyle = TYPE_COLOR[feature.type] ?? { bg: T.n100, fg: T.n600 };
  const freshness = formatFreshness(
    feature.analytics.freshnessSlaMet,
    feature.analytics.lastBackfillAt === null,
  );

  return (
    <div
      onClick={() => navigate(`/feature-store/${encodeURIComponent(feature.name)}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: GRID_TEMPLATE,
        alignItems: 'center',
        gap: 14,
        padding: '11px 18px',
        cursor: 'pointer',
        background: hovered ? T.n50 : 'transparent',
        borderBottom: isLast ? 'none' : `1px solid ${T.n100}`,
        transition: 'background .1s',
      }}
    >
      {/* 1. Name + display name */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: T.fMono,
            fontSize: 12,
            color: T.n950,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <SourceDot source={(feature.analytics as unknown as { source?: string }).source} />
          {feature.name}
        </div>
        <div
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: 11,
            color: T.n500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {feature.displayName}
        </div>
      </div>

      {/* 2. Type chip */}
      <span
        style={{
          fontFamily: T.fSans,
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 4,
          background: typeStyle.bg,
          color: typeStyle.fg,
          whiteSpace: 'nowrap',
          textAlign: 'center',
          justifySelf: 'start',
        }}
      >
        {TYPE_LABEL[feature.type] ?? feature.type}
      </span>

      {/* 3. Latency badge(s) */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {feature.dualTier ? (
          <LatencyBadge
            tiers={[
              { tier: '<1s', substrate: 'A' },
              { tier: '<1h', substrate: 'B' },
            ]}
          />
        ) : (
          <LatencyBadge tier={feature.latencyTier} substrate={feature.substrate} />
        )}
      </div>

      {/* 4. Games + Platform chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {feature.platform && (
          <PlatformPropensityChip propensity={feature.propensityModel} size="sm" />
        )}
        <GamesChipCluster games={feature.games} size="sm" />
      </div>

      {/* 5. Sparkline (vertical bars) */}
      <BarSparkline data={sparkData} />

      {/* 6. Usage counts */}
      <div
        style={{
          fontFamily: T.fSans,
          fontSize: 11,
          color: T.n500,
          whiteSpace: 'nowrap',
          textAlign: 'right',
        }}
      >
        <span style={{ color: T.n800, fontWeight: 600 }}>{usage.segmentCount}</span> seg ·{' '}
        <span style={{ color: T.n800, fontWeight: 600 }}>{usage.campaignCount}</span> cmp
      </div>

      {/* 7. Freshness % */}
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 10,
          color: T.n400,
          textAlign: 'right',
        }}
      >
        {freshness}
      </div>

      {/* 8. Status badge — only show non-active; chevron otherwise */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {feature.status !== 'active' ? (
          <Badge variant={feature.status === 'beta' ? 'warning' : 'destructive'}>
            {feature.status}
          </Badge>
        ) : (
          <svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.n400}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </div>
    </div>
  );
};
