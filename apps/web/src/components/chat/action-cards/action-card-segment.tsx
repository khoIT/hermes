/**
 * ActionCardSegment — POSTs to /api/v1/segments on Confirm, then swaps to
 * confirmed view with View link to /segments/:id.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionCardShell, type ActionCardStatus } from './action-card-shell';
import { createSegment } from '../../../api/segments-client';
import { pushRecent } from '../../../utils/recent-items-store';
import { notifyRecentChanged } from '../../sidebar/recent-items';
import { toast } from '../../ui/toast';
import type { ActionCardSegmentPayload } from '../../../data/chat/response-types';

interface Props {
  payload: ActionCardSegmentPayload;
}

export function ActionCardSegment({ payload }: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<ActionCardStatus>(
    payload.createdId ? 'confirmed' : 'preview',
  );
  const [error, setError] = React.useState<string | undefined>();
  const [createdId, setCreatedId] = React.useState<string | undefined>(payload.createdId);

  const onConfirm = async () => {
    setStatus('pending');
    setError(undefined);
    try {
      const result = await createSegment({
        name: payload.name,
        description: payload.description,
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
      onConfirm={onConfirm}
      onRefine={() => navigate('/segments/new?from=chat')}
      onView={() => createdId && navigate(`/segments/${createdId}`)}
    />
  );
}
