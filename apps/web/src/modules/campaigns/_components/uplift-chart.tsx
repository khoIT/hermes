/**
 * UpliftChart — holdout vs treatment retention curves with confidence band.
 * Hardcoded for cmp-cfm-407: +8.2% D1 retention vs holdout, p=0.02.
 * Simple SVG line chart — no external charting library.
 */
import React from 'react';
import { T } from '../../../theme';

const DAYS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// D1 retention curves (cumulative retention % at day N)
const TREATMENT_RETENTION = [100, 64.2, 52.1, 45.8, 41.2, 38.6, 36.9, 35.4, 34.2, 33.1, 32.4, 31.9, 31.5, 31.2, 31.0];
const HOLDOUT_RETENTION   = [100, 56.0, 44.8, 38.9, 34.6, 31.8, 30.1, 28.8, 27.7, 26.9, 26.3, 25.9, 25.6, 25.4, 25.2];

// Confidence bands (±1 SE)
const TREATMENT_UPPER = TREATMENT_RETENTION.map(v => v + 2.1);
const TREATMENT_LOWER = TREATMENT_RETENTION.map(v => v - 2.1);

const W = 560, H = 200, PAD = { top: 16, right: 20, bottom: 36, left: 44 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function scaleX(day: number) { return PAD.left + (day / 14) * INNER_W; }
function scaleY(pct: number) { return PAD.top + INNER_H - ((pct - 20) / 55) * INNER_H; }

function polyline(data: number[]) {
  return data.map((v, i) => `${scaleX(DAYS[i] as number).toFixed(1)},${scaleY(v).toFixed(1)}`).join(' ');
}

function area(upper: number[], lower: number[]) {
  const top = upper.map((v, i) => `${scaleX(DAYS[i] as number).toFixed(1)},${scaleY(v).toFixed(1)}`).join(' ');
  const bot = lower.map((v, i) => `${scaleX(DAYS[i] as number).toFixed(1)},${scaleY(v).toFixed(1)}`).reverse().join(' ');
  return `${top} ${bot}`;
}

export function UpliftChart() {
  return (
    <div>
      {/* Headline */}
      <div style={{
        fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.green600,
        marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          background: T.greenSoft, border: '1px solid #a7f3d0',
          borderRadius: 6, padding: '4px 12px', fontSize: 14,
        }}>
          +8.2% D1 retention vs holdout
        </span>
        <span style={{
          fontFamily: T.fMono, fontSize: 12, color: T.green600,
          background: '#d1fae5', borderRadius: 4, padding: '2px 8px',
        }}>
          p=0.02 · significant
        </span>
      </div>

      {/* SVG chart */}
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
        {/* Grid lines */}
        {[30, 40, 50, 60, 70].map(pct => (
          <g key={pct}>
            <line
              x1={PAD.left} y1={scaleY(pct)}
              x2={W - PAD.right} y2={scaleY(pct)}
              stroke={T.n100} strokeWidth={1}
            />
            <text x={PAD.left - 6} y={scaleY(pct) + 4}
              textAnchor="end"
              style={{ fontFamily: T.fSans, fontSize: 10, fill: T.n400 }}
            >
              {pct}%
            </text>
          </g>
        ))}

        {/* Day labels */}
        {[0, 7, 14].map(d => (
          <text key={d}
            x={scaleX(d)} y={H - 8}
            textAnchor="middle"
            style={{ fontFamily: T.fSans, fontSize: 10, fill: T.n400 }}
          >
            D{d}
          </text>
        ))}

        {/* Confidence band — treatment */}
        <polygon
          points={area(TREATMENT_UPPER, TREATMENT_LOWER)}
          fill={T.brand}
          opacity={0.08}
        />

        {/* Holdout line */}
        <polyline
          points={polyline(HOLDOUT_RETENTION)}
          fill="none"
          stroke={T.n400}
          strokeWidth={2}
          strokeDasharray="5 3"
        />

        {/* Treatment line */}
        <polyline
          points={polyline(TREATMENT_RETENTION)}
          fill="none"
          stroke={T.brand}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* D1 delta annotation */}
        <line
          x1={scaleX(1)} y1={scaleY(HOLDOUT_RETENTION[1] as number)}
          x2={scaleX(1)} y2={scaleY(TREATMENT_RETENTION[1] as number)}
          stroke={T.green600} strokeWidth={1.5} strokeDasharray="3 2"
        />
        <text
          x={scaleX(1) + 6} y={(scaleY(HOLDOUT_RETENTION[1] as number) + scaleY(TREATMENT_RETENTION[1] as number)) / 2 + 4}
          style={{ fontFamily: T.fSans, fontSize: 10, fill: T.green600, fontWeight: 700 }}
        >
          +8.2%
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
        <LegendItem color={T.brand}  label="Treatment (A+B combined)" dash={false} />
        <LegendItem color={T.n400}   label="Holdout (control)"         dash />
      </div>
    </div>
  );
}

function LegendItem({ color, label, dash }: { color: string; label: string; dash: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width={24} height={12}>
        <line x1={0} y1={6} x2={24} y2={6}
          stroke={color} strokeWidth={2}
          strokeDasharray={dash ? '4 2' : undefined}
        />
      </svg>
      <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600 }}>{label}</span>
    </div>
  );
}
