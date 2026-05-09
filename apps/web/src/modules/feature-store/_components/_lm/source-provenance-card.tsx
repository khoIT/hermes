/**
 * Source Provenance Card — LM persona panel.
 *
 * Loud visual badge answering "should I bet a campaign on this feature?".
 * Reads `analytics.source` ('real' | 'hybrid' | 'synth') from the
 * HermesFeature snapshot.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { HermesFeature } from '@hermes/contracts';

const COPY: Record<'real' | 'hybrid' | 'synth', { label: string; body: string; bg: string; fg: string }> = {
  real: {
    label: 'REAL · TRINO-DERIVED',
    body:  'Computed end-to-end from cfm_vn raw events. Trustworthy for targeting.',
    bg:    T.greenSoft,
    fg:    T.green600,
  },
  hybrid: {
    label: 'HYBRID · PROXY SQL',
    body:  'Derived from real Trino aggregates via a documented approximation. Fine for most segments; verify before high-stakes campaigns.',
    bg:    T.amberSoft,
    fg:    T.amber500,
  },
  synth: {
    label: 'SYNTHETIC · NO UPSTREAM SOURCE',
    body:  'Distribution seeded — no Trino source-table mapping yet. Use for preview / prototype only; do NOT bet a live campaign on this.',
    bg:    T.redSoft,
    fg:    T.red600,
  },
};

interface Props { feature: HermesFeature }

export const SourceProvenanceCard: React.FC<Props> = ({ feature }) => {
  const source = (feature.analytics as unknown as { source?: 'real' | 'hybrid' | 'synth' }).source ?? 'synth';
  const copy = COPY[source];
  const lastBackfill = feature.analytics.lastBackfillAt;

  return (
    <div
      style={{
        background:  copy.bg,
        border:      `1px solid ${copy.fg}33`,
        borderLeft:  `4px solid ${copy.fg}`,
        borderRadius: 6,
        padding:     '14px 16px',
        fontFamily:  T.fSans,
      }}
    >
      <div
        style={{
          fontFamily:    T.fMono,
          fontSize:      10,
          fontWeight:    700,
          letterSpacing: '0.08em',
          color:         copy.fg,
          marginBottom:  6,
        }}
      >
        {copy.label}
      </div>
      <div style={{ fontSize: 13, color: T.n800, lineHeight: 1.45, marginBottom: 8 }}>{copy.body}</div>
      <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>
        last backfill: {lastBackfill ? new Date(lastBackfill).toISOString().slice(0, 16).replace('T', ' ') + 'Z' : '—'}
        {feature.games?.length ? ` · games: ${feature.games.join(', ')}` : ''}
      </div>
    </div>
  );
};
