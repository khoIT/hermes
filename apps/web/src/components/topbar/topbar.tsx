/**
 * Topbar — sticky 56px chrome inside <main>.
 * Layout: Breadcrumb (flex 1) | trailing slot | Search input (420) | Avatar.
 * Backdrop blur w/ opaque fallback; sits below CmdK modal portal (z 100+).
 */
import React from 'react';
import { T } from '../../theme';
import { Breadcrumb } from './breadcrumb';
import { SearchTrigger } from './search-trigger';
import { AvatarMenu } from './avatar-menu';
import { TopbarTrailingContext } from '../../utils/topbar-trailing-context';

interface TopbarProps {
  onSearchOpen: () => void;
}

export function Topbar({ onSearchOpen }: TopbarProps) {
  const { node: trailing } = React.useContext(TopbarTrailingContext);
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 20,
        height: 56, padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        background: T.topbar,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${T.n200}`,
        fontFamily: T.fSans,
      }}
    >
      <Breadcrumb />
      {trailing && (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {trailing}
        </div>
      )}
      <SearchTrigger onOpen={onSearchOpen} />
      <AvatarMenu />
    </header>
  );
}
