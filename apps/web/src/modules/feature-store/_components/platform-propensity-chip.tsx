/**
 * PlatformPropensityChip — deep-red brand chip rendered when a feature has
 * `platform: true`. The chip flags cross-game GDS propensity models in the
 * library, detail header, segment picker, and predicate row.
 *
 * Composition: mono uppercase "PLATFORM" + dot separator + family in serif
 * italic ("pLTV", "Churn", etc.). Tooltip on hover explains the model class.
 *
 * Size variants align with GamesChipCluster (xs/sm/md) so both chips
 * sit on the same baseline across surfaces.
 */
import React from 'react';
import { T } from '../../../theme';
import type { PropensityModelMeta } from '@hermes/contracts';
import { PLATFORM_TINT } from '../../../components/_logic/game-colors';

export type PlatformPropensityChipSize = 'xs' | 'sm' | 'md';

interface PlatformPropensityChipProps {
  propensity?: PropensityModelMeta;
  size?: PlatformPropensityChipSize;
}

const SIZE_PRESETS: Record<
  PlatformPropensityChipSize,
  { padding: string; fontSize: number }
> = {
  xs: { padding: '0px 5px', fontSize: 9 },
  sm: { padding: '1px 6px', fontSize: 10 },
  md: { padding: '2px 8px', fontSize: 11 },
};

const FAMILY_LABEL: Record<PropensityModelMeta['family'], string> = {
  pltv: 'pLTV',
  churn: 'Churn',
  reactivation: 'Reactivation',
  monetization: 'Monetization',
  engagement: 'Engagement',
};

export const PlatformPropensityChip: React.FC<PlatformPropensityChipProps> = ({
  propensity,
  size = 'md',
}) => {
  const preset = SIZE_PRESETS[size];
  const family = propensity ? FAMILY_LABEL[propensity.family] : 'Propensity';

  if (size === 'xs') {
    // Single deep-red P chip for the predicate-row context.
    return (
      <span
        title={`Platform · ${family}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontFamily: T.fMono,
          fontWeight: 800,
          fontSize: preset.fontSize,
          padding: preset.padding,
          background: PLATFORM_TINT.bg,
          color: PLATFORM_TINT.fg,
          border: `1px solid ${PLATFORM_TINT.border}`,
          borderRadius: 4,
          letterSpacing: '0.06em',
          lineHeight: 1.4,
        }}
      >
        {PLATFORM_TINT.label}
      </span>
    );
  }

  return (
    <span
      title={
        propensity
          ? `Platform · ${family} model (target: ${propensity.target}, AUC ${propensity.aucBand})`
          : 'Platform · Cross-game propensity model'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: T.fMono,
        fontWeight: 700,
        fontSize: preset.fontSize,
        padding: preset.padding,
        background: PLATFORM_TINT.bg,
        color: PLATFORM_TINT.fg,
        border: `1px solid ${PLATFORM_TINT.border}`,
        borderRadius: 4,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        lineHeight: 1.4,
      }}
    >
      Platform
      <span style={{ opacity: 0.7 }}>·</span>
      <span
        style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontStyle: 'italic',
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.01em',
        }}
      >
        {family}
      </span>
    </span>
  );
};
