/**
 * FeaturePill — clickable mono pill for a feature name in the predicate composer.
 * Click opens a swap popover stub (P-7 wires real swap logic).
 * Per PRD §8.3 — mono, clickable, swap popover on click.
 */
import React from 'react';
import { T } from '../theme';

interface FeaturePillProps {
  featureName: string;
  /** Called when user confirms a swap in the popover. P-7 wires real swap. */
  onSwap?: (newFeature: string) => void;
  style?: React.CSSProperties;
}

export const FeaturePill = React.memo<FeaturePillProps>(({ featureName, onSwap, style }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ display: 'inline-block', position: 'relative', ...style }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily: T.fMono, fontSize: 12, fontWeight: 500,
          color: T.n950, background: T.n100,
          border: `1px solid ${T.n200}`, borderRadius: 5,
          padding: '2px 8px', cursor: 'pointer',
          textDecoration: open ? 'underline' : 'none',
          textDecorationColor: T.brand,
          transition: 'background .1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.n200; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.n100; }}
        title="Click to swap feature"
      >
        {featureName}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          zIndex: 200, background: '#fff',
          border: `1px solid ${T.n200}`, borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          padding: 12, minWidth: 240,
        }}>
          {/* Popover stub — P-7 wires real swap logic */}
          <div style={{ fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Swap feature
          </div>
          <div style={{ fontFamily: T.fMono, fontSize: 12, color: T.n800, background: T.n50, borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
            {featureName}
          </div>
          <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, fontStyle: 'italic', marginBottom: 10 }}>
            Swap suggestions wired in Phase 7.
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              fontFamily: T.fSans, fontSize: 12, color: T.n600,
              background: 'none', border: `1px solid ${T.n200}`,
              borderRadius: 5, padding: '4px 10px', cursor: 'pointer',
            }}
          >
            Close
          </button>
          {onSwap && (
            <button
              onClick={() => { onSwap(featureName); setOpen(false); }}
              style={{
                fontFamily: T.fSans, fontSize: 12, color: '#fff',
                background: T.brand, border: 'none',
                borderRadius: 5, padding: '4px 10px', cursor: 'pointer',
                marginLeft: 6,
              }}
            >
              Confirm swap
            </button>
          )}
        </div>
      )}
    </div>
  );
});
FeaturePill.displayName = 'FeaturePill';
