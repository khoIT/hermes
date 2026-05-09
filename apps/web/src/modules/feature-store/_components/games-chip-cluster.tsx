/**
 * GamesChipCluster — replaces the v1 owner avatar.
 * Renders 1-N small game chips (e.g. CFM, PT, NTH) in a deterministic order,
 * with overflow handled by a "+N" pill that opens a tooltip-style popover
 * listing the remaining games.
 *
 * Size variants:
 *   - md: detail header (default, 4 inline + overflow)
 *   - sm: library row card / segment picker (3 inline + overflow)
 *   - xs: predicate row pill (1 inline + overflow, single-letter)
 *
 * Phase 6 segment wiring reuses this component verbatim — no duplication.
 */
import React from 'react';
import { T } from '../../../theme';
import type { HermesGame } from '@hermes/contracts';
import { GAME_ORDER, GAME_TINT } from '../../../components/_logic/game-colors';

export type GamesChipSize = 'xs' | 'sm' | 'md';

interface GamesChipClusterProps {
  games: readonly HermesGame[];
  size?: GamesChipSize;
  /** Override max inline chips before overflow rolls up into "+N". */
  maxInline?: number;
}

const SIZE_PRESETS: Record<
  GamesChipSize,
  { padding: string; fontSize: number; defaultMax: number }
> = {
  xs: { padding: '0px 5px', fontSize: 9, defaultMax: 1 },
  sm: { padding: '1px 6px', fontSize: 10, defaultMax: 3 },
  md: { padding: '2px 7px', fontSize: 11, defaultMax: 4 },
};

function sortGames(games: readonly HermesGame[]): HermesGame[] {
  const set = new Set(games);
  return GAME_ORDER.filter((g) => set.has(g));
}

const Chip: React.FC<{
  game: HermesGame;
  size: GamesChipSize;
}> = ({ game, size }) => {
  const tint = GAME_TINT[game];
  const preset = SIZE_PRESETS[size];
  const label = size === 'xs' ? tint.label.slice(0, 2) : tint.label;
  return (
    <span
      title={tint.fullName}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: T.fMono,
        fontWeight: 700,
        fontSize: preset.fontSize,
        padding: preset.padding,
        background: tint.bg,
        color: tint.fg,
        border: `1px solid ${tint.border}`,
        borderRadius: 4,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
};

export const GamesChipCluster: React.FC<GamesChipClusterProps> = ({
  games,
  size = 'md',
  maxInline,
}) => {
  const ordered = sortGames(games);
  const cap = maxInline ?? SIZE_PRESETS[size].defaultMax;
  const visible = ordered.slice(0, cap);
  const overflow = ordered.slice(cap);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
      }}
    >
      {visible.map((g) => (
        <Chip key={g} game={g} size={size} />
      ))}
      {overflow.length > 0 && (
        <span
          title={overflow.map((g) => GAME_TINT[g].fullName).join(' · ')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontFamily: T.fMono,
            fontWeight: 700,
            fontSize: SIZE_PRESETS[size].fontSize,
            padding: SIZE_PRESETS[size].padding,
            background: T.n100,
            color: T.n600,
            border: `1px solid ${T.n200}`,
            borderRadius: 4,
            letterSpacing: '0.04em',
          }}
        >
          +{overflow.length}
        </span>
      )}
    </span>
  );
};
