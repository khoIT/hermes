/**
 * PropensityModelCard — Overview-tab card rendered when feature.platform is
 * true and propensityModel meta is set. Renders 6 mono key-value rows + an
 * italic disclaimer about offline-cache serving semantics.
 *
 * Visually anchored by a deep-red accent stripe (#f05a22) on the left edge
 * to match the Platform chip color family.
 */
import React from 'react';
import { T } from '../../../theme';
import type { HermesFeature, PropensityModelMeta } from '@hermes/contracts';

const FAMILY_PROSE: Record<PropensityModelMeta['family'], string> = {
  pltv: 'pLTV (lifetime value)',
  churn: 'Churn risk',
  reactivation: 'Reactivation (win-back)',
  monetization: 'Monetization (next-payment)',
  engagement: 'Engagement (session-likelihood)',
};

interface PropensityModelCardProps {
  feature: HermesFeature;
}

export const PropensityModelCard: React.FC<PropensityModelCardProps> = ({ feature }) => {
  const m = feature.propensityModel;
  if (!m) return null;

  const rows: { label: string; value: string }[] = [
    { label: 'Family', value: FAMILY_PROSE[m.family] },
    { label: 'Target', value: m.target },
    {
      label: 'Training',
      value: `${m.trainingWindowDays}-day rolling window · refreshed ${m.refreshCadence}`,
    },
    { label: 'AUC band', value: `${m.aucBand} (model ${m.modelVersion})` },
    { label: 'Owner', value: feature.owner },
  ];

  return (
    <section
      style={{
        background: '#fff',
        border: `1px solid ${T.n200}`,
        borderLeft: '4px solid #f05a22',
        borderRadius: 10,
        padding: '18px 22px',
      }}
    >
      <div
        style={{
          fontFamily: T.fSans,
          fontSize: 11,
          fontWeight: 700,
          color: '#9c2e10',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 4,
        }}
      >
        Propensity Model
      </div>
      <div
        style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: 17,
          color: T.n900,
          marginBottom: 14,
        }}
      >
        {feature.displayName}
      </div>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: '110px 1fr',
          gap: '6px 16px',
          margin: 0,
        }}
      >
        {rows.map((row) => (
          <React.Fragment key={row.label}>
            <dt
              style={{
                fontFamily: T.fSans,
                fontSize: 11,
                color: T.n400,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                paddingTop: 1,
              }}
            >
              {row.label}
            </dt>
            <dd
              style={{
                fontFamily: T.fMono,
                fontSize: 12,
                color: T.n800,
                margin: 0,
              }}
            >
              {row.value}
            </dd>
          </React.Fragment>
        ))}
      </dl>

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px dashed ${T.n200}`,
          fontFamily: T.fSans,
          fontStyle: 'italic',
          fontSize: 11,
          color: T.n500,
          lineHeight: 1.5,
        }}
      >
        Note · this feature is served from the offline cache. Real-time evaluation reads the last
        refreshed value (≤24h staleness for daily models, ≤7d for weekly).
      </div>
    </section>
  );
};
