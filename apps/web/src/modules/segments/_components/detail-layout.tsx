/**
 * SegmentDetailLayout — wraps every /segments/:id/* route with the hero
 * header + sub-tab strip. Renders <Outlet /> for the active child route.
 */
import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { DetailTabs } from './detail-tabs';
import { SegmentDetailHeader } from './detail-header';
import { allSegments } from '../../../data/catalog/segments';
import { pushRecent } from '../../../utils/recent-items-store';
import { notifyRecentChanged } from '../../../components/sidebar/recent-items';

export function SegmentDetailLayout() {
  const { id } = useParams<{ id: string }>();

  React.useEffect(() => {
    if (!id) return;
    const seg = allSegments.find(s => s.id === id);
    pushRecent('segments', {
      id,
      title: seg?.displayName ?? id,
      updatedAt: new Date().toISOString(),
      href: `/segments/${id}`,
    });
    notifyRecentChanged();
  }, [id]);

  if (!id) return <Outlet />;

  const seg = allSegments.find(s => s.id === id);

  return (
    <>
      {seg && <SegmentDetailHeader segment={seg} />}
      <DetailTabs segmentId={id} />
      <Outlet />
    </>
  );
}
