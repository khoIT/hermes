/**
 * Hermes Home Page — placeholder shell for P-1.
 * Will be filled with real content in P-5 (web shell).
 */
import React from 'react';
import { T, SectionHeader, Kpi, Card, Badge, Sparkline } from '../theme';

// Stub sparkline data for visual smoke test
const STUB_TREND = [12, 18, 14, 22, 19, 28, 24, 31, 27, 35];

export default function HomePage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <SectionHeader
        eyebrow="VNGGames Data Platform"
        title="Hermes"
        description="Centralised analytics hub — campaigns, segments, metrics, and game telemetry in one place."
        style={{ marginBottom: 32 }}
      />

      {/* Status row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <Badge variant="live" dot>Platform online</Badge>
        <Badge variant="secondary">Bootstrap · Phase 1</Badge>
        <Badge variant="brandSoft">VNGGames GDS</Badge>
      </div>

      {/* KPI grid — stub values, real data wired in P-5 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <Kpi label="Active Campaigns" value="—" sub="Connected in P-5" />
        <Kpi label="Tracked Segments"  value="—" sub="Connected in P-5" />
        <Kpi label="Metrics Defined"   value="—" sub="Connected in P-5" />
        <Kpi label="Games Tracked"     value="—" sub="Connected in P-5" />
      </div>

      {/* Sparkline smoke-test card */}
      <Card padding={20} style={{ maxWidth: 320 }}>
        <div style={{ fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Sample Trend
        </div>
        <Sparkline data={STUB_TREND} width={280} height={40} color={T.brand} />
        <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400, marginTop: 6 }}>
          Sparkline component · brand #f05a22
        </div>
      </Card>

      {/* Font specimen */}
      <div style={{ marginTop: 40, borderTop: `1px solid ${T.n200}`, paddingTop: 32 }}>
        <div style={{ fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Typography specimen
        </div>
        <div style={{ fontFamily: T.fDisp, fontSize: 64, fontWeight: 400, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95 }}>
          League Gothic Display
        </div>
        <div style={{ fontFamily: T.fSans, fontSize: 16, color: T.n700, marginTop: 12 }}>
          Inter — body copy, UI labels, data values
        </div>
        <div style={{ fontFamily: T.fMono, fontSize: 13, color: T.n500, marginTop: 6 }}>
          Geist Mono — code, queries, raw values
        </div>
        <div style={{ fontFamily: T.fDisp, fontSize: 24, fontWeight: 400, textTransform: 'uppercase', color: T.brand, marginTop: 16 }}>
          Brand colour #f05a22
        </div>
      </div>
    </div>
  );
}
