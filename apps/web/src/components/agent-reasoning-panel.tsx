/**
 * AgentReasoningPanel — slide-in panel showing the agent's reasoning thread.
 * Mono terse lines, chronological. Used in opportunity detail §5.3.
 * Format per PRD: "HH:MM:SS  action  description"
 */
import React from 'react';
import { T } from '../theme';

interface AgentReasoningPanelProps {
  threadId: string;
  lines: string[];
  open: boolean;
  onClose: () => void;
}

export const AgentReasoningPanel = React.memo<AgentReasoningPanelProps>(({
  threadId,
  lines,
  open,
  onClose,
}) => {
  // Keyboard close
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 299,
          background: 'rgba(0,0,0,0.15)',
        }}
      />

      {/* Slide-in panel from right */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, zIndex: 300,
        background: T.n950, boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
        animation: 'slide-in-right 0.18s ease-out',
      }}>
        <style>{`@keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid rgba(255,255,255,0.08)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              Agent reasoning thread
            </div>
            <div style={{ fontFamily: T.fMono, fontSize: 13, color: T.brand }}>
              #{threadId}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              fontFamily: T.fSans, fontSize: 18, color: T.n400,
              background: 'none', border: 'none', cursor: 'pointer',
              lineHeight: 1, padding: '4px 8px',
            }}
            aria-label="Close reasoning panel"
          >
            ×
          </button>
        </div>

        {/* Thread lines */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {lines.map((line, i) => {
            // Parse "HH:MM:SS  action  description"
            const parts = line.trim().split(/\s{2,}/);
            const time = parts[0] ?? '';
            const action = parts[1] ?? '';
            const desc = parts.slice(2).join('  ');
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '62px 80px 1fr',
                gap: 8, marginBottom: 10, alignItems: 'baseline',
              }}>
                <span style={{ fontFamily: T.fMono, fontSize: 10, color: T.n500 }}>{time}</span>
                <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.brand, fontWeight: 600 }}>{action}</span>
                <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n300 }}>{desc}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
});
AgentReasoningPanel.displayName = 'AgentReasoningPanel';
