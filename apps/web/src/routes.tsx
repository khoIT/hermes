/**
 * Route table — all 23 PRD screen IDs mapped to placeholder page components.
 * URL scheme per phase-05-web-shell.md implementation step 1.
 *
 * Screen IDs:
 *  00 home
 *  01 fs_library         /feature-store
 *  02 fs_detail          /feature-store/:name
 *  (explore stub)        /explore
 *  03 seg_library        /segments
 *  04 seg_canvas         /segments/new
 *  05 seg_threshold_deep /segments/:id/threshold
 *  06 seg_handoff        /segments/:id/handoff
 *  07 seg_monitoring     /segments/:id
 *  08 seg_patterns       /segments/patterns
 *  09 cmp_library        /campaigns
 *  10 cmp_canvas_rt      /campaigns/new/realtime
 *  11 cmp_canvas_sched   /campaigns/new/scheduled
 *  12 cmp_canvas_onetime /campaigns/new/onetime
 *  13 cmp_journey        /campaigns/:id/journey
 *  14 cmp_prelaunch      /campaigns/:id/prelaunch
 *  15 cmp_handoff        /campaigns/:id/handoff
 *  16 cmp_monitoring     /campaigns/:id
 *  17 cmp_patterns       /campaigns/patterns
 *  18 ag_inbox           /agents
 *  19 ag_op_detail       /agents/op/:id
 *  20 ag_drafts          /agents/drafts
 *  21 ag_activity        /agents/activity
 *  22 ag_settings        /agents/settings
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// -- Module: Home
import HomePage from './modules/home/page';

// -- Module 01: Feature Store
import FeatureStoreLibraryPage  from './modules/feature-store/library';
import FeatureStoreDetailPage   from './modules/feature-store/detail';
import FeatureStoreRegisterPage from './modules/feature-store/register';

// -- Module 02: Explore
import ExploreStubPage from './modules/explore/stub';

// -- Module 03: Segments
import SegmentsLibraryPage      from './modules/segments/library';
import SegmentsCanvasPage       from './modules/segments/canvas';
import SegmentsThresholdPage    from './modules/segments/threshold-deep';
import SegmentsHandoffPage      from './modules/segments/handoff-modal';
import SegmentsMonitoringPage   from './modules/segments/monitoring';
import SegmentsPatternsPage     from './modules/segments/patterns';

// -- Module 04: Campaigns
import CampaignsLibraryPage     from './modules/campaigns/library';
import CampaignCanvasRealtimePage  from './modules/campaigns/canvas/realtime';
import CampaignCanvasScheduledPage from './modules/campaigns/canvas/scheduled';
import CampaignCanvasOnetimePage   from './modules/campaigns/canvas/onetime';
import CampaignJourneyPage      from './modules/campaigns/journey';
import CampaignPrelaunchPage    from './modules/campaigns/prelaunch';
import CampaignHandoffPage      from './modules/campaigns/handoff-modal';
import CampaignMonitoringPage   from './modules/campaigns/monitoring';
import CampaignsPatternsPage    from './modules/campaigns/patterns';

// -- Module 05: Agents
import AgentsInboxPage          from './modules/agents/inbox';
import AgentsOpportunityDetailPage from './modules/agents/opportunity-detail';
import AgentsDraftsPage         from './modules/agents/drafts';
import AgentsActivityPage       from './modules/agents/activity';
import AgentsSettingsPage       from './modules/agents/settings';

export function AppRoutes() {
  return (
    <Routes>
      {/* 00 — Home */}
      <Route path="/" element={<HomePage />} />

      {/* 01-02 — Feature Store */}
      <Route path="/feature-store"       element={<FeatureStoreLibraryPage />} />
      <Route path="/feature-store/new"   element={<FeatureStoreRegisterPage />} />
      <Route path="/feature-store/:name" element={<FeatureStoreDetailPage />} />

      {/* Explore — nav-only stub */}
      <Route path="/explore" element={<ExploreStubPage />} />

      {/* 03-08 — Segments */}
      <Route path="/segments"                    element={<SegmentsLibraryPage />} />
      <Route path="/segments/new"                element={<SegmentsCanvasPage />} />
      <Route path="/segments/patterns"           element={<SegmentsPatternsPage />} />
      <Route path="/segments/:id/threshold"      element={<SegmentsThresholdPage />} />
      <Route path="/segments/:id/handoff"        element={<SegmentsHandoffPage />} />
      <Route path="/segments/:id"                element={<SegmentsMonitoringPage />} />

      {/* 09-17 — Campaigns */}
      <Route path="/campaigns"                    element={<CampaignsLibraryPage />} />
      <Route path="/campaigns/new/realtime"       element={<CampaignCanvasRealtimePage />} />
      <Route path="/campaigns/new/scheduled"      element={<CampaignCanvasScheduledPage />} />
      <Route path="/campaigns/new/onetime"        element={<CampaignCanvasOnetimePage />} />
      <Route path="/campaigns/patterns"           element={<CampaignsPatternsPage />} />
      <Route path="/campaigns/:id/journey"        element={<CampaignJourneyPage />} />
      <Route path="/campaigns/:id/prelaunch"      element={<CampaignPrelaunchPage />} />
      <Route path="/campaigns/:id/handoff"        element={<CampaignHandoffPage />} />
      <Route path="/campaigns/:id"                element={<CampaignMonitoringPage />} />

      {/* 18-22 — Agents */}
      <Route path="/agents"             element={<AgentsInboxPage />} />
      <Route path="/agents/drafts"      element={<AgentsDraftsPage />} />
      <Route path="/agents/activity"    element={<AgentsActivityPage />} />
      <Route path="/agents/settings"    element={<AgentsSettingsPage />} />
      <Route path="/agents/op/:id"      element={<AgentsOpportunityDetailPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
