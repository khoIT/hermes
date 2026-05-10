/**
 * WorkspacePill — top-of-sidebar Hermes brand pill with workspace name.
 * Click → /welcome (logo-as-home). Dropdown chevron is decorative for v1.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { T, Icon } from '../../theme';

export function WorkspacePill() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/welcome')}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%',
        padding: '10px 12px',
        background: 'transparent', border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        borderRadius: 0,
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
        fontFamily: T.fDisp, fontSize: 18, fontWeight: 400,
        color: T.n950, textTransform: 'uppercase', letterSpacing: '0.04em',
        lineHeight: 1,
      }}>HERMES</span>
      <Icon icon={ChevronDown} size={14} color={T.n400} />
    </button>
  );
}
