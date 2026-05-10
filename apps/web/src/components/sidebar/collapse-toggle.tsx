/**
 * CollapseToggle — chevron button at the bottom of the sidebar that
 * toggles between 260px (expanded) and 60px (icon rail) modes.
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { T, Icon } from '../../theme';
import { setCollapsed } from '../../utils/sidebar-collapsed-store';

interface CollapseToggleProps {
  collapsed: boolean;
}

export function CollapseToggle({ collapsed }: CollapseToggleProps) {
  return (
    <button
      type="button"
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      onClick={() => setCollapsed(!collapsed)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: collapsed ? '100%' : 28, height: 28,
        margin: collapsed ? '4px 0' : '4px 12px 4px auto',
        padding: 0, borderRadius: 6,
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: T.n500,
        transition: 'background .12s, color .12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = T.n800; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.n500; }}
    >
      <Icon icon={collapsed ? ChevronRight : ChevronLeft} size={14} />
    </button>
  );
}
