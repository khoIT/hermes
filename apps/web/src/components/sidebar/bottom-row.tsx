/**
 * BottomRow — sticky bottom Data / Settings / Account row + collapse toggle.
 * In collapsed (60px) mode, items stack vertically with icon-only rendering.
 */
import React from 'react';
import { Database, Settings as SettingsIcon, User as UserIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { T } from '../../theme';
import { SidebarItem } from './sidebar-item';

interface BottomRowProps {
  collapsed?: boolean;
}

export function BottomRow({ collapsed }: BottomRowProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAccountActive =
    location.pathname === '/account' || location.pathname.startsWith('/account/');

  return (
    <div style={{
      borderTop: `1px solid rgba(0,0,0,0.06)`,
      padding: '6px 0 8px',
    }}>
      <SidebarItem icon={Database} label="Data" to="/data" collapsed={collapsed} />
      <SidebarItem icon={SettingsIcon} label="Settings" to="/settings" collapsed={collapsed} />

      {collapsed ? (
        <SidebarItem icon={UserIcon} label="Account" to="/account" collapsed />
      ) : (
        <div
          onClick={() => navigate('/account')}
          role="button"
          tabIndex={0}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px',
            position: 'relative',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'background .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          {isAccountActive && (
            <div style={{
              position: 'absolute', left: 0, top: 4, bottom: 4, width: 3,
              background: T.brand, borderRadius: '0 2px 2px 0',
            }} />
          )}
          <div style={{
            width: 22, height: 22, borderRadius: 9999, background: T.brand,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.fSans, fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>K</div>
          <span style={{
            flex: 1, minWidth: 0,
            fontFamily: T.fSans, fontSize: 13,
            fontWeight: isAccountActive ? 600 : 500,
            color: T.n800,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>Khoi</span>
          <span style={{
            fontFamily: T.fSans, fontSize: 10, color: T.n500,
          }}>CFM PM</span>
        </div>
      )}

    </div>
  );
}
