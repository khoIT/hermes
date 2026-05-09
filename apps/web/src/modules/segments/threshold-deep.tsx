/**
 * 05 — Threshold Deep Dive (seg_threshold_deep)
 * Full-page version of the inline threshold playground.
 * Entry point: Feature Store detail → "Explore threshold" button.
 * Per PRD §8.5 / phase-07 spec.
 */
import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import { InlineThresholdPlayground } from './_composer/inline-threshold-playground';
import { allFeatures } from '../../data/catalog/features/index';
import { getThresholdGrid } from './_state/audience-lookup';

export default function SegmentsThresholdPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const featureName = params.get('feature') ?? 'consecutive_ranked_losses_streak';
  const feature = allFeatures.find(f => f.name === featureName);
  const [currentValue, setCurrentValue] = React.useState<number>(5);
  const [applied, setApplied] = React.useState<number | null>(null);

  const grid = React.useMemo(() => getThresholdGrid(featureName), [featureName]);

  return (
    <div style={{ padding: '28px 40px', maxWidth: 680 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          fontFamily: T.fSans, fontSize: 12, color: T.n500,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        ← Back
      </button>

      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
        05 · Segments · Threshold deep dive
      </div>
      <div style={{ fontFamily: T.fDisp, fontSize: 36, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 4 }}>
        Threshold Explorer
      </div>
      <div style={{ fontFamily: T.fMono, fontSize: 13, color: T.n600, marginBottom: 20 }}>
        {featureName}
        {feature && (
          <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400, marginLeft: 8 }}>
            {feature.domain} · {feature.latencyTier} · {feature.owner}
          </span>
        )}
      </div>

      {grid.length > 0 && (
        <div style={{ marginBottom: 20, background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            padding: '8px 14px', fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
            color: T.n400, textTransform: 'uppercase', letterSpacing: '0.07em',
            borderBottom: `1px solid ${T.n100}`,
          }}>
            <span>Threshold (≥)</span><span>Audience</span><span>% vs widest</span>
          </div>
          {grid.map(g => {
            const base = grid[0]?.count ?? 1;
            const pct = ((g.count / base) * 100).toFixed(0);
            const isActive = g.threshold === currentValue;
            return (
              <div key={g.threshold} onClick={() => setCurrentValue(g.threshold)} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                padding: '8px 14px', cursor: 'pointer',
                background: isActive ? T.brandSoft : 'transparent',
                borderBottom: `1px solid ${T.n50}`,
              }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = T.n50; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <span style={{ fontFamily: T.fMono, fontSize: 12, color: isActive ? T.brand : T.n800, fontWeight: isActive ? 600 : 400 }}>≥ {g.threshold}</span>
                <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.n700 }}>{g.count >= 1000 ? `${(g.count / 1000).toFixed(0)}k` : g.count}</span>
                <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.n500 }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      <InlineThresholdPlayground
        featureName={featureName}
        featureType={feature?.type ?? 'int'}
        initialValue={currentValue}
        operator=">="
        onThresholdChange={setCurrentValue}
        onApply={v => {
          setApplied(v);
          navigate(`/segments/new?seedFeature=${featureName}`);
        }}
        onCancel={() => navigate(-1)}
      />

      {applied !== null && (
        <p style={{ fontFamily: T.fSans, fontSize: 12, color: T.green600, marginTop: 12 }}>
          Threshold {applied} applied — opening canvas with {featureName} ≥ {applied} pre-populated.
        </p>
      )}

      {id && (
        <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, marginTop: 20 }}>
          Editing threshold for segment <span style={{ fontFamily: T.fMono }}>{id}</span>.{' '}
          <button onClick={() => navigate(`/segments/${id}`)}
            style={{ fontFamily: T.fSans, fontSize: 11, color: T.brand, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
            Back to monitoring
          </button>
        </p>
      )}
    </div>
  );
}
