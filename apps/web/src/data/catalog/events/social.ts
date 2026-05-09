/**
 * Event domain: Social — 6 events
 * Source: Hermes_Demo_Data.md Part 2 §Social
 * Substrate A · Kafka / Apollo TEE
 */
import type { HermesEvent } from '@hermes/contracts';

export const socialEvents: HermesEvent[] = [
  {
    name: 'event_friend_invite_sent',
    displayName: 'Friend Invite Sent',
    domain: 'social',
    keyProperties: [
      { key: 'recipient_uid', type: 'string', description: 'Recipient player UID (synthetic)' },
    ],
    usedBy: ['cfm-4'],
    dailyVolumeKey: 'vol-event-friend-invite-sent',
    sparklineKey: 'spk-event-friend-invite-sent',
  },
  {
    name: 'event_friend_invite_accepted',
    displayName: 'Friend Invite Accepted',
    domain: 'social',
    keyProperties: [
      { key: 'inviter_uid', type: 'string', description: 'Inviter player UID (synthetic)' },
    ],
    usedBy: ['cfm-4'],
    dailyVolumeKey: 'vol-event-friend-invite-accepted',
    sparklineKey: 'spk-event-friend-invite-accepted',
  },
  {
    name: 'event_guild_join',
    displayName: 'Guild Join',
    domain: 'social',
    keyProperties: [
      { key: 'guild_id', type: 'string', description: 'Guild identifier joined' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-guild-join',
    sparklineKey: 'spk-event-guild-join',
  },
  {
    name: 'event_guild_leave',
    displayName: 'Guild Leave',
    domain: 'social',
    keyProperties: [
      { key: 'guild_id', type: 'string', description: 'Guild identifier left' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-guild-leave',
    sparklineKey: 'spk-event-guild-leave',
  },
  {
    name: 'event_chat_message_sent',
    displayName: 'Chat Message Sent',
    domain: 'social',
    keyProperties: [
      { key: 'channel', type: 'string', description: 'Chat channel (guild/world/team)' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-chat-message-sent',
    sparklineKey: 'spk-event-chat-message-sent',
  },
  {
    name: 'event_pair_formed',
    displayName: 'Pair Formed',
    domain: 'social',
    keyProperties: [
      { key: 'partner_uid', type: 'string', description: 'Partner player UID (synthetic)' },
    ],
    usedBy: ['nth-5'],
    dailyVolumeKey: 'vol-event-pair-formed',
    sparklineKey: 'spk-event-pair-formed',
  },
];
