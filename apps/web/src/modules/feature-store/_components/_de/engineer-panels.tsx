/**
 * 4 Data Engineer persona panels.
 *   PipelineHealthTimelinePanel → /features/:n/pipeline-health (last 30 runs)
 *   CostLatencyPanel            → reads analytics + samples + DB row counts
 *   LineageV2Panel              → upstream (source tables) + downstream (segments/campaigns)
 *   BackfillHistoryPanel        → /features/:n/distribution?days=30 (gaps as amber)
 */
import React from 'react';
import { T } from '../../../../theme';
import { useApiFetch } from '../_da/fetch-hook';
import type { HermesFeature } from '@hermes/contracts';

interface PanelProps { feature: HermesFeature }

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

// ── 1. Pipeline health timeline ────────────────────────────────────────

interface PipelineRun {
  startedAt:   string;
  finishedAt:  string | null;
  rowsWritten: number;
  durationMs:  number | null;
  error:       string | null;
  sourceTable: string | null;
}

export const PipelineHealthTimelinePanel: React.FC<PanelProps> = ({ feature }) => {
  const { status, data } = useApiFetch<{ runs: PipelineRun[]; slaBreaches: number; p99DurationMs: number | null }>(
    `/api/v1/features/${encodeURIComponent(feature.name)}/pipeline-health?days=30`,
    [feature.name],
  );

  return (
    <Shell title="PIPELINE HEALTH · last 30d derivation runs">
      {status === 'loading' && <Empty msg="Loading run history…" />}
      {status === 'error' && <Empty msg="Could not load pipeline health." />}
      {status === 'ready' && data && data.runs.length === 0 && (
        <Empty msg="No runs recorded yet · run `pnpm refresh-cfm-data --feature-values-only` to instrument." />
      )}
      {status === 'ready' && data && data.runs.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60, marginBottom: 10 }}>
            {data.runs.slice().reverse().map((r, i) => {
              const ok    = !r.error;
              const dur   = r.durationMs ?? 0;
              const max   = data.p99DurationMs ?? 1000;
              const h     = Math.max(4, Math.min(60, (dur / Math.max(max, 1)) * 60));
              const color = ok ? T.green600 : T.red600;
              return (
                <div
                  key={i}
                  title={`${new Date(r.startedAt).toISOString()} · ${dur}ms · ${r.rowsWritten.toLocaleString('en-US')} rows${r.error ? ` · FAIL: ${r.error}` : ''}`}
                  style={{ flex: 1, height: `${h}px`, background: color, minWidth: 4, borderRadius: 1 }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, fontFamily: T.fMono, fontSize: 11, color: T.n600 }}>
            <span>{data.runs.length} runs</span>
            <span style={{ color: data.slaBreaches > 0 ? T.red600 : T.n600 }}>{data.slaBreaches} failures</span>
            <span>p99 {data.p99DurationMs ?? '—'}ms</span>
          </div>
        </>
      )}
    </Shell>
  );
};

// ── 2. Cost & latency card ─────────────────────────────────────────────

export const CostLatencyPanel: React.FC<PanelProps> = ({ feature }) => {
  // Re-use the pipeline-health endpoint for derivation cost + the analytics
  // block already on `feature` for lookup latency / freshness lag.
  const { data } = useApiFetch<{ runs: PipelineRun[]; p99DurationMs: number | null }>(
    `/api/v1/features/${encodeURIComponent(feature.name)}/pipeline-health?days=30`,
    [feature.name],
  );
  const totalRows = data?.runs.reduce((s, r) => s + r.rowsWritten, 0) ?? 0;
  const lookupP99 = feature.analytics.p99LookupLatencyMs ?? null;
  const medianLag = feature.analytics.medianLagMinutes ?? null;
  const usage     = feature.analytics.usageCount180d;

  const Cell = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div style={{ flex: 1, padding: 10, background: T.n50, borderRadius: 4, border: `1px solid ${T.n200}` }}>
      <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n500 }}>{label}</div>
      <div style={{ fontFamily: T.fMono, fontSize: 18, color: T.n900, fontWeight: 600, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n400, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <Shell title="COST & LATENCY · derivation + lookup metrics">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <Cell
          label="Derivation p99"
          value={data?.p99DurationMs !== null && data?.p99DurationMs !== undefined ? `${data.p99DurationMs}ms` : '—'}
          sub={`over ${data?.runs.length ?? 0} runs`}
        />
        <Cell
          label="Online lookup p99"
          value={lookupP99 ? `${lookupP99}ms` : '—'}
          sub="online tier"
        />
        <Cell
          label="Median freshness lag"
          value={medianLag ? `${medianLag}m` : '—'}
        />
        <Cell
          label="180d request count"
          value={usage > 1_000_000 ? `${(usage / 1_000_000).toFixed(1)}M` : usage.toLocaleString('en-US')}
          sub={`${(totalRows / 1000).toFixed(1)}k rows written total`}
        />
      </div>
    </Shell>
  );
};

// ── 3. Lineage v2 (upstream + downstream split) ────────────────────────

export const LineageV2Panel: React.FC<PanelProps> = ({ feature }) => {
  const { data: usedBy } = useApiFetch<{ segments: { count: number }; campaigns: { count: number } }>(
    `/api/v1/features/${encodeURIComponent(feature.name)}/used-by`,
    [feature.name],
  );
  const { data: topSegs } = useApiFetch<{ segments: { segmentId: string; displayName: string; audienceSize: number; game: string }[] }>(
    `/api/v1/features/${encodeURIComponent(feature.name)}/top-segments-using`,
    [feature.name],
  );

  const upstream = feature.definition?.dbtSql?.match(/ref\(['"]([^'"]+)['"]\)/g)?.map((m) => m.slice(5, -2)) ?? [];

  return (
    <Shell title="LINEAGE V2 · upstream sources + downstream consumers">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n500, marginBottom: 6 }}>UPSTREAM</div>
          {upstream.length === 0 ? (
            <Empty msg="No dbt refs in definition (raw ingestion)." />
          ) : (
            upstream.map((u) => (
              <div key={u} style={{ fontFamily: T.fMono, fontSize: 12, color: T.n800, padding: '4px 8px', background: T.n50, borderRadius: 3, marginBottom: 4 }}>
                ▲ {u}
              </div>
            ))
          )}
          <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500, marginTop: 8 }}>
            substrate: <span style={{ color: T.n800 }}>{feature.substrate}</span> · tier {feature.latencyTier}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n500, marginBottom: 6 }}>DOWNSTREAM</div>
          <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700, marginBottom: 6 }}>
            {usedBy?.segments.count ?? 0} segments · {usedBy?.campaigns.count ?? 0} campaigns
          </div>
          {topSegs?.segments.slice(0, 4).map((s) => (
            <div key={s.segmentId} style={{ fontFamily: T.fSans, fontSize: 11, padding: '4px 8px', background: T.n50, borderRadius: 3, marginBottom: 3 }}>
              ▼ <code style={{ fontFamily: T.fMono, color: T.n500 }}>{s.game}</code> · {s.displayName}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
};

// ── 4. Backfill history ────────────────────────────────────────────────

export const BackfillHistoryPanel: React.FC<PanelProps> = ({ feature }) => {
  const { status, data } = useApiFetch<{ snapshots: { snapshotDate: string; totalUids: number }[] }>(
    `/api/v1/features/${encodeURIComponent(feature.name)}/distribution?days=30`,
    [feature.name],
  );

  return (
    <Shell title="BACKFILL HISTORY · 30-day distribution row coverage">
      {status === 'loading' && <Empty msg="Loading…" />}
      {status === 'ready' && data && (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 50, marginBottom: 8 }}>
            {data.snapshots.slice().reverse().map((s) => {
              const max = data.snapshots.reduce((m, x) => Math.max(m, x.totalUids), 0) || 1;
              const h   = Math.max(2, (s.totalUids / max) * 50);
              const gap = s.totalUids === 0;
              return (
                <div
                  key={s.snapshotDate}
                  title={`${s.snapshotDate}: ${s.totalUids.toLocaleString('en-US')} uids${gap ? ' · GAP' : ''}`}
                  style={{
                    flex:       1,
                    height:     `${h}px`,
                    background: gap ? T.amber500 : T.brand,
                    minWidth:   2,
                  }}
                />
              );
            })}
          </div>
          <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>
            {data.snapshots.length} snapshots · {data.snapshots.filter((s) => s.totalUids === 0).length} gaps
          </div>
        </>
      )}
    </Shell>
  );
};
