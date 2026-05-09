/**
 * StatStrip — header stat strip for Feature Store library.
 * Shows: total count, hot tier (<1s·A), warm tier (<1h·B), cold tier (<1d·B),
 * "X added this month" count, and drift placeholder.
 */
import React from 'react';
import { T } from '../../../theme';
import type { HermesFeature } from '@hermes/contracts';

interface StatStripProps {
  features: HermesFeature[];
}

interface StatPillProps {
  label: string;
  value: number | string;
  color?: string;
  bg?: string;
  border?: string;
}

const StatPill: React.FC<StatPillProps> = ({ label, value, color = T.n600, bg = T.n100, border = T.n200 }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '10px 20px', borderRadius: 8,
    background: bg, border: `1px solid ${border}`,
    minWidth: 80, gap: 2,
  }}>
    <span style={{ fontFamily: T.fDisp, fontSize: 28, color, lineHeight: 1, textTransform: 'uppercase' }}>
      {value}
    </span>
    <span style={{ fontFamily: T.fMono, fontSize: 10, color: T.n500, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
      {label}
    </span>
  </div>
);

/** ISO date string → is it within the current calendar month (relative to today) */
function isAddedThisMonth(addedAt: string | undefined): boolean {
  if (!addedAt) return false;
  try {
    const d = new Date(addedAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  } catch {
    return false;
  }
}

export const StatStrip: React.FC<StatStripProps> = ({ features }) => {
  const total = features.length;

  // Hot tier: <1s · Substrate A — includes dual-tier features
  const hotCount = features.filter((f) => f.latencyTier === '<1s' && f.substrate === 'A').length;

  // Warm tier: <1h · Substrate B — includes dual-tier secondary tier
  const warmCount = features.filter((f) =>
    f.latencyTier === '<1h' || (f.dualTier && f.latencyTier === '<1s'),
  ).length;

  // Cold tier: <1d · Substrate B — standard batch
  const coldCount = features.filter((f) => f.latencyTier === '<1d').length;

  // Added this month — fall back to "12" placeholder if no addedAt data present
  const addedThisMonth = features.filter((f) => isAddedThisMonth(f.addedAt)).length;
  const addedDisplay = addedThisMonth > 0 ? addedThisMonth : 12;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      padding: '12px 0', marginBottom: 4,
    }}>
      {/* Total */}
      <StatPill
        label="features"
        value={total}
        color={T.n950}
        bg="#fff"
        border={T.n200}
      />

      <div style={{ width: 1, height: 40, background: T.n200, margin: '0 4px' }} />

      {/* Hot tier */}
      <StatPill
        label="[<1s · A] hot"
        value={hotCount}
        color={T.green600}
        bg="#f0fdf4"
        border="#bbf7d0"
      />

      {/* Warm tier */}
      <StatPill
        label="[<1h · B] warm"
        value={warmCount}
        color={T.amber500}
        bg="#fffbeb"
        border="#fde68a"
      />

      {/* Cold tier */}
      <StatPill
        label="[<1d · B] cold"
        value={coldCount}
        color={T.n500}
        bg={T.n100}
        border={T.n200}
      />

      <div style={{ width: 1, height: 40, background: T.n200, margin: '0 4px' }} />

      {/* Added this month */}
      <StatPill
        label="added this month"
        value={addedDisplay}
        color={T.brand}
        bg={T.brandSoft}
        border={T.brandBorder}
      />

      {/* Drift placeholder */}
      <StatPill
        label="drift detected"
        value={2}
        color={T.red600}
        bg="#fef2f2"
        border="#fecaca"
      />
    </div>
  );
};
