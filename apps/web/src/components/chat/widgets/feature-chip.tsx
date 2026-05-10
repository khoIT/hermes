/**
 * FeatureChip — inline card that fetches a Hermes feature from
 * catalog-api and falls back to the static catalog snapshot on error.
 *
 * Click → /feature-store/:name. Renders 240×88: domain badge + name +
 * latency badge + short description. Skeleton during loading.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { HermesFeature } from '@hermes/contracts';
import { T } from '../../../theme';
import { authFetch } from '../../../api/auth-fetch';
import { allFeatures } from '../../../data/catalog/features';
import { LatencyBadge } from '../../latency-badge';

interface FeatureChipProps {
  /** Technical name (snake_case). */
  name: string;
}

type State = 'loading' | 'success' | 'fallback' | 'missing';

function titleCase(s: string): string {
  return s.split(/[-_]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export function FeatureChip({ name }: FeatureChipProps) {
  const navigate = useNavigate();
  const [state, setState] = React.useState<State>('loading');
  const [data, setData] = React.useState<HermesFeature | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setState('loading');
    setData(null);

    authFetch(`/api/v1/features/${encodeURIComponent(name)}`)
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HermesFeature>;
      })
      .then(f => {
        if (cancelled) return;
        setData(f);
        setState('success');
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = allFeatures.find(f => f.name === name);
        if (fallback) {
          setData(fallback);
          setState('fallback');
        } else {
          setState('missing');
        }
      });

    return () => { cancelled = true; };
  }, [name]);

  if (state === 'loading') return <ChipSkeleton />;
  if (state === 'missing' || !data) {
    return (
      <div style={chipStyle} title={`Feature "${name}" not found`}>
        <span style={{ fontSize: 12, color: T.n500, fontFamily: T.fMono }}>
          {name} · not found
        </span>
      </div>
    );
  }

  const tier = data.latencyTier;
  const substrate = data.substrate;
  const subtitle = data.displayName ?? titleCase(data.domain);

  return (
    <button
      onClick={() => navigate(`/feature-store/${data.name}`)}
      title={data.displayName ?? data.name}
      style={{
        ...chipStyle,
        cursor: 'pointer', textAlign: 'left',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.n400; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.n200; }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
        minWidth: 0,
      }}>
        <span style={{
          fontFamily: T.fMono, fontSize: 12, fontWeight: 600, color: T.n900,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          flex: 1, minWidth: 0,
        }}>
          {data.name}
        </span>
        {tier && <LatencyBadge tier={tier} substrate={substrate} />}
      </div>
      <p style={{
        margin: 0, fontFamily: T.fSans, fontSize: 11, color: T.n500,
        lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2 as any, WebkitBoxOrient: 'vertical' as any,
        overflow: 'hidden',
      }}>
        {subtitle}
      </p>
      {state === 'fallback' && (
        <span style={{
          position: 'absolute', top: 6, right: 8,
          fontFamily: T.fSans, fontSize: 10, color: T.n400,
        }}>
          · cached
        </span>
      )}
    </button>
  );
}

const chipStyle: React.CSSProperties = {
  position: 'relative',
  display: 'block',
  width: 240, height: 88, boxSizing: 'border-box',
  padding: '10px 12px',
  background: '#fff',
  border: `1px solid ${T.n200}`,
  borderRadius: 8,
  margin: '6px 0',
  fontFamily: T.fSans,
  transition: 'border-color .12s',
};

function ChipSkeleton() {
  return (
    <div style={{
      ...chipStyle,
      background: T.n100, borderColor: T.n100,
      animation: 'pulse-soft 1.4s ease-in-out infinite',
    }}>
      <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
