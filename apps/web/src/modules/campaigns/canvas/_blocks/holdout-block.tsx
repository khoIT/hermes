/**
 * HoldoutBlock — slider 0–50%, default 90/10 treatment/control.
 * Shows "powered to detect ≥X% lift in Y days" copy.
 */
import React from 'react';
import { T } from '../../../../theme';

interface Props {
  defaultHoldout?: number; // fraction e.g. 0.10
}

/** Rough inverse-power calculation for demo copy — not a real stats library. */
function detectableLift(holdoutFraction: number): { lift: string; days: number } {
  if (holdoutFraction <= 0) return { lift: '—', days: 0 };
  // Heuristic: 10% holdout → ≥5% lift in 14d; smaller holdout → harder to detect
  const base = 0.05;
  const factor = 0.10 / Math.max(holdoutFraction, 0.01);
  const lift = (base * factor * 100).toFixed(0);
  const days = Math.round(14 * factor);
  return { lift: `${lift}%`, days: Math.min(days, 90) };
}

export function HoldoutBlock({ defaultHoldout = 0.10 }: Props) {
  const [holdout, setHoldout] = React.useState(Math.round(defaultHoldout * 100));

  const treatment = 100 - holdout;
  const { lift, days } = detectableLift(holdout / 100);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n700,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
      }}>
        Holdout &amp; Experiment Design
      </div>

      <div style={{
        border: `1px solid ${T.n200}`, borderRadius: 8,
        padding: '16px', background: '#fff',
      }}>
        {/* Allocation bar */}
        <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{
            flex: treatment, background: T.brand, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: '#fff' }}>
              Treatment {treatment}%
            </span>
          </div>
          <div style={{
            flex: holdout, background: T.n300, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n700 }}>
              {holdout > 4 ? `Holdout ${holdout}%` : ''}
            </span>
          </div>
        </div>

        {/* Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n600, flexShrink: 0 }}>0%</span>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={holdout}
            onChange={e => setHoldout(Number(e.target.value))}
            style={{ flex: 1, accentColor: T.brand }}
          />
          <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n600, flexShrink: 0 }}>50%</span>
          <span style={{
            fontFamily: T.fMono, fontSize: 13, fontWeight: 700,
            color: T.n900, minWidth: 40, textAlign: 'right',
          }}>
            {holdout}%
          </span>
        </div>

        {/* Power copy */}
        {holdout > 0 && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 7,
            background: T.greenSoft, border: `1px solid #a7f3d0`,
            fontFamily: T.fSans, fontSize: 12, color: T.green600,
          }}>
            With {holdout}% holdout: powered to detect ≥{lift} lift in {days} days (80% power, α=0.05)
          </div>
        )}
        {holdout === 0 && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 7,
            background: T.amberSoft,
            fontFamily: T.fSans, fontSize: 12, color: '#92400e',
          }}>
            No holdout — lift will not be measurable. Recommended minimum: 5%.
          </div>
        )}
      </div>
    </div>
  );
}
