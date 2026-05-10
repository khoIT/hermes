/**
 * SegmentFeaturePills — compact inline pill row rendered INSIDE
 * ActionCardSegment so the segment + its inputs read as a single artifact.
 *
 * Each pill: `name [latency-tier·substrate-dot]` → /feature-store/:name.
 * Loads from /api/v1/features/:name with a static-catalog fallback on
 * error or missing-feature (mirrors FeatureChip's data path but in a
 * smaller form factor — single-line pill instead of 240×88 card).
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { HermesFeature } from '@hermes/contracts';
import { T } from '../../../theme';
import { authFetch } from '../../../api/auth-fetch';
import { allFeatures } from '../../../data/catalog/features';
import { LatencyBadge } from '../../latency-badge';

interface Props {
  features: string[];
}

export function SegmentFeaturePills({ features }: Props) {
  if (!features.length) return null;
  return (
    <div>
      <div style={labelStyle}>Features in this predicate</div>
      <div style={rowStyle}>
        {features.map(name => <FeaturePill key={name} name={name} />)}
      </div>
    </div>
  );
}

function FeaturePill({ name }: { name: string }) {
  const navigate = useNavigate();
  const [data, setData] = React.useState<HermesFeature | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    authFetch(`/api/v1/features/${encodeURIComponent(name)}`)
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HermesFeature>;
      })
      .then(f => { if (!cancelled) setData(f); })
      .catch(() => {
        if (cancelled) return;
        const fallback = allFeatures.find(f => f.name === name);
        if (fallback) setData(fallback);
      });
    return () => { cancelled = true; };
  }, [name]);

  return (
    <button
      onClick={() => navigate(`/feature-store/${name}`)}
      title={data?.displayName ?? name}
      style={pillStyle}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.n400; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.n200; }}
    >
      <span style={{ fontFamily: T.fMono, fontSize: 12, fontWeight: 600, color: T.n900 }}>
        {name}
      </span>
      {data?.latencyTier && (
        <LatencyBadge tier={data.latencyTier} substrate={data.substrate} />
      )}
    </button>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500,
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
};

const rowStyle: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 6,
};

const pillStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '5px 10px',
  background: '#fff',
  border: `1px solid ${T.n200}`,
  borderRadius: 999,
  cursor: 'pointer',
  transition: 'border-color .12s',
};
