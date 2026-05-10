/**
 * AvatarMenu — 32px circle avatar with popover menu (Account / Settings / Data sources / Sign out).
 * Hardcoded initial `K` for Khoi until auth payload carries name.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../theme';

interface MenuItem { label: string; to?: string; divider?: boolean }
const ITEMS: MenuItem[] = [
  { label: 'Account',      to: '/account' },
  { label: 'Settings',     to: '/settings' },
  { label: 'Data sources', to: '/data' },
  { label: '', divider: true },
  { label: 'Sign out' },
];

export function AvatarMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        style={{
          width: 32, height: 32, borderRadius: 9999,
          background: T.brand, color: '#fff',
          border: 'none', cursor: 'pointer',
          fontFamily: T.fSans, fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .12s, box-shadow .12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240,90,34,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        K
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            width: 200, background: '#fff',
            border: `1px solid ${T.n200}`, borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '4px 0', zIndex: 30,
            fontFamily: T.fSans,
          }}
        >
          {ITEMS.map((it, i) => it.divider ? (
            <div key={i} style={{ height: 1, background: T.n200, margin: '4px 0' }} />
          ) : (
            <button
              key={i}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                if (it.to) navigate(it.to);
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 14px', background: 'transparent', border: 'none',
                fontFamily: T.fSans, fontSize: 13, color: T.n800, cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.n50; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
