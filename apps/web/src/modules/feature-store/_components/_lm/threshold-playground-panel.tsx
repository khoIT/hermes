/**
 * Threshold Playground — LM persona showcase panel.
 *
 * User adjusts a numeric threshold (slider or input) and sees the live
 * audience size that would match. Hits catalog-api `/audience-count`
 * with debounce; replaces the hardcoded 15k of the v1 segment composer.
 *
 * Categorical features get a pick-list of labels (each with COUNT) and
 * support multi-select via the `in` op.
 *
 * Numeric range comes from `feature_distributions_daily.buckets` for the
 * latest snapshot — fetched on mount.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { HermesFeature } from '@hermes/contracts';

type Op = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

interface NumericBucket { binStart: number; binEnd: number; count: number }
interface CategoricalBucket { label: string; count: number }
interface DistSnapshot {
  snapshotDate:  string;
  bucketKind:    'numeric' | 'categorical';
  buckets:       NumericBucket[] | CategoricalBucket[];
  totalUids:     number;
  distinctCount: number;
}

interface AudienceCountResp {
  count:     number;
  totalUids: number;
  fraction:  number;
}

const OPS: { v: Op; label: string }[] = [
  { v: 'gt',  label: '>'  },
  { v: 'gte', label: '≥'  },
  { v: 'lt',  label: '<'  },
  { v: 'lte', label: '≤'  },
  { v: 'eq',  label: '='  },
];

interface Props { feature: HermesFeature }

export const ThresholdPlaygroundPanel: React.FC<Props> = ({ feature }) => {
  const [snap, setSnap]       = React.useState<DistSnapshot | null>(null);
  const [snapLoading, setLoad] = React.useState(true);
  const [op, setOp]           = React.useState<Op>('gt');
  const [value, setValue]     = React.useState<string>('');
  const [count, setCount]     = React.useState<AudienceCountResp | null>(null);
  const [busy, setBusy]       = React.useState(false);

  // Load latest distribution snapshot once.
  React.useEffect(() => {
    let alive = true;
    fetch(`/api/v1/features/${encodeURIComponent(feature.name)}/distribution?days=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { snapshots?: DistSnapshot[] } | null) => {
        if (!alive) return;
        const latest = j?.snapshots?.[0] ?? null;
        setSnap(latest);
        if (latest?.bucketKind === 'numeric' && latest.buckets.length) {
          const b = latest.buckets as NumericBucket[];
          // Default value at the median bucket so audience starts non-empty.
          const median = b[Math.floor(b.length / 2)];
          if (median) setValue(String(Math.round(median.binStart)));
        } else if (latest?.bucketKind === 'categorical' && latest.buckets.length) {
          const top = (latest.buckets as CategoricalBucket[])[0];
          if (top) {
            setOp('eq');
            setValue(top.label);
          }
        }
        setLoad(false);
      })
      .catch(() => alive && setLoad(false));
    return () => { alive = false; };
  }, [feature.name]);

  // Debounced live audience-count fetch on (op, value) change.
  React.useEffect(() => {
    if (!value) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const url = `/api/v1/features/${encodeURIComponent(feature.name)}/audience-count?op=${op}&value=${encodeURIComponent(value)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const json = (await res.json()) as AudienceCountResp;
          setCount(json);
        }
      } catch { /* aborted */ }
      finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [feature.name, op, value]);

  if (snapLoading) {
    return <Shell><div style={{ color: T.n500, fontStyle: 'italic' }}>Loading distribution…</div></Shell>;
  }
  if (!snap) {
    return <Shell><div style={{ color: T.n500, fontStyle: 'italic' }}>No distribution available — feature may have no real data yet.</div></Shell>;
  }

  const isCategorical = snap.bucketKind === 'categorical';
  const numericBuckets = (snap.buckets as NumericBucket[]).filter(() => !isCategorical);
  const min = numericBuckets[0]?.binStart ?? 0;
  const max = numericBuckets[numericBuckets.length - 1]?.binEnd ?? 100;

  return (
    <Shell>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          fontFamily: T.fSans,
          fontSize: 13,
        }}
      >
        <span style={{ color: T.n700 }}>uid where</span>
        <code
          style={{
            fontFamily:   T.fMono,
            background:   T.n100,
            padding:      '3px 6px',
            borderRadius: 4,
            color:        T.n900,
          }}
        >
          {feature.name}
        </code>
        {isCategorical ? (
          <>
            <span style={{ color: T.n700 }}>=</span>
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={{
                fontFamily: T.fMono,
                fontSize:   13,
                padding:    '4px 8px',
                border:     `1px solid ${T.n300}`,
                borderRadius: 4,
                background: '#fff',
              }}
            >
              {(snap.buckets as CategoricalBucket[]).map((b) => (
                <option key={b.label} value={b.label}>
                  {b.label} ({b.count.toLocaleString('en-US')})
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <select
              value={op}
              onChange={(e) => setOp(e.target.value as Op)}
              style={{
                fontFamily: T.fMono,
                fontSize:   14,
                padding:    '4px 8px',
                border:     `1px solid ${T.n300}`,
                borderRadius: 4,
                background: '#fff',
              }}
            >
              {OPS.map((o) => (
                <option key={o.v} value={o.v}>{o.label}</option>
              ))}
            </select>
            <input
              type="range"
              min={min}
              max={max}
              step={Math.max(1, Math.round((max - min) / 100))}
              value={Number(value) || min}
              onChange={(e) => setValue(e.target.value)}
              style={{ flex: 1, minWidth: 120 }}
            />
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={{
                width:        100,
                fontFamily:   T.fMono,
                fontSize:     13,
                padding:      '4px 8px',
                border:       `1px solid ${T.n300}`,
                borderRadius: 4,
              }}
            />
          </>
        )}
      </div>

      {/* Result row */}
      <div
        style={{
          display:        'flex',
          alignItems:     'baseline',
          gap:            16,
          padding:        '14px 16px',
          background:     T.brandSoft,
          border:         `1px solid ${T.brandBorder}`,
          borderRadius:   6,
          fontFamily:     T.fSans,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily:    T.fDisp,
              fontSize:      36,
              fontWeight:    700,
              color:         T.brand,
              lineHeight:    1,
            }}
          >
            {count ? count.count.toLocaleString('en-US') : '—'}
          </div>
          <div style={{ fontSize: 12, color: T.n600, marginTop: 4 }}>
            uids match · {count ? `${(count.fraction * 100).toFixed(1)}% of ${count.totalUids.toLocaleString('en-US')} populated` : 'computing…'}
          </div>
        </div>
        <div
          style={{
            fontFamily: T.fMono,
            fontSize:   11,
            color:      busy ? T.amber500 : T.n500,
          }}
        >
          {busy ? 'querying…' : 'live'}
        </div>
      </div>

      {/* Mini histogram with threshold marker */}
      {!isCategorical && numericBuckets.length > 0 && (
        <Histogram buckets={numericBuckets} threshold={Number(value)} op={op} />
      )}
    </Shell>
  );
};

// ── inline subcomponents ──────────────────────────────────────────────

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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
      THRESHOLD PLAYGROUND · live audience
    </div>
    {children}
  </div>
);

const Histogram: React.FC<{ buckets: NumericBucket[]; threshold: number; op: Op }> = ({ buckets, threshold, op }) => {
  const max = Math.max(...buckets.map((b) => b.count));
  const matches = (b: NumericBucket): boolean => {
    const center = (b.binStart + b.binEnd) / 2;
    if (op === 'gt')  return center >  threshold;
    if (op === 'gte') return center >= threshold;
    if (op === 'lt')  return center <  threshold;
    if (op === 'lte') return center <= threshold;
    return Math.abs(center - threshold) <= (b.binEnd - b.binStart) / 2;
  };
  return (
    <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', gap: 1, height: 60 }}>
      {buckets.map((b, i) => {
        const h = max === 0 ? 0 : (b.count / max) * 100;
        const isMatch = matches(b);
        return (
          <div
            key={i}
            title={`${b.binStart.toFixed(0)}–${b.binEnd.toFixed(0)}: ${b.count}`}
            style={{
              flex:       1,
              height:     `${h}%`,
              background: isMatch ? T.brand : T.n300,
              minHeight:  1,
              transition: 'background 0.15s',
            }}
          />
        );
      })}
    </div>
  );
};
