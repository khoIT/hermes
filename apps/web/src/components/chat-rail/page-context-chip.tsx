/**
 * PageContextChip — small removable chip rendered in the rail input slot,
 * showing the auto-resolved page context (Feature · Name, Segments · Name,
 * Board · Name, Campaigns · Name).
 *
 * Closed/dismissed state is owned by the parent (per-id) so navigating to a
 * different artifact restores the chip without persisting a global "off"
 * preference.
 */
import React from 'react';
import { X } from 'lucide-react';
import { T, Icon } from '../../theme';
import type { PageContext } from '../../utils/page-context-resolver';

interface PageContextChipProps {
  context: PageContext;
  onClear: () => void;
}

export function PageContextChip({ context, onClear }: PageContextChipProps) {
  return (
    <span
      title={context.label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: T.n200, color: T.n800,
        padding: '4px 6px 4px 8px', borderRadius: 4,
        fontFamily: T.fSans, fontSize: 11, fontWeight: 500,
        maxWidth: '100%', minWidth: 0,
      }}
    >
      <span style={{
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        minWidth: 0,
      }}>
        {context.label}
      </span>
      <button
        onClick={onClear}
        aria-label="Clear context"
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 2, borderRadius: 3, color: T.n600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = T.n900; }}
        onMouseLeave={e => { e.currentTarget.style.color = T.n600; }}
      >
        <Icon icon={X} size={11} />
      </button>
    </span>
  );
}
