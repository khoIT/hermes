/**
 * SegmentDetailLayout — wraps every /segments/:id/* route with the
 * sub-tab strip. Renders <Outlet /> for the active child route.
 */
import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { DetailTabs } from './detail-tabs';

export function SegmentDetailLayout() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Outlet />;
  return (
    <>
      <DetailTabs segmentId={id} />
      <Outlet />
    </>
  );
}
