/**
 * Event domain: Campaign / UI Interaction — 8 events
 * Source: Hermes_Demo_Data.md Part 2 §Campaign / UI interaction
 * Substrate A · Kafka / Apollo TEE
 */
import type { HermesEvent } from '@hermes/contracts';

export const campaignUiEvents: HermesEvent[] = [
  {
    name: 'event_iam_shown',
    displayName: 'IAM Shown',
    domain: 'campaign-ui',
    keyProperties: [
      { key: 'campaign_id', type: 'string', description: 'Campaign that triggered the IAM' },
      { key: 'variant', type: 'string', description: 'A/B/holdout variant shown' },
    ],
    usedBy: ['all-iam-campaigns'],
    dailyVolumeKey: 'vol-event-iam-shown',
    sparklineKey: 'spk-event-iam-shown',
  },
  {
    name: 'event_iam_clicked',
    displayName: 'IAM Clicked',
    domain: 'campaign-ui',
    keyProperties: [
      { key: 'campaign_id', type: 'string', description: 'Campaign identifier' },
      { key: 'cta', type: 'string', description: 'CTA button label clicked' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-iam-clicked',
    sparklineKey: 'spk-event-iam-clicked',
  },
  {
    name: 'event_iam_dismissed',
    displayName: 'IAM Dismissed',
    domain: 'campaign-ui',
    keyProperties: [
      { key: 'campaign_id', type: 'string', description: 'Campaign identifier' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-iam-dismissed',
    sparklineKey: 'spk-event-iam-dismissed',
  },
  {
    name: 'event_shop_open',
    displayName: 'Shop Open',
    domain: 'campaign-ui',
    keyProperties: [
      { key: 'shop_section', type: 'string', description: 'Shop section opened' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-shop-open',
    sparklineKey: 'spk-event-shop-open',
  },
  {
    name: 'event_shop_click',
    displayName: 'Shop Click',
    domain: 'campaign-ui',
    keyProperties: [
      { key: 'shop_section', type: 'string', description: 'Shop section' },
      { key: 'item_id', type: 'string', description: 'Item clicked' },
    ],
    usedBy: ['pt-9'],
    dailyVolumeKey: 'vol-event-shop-click',
    sparklineKey: 'spk-event-shop-click',
  },
  {
    name: 'event_survey_response',
    displayName: 'Survey Response',
    domain: 'campaign-ui',
    keyProperties: [
      { key: 'survey_id', type: 'string', description: 'Survey identifier' },
      { key: 'response', type: 'string', description: 'Response value submitted' },
    ],
    usedBy: ['pt-9'],
    dailyVolumeKey: 'vol-event-survey-response',
    sparklineKey: 'spk-event-survey-response',
  },
  {
    name: 'event_h5_event_open',
    displayName: 'H5 Event Open',
    domain: 'campaign-ui',
    keyProperties: [
      { key: 'event_id', type: 'string', description: 'H5 event identifier' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-h5-event-open',
    sparklineKey: 'spk-event-h5-event-open',
  },
  {
    name: 'event_minigame_played',
    displayName: 'Minigame Played',
    domain: 'campaign-ui',
    keyProperties: [
      { key: 'minigame_id', type: 'string', description: 'Minigame identifier' },
      { key: 'score', type: 'int', description: 'Final score achieved' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-minigame-played',
    sparklineKey: 'spk-event-minigame-played',
  },
];
