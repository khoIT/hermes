/**
 * Compact hero strip — wordmark + tagline + status pills + Ask Hermes CTA.
 * Replaces the original 56px display HERMES title with a 1-line cockpit header.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { T, Badge, Icon } from '../../theme';

export function HeroStrip() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 20,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: T.fSans,
          fontSize: 11,
          fontWeight: 600,
          color: T.n400,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 4,
        }}>
          VNGGames · GDS LiveOps Platform
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontFamily: T.fDisp,
            fontSize: 28,
            fontWeight: 400,
            textTransform: 'uppercase',
            color: T.n950,
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}>
            Hermes
          </span>
          <span style={{
            fontFamily: T.fSans,
            fontSize: 13,
            color: T.n500,
          }}>
            pick up where you left off, or start something new.
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <Badge variant="live" dot>Platform online</Badge>
        <Badge variant="brandSoft">α May 2026</Badge>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: T.fSans,
            fontSize: 13,
            fontWeight: 500,
            padding: '8px 14px',
            borderRadius: 9999,
            border: `1px solid ${T.brandBorder}`,
            background: T.brandSoft,
            color: T.brand,
            cursor: 'pointer',
          }}
        >
          <Icon icon={Sparkles} size={13} color={T.brand} />
          Ask Hermes
        </button>
      </div>
    </div>
  );
}
