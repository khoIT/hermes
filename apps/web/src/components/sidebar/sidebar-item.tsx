/**
 * SidebarItem — single nav row with icon + label + optional caret.
 * Active state: 3px brand-tinted left bar + semi-bold text. No fill (Actioneer-quiet).
 */
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { T, Icon, type LucideIcon } from '../../theme';

interface SidebarItemProps {
  icon?: LucideIcon;
  label: string;
  /** Route to navigate to. Omit if it's an expand-only header (use onClick instead). */
  to?: string;
  /** Match this prefix for active highlight; defaults to `to`. */
  matchPrefix?: string;
  /** If provided, renders caret + makes row a button. */
  expandable?: boolean;
  expanded?: boolean;
  /** Show the leading "+ " glyph instead of the standard icon. */
  primary?: boolean;
  onClick?: () => void;
  /** Indented sub-row (recent items). */
  indent?: boolean;
  /** Smaller font for sub-rows. */
  muted?: boolean;
  /** Right-aligned trailing accessory (e.g. count badge). */
  trailing?: React.ReactNode;
}

export function SidebarItem({
  icon, label, to, matchPrefix, expandable, expanded,
  primary, onClick, indent, muted, trailing,
}: SidebarItemProps) {
  const location = useLocation();
  const prefix = matchPrefix ?? to;
  const isActive = !!prefix && (
    prefix === '/'
      ? location.pathname === '/'
      : location.pathname === prefix || location.pathname.startsWith(prefix + '/')
  );

  const inner = (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: indent ? '5px 12px 5px 36px' : '7px 12px',
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        borderRadius: 0,
        background: 'transparent',
        transition: 'background .12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Active left bar */}
      {isActive && (
        <div style={{
          position: 'absolute', left: 0, top: 4, bottom: 4, width: 3,
          background: T.brand, borderRadius: '0 2px 2px 0',
        }} />
      )}

      {/* Leading glyph */}
      {primary
        ? <Icon icon={Plus} size={14} color={T.n800} />
        : icon
          ? <Icon icon={icon} size={indent ? 12 : 16} color={isActive ? T.n950 : T.n600} />
          : <span style={{ width: indent ? 12 : 16 }} />
      }

      {/* Label */}
      <span style={{
        flex: 1, minWidth: 0,
        fontFamily: T.fSans,
        fontSize: muted ? 12 : 13,
        fontWeight: isActive ? 600 : primary ? 600 : 500,
        color: muted ? T.n500 : isActive ? T.n950 : T.n800,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{label}</span>

      {/* Trailing */}
      {trailing}
      {expandable && (
        <Icon icon={expanded ? ChevronDown : ChevronRight} size={12} color={T.n400} />
      )}
    </div>
  );

  // Expand-only header (no `to`, has expandable+onClick)
  if (!to) {
    return (
      <div onClick={onClick} role="button" tabIndex={0}>
        {inner}
      </div>
    );
  }

  // Navigable row
  return (
    <NavLink to={to} onClick={onClick} style={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </NavLink>
  );
}
