/**
 * SidebarSection — wraps SidebarItem header + optional expanded content.
 * Persists expand state to localStorage via recent-items-store helpers.
 */
import React from 'react';
import { SidebarItem } from './sidebar-item';
import {
  getSectionExpanded,
  setSectionExpanded,
} from '../../utils/recent-items-store';
import type { LucideIcon } from '../../theme';

interface SidebarSectionProps {
  /** Stable id for persisted expand state. */
  id: string;
  icon: LucideIcon;
  label: string;
  /** Click destination for the header (the section is always navigable). */
  to: string;
  /** Active-route prefix; defaults to `to`. */
  matchPrefix?: string;
  /** If provided, renders content under header when expanded. */
  children?: React.ReactNode;
  /** Render flat (no caret) — used for simple links. */
  flat?: boolean;
}

export function SidebarSection({
  id, icon, label, to, matchPrefix, children, flat,
}: SidebarSectionProps) {
  const [expanded, setExpanded] = React.useState(() =>
    flat ? false : getSectionExpanded(id)
  );

  const onToggle = React.useCallback(() => {
    if (flat) return;
    setExpanded(prev => {
      const next = !prev;
      setSectionExpanded(id, next);
      return next;
    });
  }, [id, flat]);

  return (
    <div>
      <SidebarItem
        icon={icon}
        label={label}
        to={to}
        matchPrefix={matchPrefix}
        expandable={!flat}
        expanded={expanded}
        onClick={onToggle}
      />
      {!flat && expanded && children && (
        <div>{children}</div>
      )}
    </div>
  );
}
