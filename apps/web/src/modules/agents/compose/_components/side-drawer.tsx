/**
 * Side drawer primitive — right-aligned 480px panel with backdrop.
 * Closes on Esc or backdrop click. Reused by swap drawer + detail drawer.
 */
import React from 'react';
import { T } from '../../../../theme';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  children?: React.ReactNode;
}

export const SideDrawer: React.FC<Props> = ({ open, onClose, title, subtitle, width = 480, children }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)',
          zIndex: 40, animation: 'sd-fade 200ms ease-out',
        }}
      />
      <aside
        role="dialog"
        aria-label={title}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width,
          background: '#fff', borderLeft: `1px solid ${T.n200}`, zIndex: 41,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-12px 0 32px rgba(0,0,0,0.12)',
          animation: 'sd-slide 220ms ease-out',
        }}
      >
        <header style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12, padding: '16px 20px', borderBottom: `1px solid ${T.n200}`,
        }}>
          <div>
            <div style={{ fontFamily: '"Spectral", Georgia, serif', fontSize: 20, color: T.n900, lineHeight: 1.15 }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500, marginTop: 4 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.n200}`,
              background: '#fff', cursor: 'pointer', fontFamily: T.fSans, fontSize: 12, color: T.n600,
            }}
          >
            Close
          </button>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {children}
        </div>
      </aside>
      <style>{`
        @keyframes sd-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sd-slide { from { transform: translateX(100%) } to { transform: none } }
      `}</style>
    </>
  );
};
