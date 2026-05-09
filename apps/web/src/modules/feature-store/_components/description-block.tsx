/**
 * DescriptionBlock — short plain-English description of a feature.
 * Generated from feature metadata when no explicit copy exists; this avoids
 * dumping SQL/expr-lang into Overview tab (PMs need prose, not code).
 */
import React from 'react';
import { T } from '../../../theme';
import type { HermesFeature, HermesFeatureType } from '@hermes/contracts';

const TYPE_PROSE: Record<HermesFeatureType, string> = {
  int: 'integer counter',
  numeric: 'numeric score',
  bool: 'boolean flag',
  enum: 'categorical tag',
  string: 'string value',
  timestamp: 'timestamp',
  'array<string>': 'array of strings',
};

function fallbackDescription(feature: HermesFeature): string {
  const type = TYPE_PROSE[feature.type] ?? feature.type;
  const tier =
    feature.latencyTier === '<1s'
      ? 'realtime'
      : feature.latencyTier === '<1h'
        ? 'batch warm (hourly)'
        : 'batch cold (daily)';
  const games =
    feature.games.length === 6
      ? 'all six games'
      : feature.games.length === 1
        ? `${feature.games[0]?.toUpperCase()}`
        : `${feature.games.length} games`;
  return `${feature.displayName} — a ${type} surfaced for ${games}, refreshed on the ${tier} path.`;
}

interface DescriptionBlockProps {
  feature: HermesFeature;
}

export const DescriptionBlock: React.FC<DescriptionBlockProps> = ({ feature }) => {
  const text = fallbackDescription(feature);
  return (
    <section
      style={{
        background: '#fff',
        border: `1px solid ${T.n200}`,
        borderRadius: 10,
        padding: '14px 20px',
      }}
    >
      <div
        style={{
          fontFamily: T.fSans,
          fontSize: 10,
          fontWeight: 700,
          color: T.n400,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: 6,
        }}
      >
        Description
      </div>
      <p
        style={{
          fontFamily: T.fSans,
          fontSize: 13,
          color: T.n700,
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {text}
      </p>
    </section>
  );
};
