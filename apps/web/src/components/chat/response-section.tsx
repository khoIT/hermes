/**
 * ResponseSection — H2 heading + arbitrary body slot inside an assistant response.
 */
import React from 'react';
import { T } from '../../theme';

interface ResponseSectionProps {
  title: string;
  children?: React.ReactNode;
}

export function ResponseSection({ title, children }: ResponseSectionProps) {
  return (
    <section style={{ margin: '20px 0 8px', maxWidth: 820 }}>
      <h2 style={{
        fontFamily: T.fSans, fontSize: 16, fontWeight: 600,
        color: T.n900, letterSpacing: '-0.005em',
        margin: '0 0 10px',
      }}>{title}</h2>
      {children}
    </section>
  );
}
