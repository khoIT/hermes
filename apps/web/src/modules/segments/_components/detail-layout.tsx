/**
 * SegmentDetailLayout — wraps every /segments/:id/* route with the
 * sub-tab strip. Renders <Outlet /> for the active child route.
 */
import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { DetailTabs } from './detail-tabs';
import { allSegments } from '../../../data/catalog/segments';
import { SourceThreadPill } from '../../../components/chat-rail/source-thread-pill';
import { ContinueInChatPill } from '../../../components/chat-rail/continue-in-chat-pill';
import { pushRecent } from '../../../utils/recent-items-store';
import { notifyRecentChanged } from '../../../components/sidebar/recent-items';

export function SegmentDetailLayout() {
  const { id } = useParams<{ id: string }>();

  // Track recent: log a visit for any segment id, even those not in the
  // static catalog (e.g. live-created via /api or stubbed by segments-client
  // when the user lands here from a chat action card).
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
  const sourceThreadId = seg?.sourceThreadId;

  return (
    <>
      <DetailTabs segmentId={id} />
      {sourceThreadId && (
        <div style={{ padding: '6px 24px 0' }}>
          <SourceThreadPill
            threadId={sourceThreadId}
            variant="header"
            prefix="💬 Last asked"
          />
        </div>
      )}
      <Outlet />
      <ContinueInChatPill threadId={sourceThreadId} />
    </>
  );
}
