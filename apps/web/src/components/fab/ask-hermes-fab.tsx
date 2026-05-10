/**
 * AskHermesFab — floating bottom-right button.
 * Hidden on landing / chat / welcome routes (full chat experience available there).
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { T, Icon } from '../../theme';
import { usePanel } from '../../utils/panel-store';
import { useCurrentPageContext, shouldHideFab } from '../../utils/page-context';

export function AskHermesFab() {
  const { pathname } = useLocation();
  const { open, setOpen, setContext } = usePanel();
  const ctx = useCurrentPageContext();
  if (shouldHideFab(pathname)) return null;
  if (open) return null;

  const tooltip = ctx.type
    ? `Ask Hermes about this ${ctx.type}`
    : 'Ask Hermes';

  return (
    <button
      onClick={() => { setContext(ctx); setOpen(true); }}
      title={tooltip}
      aria-label={tooltip}
      style={{
        position: 'fixed', right: 24, bottom: 24, zIndex: 900,
        width: 52, height: 52, borderRadius: 9999,
        background: T.n900, color: '#fff',
        border: 'none', cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform .12s, background .12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = T.brand;
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = T.n900;
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <Icon icon={Sparkles} size={22} color="#fff" />
    </button>
  );
}
