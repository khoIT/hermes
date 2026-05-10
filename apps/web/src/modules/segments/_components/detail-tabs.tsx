/**
 * DetailTabs — sticky sub-tab strip rendered just below the topbar
 * on segment detail pages. NavLinks point to existing routes; missing
 * tabs are stubbed via ComingSoon.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { T } from '../../../theme';

interface SegmentTab {
  label: string;
  /** Path segment after `/segments/:id` (or empty for Overview). */
  sub: string;
  end?: boolean;
}

const SEGMENT_TABS: SegmentTab[] = [
  { label: 'Overview',     sub: '',             end: true },
  { label: 'Composition',  sub: 'composition' },
  { label: 'Users',        sub: 'users' },
  { label: 'Predicate',    sub: 'predicate' },
  { label: 'Campaigns',    sub: 'campaigns' },
];

interface DetailTabsProps {
  segmentId: string;
}

export function DetailTabs({ segmentId }: DetailTabsProps) {
  return (
    <nav
      style={{
        position: 'sticky', top: 56, zIndex: 15,
        height: 40, padding: '0 24px',
        display: 'flex', alignItems: 'flex-end', gap: 4,
        background: 'rgba(249,246,242,0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: `1px solid rgba(0,0,0,0.06)`,
      }}
    >
      {SEGMENT_TABS.map(t => {
        const to = t.sub ? `/segments/${segmentId}/${t.sub}` : `/segments/${segmentId}`;
        return (
          <NavLink
            key={t.label}
            to={to}
            end={t.end}
            style={({ isActive }) => ({
              fontFamily: T.fSans, fontSize: 12.5,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? T.n950 : T.n600,
              padding: '8px 12px 9px',
              borderBottom: `2px solid ${isActive ? T.brand : 'transparent'}`,
              textDecoration: 'none',
              transition: 'color .12s, border-color .12s',
            })}
          >
            {t.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
