/**
 * Event domain: Match & Gameplay — 6 events
 * Source: Hermes_Demo_Data.md Part 2 §Match & gameplay
 * Substrate A · Kafka / Apollo TEE
 */
import type { HermesEvent } from '@hermes/contracts';

export const matchGameplayEvents: HermesEvent[] = [
  {
    name: 'event_match_start',
    displayName: 'Match Start',
    domain: 'match-gameplay',
    keyProperties: [
      { key: 'mode', type: 'string', description: 'Match mode (ranked/casual)' },
      { key: 'map', type: 'string', description: 'Map identifier' },
      { key: 'mmr_at_start', type: 'int', description: 'Player MMR at match entry' },
    ],
    usedBy: ['cfm-ranked-tracking'],
    dailyVolumeKey: 'vol-event-match-start',
    sparklineKey: 'spk-event-match-start',
  },
  {
    name: 'event_match_end',
    displayName: 'Match End',
    domain: 'match-gameplay',
    keyProperties: [
      { key: 'outcome', type: 'string', description: 'win or lose' },
      { key: 'mode', type: 'string', description: 'Match mode' },
      { key: 'mmr_change', type: 'int', description: 'MMR delta from this match' },
      { key: 'kills', type: 'int', description: 'Kill count' },
      { key: 'deaths', type: 'int', description: 'Death count' },
      { key: 'weapon_used', type: 'string', description: 'Primary weapon used' },
      { key: 'killed_by_weapon', type: 'string', description: 'Weapon that dealt final blow' },
      { key: 'duration', type: 'int', description: 'Match duration in seconds' },
    ],
    usedBy: ['cmp-cfm-407', 'cfm-12', 'cfm-17'],
    dailyVolumeKey: 'vol-event-match-end',
    sparklineKey: 'spk-event-match-end',
  },
  {
    name: 'event_round_end',
    displayName: 'Round End',
    domain: 'match-gameplay',
    keyProperties: [
      { key: 'round_number', type: 'int', description: 'Round number within match' },
      { key: 'won', type: 'bool', description: 'Did this player win the round' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-round-end',
    sparklineKey: 'spk-event-round-end',
  },
  {
    name: 'event_kill',
    displayName: 'Kill',
    domain: 'match-gameplay',
    keyProperties: [
      { key: 'weapon', type: 'string', description: 'Weapon used for the kill' },
      { key: 'victim_uid', type: 'string', description: 'Victim player UID (synthetic)' },
      { key: 'killer_uid', type: 'string', description: 'Killer player UID (synthetic)' },
    ],
    usedBy: ['cfm-17'],
    dailyVolumeKey: 'vol-event-kill',
    sparklineKey: 'spk-event-kill',
  },
  {
    name: 'event_death',
    displayName: 'Death',
    domain: 'match-gameplay',
    keyProperties: [
      { key: 'weapon', type: 'string', description: 'Weapon that caused death' },
      { key: 'killer_uid', type: 'string', description: 'Killer player UID (synthetic)' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-death',
    sparklineKey: 'spk-event-death',
  },
  {
    name: 'event_weapon_pickup',
    displayName: 'Weapon Pickup',
    domain: 'match-gameplay',
    keyProperties: [
      { key: 'weapon_id', type: 'string', description: 'Weapon identifier picked up' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-weapon-pickup',
    sparklineKey: 'spk-event-weapon-pickup',
  },
];
