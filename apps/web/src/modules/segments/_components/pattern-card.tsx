/**
 * PatternCard — one audience pattern card for the patterns library (Screen 08).
 * Shows name, description, 4R goal chip, key features, example segment count.
 * Per PRD §8.9.
 */
import React from 'react';
import { T } from '../../../theme';
import type { AudiencePattern } from '../../../data/catalog/audience-patterns';

const GOAL_COLORS: Record<string, { bg: string; fg: string }> = {
  retain:     { bg: '#ecfdf5', fg: T.green600 },
  revenue:    { bg: T.brandSoft, fg: T.brand },
  reactivate: { bg: T.amberSoft, fg: T.amber500 },
  recruit:    { bg: T.blueSoft, fg: T.blue500 },
};

interface Props {
  pattern: AudiencePattern;
  onUse?: (pattern: AudiencePattern) => void;
  onNavigate?: (pattern: AudiencePattern) => void;
}

export const PatternCard = React.memo<Props>(({ pattern, onUse, onNavigate }) => {
  const goal = (GOAL_COLORS[pattern.goal4r] ?? GOAL_COLORS['retain'])!;

  return (
    <div
      onClick={() => onNavigate?.(pattern)}
      style={{
        background: '#fff', border: `1px solid ${T.n200}`,
        borderRadius: 10, padding: '16px 18px',
        cursor: onNavigate ? 'pointer' : 'default',
        transition: 'border-color .12s, box-shadow .12s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={e => {
        if (!onNavigate) return;
        const d = e.currentTarget as HTMLDivElement;
        d.style.borderColor = T.brand;
        d.style.boxShadow = '0 4px 12px rgba(240,90,34,0.10)';
      }}
      onMouseLeave={e => {
        const d = e.currentTarget as HTMLDivElement;
        d.style.borderColor = T.n200;
        d.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: T.fDisp, fontSize: 20, fontWeight: 400,
            textTransform: 'uppercase', color: T.n950, lineHeight: 1.05,
            letterSpacing: '0.01em',
          }}>
            {pattern.name}
          </div>
          <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500, marginTop: 2 }}>
            {pattern.game} · {pattern.typicalAudienceRange} typical
          </div>
        </div>
        <span style={{
          fontFamily: T.fSans, fontSize: 10, fontWeight: 700,
          padding: '3px 9px', borderRadius: 9999,
          background: goal.bg, color: goal.fg,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          flexShrink: 0,
        }}>
          {pattern.goal4r}
        </span>
      </div>

      {/* Description */}
      <p style={{
        fontFamily: T.fSans, fontSize: 12, color: T.n600,
        lineHeight: 1.5, margin: '0 0 10px',
      }}>
        {pattern.description}
      </p>

      {/* Key features */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {pattern.keyFeatures.map(f => (
          <span key={f} style={{
            fontFamily: T.fMono, fontSize: 10,
            color: T.n700, background: T.n100,
            border: `1px solid ${T.n200}`,
            borderRadius: 4, padding: '1px 6px',
          }}>
            {f}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: `1px solid ${T.n100}`, paddingTop: 10,
      }}>
        <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>
          {pattern.exampleSegments.length} example segment{pattern.exampleSegments.length !== 1 ? 's' : ''}
        </span>
        {onUse && (
          <button
            onClick={e => { e.stopPropagation(); onUse(pattern); }}
            style={{
              fontFamily: T.fSans, fontSize: 11, fontWeight: 500,
              color: '#fff', background: T.brand, border: 'none',
              borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.brandHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.brand; }}
          >
            Use pattern →
          </button>
        )}
      </div>
    </div>
  );
});
PatternCard.displayName = 'PatternCard';
