/**
 * Agent activity log — chronological record of agent actions.
 * Includes 3 rejected/dismissed opportunities per PRD_Hermes_Agentic.md §7.4
 * plus meta-records of approvals from the demo flow.
 * Powers the Activity tab in Module 05 (21_ag_activity).
 */
import type { AgentActivity } from '@hermes/contracts';

export const allActivity: AgentActivity[] = [
  // ── Rejected / dismissed opportunities (§7.4) ────────────────────────────

  {
    id: 'aa-0001',
    agent: 'insight',
    action: 'proposed',
    outcome: 'rejected',
    reasonCode: 'already-covered',
    artifactRef: 'ag-op-lapsed-pt',
    artifactLabel: 'Lapsed players in PT — propose 30-day recall push',
    timestamp: '2026-05-03T09:12:00+07:00',
  },
  {
    id: 'aa-0002',
    agent: 'insight',
    action: 'proposed',
    outcome: 'dismissed',
    artifactRef: 'ag-op-cos-casual-meta',
    artifactLabel: 'COS Casual Player segment — propose ad export to Meta',
    timestamp: '2026-05-04T14:38:00+07:00',
  },
  {
    id: 'aa-0003',
    agent: 'insight',
    action: 'proposed',
    outcome: 'rejected',
    reasonCode: 'tried-before-didnt-work',
    artifactRef: 'ag-op-cfm-gem-threshold',
    artifactLabel: 'CFM gem-balance threshold drop',
    timestamp: '2026-05-05T11:55:00+07:00',
  },

  // ── Approvals from the live demo flow ────────────────────────────────────

  {
    id: 'aa-0004',
    agent: 'insight',
    action: 'proposed',
    outcome: 'approved',
    artifactRef: 'ag-op-1044',
    artifactLabel: 'TF-1 Football Hub returning coaches',
    timestamp: '2026-05-08T07:02:18+07:00',
  },
  {
    id: 'aa-0005',
    agent: 'authoring',
    action: 'drafted',
    outcome: 'approved-with-edits',
    artifactRef: 'ad-0003',
    artifactLabel: 'TF-1 Football Hub Real-time Campaign (draft)',
    timestamp: '2026-05-08T07:10:00+07:00',
  },
  {
    id: 'aa-0006',
    agent: 'experiment',
    action: 'recommended',
    outcome: 'approved',
    artifactRef: 'ar-0001',
    artifactLabel: 'cmp-cfm-407 · Scale to 100%',
    timestamp: '2026-05-08T08:05:00+07:00',
  },
];
