/**
 * Sidebar — 260px (expanded) / 60px (icon rail) fixed left navigation.
 * Collapsed state persists in localStorage and is read synchronously on mount
 * so there's no width flash. Items per brainstorm §3.2.
 */
import React from 'react';
import {
  Plus, Clock, Grid, Layers, FileText, Users,
  Filter, RefreshCw, Send, BookOpen,
} from 'lucide-react';
import { T } from '../../theme';
import { SidebarSection } from './sidebar-section';
import { SidebarItem } from './sidebar-item';
import { RecentItems } from './recent-items';
import { WorkspacePill } from './workspace-pill';
import { BottomRow } from './bottom-row';
import { getCollapsed, onCollapsedChange } from '../../utils/sidebar-collapsed-store';

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 60;
const SIDEBAR_BG = '#F9F6F2';

export function Sidebar() {
  // Synchronous initial read — avoids hydration flash from 260 → 60.
  const [collapsed, setCollapsedState] = React.useState<boolean>(() => getCollapsed());

  React.useEffect(() => onCollapsedChange(setCollapsedState), []);

  const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <aside
      style={{
        width,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        background: SIDEBAR_BG,
        borderRight: `1px solid rgba(0,0,0,0.06)`,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: T.fSans,
        overflow: 'hidden',
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

        <SidebarSection
          id="features"
          icon={Grid}
          label="Feature Store"
          to="/feature-store"
          collapsed={collapsed}
        >
          <RecentItems
            module="features"
            seeAllTo="/feature-store"
            hrefFor={name => `/feature-store/${name}`}
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
          id="playbooks"
          icon={FileText}
          label="Playbooks"
          to="/playbooks"
          flat
          collapsed={collapsed}
        />

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
          />
        </SidebarSection>

        <SidebarSection id="funnels" icon={Filter} label="Funnels" to="/funnels" flat collapsed={collapsed} />
        <SidebarSection id="retentions" icon={RefreshCw} label="Retentions" to="/retentions" flat collapsed={collapsed} />

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

        <SidebarSection id="knowledge" icon={BookOpen} label="Knowledge" to="/knowledge" flat collapsed={collapsed} />
      </nav>

      <BottomRow collapsed={collapsed} />
    </aside>
  );
}
