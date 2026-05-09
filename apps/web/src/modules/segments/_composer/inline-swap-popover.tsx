/**
 * InlineSwapPopover — PRD §8.4.
 * Opens in-place on FeaturePill click. Shows current feature card + 3-5
 * same-domain alternatives ranked by co-usage frequency (v1: same domain,
 * descending usedBySegments). "Browse Feature Store" link opens FS slide-out.
 */
import React from 'react';
import { T } from '../../../theme';
import { allFeatures } from '../../../data/catalog/features/index';
import type { HermesFeature } from '@hermes/contracts';
import { LatencyBadge } from '../../../components/latency-badge';

interface Props {
  featureName: string;
  onSwap: (newFeature: string, featureType: string) => void;
  onClose: () => void;
  onBrowseFeatureStore?: () => void;
}

function featureByName(name: string): HermesFeature | undefined {
  return allFeatures.find(f => f.name === name);
}

/** Pick 3-5 alternatives: same domain, different name, sorted by usedBySegments desc */
function getAlternatives(current: HermesFeature): HermesFeature[] {
  return allFeatures
    .filter(f => f.domain === current.domain && f.name !== current.name)
    .sort((a, b) => (b.usedBySegments ?? 0) - (a.usedBySegments ?? 0))
    .slice(0, 4);
}

function FeatureCard({
  feature, selected, onClick,
}: { feature: HermesFeature; selected?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px 10px',
        borderRadius: 6,
        border: `1px solid ${selected ? T.brand : T.n200}`,
        background: selected ? T.brandSoft : '#fff',
        cursor: onClick ? 'pointer' : 'default',
        marginBottom: 4,
        transition: 'border-color .1s, background .1s',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.borderColor = T.brand; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = T.n200; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ fontFamily: T.fMono, fontSize: 11, fontWeight: 600, color: T.n900, flex: 1 }}>
          {feature.name}
        </span>
        <LatencyBadge tier={feature.latencyTier} substrate={feature.substrate ?? 'B'} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500 }}>
          {feature.domain}
        </span>
        <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400 }}>·</span>
        <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500 }}>
          {feature.owner}
        </span>
        {(feature.usedBySegments ?? 0) > 0 && (
          <>
            <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400 }}>·</span>
            <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500 }}>
              used in {feature.usedBySegments} seg{feature.usedBySegments !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export const InlineSwapPopover = React.memo<Props>(({
  featureName, onSwap, onClose, onBrowseFeatureStore,
}) => {
  const current = featureByName(featureName);
  const alternatives = React.useMemo(
    () => current ? getAlternatives(current) : [],
    [current],
  );

  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, marginTop: 6,
      zIndex: 300, background: '#fff',
      border: `1px solid ${T.n200}`, borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
      padding: '12px 14px', minWidth: 280, maxWidth: 340,
    }}>
      {/* Header */}
      <div style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
        color: T.n500, textTransform: 'uppercase', letterSpacing: '0.07em',
        marginBottom: 8,
      }}>
        Swap feature
      </div>

      {/* Current feature */}
      {current ? (
        <FeatureCard feature={current} selected />
      ) : (
        <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700,
          background: T.n50, borderRadius: 5, padding: '6px 8px', marginBottom: 4 }}>
          {featureName}
        </div>
      )}

      {/* Divider + swap for similar */}
      {alternatives.length > 0 && (
        <>
          <div style={{
            fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
            color: T.n500, textTransform: 'uppercase', letterSpacing: '0.07em',
            margin: '10px 0 6px',
          }}>
            Swap for similar
          </div>
          {alternatives.map(alt => (
            <FeatureCard
              key={alt.name}
              feature={alt}
              onClick={() => onSwap(alt.name, alt.type)}
            />
          ))}
        </>
      )}

      {/* Browse FS link */}
      <div style={{ marginTop: 10, borderTop: `1px solid ${T.n100}`, paddingTop: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBrowseFeatureStore}
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.brand,
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', textDecoration: 'underline',
            textDecorationStyle: 'dotted',
          }}
        >
          Browse Feature Store →
        </button>
        <button
          onClick={onClose}
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.n500,
            background: 'none', border: `1px solid ${T.n200}`,
            borderRadius: 5, padding: '3px 10px', cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
});
InlineSwapPopover.displayName = 'InlineSwapPopover';
