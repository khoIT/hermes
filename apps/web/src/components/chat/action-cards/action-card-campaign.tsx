/**
 * ActionCardCampaign — POSTs to /api/v1/campaigns on Confirm, then swaps to
 * confirmed view with View link to /campaigns/:id.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionCardShell, type ActionCardStatus } from './action-card-shell';
import { createCampaign } from '../../../api/campaigns-client';
import { toast } from '../../ui/toast';
import { useActiveThreadId } from '../../../utils/active-thread-context';
import type { ActionCardCampaignPayload } from '../../../data/chat/response-types';

interface Props {
  payload: ActionCardCampaignPayload;
}

export function ActionCardCampaign({ payload }: Props) {
  const navigate = useNavigate();
  const activeThreadId = useActiveThreadId();
  const [status, setStatus] = React.useState<ActionCardStatus>(
    payload.createdId ? 'confirmed' : 'preview',
  );
  const [error, setError] = React.useState<string | undefined>();
  const [createdId, setCreatedId] = React.useState<string | undefined>(payload.createdId);
  // Derived: for demo thread, the view link always points to the seeded anchor.
  const viewId =
    activeThreadId === 'thread-demo-livops-2026' && createdId ? 'cmp-cfm-407' : createdId;

  const onConfirm = async () => {
    setStatus('pending');
    setError(undefined);
    try {
      const result = await createCampaign({
        name: payload.name,
        description: payload.description,
        type: payload.type,
        segmentId: payload.segmentId,
        sourceThreadId: activeThreadId ?? undefined,
      });
      setCreatedId(result.id);
      setStatus('confirmed');
      toast(
        result.live
          ? `Campaign "${payload.name}" created`
          : `Campaign "${payload.name}" created (stub)`,
        { tone: 'success' },
      );
      // Demo path: the demo thread's campaign proposal always targets the seeded
      // anchor campaign (cmp-cfm-407) which has sourceThreadId pre-set in the
      // static catalog. This ensures the monitoring page shows the source-thread
      // banner and SourceThreadPill without a live-campaign store lookup.
      // Non-demo campaigns (no activeThreadId match) use the real result.id.
      const destinationId =
        activeThreadId === 'thread-demo-livops-2026' ? 'cmp-cfm-407' : result.id;
      navigate(`/campaigns/${destinationId}`);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const refineRoute =
    payload.type === 'realtime' ? '/campaigns/new/realtime'
    : payload.type === 'scheduled' ? '/campaigns/new/scheduled'
    : '/campaigns/new/onetime';

  return (
    <ActionCardShell
      kind={`${payload.type} campaign`}
      status={status}
      name={payload.name}
      subline={payload.description}
      error={error}
      viewHref={viewId ? `/campaigns/${viewId}` : undefined}
      onConfirm={onConfirm}
      onRefine={() => navigate(`${refineRoute}?from=chat`)}
      onView={() => viewId && navigate(`/campaigns/${viewId}`)}
    />
  );
}
