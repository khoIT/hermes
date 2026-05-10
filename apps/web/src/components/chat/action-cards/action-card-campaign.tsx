/**
 * ActionCardCampaign — POSTs to /api/v1/campaigns on Confirm, then swaps to
 * confirmed view with View link to /campaigns/:id.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionCardShell, type ActionCardStatus } from './action-card-shell';
import { createCampaign } from '../../../api/campaigns-client';
import { toast } from '../../ui/toast';
import type { ActionCardCampaignPayload } from '../../../data/chat/response-types';

interface Props {
  payload: ActionCardCampaignPayload;
}

export function ActionCardCampaign({ payload }: Props) {
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
      const result = await createCampaign({
        name: payload.name,
        description: payload.description,
        type: payload.type,
        segmentId: payload.segmentId,
      });
      setCreatedId(result.id);
      setStatus('confirmed');
      toast(
        result.live
          ? `Campaign "${payload.name}" created`
          : `Campaign "${payload.name}" created (stub)`,
        { tone: 'success' },
      );
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
      viewHref={createdId ? `/campaigns/${createdId}` : undefined}
      onConfirm={onConfirm}
      onRefine={() => navigate(`${refineRoute}?from=chat`)}
      onView={() => createdId && navigate(`/campaigns/${createdId}`)}
    />
  );
}
