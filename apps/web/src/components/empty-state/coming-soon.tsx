/**
 * ComingSoon — reusable centered placeholder for sidebar stub pages.
 * Eyebrow / Title / body / optional list of bullets describing future scope.
 */
import React from 'react';
import { T, type LucideIcon, Icon } from '../../theme';

interface ComingSoonProps {
  title: string;
  body: string;
  icon?: LucideIcon;
  bullets?: string[];
}

export function ComingSoon({ title, body, icon, bullets }: ComingSoonProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '60px 32px',
    }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        {icon && (
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: T.n100, color: T.n500,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Icon icon={icon} size={22} color={T.n500} />
          </div>
        )}
        <div style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n400,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
        }}>Coming soon</div>
        <h1 style={{
          fontFamily: T.fSans, fontSize: 28, fontWeight: 600, color: T.n950,
          margin: '0 0 14px', letterSpacing: '-0.01em',
        }}>{title}</h1>
        <p style={{
          fontFamily: T.fSans, fontSize: 14, color: T.n600, lineHeight: 1.6,
          margin: '0 auto 18px', maxWidth: 440,
        }}>{body}</p>
        {bullets && bullets.length > 0 && (
          <ul style={{
            listStyle: 'none', padding: 0, margin: 0,
            textAlign: 'left', maxWidth: 380, marginInline: 'auto',
          }}>
            {bullets.map((b, i) => (
              <li key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '6px 0',
                fontFamily: T.fSans, fontSize: 13, color: T.n700,
              }}>
                <span style={{ color: T.brand, marginTop: 1 }}>·</span>
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
