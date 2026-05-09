/**
 * PreviewPane — live preview of the would-be feature-detail header. Updates
 * as form fields change. Reuses Phase 3 chip components verbatim.
 */
import React from 'react';
import { T } from '../../../theme';
import { LatencyBadge } from '../../../components/latency-badge';
import { GamesChipCluster } from '../_components/games-chip-cluster';
import { PlatformPropensityChip } from '../_components/platform-propensity-chip';
import type { FeatureFormState } from '../_logic/feature-form-validation';

const TYPE_LABEL: Record<FeatureFormState['type'], string> = {
  int: 'Counter · integer',
  numeric: 'Score · numeric',
  bool: 'Boolean',
  enum: 'Tag · enum',
  string: 'String',
  timestamp: 'Timestamp',
  'array<string>': 'Array · string[]',
};

interface Props {
  form: FeatureFormState;
}

export const PreviewPane: React.FC<Props> = ({ form }) => (
  <aside
    style={{
      position: 'sticky',
      top: 80,
      alignSelf: 'flex-start',
      width: '100%',
      border: `1px solid ${T.n200}`,
      borderRadius: 10,
      background: '#fff',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        padding: '8px 14px',
        borderBottom: `1px solid ${T.n200}`,
        background: T.n50,
        fontFamily: T.fSans,
        fontSize: 10,
        fontWeight: 700,
        color: T.n500,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}
    >
      Live preview · detail header
    </div>

    <div style={{ padding: '16px 18px' }}>
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 16,
          color: T.n950,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {form.name || 'feature_name'}
      </div>
      <div
        style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: 13,
          color: T.n500,
          marginBottom: 12,
        }}
      >
        {form.displayName || 'Display Name'}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: T.fSans,
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: 4,
            background: '#dbeafe',
            color: '#1e40af',
          }}
        >
          {TYPE_LABEL[form.type]}
        </span>

        {form.dualTier ? (
          <LatencyBadge
            tiers={[
              { tier: '<1s', substrate: 'A' },
              { tier: '<1h', substrate: 'B' },
            ]}
          />
        ) : (
          <LatencyBadge tier={form.latencyTier} substrate={form.substrate} />
        )}

        {form.games.length > 0 && <GamesChipCluster games={form.games} size="sm" />}

        {form.platform && (
          <PlatformPropensityChip propensity={form.propensityModel} size="sm" />
        )}
      </div>

      <div
        style={{
          fontFamily: T.fSans,
          fontSize: 11,
          color: T.n400,
          fontStyle: 'italic',
          paddingTop: 12,
          borderTop: `1px dashed ${T.n200}`,
        }}
      >
        Health snapshot · no data yet — 7-day warm-up after registration.
      </div>
    </div>
  </aside>
);
