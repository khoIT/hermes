/**
 * FeaturesInUse — right rail list of features in the current predicate.
 * Click → opens Feature Store slide-out (handled by parent via callback).
 * Per PRD §8.3 Region 4.
 */
import React from 'react';
import { T } from '../../../theme';
import { allFeatures } from '../../../data/catalog/features/index';
import { LatencyBadge } from '../../../components/latency-badge';
import { GamesChipCluster } from '../../feature-store/_components/games-chip-cluster';
import { PlatformPropensityChip } from '../../feature-store/_components/platform-propensity-chip';

interface Props {
  featureNames: string[];
  onFeatureClick?: (featureName: string) => void;
}

export const FeaturesInUse = React.memo<Props>(({ featureNames, onFeatureClick }) => {
  if (!featureNames.length) return null;

  return (
    <div>
      <div style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
        color: T.n500, textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 8,
      }}>
        Features in use
      </div>

      {featureNames.map(name => {
        const feat = allFeatures.find(f => f.name === name);
        return (
          <div
            key={name}
            onClick={() => onFeatureClick?.(name)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 0',
              borderBottom: `1px solid ${T.n100}`,
              cursor: onFeatureClick ? 'pointer' : 'default',
            }}
            onMouseEnter={e => { if (onFeatureClick) (e.currentTarget as HTMLDivElement).style.background = T.n50; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <span style={{
              fontFamily: T.fMono, fontSize: 11, color: T.n900, flex: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {name}
            </span>
            {feat && (
              <span title={`Freshness ${(feat.analytics.freshnessSlaMet * 100).toFixed(1)}%`}>
                <LatencyBadge tier={feat.latencyTier} substrate={feat.substrate ?? 'B'} />
              </span>
            )}
            {feat && feat.platform && (
              <PlatformPropensityChip propensity={feat.propensityModel} size="xs" />
            )}
            {feat && !feat.platform && (
              <GamesChipCluster games={feat.games} size="xs" />
            )}
          </div>
        );
      })}
    </div>
  );
});
FeaturesInUse.displayName = 'FeaturesInUse';
