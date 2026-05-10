/**
 * Overview tab for /segments/:id — answers "is this segment healthy?".
 * Full-width SegmentSizeChart + drift banner + 2-col vs-All / Trend tables +
 * full-width Segment Overlap table. Uses deterministic synth fixtures keyed
 * by segment id (stable across reloads).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { T } from '../../theme';
import { allSegments } from '../../data/catalog/segments';
import { SegmentSizeChart } from './_components/segment-size-chart';
import { VsAllUsersTable } from './_components/vs-all-users-table';
import { TrendOverTimeTable } from './_components/trend-over-time-table';
import { SegmentOverlapTable } from './_components/segment-overlap-table';

export default function SegmentsOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const seg = id ? allSegments.find(s => s.id === id) : undefined;

  if (!id) return null;
  if (!seg) {
    return (
      <div style={{ padding: 32, fontFamily: T.fSans, color: T.n500 }}>
        Segment not found.
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px 48px', maxWidth: 1200 }}>
      <SegmentSizeChart segment={seg} />

      {seg.drift && (
        <div style={{
          marginTop: 16,
          background: T.amberSoft, border: `1px solid ${T.amber500}`,
          borderRadius: 8, padding: '12px 16px',
          fontFamily: T.fSans, fontSize: 13, color: '#92400e',
        }}>
          ⚠ Drift detected — composition shifted &gt;15% from baseline. Consider rebuilding.
        </div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
        marginTop: 16,
      }}>
        <VsAllUsersTable segmentId={id} segment={seg} />
        <TrendOverTimeTable segmentId={id} />
      </div>

      <div style={{ marginTop: 16 }}>
        <SegmentOverlapTable segmentId={id} />
      </div>
    </div>
  );
}
