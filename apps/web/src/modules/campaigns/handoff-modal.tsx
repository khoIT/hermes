/**
 * 15 — Campaign Handoff Modal
 *
 * Two exports:
 *   1. CampaignHandoffModal  — reusable component used inline by canvas pages
 *   2. default               — route page at /campaigns/:id/handoff
 *
 * Uses shared <HandoffModal> with conditional dual-substrate render:
 *   - Real-time only  → substrate="A"  → Substrate A steps only
 *   - Segment-backed  → substrate="B"  → Substrate B steps only  (future use)
 *   - Hybrid TF-1     → substrate="hybrid" → both A + B blocks rendered
 *
 * Shows conditional AgentAttribution when campaign was agent-drafted.
 * Mints CampaignID always; TriggerID for real-time; SegmentID for segment-backed.
 * Per PRD §9.9 verbatim copy from handoff-modal-copy.ts.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HandoffModal } from '../../components/handoff-modal';
import type { HandoffSubstrate } from '../../components/handoff-modal';
import { allCampaigns } from '../../data/catalog/campaigns';

// ---------------------------------------------------------------------------
// Reusable component (used by realtime.tsx, scheduled.tsx, onetime.tsx)
// ---------------------------------------------------------------------------
interface CampaignHandoffModalProps {
  open: boolean;
  campaignId: string;
  triggerId?: string;
  segmentId?: string;
  /** True when both segment + trigger are present (TF-1 hybrid pattern) */
  isHybrid?: boolean;
  isAgentDrafted?: boolean;
  agentRef?: string;
  onOpenMonitoring?: () => void;
  onDone: () => void;
}

export function CampaignHandoffModal({
  open,
  campaignId,
  triggerId,
  segmentId,
  isHybrid = false,
  isAgentDrafted = false,
  agentRef,
  onOpenMonitoring,
  onDone,
}: CampaignHandoffModalProps) {
  // Determine substrate config
  const substrate: HandoffSubstrate = isHybrid
    ? 'hybrid'
    : triggerId && !segmentId
      ? 'A'      // pure real-time
      : 'B';     // segment-backed scheduled/one-time (or no trigger)

  // Shown ID: prefer triggerId for real-time, campaignId as fallback
  const displayId = triggerId ?? campaignId;

  const agentAttribution = isAgentDrafted
    ? { agentLabel: agentRef ?? 'Authoring Agent', approvedBy: 'khoitn@vng.com.vn' }
    : undefined;

  // For hybrid: show both IDs side-by-side in the ID block via custom copy
  // We pass the triggerId (primary Substrate A artifact) as `id`; the modal
  // already renders SegmentID from the Substrate B steps section.

  return (
    <HandoffModal
      open={open}
      idType="campaign"
      id={displayId}
      substrate={substrate}
      agentAttribution={agentAttribution}
      onOpenMonitoring={onOpenMonitoring}
      onDone={onDone}
    />
  );
}

// ---------------------------------------------------------------------------
// Route page — /campaigns/:id/handoff
// ---------------------------------------------------------------------------
export default function CampaignHandoffPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Look up campaign to determine substrate config
  const campaign = allCampaigns.find(c => c.id === id);
  const isHybrid        = campaign?.triggerType === 'hybrid';
  const hasSegment      = Boolean(campaign?.audienceRef);
  const hasTrigger      = Boolean(campaign?.triggerId ?? campaign?.eventTrigger);
  const isAgentDrafted  = campaign?.author === 'agent-drafted';

  const substrate: HandoffSubstrate = isHybrid
    ? 'hybrid'
    : hasTrigger && !hasSegment
      ? 'A'
      : 'B';

  const displayId = campaign?.triggerId ?? id ?? 'trg-unknown';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <HandoffModal
        open={true}
        idType="campaign"
        id={displayId}
        substrate={substrate}
        agentAttribution={isAgentDrafted && campaign?.agentRef
          ? { agentLabel: campaign.agentRef, approvedBy: 'khoitn@vng.com.vn' }
          : undefined
        }
        onOpenMonitoring={() => navigate(`/campaigns/${id ?? ''}`)}
        onDone={() => navigate(`/campaigns/${id ?? ''}`)}
      />
    </div>
  );
}
