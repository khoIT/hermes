/**
 * 5 Data Analyst persona panels in one file (each is small, shares the
 * same useApiFetch hook + Shell component). Each consumes a Phase 01
 * persona endpoint:
 *   QuantileStripPanel        → /features/:n/quantiles
 *   CoverageSegmentationPanel → /features/:n/coverage-segmentation
 *   SampleValueCardsPanel     → /features/:n/samples
 *   CorrelatedFeaturesPanel   → /features/:n/correlations
 *   OutlierExamplesPanel      → /features/:n/outliers
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../../../theme';
import { useApiFetch } from './fetch-hook';

interface PanelProps { feature: { name: string; type: string } }

const Shell: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div
    style={{
      background:   '#fff',
      border:       `1px solid ${T.n200}`,
      borderRadius: 6,
      padding:      '14px 16px',
      fontFamily:   T.fSans,
    }}
  >
    <div
      style={{
        fontFamily:    T.fMono,
        fontSize:      10,
        fontWeight:    700,
        color:         T.n500,
        letterSpacing: '0.08em',
        marginBottom:  10,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const Empty: React.FC<{ msg: string }> = ({ msg }) => (
  <div style={{ fontSize: 12, color: T.n500, fontStyle: 'italic' }}>{msg}</div>
);

// ── 1. Quantile strip (p10/p25/p50/p75/p90/p99) ────────────────────────

export const QuantileStripPanel: React.FC<PanelProps> = ({ feature }) => {
  const { status, data } = useApiFetch<{ quantiles: { p: number; value: number }[] }>(
    `/api/v1/features/${encodeURIComponent(feature.name)}/quantiles`,
    [feature.name],
  );
  const quantiles = data?.quantiles ?? [];
  const max = quantiles.reduce((m, q) => Math.max(m, q.value), 0);

  return (
    <Shell title="QUANTILE STRIP · p10 → p99">
      {status === 'loading' && <Empty msg="Computing percentiles…" />}
      {status === 'error' && <Empty msg="Could not load quantiles." />}
      {status === 'ready' && quantiles.length === 0 && <Empty msg="No numeric values for this feature." />}
      {status === 'ready' && quantiles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {quantiles.map((q) => {
            const h = max === 0 ? 4 : Math.max(4, (q.value / max) * 80);
            return (
              <div key={q.p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n800 }}>
                  {q.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
                <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${h}px`, background: T.brand, borderRadius: 2 }} />
                </div>
                <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n500 }}>p{Math.round(q.p * 100)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
};

// ── 2. Coverage segmentation (lifecycle / region / spend tier) ─────────

const CoverageBar: React.FC<{ label: string; data: Record<string, number> }> = ({ label, data }) => {
  const total = Object.values(data).reduce((s, v) => s + v, 0) || 1;
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const palette = [T.brand, T.blue500, T.green600, T.amber500, T.purple500, T.n400];
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n500, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', height: 16, borderRadius: 3, overflow: 'hidden', background: T.n100 }}>
        {entries.map(([key, count], i) => (
          <div
            key={key}
            title={`${key}: ${count.toLocaleString('en-US')} (${((count / total) * 100).toFixed(1)}%)`}
            style={{
              width:      `${(count / total) * 100}%`,
              background: palette[i % palette.length],
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        {entries.slice(0, 5).map(([key, count], i) => (
          <span key={key} style={{ fontFamily: T.fMono, fontSize: 10, color: T.n600 }}>
            <span style={{ color: palette[i % palette.length] }}>●</span> {key} ({count.toLocaleString('en-US')})
          </span>
        ))}
      </div>
    </div>
  );
};

export const CoverageSegmentationPanel: React.FC<PanelProps> = ({ feature }) => {
  const { status, data } = useApiFetch<{
    byLifecycle:  Record<string, number>;
    byRegion:     Record<string, number>;
    bySpendTier:  Record<string, number>;
  }>(`/api/v1/features/${encodeURIComponent(feature.name)}/coverage-segmentation`, [feature.name]);

  return (
    <Shell title="COVERAGE SEGMENTATION · who has this feature populated">
      {status === 'loading' && <Empty msg="Joining cohorts…" />}
      {status === 'error' && <Empty msg="Could not load segmentation." />}
      {status === 'ready' && data && (
        <>
          <CoverageBar label="By lifecycle stage" data={data.byLifecycle} />
          <CoverageBar label="By region" data={data.byRegion} />
          <CoverageBar label="By spend tier" data={data.bySpendTier} />
        </>
      )}
    </Shell>
  );
};

// ── 3. Sample value cards ──────────────────────────────────────────────

export const SampleValueCardsPanel: React.FC<PanelProps> = ({ feature }) => {
  const { status, data } = useApiFetch<{ samples: { uidAnonymized: string; value: unknown; gameId: string }[] }>(
    `/api/v1/features/${encodeURIComponent(feature.name)}/samples?limit=8`,
    [feature.name],
  );
  return (
    <Shell title="SAMPLE VALUES · what does a real value look like">
      {status === 'loading' && <Empty msg="Picking samples…" />}
      {status === 'ready' && data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {data.samples.map((s) => (
            <div
              key={s.uidAnonymized}
              style={{
                padding:      '8px 10px',
                background:   T.n50,
                borderRadius: 4,
                border:       `1px solid ${T.n200}`,
              }}
            >
              <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n500 }}>{s.uidAnonymized}</div>
              <div style={{ fontFamily: T.fMono, fontSize: 14, color: T.n900, fontWeight: 600 }}>
                {String(s.value)}
              </div>
              <div style={{ fontFamily: T.fMono, fontSize: 9, color: T.n400 }}>{s.gameId}</div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
};

// ── 4. Correlated features ─────────────────────────────────────────────

export const CorrelatedFeaturesPanel: React.FC<PanelProps> = ({ feature }) => {
  const navigate = useNavigate();
  const { status, data } = useApiFetch<{
    correlations: { feature: string; pearson: number; sampleSize: number }[];
    cacheStatus:  'warm' | 'cold' | 'computing';
  }>(`/api/v1/features/${encodeURIComponent(feature.name)}/correlations?topK=5`, [feature.name]);

  return (
    <Shell title="CORRELATED FEATURES · top-5 by Pearson on standardized 5k uid sample">
      {status === 'loading' && <Empty msg="Loading…" />}
      {status === 'ready' && data && data.cacheStatus !== 'warm' && (
        <Empty msg={`Computing correlations in background — refresh in ~30s. (${data.cacheStatus})`} />
      )}
      {status === 'ready' && data && data.correlations.length === 0 && data.cacheStatus === 'warm' && (
        <Empty msg="No correlations available (insufficient overlapping samples)." />
      )}
      {status === 'ready' && data && data.correlations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.correlations.map((c) => {
            const w = Math.abs(c.pearson) * 100;
            const dir = c.pearson >= 0 ? T.brand : T.blue500;
            return (
              <button
                key={c.feature}
                onClick={() => navigate(`/feature-store/${encodeURIComponent(c.feature)}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: T.fSans, fontSize: 12,
                  textAlign: 'left',
                  padding: '4px 6px', border: 'none', cursor: 'pointer',
                  background: 'transparent', borderRadius: 3,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.n50)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ width: 200, fontFamily: T.fMono, color: T.n800 }}>{c.feature}</span>
                <div style={{ flex: 1, height: 8, background: T.n100, borderRadius: 4, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${w}%`, background: dir, borderRadius: 4 }} />
                </div>
                <span style={{ width: 60, fontFamily: T.fMono, fontSize: 11, color: T.n700, textAlign: 'right' }}>
                  {c.pearson.toFixed(3)}
                </span>
                <span style={{ fontFamily: T.fMono, fontSize: 10, color: T.n400 }}>n={c.sampleSize}</span>
              </button>
            );
          })}
        </div>
      )}
    </Shell>
  );
};

// ── 5. Outlier examples ────────────────────────────────────────────────

export const OutlierExamplesPanel: React.FC<PanelProps> = ({ feature }) => {
  const { status, data } = useApiFetch<{ outliers: { uidAnonymized: string; value: number; zScore: number }[] }>(
    `/api/v1/features/${encodeURIComponent(feature.name)}/outliers?topK=5`,
    [feature.name],
  );
  return (
    <Shell title="OUTLIERS · top-5 by |z-score|">
      {status === 'loading' && <Empty msg="Detecting outliers…" />}
      {status === 'ready' && data && data.outliers.length === 0 && <Empty msg="No outliers — feature is non-numeric or too uniform." />}
      {status === 'ready' && data && data.outliers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.outliers.map((o) => {
            const sev = Math.abs(o.zScore);
            const color = sev >= 3 ? T.red600 : sev >= 2 ? T.amber500 : T.n500;
            return (
              <div key={o.uidAnonymized} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: T.fSans, fontSize: 12 }}>
                <span style={{ width: 60, fontFamily: T.fMono, color: T.n500 }}>{o.uidAnonymized}</span>
                <span style={{ flex: 1, fontFamily: T.fMono, color: T.n800 }}>{o.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                <span style={{
                  fontFamily: T.fMono, fontSize: 11, color,
                  padding: '2px 6px', background: `${color}15`, borderRadius: 3,
                }}>z = {o.zScore.toFixed(2)}σ</span>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
};
