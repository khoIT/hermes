/**
 * LatencyBadge — mono pill showing feature latency tier + substrate.
 * Single: [<1s · A]  or  [<1h · B]  or  [<1d · B]
 * Dual-tier: shows both badges inline for features with two materializations.
 *
 * Per PRD §6.2 — bracket chars are literal, mono font, no color fill.
 */
import React from 'react';
import { T } from '../theme';
import type { HermesLatencyTier, HermesSubstrate } from '@hermes/contracts';

export interface LatencyTierItem {
  tier: HermesLatencyTier;
  substrate: HermesSubstrate;
}

interface SingleBadgeProps {
  tier: HermesLatencyTier;
  substrate: HermesSubstrate;
  style?: React.CSSProperties;
}

const TIER_COLOR: Record<HermesLatencyTier, string> = {
  '<1s': T.green600,
  '<1h': T.amber500,
  '<1d': T.n500,
};

const SingleBadge = React.memo<SingleBadgeProps>(({ tier, substrate, style }) => (
  <span style={{
    fontFamily: T.fMono,
    fontSize: 11,
    fontWeight: 500,
    color: TIER_COLOR[tier],
    background: 'transparent',
    border: `1px solid currentColor`,
    borderRadius: 4,
    padding: '1px 5px',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    lineHeight: 1.5,
    ...style,
  }}>
    {`[${tier} · ${substrate}]`}
  </span>
));
SingleBadge.displayName = 'SingleBadge';

// ── Public API ──────────────────────────────────────────────────────────────

interface LatencyBadgeSingle {
  tier: HermesLatencyTier;
  substrate: HermesSubstrate;
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
