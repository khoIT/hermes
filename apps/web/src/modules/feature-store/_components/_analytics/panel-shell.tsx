/**
 * PanelShell — shared chrome for the 6 Analytics-tab panels.
 * Border, padding, title strip. Each panel composes content inside.
 */
import React from 'react';
import { T } from '../../../../theme';

interface PanelShellProps {
  title: string;
  children: React.ReactNode;
  /** Make the panel span the full grid width (e.g. distribution-over-time). */
  fullWidth?: boolean;
}

export const PanelShell: React.FC<PanelShellProps> = ({ title, children, fullWidth }) => (
  <section
    style={{
      gridColumn: fullWidth ? '1 / -1' : 'auto',
      background: '#fff',
      border: `1px solid ${T.n200}`,
      borderRadius: 10,
      padding: '14px 18px',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div
      style={{
        fontFamily: T.fSans,
        fontSize: 10,
        fontWeight: 700,
        color: T.n400,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 12,
      }}
    >
      {title}
    </div>
    {children}
  </section>
);
