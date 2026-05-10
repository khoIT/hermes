/**
 * LifecycleCard — stacked horizontal bar with 4 lifecycle stages.
 * Pulls seg.lifecycleBreakdown if present, else falls back to synth.
 */
import React from 'react';
import type { HermesSegment } from '@hermes/contracts';
import { T } from '../../../../theme';
import { synthLifecycleBreakdown } from '../../_utils/synth-segment-detail-data';
import { CardShell, StackedBar, Legend } from './card-primitives';

const COLORS = {
  nru: '#3f8dff',
  mid: '#10b981',
  veteran: '#7c3aed',
  lapsed: '#f59e0b',
};

const LABELS: Record<string, string> = {
  nru: 'New (NRU)',
  mid: 'Mid',
  veteran: 'Veteran',
  lapsed: 'Lapsed',
};

interface Props { segment: HermesSegment }

export function LifecycleCard({ segment }: Props) {
  const lb = segment.lifecycleBreakdown ?? synthLifecycleBreakdown(segment.id);
  const segments = (Object.keys(LABELS) as Array<keyof typeof LABELS>)
    .map(k => ({
      key: k as string,
      label: LABELS[k]!,
      pct: (lb as Record<string, number | undefined>)[k as string] ?? 0,
      color: COLORS[k as keyof typeof COLORS],
    }))
    .filter(s => s.pct > 0);
  const isFallback = !segment.lifecycleBreakdown;
  return (
    <CardShell title="Lifecycle stage" demo={isFallback}>
      <StackedBar segments={segments} />
      <Legend items={segments} />
    </CardShell>
  );
}
