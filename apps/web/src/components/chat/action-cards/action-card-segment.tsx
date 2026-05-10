/**
 * ActionCardSegment — POSTs to /api/v1/segments on Confirm, then swaps to
 * confirmed view with View link to /segments/:id.
 *
 * Canonical chat-side segment creation flow:
 *   1. createSegment({ name, description, sourceThreadId }) → POST /api/v1/segments
 *   2. navigate(`/segments/${result.id}`) → lands on Overview tab
 *   3. user clicks Predicate tab → reads predicate
 *   4. (optional) clicks Edit → updateSegment(id, patch) on Save (override-map refresh)
 *   5. SourceThreadPill on detail header returns to source thread
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionCardShell, type ActionCardStatus } from './action-card-shell';
import { SegmentFeaturePills } from './segment-feature-pills';
import { createSegment } from '../../../api/segments-client';
import { pushRecent } from '../../../utils/recent-items-store';
import { notifyRecentChanged } from '../../sidebar/recent-items';
import { toast } from '../../ui/toast';
import { useActiveThreadId } from '../../../utils/active-thread-context';
import type { ActionCardSegmentPayload } from '../../../data/chat/response-types';

interface Props {
  payload: ActionCardSegmentPayload;
}

export function ActionCardSegment({ payload }: Props) {
  const navigate = useNavigate();
  const activeThreadId = useActiveThreadId();
  const [status, setStatus] = React.useState<ActionCardStatus>(
    payload.createdId ? 'confirmed' : 'preview',
  );
  const [error, setError] = React.useState<string | undefined>();
  const [createdId, setCreatedId] = React.useState<string | undefined>(payload.createdId);

  const onConfirm = async () => {
    setStatus('pending');
    setError(undefined);

    // Pre-bound demo path: reuse a seeded segment with full audience metrics
    // instead of creating a fresh empty one via the API.
    if (payload.targetSegmentId) {
      setCreatedId(payload.targetSegmentId);
      setStatus('confirmed');
      pushRecent('segments', {
        id: payload.targetSegmentId,
        title: payload.name,
        updatedAt: new Date().toISOString(),
        href: `/segments/${payload.targetSegmentId}`,
      });
      notifyRecentChanged();
      toast(`Segment "${payload.name}" confirmed`, { tone: 'success' });
      return;
    }

    try {
      const result = await createSegment({
        name: payload.name,
        description: payload.description,
        sourceThreadId: activeThreadId ?? undefined,
      });
      setCreatedId(result.id);
      setStatus('confirmed');
      pushRecent('segments', {
        id: result.id,
        title: result.name,
        updatedAt: new Date().toISOString(),
        href: `/segments/${result.id}`,
      });
      notifyRecentChanged();
      toast(
        result.live
          ? `Segment "${payload.name}" created`
          : `Segment "${payload.name}" created (stub)`,
        { tone: 'success' },
      );
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <ActionCardShell
      kind="segment"
      status={status}
      name={payload.name}
      subline={payload.description}
      error={error}
      viewHref={createdId ? `/segments/${createdId}` : undefined}
      inlineExtras={payload.features?.length ? <SegmentFeaturePills features={payload.features} /> : undefined}
      onConfirm={onConfirm}
      onRefine={() => navigate('/segments/new?from=chat')}
      onView={() => createdId && navigate(`/segments/${createdId}`)}
    />
  );
}
