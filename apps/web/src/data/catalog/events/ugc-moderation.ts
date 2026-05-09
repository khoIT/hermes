/**
 * Event domain: UGC & Moderation — 4 events
 * Source: Hermes_Demo_Data.md Part 2 §UGC & moderation
 * Substrate A · Kafka / Apollo TEE
 */
import type { HermesEvent } from '@hermes/contracts';

export const ugcModerationEvents: HermesEvent[] = [
  {
    name: 'event_ugc_submission',
    displayName: 'UGC Submission',
    domain: 'ugc-moderation',
    keyProperties: [
      { key: 'content_id', type: 'string', description: 'UGC content identifier' },
      { key: 'content_type', type: 'string', description: 'Type of UGC (screenshot/video/design)' },
    ],
    usedBy: ['nth-1', 'nth-4', 'nth-7'],
    dailyVolumeKey: 'vol-event-ugc-submission',
    sparklineKey: 'spk-event-ugc-submission',
  },
  {
    name: 'event_ugc_vote',
    displayName: 'UGC Vote',
    domain: 'ugc-moderation',
    keyProperties: [
      { key: 'content_id', type: 'string', description: 'UGC content voted on' },
      { key: 'vote', type: 'string', description: 'up or down' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-ugc-vote',
    sparklineKey: 'spk-event-ugc-vote',
  },
  {
    name: 'event_ugc_view',
    displayName: 'UGC View',
    domain: 'ugc-moderation',
    keyProperties: [
      { key: 'content_id', type: 'string', description: 'UGC content viewed' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-ugc-view',
    sparklineKey: 'spk-event-ugc-view',
  },
  {
    name: 'event_suspicious_activity_flagged',
    displayName: 'Suspicious Activity Flagged',
    domain: 'ugc-moderation',
    keyProperties: [
      { key: 'flag_type', type: 'string', description: 'Category of suspicious activity' },
      { key: 'severity', type: 'string', description: 'low/medium/high' },
    ],
    usedBy: ['nth-6'],
    dailyVolumeKey: 'vol-event-suspicious-activity-flagged',
    sparklineKey: 'spk-event-suspicious-activity-flagged',
  },
];
