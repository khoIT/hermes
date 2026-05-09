/**
 * Feature swap drawer — two tabs (Suggested · All features).
 * Suggested = correlated features from catalog-api with playbook fallback.
 * All = filterable list of full catalog. Click "Use this" → dispatch FEATURE_SWAP.
 */
import React from 'react';
import { T } from '../../../../theme';
import { SideDrawer } from './side-drawer';
import { ProvenanceDot } from './provenance-dot';
import type { HermesFeature } from '@hermes/contracts';
import type { ProposedFeatureRow } from '../_state/compose-types';

interface CorrelatedRow { feature: string; pearson: number }

interface Props {
  open: boolean;
  onClose: () => void;
  currentRow: ProposedFeatureRow | null;
  allFeatures: readonly HermesFeature[];
  onSwap: (newFeatureId: string, newRephrase: string, newRationale: ProposedFeatureRow['rationale']) => void;
}

const CACHE = new Map<string, CorrelatedRow[]>();

async function fetchCorrelated(featureId: string): Promise<CorrelatedRow[]> {
  if (CACHE.has(featureId)) return CACHE.get(featureId)!;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`/api/v1/features/${featureId}/correlations?topK=8`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as { correlations: CorrelatedRow[] };
    const rows = json.correlations ?? [];
    CACHE.set(featureId, rows);
    return rows;
  } catch {
    return [];
  }
}

function getSource(f: HermesFeature | undefined): 'real' | 'hybrid' | 'synth' {
  if (!f) return 'synth';
  return ((f.analytics as unknown as { source?: 'real' | 'hybrid' | 'synth' }).source) ?? 'synth';
}

const FeatureLine: React.FC<{
  feature: HermesFeature; meta?: string; onUse: () => void;
}> = ({ feature, meta, onUse }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    borderBottom: `1px solid ${T.n100}`,
  }}>
    <ProvenanceDot source={getSource(feature)} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: T.fMono, fontSize: 12, color: T.n900, fontWeight: 600 }}>
        {feature.name}
      </div>
      <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, marginTop: 2 }}>
        {feature.displayName} · {feature.type} · {feature.latencyTier}
      </div>
    </div>
    {meta && (
      <span style={{ fontFamily: T.fMono, fontSize: 10, color: T.n500 }}>{meta}</span>
    )}
    <button
      onClick={onUse}
      style={{
        padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
        background: T.brand, color: '#fff', border: 0,
        fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
      }}
    >
      Use this
    </button>
  </div>
);

export const FeatureSwapDrawer: React.FC<Props> = ({
  open, onClose, currentRow, allFeatures, onSwap,
}) => {
  const [tab, setTab] = React.useState<'suggested' | 'all'>('suggested');
  const [query, setQuery] = React.useState('');
  const [correlated, setCorrelated] = React.useState<CorrelatedRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !currentRow) return;
    setLoading(true);
    fetchCorrelated(currentRow.featureId).then((rows) => {
      setCorrelated(rows);
      setLoading(false);
    });
  }, [open, currentRow?.featureId]);

  const filteredAll = React.useMemo(() => {
    const q = query.toLowerCase();
    return allFeatures
      .filter((f) => f.name !== currentRow?.featureId)
      .filter((f) => !q || f.name.toLowerCase().includes(q) || f.displayName.toLowerCase().includes(q))
      .slice(0, 80);
  }, [allFeatures, query, currentRow?.featureId]);

  const suggestions = correlated
    .map((c) => allFeatures.find((f) => f.name === c.feature))
    .filter((f): f is HermesFeature => !!f && f.name !== currentRow?.featureId);

  const useFeature = (newId: string) => {
    if (!currentRow) return;
    const f = allFeatures.find((x) => x.name === newId);
    const rephrase = f?.displayName ? `Bound to ${f.displayName}` : `Bound to ${newId}`;
    onSwap(newId, rephrase, currentRow.rationale);
    onClose();
  };

  return (
    <SideDrawer open={open} onClose={onClose} title="Swap feature" subtitle={currentRow ? `replacing ${currentRow.featureId}` : undefined}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.n200}`, display: 'flex', gap: 8 }}>
        {(['suggested', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
              background: tab === t ? T.n900 : '#fff',
              color: tab === t ? '#fff' : T.n700,
              border: `1px solid ${tab === t ? T.n900 : T.n200}`,
              fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
            }}
          >
            {t === 'suggested' ? 'Suggested' : 'All features'}
          </button>
        ))}
      </div>
      {tab === 'suggested' && (
        <div>
          {loading && (
            <div style={{ padding: 24, fontFamily: T.fSans, fontSize: 12, color: T.n500 }}>
              Fetching correlated features…
            </div>
          )}
          {!loading && suggestions.length === 0 && (
            <div style={{ padding: 24, fontFamily: T.fSans, fontSize: 12, color: T.n500 }}>
              No correlated features available — try the All tab.
            </div>
          )}
          {!loading && suggestions.map((f, i) => (
            <FeatureLine
              key={f.name}
              feature={f}
              meta={`r=${(correlated[i]?.pearson ?? 0).toFixed(2)}`}
              onUse={() => useFeature(f.name)}
            />
          ))}
        </div>
      )}
      {tab === 'all' && (
        <div>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.n100}` }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search features…"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                border: `1px solid ${T.n200}`, borderRadius: 8, outline: 0,
                fontFamily: T.fSans, fontSize: 12, color: T.n900,
              }}
            />
          </div>
          {filteredAll.map((f) => (
            <FeatureLine key={f.name} feature={f} onUse={() => useFeature(f.name)} />
          ))}
          {filteredAll.length === 0 && (
            <div style={{ padding: 24, fontFamily: T.fSans, fontSize: 12, color: T.n500 }}>
              No matches.
            </div>
          )}
        </div>
      )}
    </SideDrawer>
  );
};
