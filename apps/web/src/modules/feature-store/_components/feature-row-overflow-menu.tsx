/**
 * FeatureRowOverflowMenu — anchored popover triggered by the row's `⋯`
 * button. Items: Pin/Unpin · View detail · Used by · Add to draft segment.
 * Click outside or Esc closes; row clicks are stopPropagation'd by callers.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Star, Eye, Link2, Plus } from 'lucide-react';
import { T, Icon } from '../../../theme';
import type { HermesFeature } from '@hermes/contracts';
import type { FeatureUsage } from '../_logic/usage-count';

interface FeatureRowOverflowMenuProps {
  feature: HermesFeature;
  usage: FeatureUsage;
  isPinned: boolean;
  onTogglePin: () => void;
  /** Forced visibility (e.g. parent row hover). Menu stays open even when false once toggled. */
  visible?: boolean;
}

export function FeatureRowOverflowMenu({
  feature, usage, isPinned, onTogglePin, visible,
}: FeatureRowOverflowMenuProps) {
  const navigate = useNavigate();
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

  const usedByCount = usage.segmentCount + usage.campaignCount;
  const usedByLabel = usedByCount > 0
    ? `Used by (${usage.segmentCount}s · ${usage.campaignCount}c)`
    : 'Used by (none)';

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex' }}
      onClick={e => e.stopPropagation()}
    >
      <button
        type="button"
        title="More actions"
        aria-label="More actions"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: 4,
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: T.n500,
          opacity: open || visible ? 1 : 0,
          transition: 'opacity .12s, background .12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon icon={MoreHorizontal} size={14} />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', right: 0,
            minWidth: 200, background: '#fff',
            border: `1px solid ${T.n200}`, borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            padding: '4px 0', zIndex: 60,
            fontFamily: T.fSans,
          }}
        >
          <MenuRow
            icon={Star}
            label={isPinned ? 'Unpin' : 'Pin'}
            onClick={() => { setOpen(false); onTogglePin(); }}
          />
          <MenuRow
            icon={Eye}
            label="View detail"
            onClick={() => {
              setOpen(false);
              navigate(`/feature-store/${encodeURIComponent(feature.name)}`);
            }}
          />
          <MenuRow
            icon={Link2}
            label={usedByLabel}
            disabled={usedByCount === 0}
            onClick={() => {
              setOpen(false);
              navigate(`/feature-store/${encodeURIComponent(feature.name)}#used-by`);
            }}
          />
          <MenuRow
            icon={Plus}
            label="Add to draft segment"
            disabled
            title="No draft in progress"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

interface MenuRowProps {
  icon: typeof Star;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}

function MenuRow({ icon, label, onClick, disabled, title }: MenuRowProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={e => { e.stopPropagation(); if (!disabled) onClick(); }}
      title={title}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 12px',
        background: 'transparent', border: 'none',
        fontFamily: T.fSans, fontSize: 12.5,
        color: disabled ? T.n400 : T.n800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = T.n50; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon icon={icon} size={13} color={disabled ? T.n400 : T.n600} />
      {label}
    </button>
  );
}
