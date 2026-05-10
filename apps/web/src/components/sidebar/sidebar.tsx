/**
 * Sidebar — 260px (expanded) / 60px (icon rail) fixed left navigation.
 * Collapsed state persists in localStorage and is read synchronously on mount
 * so there's no width flash. Items per brainstorm §3.2.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus, Clock, Layers, FileText, Users,
  Filter, RefreshCw, Send, BookOpen, MoreHorizontal,
} from 'lucide-react';
import { T } from '../../theme';
import { SidebarSection } from './sidebar-section';
import { SidebarItem } from './sidebar-item';
import { RecentItems } from './recent-items';
import { WorkspacePill } from './workspace-pill';
import { BottomRow } from './bottom-row';
import { SidebarFeatureStoreSection } from './sidebar-feature-store-section';
import { CollapseToggle } from './collapse-toggle';
import { getCollapsed, onCollapsedChange } from '../../utils/sidebar-collapsed-store';
import { getSidebarSectionForPath, setSectionExpanded } from '../../utils/recent-items-store';
import { allSegments } from '../../data/catalog/segments';

const CANONICAL_SEGMENT_IDS = new Set(allSegments.map(s => s.id));

/**
 * Filter for the segments recent-items list — drops "dangling" entries:
 *   - URL-only visits whose title fell back to the id (title === id)
 *   - ad-hoc backend ids (`s_<digits>`) that aren't in the canonical catalog
 *   - stub ids (`seg-stub-<...>`) from offline createSegment fallback
 * Real chat-action-card creations land in the catalog (or carry a real
 * displayName from the action card's name field) and pass through.
 */
function isCanonicalSegmentRecent(item: { id: string; title: string }): boolean {
  if (CANONICAL_SEGMENT_IDS.has(item.id)) return true;
  if (item.title === item.id) return false;
  if (/^s_\d+$/.test(item.id)) return false;
  if (item.id.startsWith('seg-stub-')) return false;
  return true;
}

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 60;
const SIDEBAR_BG = '#F9F6F2';

export function Sidebar() {
  // Synchronous initial read — avoids hydration flash from 260 → 60.
  const [collapsed, setCollapsedState] = React.useState<boolean>(() => getCollapsed());

  React.useEffect(() => onCollapsedChange(setCollapsedState), []);

  // Auto-expand the matching section when the route changes.
  // One-shot: writes to localStorage so the section re-reads its persisted state,
  // then notifies mounted sections via a custom event. User can still collapse
  // manually after — the next route change to the same section will re-open it.
  const { pathname } = useLocation();
  React.useEffect(() => {
    const sectionId = getSidebarSectionForPath(pathname);
    if (sectionId) {
      setSectionExpanded(sectionId, true);
      window.dispatchEvent(new Event('hermes:sidebar-expand-changed'));
    }
  }, [pathname]);

  const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <aside
      style={{
        width,
        flexShrink: 0,
        height: '100%',
        background: SIDEBAR_BG,
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: T.fSans,
        // overflow:visible lets the seam <CollapseToggle/> pop outside the
        // right edge as a round button. Inner <nav> manages its own scroll.
        overflow: 'visible',
        position: 'relative',
        transition: 'width 0.16s ease',
        willChange: 'width',
      }}
    >
      {/* Workspace */}
      <WorkspacePill collapsed={collapsed} />

      {/* Scrollable nav region */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '4px 0 12px' }}>
        {/* Primary CTA */}
        <SidebarItem
          icon={Plus}
          label="New chat"
          to="/"
          matchPrefix="/__new_chat__"
          primary
          collapsed={collapsed}
        />

        <SidebarSection
          id="chats"
          icon={Clock}
          label="All Chats"
          to="/chat"
          matchPrefix="/chat"
          collapsed={collapsed}
        >
          <RecentItems
            module="chats"
            seeAllTo="/chat"
            hrefFor={id => `/chat/${id}`}
          />
        </SidebarSection>

        {/* Primary modules — ordered Feature Store, Segments, Boards, Campaigns. */}
        <SidebarFeatureStoreSection collapsed={collapsed} />

        <SidebarSection
          id="segments"
          icon={Users}
          label="Segments"
          to="/segments"
          collapsed={collapsed}
        >
          <RecentItems
            module="segments"
            seeAllTo="/segments"
            hrefFor={id => `/segments/${id}`}
            filter={isCanonicalSegmentRecent}
          />
        </SidebarSection>

        <SidebarSection
          id="boards"
          icon={Layers}
          label="Boards"
          to="/canvas"
          collapsed={collapsed}
        >
          <RecentItems
            module="boards"
            seeAllTo="/canvas"
            hrefFor={id => `/canvas/${id}`}
          />
        </SidebarSection>

        <SidebarSection
          id="campaigns"
          icon={Send}
          label="Campaigns"
          to="/campaigns"
          collapsed={collapsed}
        >
          <RecentItems
            module="campaigns"
            seeAllTo="/campaigns"
            hrefFor={id => `/campaigns/${id}`}
          />
        </SidebarSection>

        {/* Advanced Features group — Playbooks, Funnels, Retentions, Knowledge live here.
            Pure expand-only header (no `to`) so the row toggles in place. The label
            disappears once expanded so the four sub-items read as a clean module list. */}
        <SidebarSection
          id="advanced-features"
          icon={MoreHorizontal}
          label="Advanced Features"
          collapsed={collapsed}
          hideLabelWhenExpanded
        >
          <SidebarItem icon={FileText}  label="Playbooks"  to="/playbooks"  indent />
          <SidebarItem icon={Filter}    label="Funnels"    to="/funnels"    indent />
          <SidebarItem icon={RefreshCw} label="Retentions" to="/retentions" indent />
          <SidebarItem icon={BookOpen}  label="Knowledge"  to="/knowledge"  indent />
        </SidebarSection>
      </nav>

      <BottomRow collapsed={collapsed} />

      {/* Seam-hover collapse button — absolute, pops outside the aside's
          right edge. Hidden by default; revealed on hover of the seam strip. */}
      <CollapseToggle collapsed={collapsed} />
    </aside>
  );
}
