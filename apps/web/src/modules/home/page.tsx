/**
 * 00 — Home page. Nav-aware landing replaces P-1 placeholder.
 * Shows quick links to all 5 modules with verb subtitles.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, Badge, Sparkline } from '../../theme';

const MODULES = [
  { num: '01', label: 'Feature Store', verb: 'inventory',   path: '/feature-store', desc: '67 features across 9 domains · dual-substrate catalog' },
  { num: '02', label: 'Explore',       verb: 'investigate', path: '/explore',       desc: 'Anomaly landing · event browser · cohort analytics' },
  { num: '03', label: 'Segments',      verb: 'compose',     path: '/segments',      desc: '31 segments · predicate composer · audience preview' },
  { num: '04', label: 'Campaign',      verb: 'activate',    path: '/campaigns',     desc: 'Real-time · Scheduled · One-time · journey builder' },
  { num: '05', label: 'Agents',        verb: 'supervise',   path: '/agents',        desc: '9 opportunities · 3 drafts · 2 experiment recs' },
];

const STUB_TREND = [12, 18, 14, 22, 19, 28, 24, 31, 27, 35];

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          VNGGames · GDS LiveOps Platform
        </div>
        <div style={{ fontFamily: T.fDisp, fontSize: 56, fontWeight: 400, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, letterSpacing: '0.03em', marginBottom: 12 }}>
          Hermes
        </div>
        <p style={{ fontFamily: T.fSans, fontSize: 14, color: T.n500, maxWidth: 520, lineHeight: 1.6 }}>
          Self-service LiveOps authoring. Compose segments over the Feature Store,
          activate campaigns against two substrates, and supervise agent proposals.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Badge variant="live" dot>Platform online</Badge>
          <Badge variant="brandSoft">α prototype · May 2026</Badge>
        </div>
      </div>

      {/* Module cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {MODULES.map(m => (
          <div
            key={m.num}
            onClick={() => navigate(m.path)}
            style={{
              background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
              padding: '18px 20px', cursor: 'pointer',
              transition: 'box-shadow .15s, border-color .15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px rgba(0,0,0,0.1)`;
              (e.currentTarget as HTMLDivElement).style.borderColor = T.brand;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              (e.currentTarget as HTMLDivElement).style.borderColor = T.n200;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
              <span style={{ fontFamily: T.fMono, fontSize: 10, color: T.brand, fontWeight: 600 }}>{m.num}</span>
              <span style={{ fontFamily: T.fDisp, fontSize: 18, color: T.n950, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</span>
            </div>
            <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400, textTransform: 'lowercase', letterSpacing: '0.04em', marginBottom: 10 }}>
              {m.verb}
            </div>
            <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, lineHeight: 1.5, margin: 0 }}>
              {m.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Stub sparkline smoke-test */}
      <div style={{ marginTop: 48, borderTop: `1px solid ${T.n100}`, paddingTop: 24 }}>
        <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Sparkline primitive ·
        </span>
        <Sparkline data={STUB_TREND} width={120} height={28} color={T.brand} />
      </div>
    </div>
  );
}
