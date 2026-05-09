/**
 * ApproveEditDismiss — 3-CTA bar matching PRD Agentic §3 card spec.
 * Order: Approve (primary, deep red) · Edit (secondary) · Dismiss (ghost).
 * Per PRD_Hermes_Agentic.md §4
 */
import React from 'react';
import { T } from '../theme';

interface ApproveEditDismissProps {
  onApprove: () => void;
  onEdit: () => void;
  onDismiss: () => void;
  approveLabel?: string;
  editLabel?: string;
  dismissLabel?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const ApproveEditDismiss = React.memo<ApproveEditDismissProps>(({
  onApprove, onEdit, onDismiss,
  approveLabel = 'Approve & draft',
  editLabel = 'Edit before drafting',
  dismissLabel = 'Dismiss',
  disabled = false,
  style,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
    {/* Primary — deep red */}
    <button
      onClick={onApprove}
      disabled={disabled}
      style={{
        fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
        color: '#fff', background: T.brand,
        border: 'none', borderRadius: 7,
        padding: '7px 16px', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background .1s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = T.brandHover; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = T.brand; }}
    >
      {approveLabel}
    </button>

    {/* Secondary */}
    <button
      onClick={onEdit}
      disabled={disabled}
      style={{
        fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
        color: T.n800, background: '#fff',
        border: `1px solid ${T.n200}`, borderRadius: 7,
        padding: '7px 14px', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background .1s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = T.n50; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = '#fff'; }}
    >
      {editLabel}
    </button>

    {/* Ghost */}
    <button
      onClick={onDismiss}
      disabled={disabled}
      style={{
        fontFamily: T.fSans, fontSize: 13,
        color: T.n500, background: 'transparent',
        border: 'none', borderRadius: 7,
        padding: '7px 10px', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {dismissLabel}
    </button>
  </div>
));
ApproveEditDismiss.displayName = 'ApproveEditDismiss';
