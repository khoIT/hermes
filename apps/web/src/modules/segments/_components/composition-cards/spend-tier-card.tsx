/**
 * SpendTierCard — stacked horizontal bar with 5 spend tiers (free/low/mid/high/whale).
 * Pulls seg.spendTierBreakdown if present, else falls back to synth.
 */
import React from 'react';
import type { HermesSegment } from '@hermes/contracts';
import { synthSpendTierBreakdown } from '../../_utils/synth-segment-detail-data';
import { CardShell, StackedBar, Legend } from './card-primitives';
import { T } from '../../../../theme';

const COLORS = {
  free: T.n400,
  low: '#10b981',
  mid: '#3f8dff',
  high: '#f59e0b',
  whale: '#7c3aed',
};
const LABELS: Record<string, string> = {
  free: 'F2P', low: 'Minnow', mid: 'Dolphin', high: 'High', whale: 'Whale',
};
const TIER_LTV: Record<string, number> = {
  free: 0, low: 4, mid: 18, high: 80, whale: 320,
};

interface Props { segment: HermesSegment }

export function SpendTierCard({ segment }: Props) {
  const lb = segment.spendTierBreakdown ?? synthSpendTierBreakdown(segment.id);
  const segments = (Object.keys(LABELS))
    .map(k => ({
      key: k,
      label: LABELS[k]!,
      pct: (lb as Record<string, number | undefined>)[k] ?? 0,
      color: COLORS[k as keyof typeof COLORS],
    }))
    .filter(s => s.pct > 0);
  const isFallback = !segment.spendTierBreakdown;
  const avgLtv = segments.reduce((acc, s) => acc + s.pct * (TIER_LTV[s.key] ?? 0), 0);
  return (
    <CardShell
      title="Spend tier"
      demo={isFallback}
      footer={`Avg LTV: $${avgLtv.toFixed(2)}`}
    >
      <StackedBar segments={segments} />
      <Legend items={segments} />
    </CardShell>
  );
}
