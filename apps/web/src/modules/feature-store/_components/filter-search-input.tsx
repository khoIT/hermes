/**
 * FilterSearchInput — wide search box bound to FilterState.query.
 * Pressing `/` from anywhere on the page focuses this input (unless
 * the user is already typing in another input/textarea/contenteditable).
 */
import React from 'react';
import { Search } from 'lucide-react';
import { T, Icon } from '../../../theme';

interface FilterSearchInputProps {
  value: string;
  onChange: (next: string) => void;
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable;
}

export function FilterSearchInput({ value, onChange }: FilterSearchInputProps) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      width: '100%', height: 32, padding: '0 12px',
      background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8,
    }}>
      <Icon icon={Search} size={14} color={T.n500} />
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search by name, owner, domain… (press / to focus)"
        style={{
          flex: 1, border: 0, outline: 0, background: 'transparent',
          fontFamily: T.fSans, fontSize: 13, color: T.n900,
        }}
      />
      <kbd style={{
        fontFamily: T.fMono, fontSize: 10, color: T.n500,
        background: T.n100, borderRadius: 4, padding: '1px 5px',
        lineHeight: 1, fontWeight: 500,
      }}>/</kbd>
    </div>
  );
}
