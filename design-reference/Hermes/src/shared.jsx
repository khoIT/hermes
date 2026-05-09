/* global React, window */
const { useState, useEffect, useRef, useMemo } = React;

// ─── Icons (inline SVG, lucide-style) ─────────────────────────────────────
const ICONS = {
  search:   <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  chevdown: <path d="m6 9 6 6 6-6"/>,
  chevright:<path d="m9 6 6 6-6 6"/>,
  chevleft: <path d="m15 6-6 6 6 6"/>,
  plus:     <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  x:        <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  copy:     <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>,
  check:    <path d="m5 12 5 5L20 7"/>,
  arrow:    <><path d="M5 12h14"/><path d="m13 5 7 7-7 7"/></>,
  arrowl:   <><path d="M19 12H5"/><path d="m11 5-7 7 7 7"/></>,
  filter:   <path d="M3 5h18l-7 9v6l-4-2v-4Z"/>,
  more:     <><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></>,
  sliders:  <><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="7" cy="18" r="2" fill="currentColor"/></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
  zap:      <path d="m13 2-9 12h7l-1 8 9-12h-7Z"/>,
  layers:   <><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></>,
  send:     <path d="m22 2-9.5 9.5M22 2 15 22l-2.5-9L3 11Z"/>,
  trash:    <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></>,
  pause:    <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  play:     <path d="m6 4 14 8-14 8z"/>,
  edit:     <><path d="m12 20 9-9-3-3-9 9-1 4z"/><path d="m15 8 3 3"/></>,
  link:     <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>,
  external: <><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
  alert:    <><path d="M12 2 1 21h22Z"/><path d="M12 9v5"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></>,
  bookmark: <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>,
  bell:     <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></>,
  history:  <><path d="M3 12a9 9 0 1 0 9-9 9.7 9.7 0 0 0-7 3"/><path d="M3 3v5h5"/><path d="M12 7v5l3 3"/></>,
  branch:   <><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></>,
  target:   <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></>,
  sparkle:  <path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/>,
  flask:    <><path d="M9 3h6"/><path d="M10 3v7L4 21h16L14 10V3"/></>,
  refresh:  <><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
  funnel:   <path d="M3 5h18l-7 9v6l-4-2v-4Z"/>,
  list:     <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  grid:     <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  home:     <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 21v-6h6v6"/></>,
  flag:     <><path d="M4 21V4M4 4h13l-2 4 2 4H4"/></>,
  bell2:    <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  message:  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>,
  user:     <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  clock:    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  bolt:     <path d="m13 2-9 12h7l-1 8 9-12h-7z"/>,
  eye:      <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  scope:    <><circle cx="12" cy="12" r="9"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></>,
};

function Icon({ name, size = 14, style, color }) {
  return <svg className="i" viewBox="0 0 24 24" width={size} height={size} style={{ color, ...style }}>{ICONS[name] || null}</svg>;
}

// ─── Substrate / latency badge ────────────────────────────────────────────
function LatencyBadge({ tier }) {
  // tier: '<1s · A', '<1h · B', '<1d · B'
  const isReal = tier.includes('A');
  const cls = isReal ? 'pill accent' : 'pill';
  return (
    <span className={cls} style={{ fontSize: 10.5, padding: '1px 6px' }}>
      <span style={{ width: 5, height: 5, borderRadius: 99, background: isReal ? 'var(--accent)' : 'var(--ink-3)' }}/>
      {tier}
    </span>
  );
}

// ─── 4R Goal Badge ────────────────────────────────────────────────────────
function GoalBadge({ goal, size }) {
  const map = {
    Retain:     { bg: '#eaf2ff', bd: '#c7d9f7', fg: '#1e63ce' },
    Revenue:    { bg: '#fff2eb', bd: '#f8c9b0', fg: '#9a3412' },
    Reactivate: { bg: '#fef6e0', bd: '#f0d896', fg: '#92580a' },
    Recruit:    { bg: '#f3eefe', bd: '#d8c8fa', fg: '#5b21b6' },
  };
  const c = map[goal] || { bg: '#f3f1ec', bd: '#e7e5e0', fg: '#525252' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'sm' ? '1px 6px' : '2px 8px',
      borderRadius: 4, border: `1px solid ${c.bd}`, background: c.bg, color: c.fg,
      fontSize: size === 'sm' ? 10 : 11, fontWeight: 600, letterSpacing: 0.02,
    }}>
      {goal}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────
function Avatar({ initials, size = 22, color }) {
  const palette = ['#f05a22', '#3f8dff', '#009689', '#7c3aed', '#92580a'];
  const c = color || palette[(initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % palette.length];
  return (
    <span style={{
      width: size, height: size, borderRadius: 99,
      background: c, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 600, letterSpacing: 0.02, flexShrink: 0,
    }}>{initials}</span>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, accent, amber, height = 22, w = 80 }) {
  if (!data || !data.length) return <span className="t-meta">—</span>;
  const max = Math.max(...data, 1);
  const cls = `sparkline${accent ? ' accent' : ''}${amber ? ' amber' : ''}`;
  return (
    <div className={cls} style={{ height, width: w }}>
      {data.map((v, i) => <div key={i} className="pt" style={{ height: `${(v / max) * 100}%` }}/>)}
    </div>
  );
}

// ─── Histogram (28 bins) ──────────────────────────────────────────────────
function Histogram({ bins, matchedFn, height = 36, showAxis }) {
  const max = Math.max(...bins, 1);
  return (
    <div>
      <div className="histo" style={{ height }}>
        {bins.map((v, i) => {
          const matched = matchedFn ? matchedFn(i, bins.length) : false;
          return (
            <div key={i} className={`bar${matched ? ' matched' : ''}`}
                 style={{ height: `${(v / max) * 100}%` }}/>
          );
        })}
      </div>
      {showAxis && (
        <div style={{ display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-5)', marginTop: 4 }}>
          <span>0</span><span>p50</span><span>p90</span><span>p99</span><span>max</span>
        </div>
      )}
    </div>
  );
}

// ─── Stat strip block ─────────────────────────────────────────────────────
function StatStrip({ items }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 28,
      padding: '14px 0', borderBottom: '1px solid var(--hairline)' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="t-mini">{it.label}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: it.color || 'var(--ink)' }}>
            {it.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Lookup helpers exposed globally ──────────────────────────────────────
function getFeature(id) {
  return (window.HERMES_DATA.FEATURES || []).find(f => f.id === id);
}
function getSegment(id) {
  return (window.HERMES_DATA.SEGMENTS || []).find(s => s.id === id);
}
function getCampaign(id) {
  return (window.HERMES_DATA.CAMPAIGNS || []).find(c => c.id === id);
}
function getEvent(id) {
  return (window.HERMES_DATA.EVENTS || []).find(e => e.id === id);
}

// ─── Status dot ───────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const map = {
    Active:    { c: '#009689', label: 'Active' },
    Draft:     { c: '#a3a3a3', label: 'Draft' },
    Ended:     { c: '#737373', label: 'Ended' },
    Paused:    { c: '#f59e0b', label: 'Paused' },
    Drift:     { c: '#f59e0b', label: 'Drift' },
    Stale:     { c: '#a3a3a3', label: 'Stale' },
  };
  const m = map[status] || map.Active;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: m.c, boxShadow: status === 'Active' ? `0 0 0 3px ${m.c}22` : 'none' }}/>
      {m.label}
    </span>
  );
}

// ─── Number formatter ─────────────────────────────────────────────────────
function fmtNum(n) {
  if (n == null) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(n >= 10000000 ? 0 : 1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return String(n);
}

// ─── Empty rail block ─────────────────────────────────────────────────────
function RailBlock({ title, children, action }) {
  return (
    <div style={{ padding: 16, borderBottom: '1px solid var(--hairline)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="t-mini">{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, { Icon, LatencyBadge, GoalBadge, Avatar, Sparkline, Histogram, StatStrip, StatusDot, RailBlock, fmtNum, getFeature, getSegment, getCampaign, getEvent });
