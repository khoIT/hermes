/**
 * LatencyBadge — PM-facing latency pill (Phase 2 v2).
 * Renders: [Realtime] / [Batch warm] / [Batch cold] — color-toned per tier.
 * Dual-tier features render two pills side-by-side (Realtime · Batch warm).
 *
 * Architecture identifier (A/B) is intentionally NOT shown on this badge.
 * That signal lives on engineer surfaces (handoff modals, definition pane,
 * lineage detail rows) — see latency-labels.ts.
 *
 * Substrate dot is preserved as a subtle ambient cue: orange = TEE realtime,
 * neutral = batch.
 */
import React from 'react';
import { T } from '../theme';
import type { HermesLatencyTier, HermesSubstrate } from '@hermes/contracts';
import { TIER_COLORS, TIER_LABEL, TIER_TONE } from './_logic/latency-labels';

export interface LatencyTierItem {
  tier: HermesLatencyTier;
  substrate: HermesSubstrate;
}

interface SingleBadgeProps {
  tier: HermesLatencyTier;
  /** Substrate is now decorative — drives the dot color, not the label. */
  substrate?: HermesSubstrate;
  style?: React.CSSProperties;
}

const SUBSTRATE_DOT: Record<HermesSubstrate, string> = {
  A: '#f05a22', // realtime substrate signature
  B: T.n500, // batch substrate
};

const SingleBadge = React.memo<SingleBadgeProps>(({ tier, substrate, style }) => {
  const tone = TIER_TONE[tier];
  const colors = TIER_COLORS[tone];
  const dot = substrate ? SUBSTRATE_DOT[substrate] : undefined;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: T.fSans,
        fontSize: 11,
        fontWeight: 600,
        color: colors.fg,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 999,
        padding: '2px 9px',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dot,
            flexShrink: 0,
          }}
          aria-hidden
        />
      )}
      {TIER_LABEL[tier]}
    </span>
  );
});
SingleBadge.displayName = 'SingleBadge';

interface LatencyBadgeSingle {
  tier: HermesLatencyTier;
  substrate?: HermesSubstrate;
  tiers?: never;
  style?: React.CSSProperties;
}

interface LatencyBadgeDual {
  tiers: [LatencyTierItem, LatencyTierItem];
  tier?: never;
  substrate?: never;
  style?: React.CSSProperties;
}

export type LatencyBadgeProps = LatencyBadgeSingle | LatencyBadgeDual;

export const LatencyBadge = React.memo<LatencyBadgeProps>((props) => {
  if (props.tiers) {
    return (
      <span style={{ display: 'inline-flex', gap: 4 }}>
        {props.tiers.map((t, i) => (
          <SingleBadge key={i} tier={t.tier} substrate={t.substrate} />
        ))}
      </span>
    );
  }
  return <SingleBadge tier={props.tier} substrate={props.substrate} style={props.style} />;
});
LatencyBadge.displayName = 'LatencyBadge';
