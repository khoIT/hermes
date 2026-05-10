/**
 * Welcome — LiveOps cockpit. Hybrid hero + KPI strip + 8/4 body
 * (Active campaigns left, Start something + Recent threads right).
 *
 * Brainstorm: plans/reports/brainstorm-260510-1233-welcome-page-cockpit.md
 */
import React from 'react';
import { T } from '../../theme';
import { HeroStrip } from './hero-strip';
import { KpiStrip } from './kpi-strip';
import { ActiveCampaignsPanel } from './active-campaigns-panel';
import { StartSomethingPanel } from './start-something-panel';
import { RecentThreadsPanel } from './recent-threads-panel';

export default function WelcomePage() {
  return (
    <div style={{
      padding: '32px 48px 56px',
      maxWidth: 1240,
      margin: '0 auto',
      fontFamily: T.fSans,
    }}>
      <HeroStrip />
      <div style={{ marginBottom: 20 }}>
        <KpiStrip />
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
        gap: 20,
        alignItems: 'flex-start',
      }}>
        <ActiveCampaignsPanel />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <StartSomethingPanel />
          <RecentThreadsPanel />
        </div>
      </div>
    </div>
  );
}
