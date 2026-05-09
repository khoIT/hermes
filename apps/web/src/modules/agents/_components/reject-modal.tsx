/**
 * RejectModal — 4-reason reject modal for dismissing an Opportunity.
 * Reasons: Already covered · Tried before · Wrong target · Other
 * Fast path: "Dismiss without feedback"
 * ESC key closes.
 * Per PRD_Hermes_Agentic.md §3 approval contract.
 */
import React from 'react';
import { T } from '../../../theme';

export type RejectReason =
  | 'already-covered'
  | 'tried-before-didnt-work'
  | 'wrong-target'
  | 'other';

interface RejectModalProps {
  opportunityId: string;
  open: boolean;
  onConfirm: (id: string, reason: RejectReason | null) => void;
  onCancel: () => void;
}

const REASONS: { value: RejectReason; label: string }[] = [
  { value: 'already-covered',      label: 'Already covered by an existing campaign' },
  { value: 'tried-before-didnt-work', label: 'Tried before — didn\'t work' },
  { value: 'wrong-target',         label: 'Wrong target audience for this game' },
  { value: 'other',                label: 'Other' },
];

export const RejectModal = React.memo<RejectModalProps>(({
  opportunityId, open, onConfirm, onCancel,
}) => {
  const [reason, setReason] = React.useState<RejectReason | null>(null);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  // Reset reason when re-opened
  React.useEffect(() => { if (open) setReason(null); }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dismiss opportunity"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10,10,10,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        width: 440, padding: '28px 28px 20px',
      }}>
        {/* Header */}
        <div style={{ fontFamily: T.fDisp, fontSize: 22, textTransform: 'uppercase', color: T.n950, marginBottom: 6 }}>
          Dismiss opportunity
        </div>
        <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400, marginBottom: 18 }}>
          {opportunityId}
        </div>

        {/* Reasons */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500,
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
          }}>
            Reason (optional)
          </div>
          {REASONS.map(r => (
            <label
              key={r.value}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                background: reason === r.value ? T.brandSoft : 'transparent',
                border: `1px solid ${reason === r.value ? T.brandBorder : 'transparent'}`,
                marginBottom: 4, transition: 'background .1s',
              }}
            >
              <input
                type="radio"
                name="reject-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                style={{ accentColor: T.brand, flexShrink: 0 }}
              />
              <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n800 }}>
                {r.label}
              </span>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            onClick={() => onConfirm(opportunityId, null)}
            style={{
              fontFamily: T.fSans, fontSize: 12, color: T.n400,
              background: 'none', border: 'none', padding: 0,
              cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted',
            }}
          >
            Dismiss without feedback
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onCancel}
              style={{
                fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
                color: T.n700, background: '#fff',
                border: `1px solid ${T.n200}`, borderRadius: 7,
                padding: '7px 16px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(opportunityId, reason)}
              style={{
                fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
                color: '#fff', background: T.brand,
                border: 'none', borderRadius: 7,
                padding: '7px 16px', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.brandHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.brand; }}
            >
              Confirm dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
RejectModal.displayName = 'RejectModal';
