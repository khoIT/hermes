/**
 * AnalyticsTab — Phase 3 v2 dashboard. 6 panels in a 2-column grid:
 *
 *   ┌──────────────────────┬──────────────────────┐
 *   │ Health snapshot      │ Freshness vs SLA     │
 *   ├──────────────────────┴──────────────────────┤
 *   │ Value distribution over time (full width)   │
 *   ├──────────────────────┬──────────────────────┤
 *   │ Top consuming camps  │ Online request rate  │
 *   ├──────────────────────┴──────────────────────┤
 *   │ Data quality (full width)                   │
 *   └─────────────────────────────────────────────┘
 *
 * Each panel reads from `feature.analytics` and renders empty-state when
 * `lastBackfillAt === null` (newly-registered features).
 */
import React from 'react';
import type { HermesFeature } from '@hermes/contracts';
import { DataQualityPanel } from './_analytics/data-quality-panel';
import { FreshnessVsSlaPanel } from './_analytics/freshness-vs-sla-panel';
import { HealthSnapshotPanel } from './_analytics/health-snapshot-panel';
import { OnlineRequestRatePanel } from './_analytics/online-request-rate-panel';
import { TopConsumingCampaignsPanel } from './_analytics/top-consuming-campaigns-panel';
import { ValueDistributionOverTimePanel } from './_analytics/value-distribution-over-time-panel';

interface AnalyticsTabProps {
  feature: HermesFeature;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ feature }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 16,
    }}
  >
    <HealthSnapshotPanel analytics={feature.analytics} />
    <FreshnessVsSlaPanel analytics={feature.analytics} latencyTier={feature.latencyTier} />
    <ValueDistributionOverTimePanel feature={feature} analytics={feature.analytics} />
    <TopConsumingCampaignsPanel analytics={feature.analytics} />
    <OnlineRequestRatePanel analytics={feature.analytics} />
    <DataQualityPanel analytics={feature.analytics} />
  </div>
);
