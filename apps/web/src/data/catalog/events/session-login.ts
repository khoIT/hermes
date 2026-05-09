/**
 * Event domain: Session & Login — 7 events
 * Source: Hermes_Demo_Data.md Part 2 §Session & login
 * Substrate A · Kafka / Apollo TEE
 */
import type { HermesEvent } from '@hermes/contracts';

export const sessionLoginEvents: HermesEvent[] = [
  {
    name: 'event_login',
    displayName: 'Login',
    domain: 'session-login',
    keyProperties: [
      { key: 'is_first_login_in_window', type: 'bool', description: 'First login in current campaign window' },
      { key: 'last_login_gap_days', type: 'int', description: 'Days since previous login' },
    ],
    usedBy: ['cmp-tf-001', 'pt-1'],
    dailyVolumeKey: 'vol-event-login',
    sparklineKey: 'spk-event-login',
  },
  {
    name: 'event_logout',
    displayName: 'Logout',
    domain: 'session-login',
    keyProperties: [
      { key: 'session_duration', type: 'int', description: 'Session duration in seconds' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-logout',
    sparklineKey: 'spk-event-logout',
  },
  {
    name: 'event_session_start',
    displayName: 'Session Start',
    domain: 'session-login',
    keyProperties: [
      { key: 'platform', type: 'string', description: 'ios / android / pc' },
      { key: 'region', type: 'string', description: 'Player region code' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-session-start',
    sparklineKey: 'spk-event-session-start',
  },
  {
    name: 'event_session_end',
    displayName: 'Session End',
    domain: 'session-login',
    keyProperties: [
      { key: 'duration_minutes', type: 'numeric', description: 'Session length in minutes' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-session-end',
    sparklineKey: 'spk-event-session-end',
  },
  {
    name: 'event_lobby_enter',
    displayName: 'Lobby Enter',
    domain: 'session-login',
    keyProperties: [
      { key: 'mode', type: 'string', description: 'Lobby mode (ranked/casual/custom)' },
    ],
    usedBy: ['cfm-15'],
    dailyVolumeKey: 'vol-event-lobby-enter',
    sparklineKey: 'spk-event-lobby-enter',
  },
  {
    name: 'event_lobby_exit',
    displayName: 'Lobby Exit',
    domain: 'session-login',
    keyProperties: [
      { key: 'duration_minutes', type: 'numeric', description: 'Time spent in lobby' },
    ],
    usedBy: [],
    dailyVolumeKey: 'vol-event-lobby-exit',
    sparklineKey: 'spk-event-lobby-exit',
  },
  {
    name: 'event_lobby_idle_60min',
    displayName: 'Lobby Idle 60min (Timer)',
    domain: 'session-login',
    keyProperties: [],
    usedBy: ['cfm-15'],
    dailyVolumeKey: 'vol-event-lobby-idle-60min',
    sparklineKey: 'spk-event-lobby-idle-60min',
  },
];
