/**
 * FeatureRowCard — per PRD §6.2 feature list row.
 * Shows: mono name + serif italic display, type chip, latency badge,
 * owner avatar, 7-day sparkline, backlink counts, freshness gauge.
 * Click navigates to /feature-store/:name.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, Avatar, Badge } from '../../../theme';
import { LatencyBadge } from '../../../components/latency-badge';
import { SparklineChart, synthSparkline } from '../../../components/sparkline';
import type { HermesFeature } from '@hermes/contracts';
import type { FeatureUsage } from '../_logic/usage-count';

interface FeatureRowCardProps {
  feature: HermesFeature;
  usage: FeatureUsage;
  /** Index within group — used for staggered freshness placeholders */
  index?: number;
}

const TYPE_LABEL: Record<string, string> = {
  'int': 'Counter',
  'numeric': 'Score',
  'bool': 'Boolean',
  'enum': 'Tag',
  'string': 'String',
  'timestamp': 'Timestamp',
  'array<string>': 'Array',
};

const TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  'int':          { bg: '#dbeafe', fg: '#1e40af' },
  'numeric':      { bg: '#ede9fe', fg: '#5b21b6' },
  'bool':         { bg: '#dcfce7', fg: '#166534' },
  'enum':         { bg: '#fef3c7', fg: '#92400e' },
  'string':       { bg: '#f1f5f9', fg: '#475569' },
  'timestamp':    { bg: '#fce7f3', fg: '#9d174d' },
  'array<string>':{ bg: '#f0fdf4', fg: '#065f46' },
};

const FRESHNESS_PLACEHOLDERS = ['2h ago', '4h ago', 'yesterday', '6h ago', '1h ago', '3h ago', '8h ago'];

export const FeatureRowCard: React.FC<FeatureRowCardProps> = ({ feature, usage, index = 0 }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);

  const sparkData = React.useMemo(
    () => synthSparkline(feature.sparklineKey ?? feature.name, 7),
    [feature.name, feature.sparklineKey],
  );

  const typeStyle = TYPE_COLOR[feature.type] ?? { bg: T.n100, fg: T.n600 };
  const freshness = FRESHNESS_PLACEHOLDERS[index % FRESHNESS_PLACEHOLDERS.length] ?? '2h ago';

  const handleClick = () => {
    navigate(`/feature-store/${encodeURIComponent(feature.name)}`);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${hovered ? T.n300 : T.n200}`,
        background: hovered ? T.n50 : '#fff',
        transition: 'background .1s, border-color .1s',
        marginBottom: 4,
      }}
    >
      {/* Name + display name */}
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div style={{
          fontFamily: T.fMono, fontSize: 12, color: T.n950,
          fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {feature.name}
        </div>
        <div style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontStyle: 'italic', fontSize: 11, color: T.n500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {feature.displayName}
        </div>
      </div>

      {/* Type chip */}
      <span style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
        padding: '2px 7px', borderRadius: 4,
        background: typeStyle.bg, color: typeStyle.fg,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {TYPE_LABEL[feature.type] ?? feature.type}
      </span>

      {/* Latency badge — dual or single */}
      <div style={{ flexShrink: 0 }}>
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

      {/* 7-day sparkline */}
      <div style={{ flexShrink: 0 }}>
        <SparklineChart data={sparkData} width={60} height={20} color={T.brand} />
      </div>

      {/* Backlink counts */}
      <div style={{
        flexShrink: 0, fontFamily: T.fSans, fontSize: 11, color: T.n500,
        whiteSpace: 'nowrap', minWidth: 140, textAlign: 'right',
      }}>
        Used by{' '}
        <span style={{ color: T.n800, fontWeight: 600 }}>{usage.segmentCount}</span>
        {' '}seg ·{' '}
        <span style={{ color: T.n800, fontWeight: 600 }}>{usage.campaignCount}</span>
        {' '}cmp
      </div>

      {/* Freshness gauge */}
      <div style={{
        flexShrink: 0, fontFamily: T.fMono, fontSize: 10, color: T.n400,
        minWidth: 64, textAlign: 'right',
      }}>
        {freshness}
      </div>

      {/* Owner avatar */}
      <Avatar name={feature.owner} size={24} style={{ flexShrink: 0 }} />

      {/* Status badge — only show non-active */}
      {feature.status !== 'active' && (
        <Badge
          variant={feature.status === 'beta' ? 'warning' : 'destructive'}
          style={{ flexShrink: 0 }}
        >
          {feature.status}
        </Badge>
      )}
    </div>
  );
};
