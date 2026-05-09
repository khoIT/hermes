/**
 * Provenance dot — small colored circle indicating real / hybrid / synth source.
 * Mirrors the Feature Store library row dot (green / amber / gray).
 */
import React from 'react';

interface Props {
  source: 'real' | 'hybrid' | 'synth' | undefined;
  size?: number;
}

const COLOR: Record<'real' | 'hybrid' | 'synth', string> = {
  real: '#059669', hybrid: '#f59e0b', synth: '#a3a3a3',
};

export const ProvenanceDot: React.FC<Props> = ({ source, size = 8 }) => {
  const color = source ? COLOR[source] : '#d4d4d4';
  return (
    <span
      title={source ? `${source} source` : 'unknown source'}
      style={{
        width: size, height: size, borderRadius: 9999,
        background: color, display: 'inline-block', flexShrink: 0,
      }}
    />
  );
};
