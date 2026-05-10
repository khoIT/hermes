/**
 * Route table — chat-first IA. Root `/` is the chat landing, `/welcome` is
 * the moved dashboard. The former `/agents/*` routes are 301-style redirected
 * to either the chat landing or the canonical loss-streak thread.
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// -- Welcome (former Home, moved in Phase 10)
import WelcomePage from './modules/welcome/page';

// -- Chat module
import ChatLandingPage from './modules/chat/landing-page';
import ChatThreadPage from './modules/chat/thread-page';

// -- Sidebar stub modules
import PlaybooksListPage from './modules/playbooks/list-page';
import FunnelsListPage from './modules/funnels/list-page';
import RetentionsListPage from './modules/retentions/list-page';
import KnowledgePage from './modules/knowledge/page';
import DataPage from './modules/data/page';
import SettingsPage from './modules/settings/page';
import AccountPage from './modules/account/page';

// -- Boards (Phase 6)
import CanvasListPage from './modules/canvas/list-page';
import CanvasDetailPage from './modules/canvas/detail-page';

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
import { SegmentDetailLayout }  from './modules/segments/_components/detail-layout';
import { ComingSoon }           from './components/empty-state/coming-soon';

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

export function AppRoutes() {
  return (
    <Routes>
      {/* Chat landing at root */}
      <Route path="/" element={<ChatLandingPage />} />

      {/* Welcome — moved dashboard */}
      <Route path="/welcome" element={<WelcomePage />} />

      {/* Chat thread + index */}
      <Route path="/chat"     element={<ChatLandingPage />} />
      <Route path="/chat/:id" element={<ChatThreadPage />} />

      {/* Boards / Canvas */}
      <Route path="/canvas"           element={<CanvasListPage />} />
      <Route path="/canvas/:boardId"  element={<CanvasDetailPage />} />

      {/* Sidebar stub modules */}
      <Route path="/playbooks"   element={<PlaybooksListPage />} />
      <Route path="/funnels"     element={<FunnelsListPage />} />
      <Route path="/retentions"  element={<RetentionsListPage />} />
      <Route path="/knowledge"   element={<KnowledgePage />} />
      <Route path="/data"        element={<DataPage />} />
      <Route path="/settings"    element={<SettingsPage />} />
      <Route path="/account"     element={<AccountPage />} />

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
      {/* Segment detail — nested under SegmentDetailLayout for sub-tab strip */}
      <Route path="/segments/:id" element={<SegmentDetailLayout />}>
        <Route index               element={<SegmentsMonitoringPage />} />
        <Route path="threshold"    element={<SegmentsThresholdPage />} />
        <Route path="handoff"      element={<SegmentsHandoffPage />} />
        <Route path="monitoring"   element={<SegmentsMonitoringPage />} />
        <Route path="composition"  element={<ComingSoon title="Composition" body="Per-feature breakdown of who lands in this segment — cohort heatmap by tenure, drop-off curve by predicate clause, and overlap with sibling segments." />} />
        <Route path="users"        element={<ComingSoon title="Users" body="Sample of frozen UIDs in the latest build with last-event timestamps. Useful for spot-checking that the predicate is selecting the right people." />} />
        <Route path="campaigns"    element={<ComingSoon title="Campaigns" body="Cross-reference of every campaign that targets this segment — status, last send, observed lift." />} />
        <Route path="canvas"       element={<ComingSoon title="Canvas" body="Visual canvas view of the segment predicate — node-style representation of cascading clauses with feature pills." />} />
      </Route>

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

      {/* /agents/* — deleted; redirect to canonical surface */}
      <Route path="/agents/op/cfm-loss-streak" element={<Navigate to="/chat/thread-003" replace />} />
      <Route path="/agents/settings"           element={<Navigate to="/account" replace />} />
      <Route path="/agents/compose"            element={<Navigate to="/" replace />} />
      <Route path="/agents/op/:id"             element={<Navigate to="/" replace />} />
      <Route path="/agents/drafts"             element={<Navigate to="/" replace />} />
      <Route path="/agents/activity"           element={<Navigate to="/" replace />} />
      <Route path="/agents"                    element={<Navigate to="/" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
