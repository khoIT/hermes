/**
 * FilterDropdownChip — pill button that opens an anchored popover with the
 * given chip-group children. Click outside or Esc closes; opening another
 * dropdown is handled by callers via shared state if needed.
 */
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { T, Icon } from '../../../theme';

interface FilterDropdownChipProps {
  label: string;
  /** Number of currently-active selections in this category. */
  activeCount: number;
  children: React.ReactNode;
  /** Optional max height of the popover body before scrolling. */
  maxHeight?: number;
}

export function FilterDropdownChip({
  label, activeCount, children, maxHeight = 320,
}: FilterDropdownChipProps) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = activeCount > 0;

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          height: 30, padding: '0 10px', borderRadius: 9999,
          fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
          color: active ? T.brand : T.n700,
          background: active ? T.brandSoft : '#fff',
          border: `1px solid ${active ? T.brandBorder : T.n200}`,
          cursor: 'pointer',
          transition: 'background .12s, border-color .12s, color .12s',
        }}
      >
        {label}
        {active && (
          <span style={{
            fontFamily: T.fMono, fontSize: 10, fontWeight: 600,
            color: T.brand, marginLeft: 1,
          }}>
            ({activeCount})
          </span>
        )}
        <Icon icon={ChevronDown} size={12} color={active ? T.brand : T.n500} />
      </button>
      {open && (
        <div
          role="dialog"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0,
            minWidth: 200, maxWidth: 280, maxHeight,
            background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            padding: 8, zIndex: 40,
            overflowY: 'auto', overflowX: 'hidden',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Shared chip rendered inside dropdown popovers ────────────────────────────
interface PopoverChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  count?: number;
}

export function PopoverChip({ label, active, onClick, color, count }: PopoverChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '6px 10px', borderRadius: 6,
        fontFamily: T.fSans, fontSize: 12, lineHeight: 1.4,
        border: `1px solid ${active ? (color ?? T.brand) : T.n200}`,
        background: active ? (color ? `${color}18` : T.brandSoft) : '#fff',
        color: active ? (color ?? T.brand) : T.n700,
        cursor: 'pointer', marginBottom: 4,
        transition: 'background .12s, color .12s, border-color .12s',
      }}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span style={{
          fontFamily: T.fMono, fontSize: 10,
          color: active ? color ?? T.brand : T.n400,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}
