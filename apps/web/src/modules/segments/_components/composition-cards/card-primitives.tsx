/**
 * Shared shell + stacked-bar + legend primitives for the 4 composition cards.
 */
import React from 'react';
import { T } from '../../../../theme';

interface ShellProps {
  title: string;
  demo?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function CardShell({ title, demo, children, footer }: ShellProps) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: T.fSans, fontSize: 12.5, fontWeight: 600, color: T.n800,
        }}>{title}</span>
        {demo && (
          <span style={{
            fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500,
            background: T.n100, padding: '2px 8px', borderRadius: 999,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            Demo data
          </span>
        )}
      </div>
      {children}
      {footer && (
        <div style={{
          fontFamily: T.fMono, fontSize: 11, color: T.n500,
          paddingTop: 8, borderTop: `1px solid ${T.n100}`,
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}

interface BarSeg { key: string; label: string; pct: number; color: string }

export function StackedBar({ segments }: { segments: BarSeg[] }) {
  return (
    <div style={{
      display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden',
      background: T.n100,
    }}>
      {segments.map(s => (
        <div key={s.key} title={`${s.label} · ${(s.pct * 100).toFixed(1)}%`}
          style={{
            width: `${s.pct * 100}%`, background: s.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.fMono, fontSize: 10.5, color: '#fff', fontWeight: 600,
          }}>
          {s.pct >= 0.08 ? `${Math.round(s.pct * 100)}%` : ''}
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: BarSeg[] }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
      fontFamily: T.fSans, fontSize: 11.5,
    }}>
      {items.map(s => (
        <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
          <span style={{ color: T.n700 }}>{s.label}</span>
          <span style={{ color: T.n500, fontFamily: T.fMono }}>{(s.pct * 100).toFixed(1)}%</span>
        </span>
      ))}
    </div>
  );
}
