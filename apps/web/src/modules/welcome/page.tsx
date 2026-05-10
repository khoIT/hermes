/**
 * Welcome — preserved dashboard moved from `/` (former HomePage).
 * Module cards + brand intro. Links into the existing canvases stay valid;
 * old /agents links 301-redirect to chat per Phase 10 routing.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { T, Badge, Sparkline, Icon } from '../../theme';

const MODULES = [
  { num: '01', label: 'Feature Store', verb: 'inventory',   path: '/feature-store', desc: '67 features across 9 domains · dual-substrate catalog' },
  { num: '02', label: 'Segments',      verb: 'compose',     path: '/segments',      desc: '31 segments · predicate composer · audience preview' },
  { num: '03', label: 'Campaigns',     verb: 'activate',    path: '/campaigns',     desc: 'Real-time · Scheduled · One-time · journey builder' },
  { num: '04', label: 'Boards',        verb: 'pin',         path: '/canvas',        desc: 'Pin chat widgets to working dashboards' },
  { num: '05', label: 'Explore',       verb: 'investigate', path: '/explore',       desc: 'Anomaly landing · event browser · cohort analytics' },
];

const STUB_TREND = [12, 18, 14, 22, 19, 28, 24, 31, 27, 35];

export default function WelcomePage() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          VNGGames · GDS LiveOps Platform
        </div>
        <div style={{ fontFamily: T.fDisp, fontSize: 56, fontWeight: 400, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, letterSpacing: '0.03em', marginBottom: 12 }}>
          Hermes
        </div>
        <p style={{ fontFamily: T.fSans, fontSize: 14, color: T.n500, maxWidth: 560, lineHeight: 1.6 }}>
          Self-service LiveOps authoring. Ask questions in chat, compose
          segments and campaigns, and pin the answers to a board.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
          <Badge variant="live" dot>Platform online</Badge>
          <Badge variant="brandSoft">α prototype · May 2026</Badge>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginLeft: 'auto',
              fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
              padding: '8px 14px', borderRadius: 9999,
              border: `1px solid ${T.brandBorder}`, background: T.brandSoft, color: T.brand,
              cursor: 'pointer',
            }}
          >
            <Icon icon={Sparkles} size={13} color={T.brand} />
            Ask Hermes
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
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

      <div style={{ marginTop: 48, borderTop: `1px solid ${T.n100}`, paddingTop: 24 }}>
        <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Activity ·
        </span>
        <Sparkline data={STUB_TREND} width={120} height={28} color={T.brand} />
      </div>
    </div>
  );
}
