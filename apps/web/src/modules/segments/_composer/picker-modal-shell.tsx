/**
 * PickerModalShell — centered-modal frame shared by ConditionPicker,
 * ExclusionPicker, and OrRowPicker. Replaces the previous fixed-right
 * slide-out so the picker doesn't overlap the chat rail when it's open.
 *
 * Click on backdrop or Esc closes via `onClose`.
 */
import React from 'react';
import { T } from '../../../theme';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
  /** Optional max-width override; defaults to 480px (denser than 380 rail). */
  maxWidth?: number;
  /** zIndex for stacking; defaults to 350 (matches prior fixed rail). */
  zIndex?: number;
}

export function PickerModalShell({ children, onClose, maxWidth = 480, zIndex = 350 }: Props) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: zIndex - 1,
          background: 'rgba(15, 15, 17, 0.32)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />
      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '92vw', maxWidth, maxHeight: '85vh',
          zIndex,
          background: '#fff',
          border: `1px solid ${T.n200}`,
          borderRadius: 12,
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}
