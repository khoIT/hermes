/**
 * SegmentDetailLayout — wraps every /segments/:id/* route with the
 * sub-tab strip. Renders <Outlet /> for the active child route.
 */
import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { DetailTabs } from './detail-tabs';
import { allSegments } from '../../../data/catalog/segments';
import { pushRecent } from '../../../utils/recent-items-store';
import { notifyRecentChanged } from '../../../components/sidebar/recent-items';

export function SegmentDetailLayout() {
  const { id } = useParams<{ id: string }>();

  // Track recent: log a visit once we have a known segment id.
  React.useEffect(() => {
    if (!id) return;
    const seg = allSegments.find(s => s.id === id);
    if (!seg) return;
    pushRecent('segments', {
      id: seg.id,
      title: seg.displayName,
      updatedAt: new Date().toISOString(),
      href: `/segments/${seg.id}`,
    });
    notifyRecentChanged();
  }, [id]);

  if (!id) return <Outlet />;
  return (
    <>
      <DetailTabs segmentId={id} />
      <Outlet />
    </>
  );
}
