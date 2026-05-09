/**
 * Authoring Agent drafts — 3 draft artifacts per PRD_Hermes_Agentic.md §7.2.
 * Each draft references the opportunity that triggered it and the catalog artifact
 * (segment or campaign) that was produced.
 */
import type { AgentDraft } from '@hermes/contracts';

export const allDrafts: AgentDraft[] = [
  {
    id: 'ad-0001',
    fromOpportunity: 'ag-op-1042',
    type: 'campaign',
    draftRef: 'cmp-cfm-pass-stuck-variant-b',
    displayName: 'Pass Stuck Rescue · Variant B',
    status: 'pending-review',
    draftedAt: '2026-05-08T06:20:00+07:00',
    estimatedImpact: '~23,890 UIDs · forecast +7% D1 retention',
  },
  {
    id: 'ad-0002',
    fromOpportunity: 'ag-op-1043',
    type: 'campaign',
    draftRef: 'cmp-nth-whale-comeback',
    displayName: 'NTH Whale Comeback Campaign',
    status: 'pending-review',
    draftedAt: '2026-05-07T09:45:00+07:00',
    estimatedImpact: '~3,870 UIDs · forecast +24% 7d recovery',
  },
  {
    id: 'ad-0003',
    fromOpportunity: 'ag-op-1044',
    type: 'campaign',
    draftRef: 'cmp-tf-001',
    displayName: 'TF-1 Football Hub Real-time Campaign',
    status: 'edits-applied',
    draftedAt: '2026-05-08T07:10:00+07:00',
    editedBy: 'khoi.tn',
    estimatedImpact: '~38k seed UIDs + ~600 fires/day · forecast 18–22% activation',
  },
];
