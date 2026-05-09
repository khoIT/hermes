/**
 * Event domain: Purchase & Monetization — 6 events
 * Source: Hermes_Demo_Data.md Part 2 §Purchase & monetization
 * Substrate A · Kafka / Apollo TEE
 */
import type { HermesEvent } from '@hermes/contracts';

export const purchaseMonetizationEvents: HermesEvent[] = [
  {
    name: 'event_purchase',
    displayName: 'Purchase',
    domain: 'purchase-monetization',
    keyProperties: [
      { key: 'sku', type: 'string', description: 'Product SKU' },
      { key: 'currency', type: 'string', description: 'Currency code' },
      { key: 'gross_charged_amount', type: 'numeric', description: 'Gross charged amount' },
      { key: 'order_number', type: 'string', description: 'Unique order identifier' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-purchase',
    sparklineKey: 'spk-event-purchase',
  },
  {
    name: 'event_iap_shop_open',
    displayName: 'IAP Shop Open',
    domain: 'purchase-monetization',
    keyProperties: [
      { key: 'shop_section', type: 'string', description: 'Shop section opened' },
    ],
    usedBy: ['cfm-7'],
    dailyVolumeKey: 'vol-event-iap-shop-open',
    sparklineKey: 'spk-event-iap-shop-open',
  },
  {
    name: 'event_clicktobuy_item_iap',
    displayName: 'Click-to-Buy Item (IAP)',
    domain: 'purchase-monetization',
    keyProperties: [
      { key: 'item_id', type: 'string', description: 'Item clicked for purchase' },
      { key: 'price', type: 'numeric', description: 'Displayed price' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-clicktobuy-item-iap',
    sparklineKey: 'spk-event-clicktobuy-item-iap',
  },
  {
    name: 'event_pack_offered',
    displayName: 'Pack Offered',
    domain: 'purchase-monetization',
    keyProperties: [
      { key: 'pack_tier', type: 'int', description: 'Pack tier (1-4)' },
      { key: 'pack_id', type: 'string', description: 'Pack identifier' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-pack-offered',
    sparklineKey: 'spk-event-pack-offered',
  },
  {
    name: 'event_purchase_failed',
    displayName: 'Purchase Failed',
    domain: 'purchase-monetization',
    keyProperties: [
      { key: 'reason', type: 'string', description: 'Failure reason code' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-purchase-failed',
    sparklineKey: 'spk-event-purchase-failed',
  },
  {
    name: 'event_pack_purchased',
    displayName: 'Pack Purchased',
    domain: 'purchase-monetization',
    keyProperties: [
      { key: 'tier', type: 'int', description: 'Pack tier 1/2/3/4' },
      { key: 'sku', type: 'string', description: 'Pack SKU' },
    ],
    usedBy: ['cos-3'],
    dailyVolumeKey: 'vol-event-pack-purchased',
    sparklineKey: 'spk-event-pack-purchased',
  },
];
