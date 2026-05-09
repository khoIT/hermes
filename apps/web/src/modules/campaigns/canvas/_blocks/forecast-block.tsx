/**
 * ForecastBlock — reach/cost/lift sparkline + goal-alignment dial.
 * Uses hardcoded demo projections for cmp-cfm-407 anchor campaign.
 */
import React from 'react';
import { T, Sparkline } from '../../../../theme';

const REACH_SPARKLINE  = [2800, 3100, 3200, 3350, 3420, 3380, 3450, 3500, 3420, 3480, 3520, 3410, 3460, 3440];
const COST_SPARKLINE   = [1.2, 1.3, 1.35, 1.4, 1.42, 1.39, 1.43, 1.45, 1.42, 1.44, 1.46, 1.41, 1.43, 1.42];
const LIFT_SPARKLINE   = [0, 1.2, 2.8, 4.1, 5.6, 6.3, 7.0, 7.5, 7.8, 8.0, 8.2, 8.1, 8.2, 8.2];

interface GoalDialProps {
  label: string;
  pct: number; // 0–100
  color?: string;
}

function GoalDial({ label, pct, color = T.brand }: GoalDialProps) {
  // Simple SVG arc dial
  const r = 32, cx = 40, cy = 44, strokeW = 6;
  const sweep = (pct / 100) * Math.PI; // 0..π (semicircle)
  const x2 = cx + r * Math.cos(Math.PI - sweep);
  const y2 = cy - r * Math.sin(Math.PI - sweep);
  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const fgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 ${sweep > Math.PI / 2 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;

  return (
    <div style={{ textAlign: 'center', width: 80 }}>
      <svg width={80} height={50} viewBox="0 0 80 50">
        <path d={bgPath} fill="none" stroke={T.n200} strokeWidth={strokeW} strokeLinecap="round" />
        <path d={fgPath} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
        <text x={cx} y={cy + 2} textAnchor="middle"
          style={{ fontFamily: T.fDisp, fontSize: 13, fill: T.n900 }}>
          {pct}%
        </text>
      </svg>
      <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  sub?: string;
  sparkline?: number[];
  color?: string;
}

function StatRow({ label, value, sub, sparkline, color = T.brand }: StatRowProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderBottom: `1px solid ${T.n100}`,
    }}>
      <div>
        <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        <div style={{ fontFamily: T.fDisp, fontSize: 20, color: T.n900, textTransform: 'uppercase', marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400, marginTop: 1 }}>{sub}</div>}
      </div>
      {sparkline && <Sparkline data={sparkline} width={80} height={24} color={color} />}
    </div>
  );
}

export function ForecastBlock() {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n700,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
      }}>
        Forecast &amp; Goal Alignment
      </div>

      <div style={{ border: `1px solid ${T.n200}`, borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
        <StatRow
          label="Estimated reach"
          value="~3,420 / day"
          sub="~18,200 unique players / week"
          sparkline={REACH_SPARKLINE}
          color={T.brand}
        />
        <StatRow
          label="Projected cost"
          value="~$1.42 CPM"
          sub="IAM channel · no hard cost"
          sparkline={COST_SPARKLINE}
          color={T.n400}
        />
        <StatRow
          label="Forecast lift"
          value="+8.2% D1 retention"
          sub="Based on ia-pass-stuck-rescue lineage · 3 prior campaigns"
          sparkline={LIFT_SPARKLINE}
          color={T.green600}
        />

        {/* Goal alignment dials */}
        <div style={{ padding: '16px 14px', borderTop: `1px solid ${T.n100}` }}>
          <div style={{
            fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500,
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12,
          }}>
            Goal alignment
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <GoalDial label="D1 Retention" pct={82} color={T.brand} />
            <GoalDial label="D7 Retention" pct={64} color={T.brand} />
            <GoalDial label="Revenue impact" pct={12} color={T.n400} />
            <GoalDial label="Pattern match" pct={95} color={T.green600} />
          </div>
        </div>
      </div>
    </div>
  );
}
