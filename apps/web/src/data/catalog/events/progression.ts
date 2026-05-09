/**
 * Event domain: Progression — 8 events
 * Source: Hermes_Demo_Data.md Part 2 §Progression
 * Substrate A · Kafka / Apollo TEE
 */
import type { HermesEvent } from '@hermes/contracts';

export const progressionEvents: HermesEvent[] = [
  {
    name: 'event_level_up',
    displayName: 'Level Up',
    domain: 'progression',
    keyProperties: [
      { key: 'new_level', type: 'int', description: 'Player level after this event' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-level-up',
    sparklineKey: 'spk-event-level-up',
  },
  {
    name: 'event_quest_complete',
    displayName: 'Quest Complete',
    domain: 'progression',
    keyProperties: [
      { key: 'quest_id', type: 'string', description: 'Quest identifier' },
      { key: 'quest_type', type: 'string', description: 'daily/weekly/story/challenge' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-quest-complete',
    sparklineKey: 'spk-event-quest-complete',
  },
  {
    name: 'event_chapter_complete',
    displayName: 'Chapter Complete',
    domain: 'progression',
    keyProperties: [
      { key: 'chapter_id', type: 'string', description: 'Chapter identifier' },
      { key: 'total_chapters', type: 'int', description: 'Total chapters in current arc' },
    ],
    usedBy: ['cmp-tf-001'],
    dailyVolumeKey: 'vol-event-chapter-complete',
    sparklineKey: 'spk-event-chapter-complete',
  },
  {
    name: 'event_chapter_started',
    displayName: 'Chapter Started',
    domain: 'progression',
    keyProperties: [
      { key: 'chapter_id', type: 'string', description: 'Chapter identifier' },
    ],
    usedBy: ['cmp-tf-001'],
    dailyVolumeKey: 'vol-event-chapter-started',
    sparklineKey: 'spk-event-chapter-started',
  },
  {
    name: 'event_milestone_reached',
    displayName: 'Milestone Reached',
    domain: 'progression',
    keyProperties: [
      { key: 'milestone_id', type: 'string', description: 'Milestone identifier' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-milestone-reached',
    sparklineKey: 'spk-event-milestone-reached',
  },
  {
    name: 'event_rank_promotion',
    displayName: 'Rank Promotion',
    domain: 'progression',
    keyProperties: [
      { key: 'new_tier', type: 'int', description: 'Rank tier after promotion' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-rank-promotion',
    sparklineKey: 'spk-event-rank-promotion',
  },
  {
    name: 'event_rank_demotion',
    displayName: 'Rank Demotion',
    domain: 'progression',
    keyProperties: [
      { key: 'new_tier', type: 'int', description: 'Rank tier after demotion' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-rank-demotion',
    sparklineKey: 'spk-event-rank-demotion',
  },
  {
    name: 'event_mmr_threshold_crossed',
    displayName: 'MMR Threshold Crossed',
    domain: 'progression',
    keyProperties: [
      { key: 'new_threshold', type: 'int', description: 'The MMR threshold value crossed' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-mmr-threshold-crossed',
    sparklineKey: 'spk-event-mmr-threshold-crossed',
  },
];
