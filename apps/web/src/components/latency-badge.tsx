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

// Substrate dot color: A (Apollo TEE · realtime) = deep red accent · B (batch) = neutral gray.
// Per reference image (PRD §6.2): orange filled dot for substrate A, gray dot for substrate B.
const SUBSTRATE_DOT: Record<HermesSubstrate, string> = {
  A: '#f05a22', // deep red — realtime substrate signature
  B: T.n500,    // neutral gray — batch substrate
};

const SUBSTRATE_BG: Record<HermesSubstrate, string> = {
  A: '#fef0e8', // peach tint — substrate A pill background
  B: T.n100,    // neutral tint — substrate B pill background
};

const SUBSTRATE_TEXT: Record<HermesSubstrate, string> = {
  A: '#a23d18', // darker red text on peach
  B: T.n700,    // neutral dark text on gray
};

const SingleBadge = React.memo<SingleBadgeProps>(({ tier, substrate, style }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: T.fMono,
    fontSize: 11,
    fontWeight: 500,
    color: SUBSTRATE_TEXT[substrate],
    background: SUBSTRATE_BG[substrate],
    border: `1px solid ${SUBSTRATE_BG[substrate]}`,
    borderRadius: 999,
    padding: '2px 8px',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    lineHeight: 1.4,
    ...style,
  }}>
    <span style={{
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: SUBSTRATE_DOT[substrate],
      flexShrink: 0,
    }} aria-hidden />
    {`${tier} · ${substrate}`}
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
