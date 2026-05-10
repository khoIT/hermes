/**
 * Composition tab — answers "who is in this segment?" via a 2x2 grid:
 * Lifecycle stage · Spend tier · Country top-10 · Device platform.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { T } from '../../theme';
import { allSegments } from '../../data/catalog/segments';
import { LifecycleCard } from './_components/composition-cards/lifecycle-card';
import { SpendTierCard } from './_components/composition-cards/spend-tier-card';
import { CountryCard } from './_components/composition-cards/country-card';
import { DeviceCard } from './_components/composition-cards/device-card';

export default function SegmentsCompositionPage() {
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
      <div style={{
        display: 'grid', gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(440px, 100%), 1fr))',
      }}>
        <LifecycleCard segment={seg} />
        <SpendTierCard segment={seg} />
        <CountryCard segmentId={seg.id} />
        <DeviceCard segmentId={seg.id} />
      </div>
    </div>
  );
}
