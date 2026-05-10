/**
 * WorkspacePill — top-of-sidebar Hermes brand pill with workspace name.
 * Click → /welcome (logo-as-home). Subtitle "Thinking → Actionable Data".
 * Collapsed mode renders only the VG glyph centered.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { T, Icon } from '../../theme';

interface WorkspacePillProps {
  collapsed?: boolean;
}

export function WorkspacePill({ collapsed }: WorkspacePillProps) {
  const navigate = useNavigate();

  if (collapsed) {
    return (
      <button
        onClick={() => navigate('/welcome')}
        title="Hermes — Welcome"
        aria-label="Hermes — Welcome"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', height: 56, flexShrink: 0,
          background: 'transparent', border: 'none', cursor: 'pointer',
          borderRadius: 0,
        }}
      >
        <div style={{
          width: 24, height: 24, borderRadius: 5, background: T.brand,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: T.fDisp, fontSize: 11, fontWeight: 400,
            color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em',
            lineHeight: 1,
          }}>VG</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/welcome')}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%',
        height: 56, flexShrink: 0,
        padding: '0 12px',
        background: 'transparent', border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        borderRadius: '18px 18px 0 0',
        transition: 'background .12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 5, background: T.brand,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: T.fDisp, fontSize: 11, fontWeight: 400,
          color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em',
          lineHeight: 1,
        }}>VG</span>
      </div>
      <span style={{
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        <span style={{
          fontFamily: T.fDisp, fontSize: 18, fontWeight: 400,
          color: T.n950, textTransform: 'uppercase', letterSpacing: '0.04em',
          lineHeight: 1,
        }}>HERMES</span>
        <span style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 400,
          color: T.n500, lineHeight: 1.3, letterSpacing: '0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          Thinking → Actionable Data
        </span>
      </span>
      <Icon icon={ChevronDown} size={14} color={T.n400} />
    </button>
  );
}
