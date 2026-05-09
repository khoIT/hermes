/**
 * Per-game tint tokens for chip cluster + library group headers + predicate
 * row pills. Phase 3 v2 (referenced by Phase 6 segment wiring).
 *
 * Each entry: bg (light tint for chip background), fg (high-contrast label
 * text), and label (2-3 letter uppercase code).
 *
 * The PLATFORM_TINT lives separately — deep-red brand fill for cross-game
 * propensity features; never mixes with the per-game palette.
 */
import type { HermesGame } from '@hermes/contracts';

export interface GameTint {
  bg: string;
  fg: string;
  border: string;
  label: string;
  fullName: string;
}

export const GAME_TINT: Record<HermesGame, GameTint> = {
  cfm: {
    bg: '#fee2e2',
    fg: '#991b1b',
    border: '#fecaca',
    label: 'CFM',
    fullName: 'CrossFire Mobile',
  },
  pt: {
    bg: '#dbeafe',
    fg: '#1e40af',
    border: '#bfdbfe',
    label: 'PT',
    fullName: 'PlayTogether',
  },
  nth: {
    bg: '#dcfce7',
    fg: '#166534',
    border: '#bbf7d0',
    label: 'NTH',
    fullName: 'Ngọa Thiên Hạ',
  },
  tf: {
    bg: '#fef3c7',
    fg: '#92400e',
    border: '#fde68a',
    label: 'TF',
    fullName: 'Thiết Hỏa',
  },
  cos: {
    bg: '#fce7f3',
    fg: '#9d174d',
    border: '#fbcfe8',
    label: 'COS',
    fullName: 'Cộng Đồng',
  },
  ptg: {
    bg: '#e0e7ff',
    fg: '#3730a3',
    border: '#c7d2fe',
    label: 'PG',
    fullName: 'PlayTogether-G',
  },
};

export const PLATFORM_TINT = {
  bg: '#f05a22',
  fg: '#fff',
  border: '#d94c1a',
  label: 'P',
  fullName: 'Platform · Cross-game',
};

/** Stable display order for game chips (CFM first — canonical demo game). */
export const GAME_ORDER: readonly HermesGame[] = ['cfm', 'pt', 'nth', 'tf', 'cos', 'ptg'];
