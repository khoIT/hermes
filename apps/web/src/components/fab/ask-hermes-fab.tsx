/**
 * AskHermesFab — floating bottom-right toggle for the chat rail.
 *
 * Repurposed: in the rail era, the FAB no longer opens a slide-out panel.
 * It now flips the rail open/closed and persists that state. Hidden on
 * routes where the rail itself is hidden (chat landing, chat threads).
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { T, Icon } from '../../theme';
import { isRailHidden } from '../../utils/chat-rail-store';

interface AskHermesFabProps {
  open: boolean;
  onToggle: () => void;
}

export function AskHermesFab({ open, onToggle }: AskHermesFabProps) {
  const { pathname } = useLocation();
  if (isRailHidden(pathname)) return null;

  const tooltip = open ? 'Hide chat rail' : 'Open chat rail';
  const IconCmp = open ? ChevronRight : MessageCircle;

  return (
    <button
      onClick={onToggle}
      title={tooltip}
      aria-label={tooltip}
      aria-pressed={open}
      style={{
        position: 'fixed', right: 24, bottom: 24, zIndex: 900,
        width: 52, height: 52, borderRadius: 9999,
        background: T.n900, color: '#fff',
        border: 'none', cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform .12s, background .12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = T.brand;
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = T.n900;
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <Icon icon={IconCmp} size={22} color="#fff" />
    </button>
  );
}
