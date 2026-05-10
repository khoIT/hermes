/**
 * Breadcrumb — auto-resolved from pathname against the route registry.
 * Last crumb is bold, non-link; preceding crumbs are NavLinks.
 */
import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { T, Icon } from '../../theme';
import { resolveBreadcrumb, type BreadcrumbGetters } from '../../utils/breadcrumb-resolver';
import { allFeatures } from '../../data/catalog/features';
import { allSegments } from '../../data/catalog/segments';
import { allCampaigns } from '../../data/catalog/campaigns';
import { listThreads } from '../../utils/chat-store';
import { listBoards, type Board } from '../../api/boards-client';

const featureMap = new Map(allFeatures.map(f => [f.name, f]));
const segmentMap = new Map(allSegments.map(s => [s.id, s]));
const campaignMap = new Map(allCampaigns.map(c => [c.id, c]));

// Boards are async — hydrate a module-level cache once and fall back to id.
const boardMap = new Map<string, Board>();
let boardsHydrated = false;
function hydrateBoards() {
  if (boardsHydrated) return;
  boardsHydrated = true;
  listBoards().then(bs => bs.forEach(b => boardMap.set(b.id, b))).catch(() => { boardsHydrated = false; });
}

const GETTERS: BreadcrumbGetters = {
  getFeature:  name => featureMap.get(name),
  getSegment:  id => segmentMap.get(id),
  getCampaign: id => campaignMap.get(id),
  getBoard:    id => boardMap.get(id),
  getThread:   id => listThreads().find(t => t.id === id),
};

export function Breadcrumb() {
  const { pathname } = useLocation();
  React.useEffect(() => { hydrateBoards(); }, []);
  const crumbs = React.useMemo(() => resolveBreadcrumb(pathname, GETTERS), [pathname]);

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        flex: 1, minWidth: 0, overflow: 'hidden',
        fontFamily: T.fSans, fontSize: 13,
      }}
    >
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <React.Fragment key={`${i}-${c.label}`}>
            {i > 0 && <Icon icon={ChevronRight} size={12} color={T.n400} />}
            {c.to && !isLast ? (
              <NavLink
                to={c.to}
                style={{
                  color: T.n600, textDecoration: 'none',
                  fontWeight: 500, whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 240,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = T.n900; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.n600; }}
              >
                {c.label}
              </NavLink>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                style={{
                  color: T.n950, fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 320, minWidth: 0,
                }}
              >
                {c.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
