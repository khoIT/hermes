/**
 * Sidebar — 260px fixed left navigation. Replaces the old top Nav.
 * Items per brainstorm §3.2:
 *   Workspace pill · + New chat · All Chats · Feature Store · Boards
 *   · Playbooks · Segments · Funnels · Retentions · Campaigns · Knowledge
 *   · (divider) Data · Settings · Account
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

const SIDEBAR_WIDTH = 260;
const SIDEBAR_BG = '#F9F6F2';

export function Sidebar() {
  return (
    <aside
      style={{
        width: SIDEBAR_WIDTH,
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
      }}
    >
      {/* Workspace */}
      <WorkspacePill />

      {/* Scrollable nav region */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0 12px' }}>
        {/* Primary CTA */}
        <SidebarItem
          icon={Plus}
          label="New chat"
          to="/"
          matchPrefix="/__new_chat__"
          primary
        />

        {/* All Chats */}
        <SidebarSection
          id="chats"
          icon={Clock}
          label="All Chats"
          to="/chat"
          matchPrefix="/chat"
        >
          <RecentItems
            module="chats"
            seeAllTo="/chat"
            hrefFor={id => `/chat/${id}`}
          />
        </SidebarSection>

        {/* Feature Store */}
        <SidebarSection
          id="features"
          icon={Grid}
          label="Feature Store"
          to="/feature-store"
        >
          <RecentItems
            module="features"
            seeAllTo="/feature-store"
            hrefFor={name => `/feature-store/${name}`}
          />
        </SidebarSection>

        {/* Boards (NEW) */}
        <SidebarSection
          id="boards"
          icon={Layers}
          label="Boards"
          to="/canvas"
        >
          <RecentItems
            module="boards"
            seeAllTo="/canvas"
            hrefFor={id => `/canvas/${id}`}
          />
        </SidebarSection>

        {/* Playbooks (stub) */}
        <SidebarSection
          id="playbooks"
          icon={FileText}
          label="Playbooks"
          to="/playbooks"
          flat
        />

        {/* Segments */}
        <SidebarSection
          id="segments"
          icon={Users}
          label="Segments"
          to="/segments"
        >
          <RecentItems
            module="segments"
            seeAllTo="/segments"
            hrefFor={id => `/segments/${id}`}
          />
        </SidebarSection>

        {/* Funnels (stub) */}
        <SidebarSection id="funnels" icon={Filter} label="Funnels" to="/funnels" flat />

        {/* Retentions (stub) */}
        <SidebarSection id="retentions" icon={RefreshCw} label="Retentions" to="/retentions" flat />

        {/* Campaigns */}
        <SidebarSection
          id="campaigns"
          icon={Send}
          label="Campaigns"
          to="/campaigns"
        >
          <RecentItems
            module="campaigns"
            seeAllTo="/campaigns"
            hrefFor={id => `/campaigns/${id}`}
          />
        </SidebarSection>

        {/* Knowledge (stub) */}
        <SidebarSection id="knowledge" icon={BookOpen} label="Knowledge" to="/knowledge" flat />
      </nav>

      <BottomRow />
    </aside>
  );
}
