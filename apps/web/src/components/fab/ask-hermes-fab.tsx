/**
 * AskHermesFab — floating bottom-right toggle for the chat rail.
 *
 * Repurposed: in the rail era, the FAB no longer opens a slide-out panel.
 * It now flips the rail open/closed and persists that state. Hidden on
 * routes where the rail itself is hidden (chat landing, chat threads).
 *
 * Style: labelled pill ("Ask Hermes") with an icon prefix, mirroring the
 * Actioneer reference screenshot. Closed state shows MessageCircle; open
 * state shows ChevronRight + same label.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { T, Icon } from '../../theme';
import { isRailHidden } from '../../utils/chat-rail-store';

interface AskHermesFabProps {
  open: boolean;
  onToggle: () => void;
}

export function AskHermesFab({ open, onToggle }: AskHermesFabProps) {
  const { pathname } = useLocation();
  if (isRailHidden(pathname)) return null;
  // Hide when the rail is already open — its own header X button is the
  // canonical close affordance, and the FAB would otherwise overlap the
  // rail's bottom-right input area.
  if (open) return null;

  const label = 'Ask Hermes';
  const tooltip = 'Open chat rail';
  const IconCmp = MessageCircle;

  return (
    <button
      onClick={onToggle}
      title={tooltip}
      aria-label={tooltip}
      aria-pressed={false}
      style={{
        position: 'fixed', right: 24, bottom: 24, zIndex: 900,
        height: 44, padding: '0 18px 0 14px', borderRadius: 9999,
        background: T.n900, color: '#fff',
        border: 'none', cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontFamily: T.fSans, fontSize: 14, fontWeight: 500,
        letterSpacing: '-0.005em',
        transition: 'transform .12s, background .12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = T.brand;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = T.n900;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <Icon icon={IconCmp} size={18} color="#fff" />
      <span>{label}</span>
    </button>
  );
}
