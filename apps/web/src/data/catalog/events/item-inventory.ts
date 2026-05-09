/**
 * Event domain: Item & Inventory — 6 events
 * Source: Hermes_Demo_Data.md Part 2 §Item & inventory
 * Substrate A · Kafka / Apollo TEE
 */
import type { HermesEvent } from '@hermes/contracts';

export const itemInventoryEvents: HermesEvent[] = [
  {
    name: 'event_item_received',
    displayName: 'Item Received',
    domain: 'item-inventory',
    keyProperties: [
      { key: 'item_id', type: 'string', description: 'Item identifier received' },
      { key: 'source', type: 'string', description: 'Source of item (purchase/reward/drop)' },
    ],
    usedBy: ['pt-4'],
    dailyVolumeKey: 'vol-event-item-received',
    sparklineKey: 'spk-event-item-received',
  },
  {
    name: 'event_item_used',
    displayName: 'Item Used',
    domain: 'item-inventory',
    keyProperties: [
      { key: 'item_id', type: 'string', description: 'Item identifier used' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-item-used',
    sparklineKey: 'spk-event-item-used',
  },
  {
    name: 'event_currency_balance_change',
    displayName: 'Currency Balance Change',
    domain: 'item-inventory',
    keyProperties: [
      { key: 'currency', type: 'string', description: 'Currency type (cf_coin/gem/etc)' },
      { key: 'delta', type: 'int', description: 'Balance change amount (positive or negative)' },
      { key: 'balance_after', type: 'int', description: 'Balance after the change' },
    ],
    usedBy: ['cmp-cfm-408', 'cfm-9'],
    dailyVolumeKey: 'vol-event-currency-balance-change',
    sparklineKey: 'spk-event-currency-balance-change',
  },
  {
    name: 'event_weapon_trial_started',
    displayName: 'Weapon Trial Started',
    domain: 'item-inventory',
    keyProperties: [
      { key: 'weapon_id', type: 'string', description: 'Weapon being trialed' },
      { key: 'expires_at', type: 'timestamp', description: 'Trial expiry timestamp' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-weapon-trial-started',
    sparklineKey: 'spk-event-weapon-trial-started',
  },
  {
    name: 'event_weapon_trial_expired',
    displayName: 'Weapon Trial Expired',
    domain: 'item-inventory',
    keyProperties: [
      { key: 'weapon_id', type: 'string', description: 'Weapon whose trial expired' },
    ],
    usedBy: ['cfm-16'],
    dailyVolumeKey: 'vol-event-weapon-trial-expired',
    sparklineKey: 'spk-event-weapon-trial-expired',
  },
  {
    name: 'event_weapon_unlocked',
    displayName: 'Weapon Unlocked',
    domain: 'item-inventory',
    keyProperties: [
      { key: 'weapon_id', type: 'string', description: 'Weapon unlocked' },
      { key: 'source', type: 'string', description: 'How the weapon was unlocked' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-weapon-unlocked',
    sparklineKey: 'spk-event-weapon-unlocked',
  },
];
