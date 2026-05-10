/**
 * SeamCollapseToggle — round chevron button that lives at the sidebar's
 * right edge (the seam between the sidebar and the main content). Hidden
 * by default; revealed when the user hovers a thin invisible strip that
 * straddles the seam, so it doesn't compete visually with the sidebar
 * content during normal use.
 *
 * Click toggles between 260px (expanded) and 60px (icon rail) modes.
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { T, Icon } from '../../theme';
import { setCollapsed } from '../../utils/sidebar-collapsed-store';

interface SeamCollapseToggleProps {
  collapsed: boolean;
}

const BUTTON_SIZE = 28;
// Strip extends 8px outside + 8px inside the sidebar's right edge so users
// don't have to be pixel-perfect to hit it.
const STRIP_WIDTH = 16;

export function CollapseToggle({ collapsed }: SeamCollapseToggleProps) {
  const [hovered, setHovered] = React.useState(false);
  const [buttonHovered, setButtonHovered] = React.useState(false);

  // Keep button visible while it itself is hovered (mouse can move from strip
  // onto the button without losing the hover ring).
  const visible = hovered || buttonHovered;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        // Pinned to the sidebar's right edge; sidebar parent uses
        // overflow:visible so the button can pop outside.
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: -STRIP_WIDTH / 2,
        width: STRIP_WIDTH,
        zIndex: 20,
        // The strip is invisible — it's a hit area only.
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={() => setCollapsed(!collapsed)}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
        style={{
          // Vertically centered on the viewport. `position: sticky` keeps the
          // button near mid-screen even when the sidebar's inner content
          // scrolls — feels like it's anchored to the seam, not the page.
          position: 'sticky',
          top: '50vh',
          marginLeft: (STRIP_WIDTH - BUTTON_SIZE) / 2,
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          padding: 0,
          borderRadius: '50%',
          background: T.surface,
          border: `1px solid ${T.n200}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          color: T.n700,
          cursor: 'pointer',
          opacity: visible ? 1 : 0,
          // No transform here — keep the click target stable while it fades.
          transition: 'opacity 0.15s ease, background 0.12s, color 0.12s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon icon={collapsed ? ChevronRight : ChevronLeft} size={14} />
      </button>
    </div>
  );
}
