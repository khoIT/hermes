/**
 * Welcome page synthetic metrics — single source of truth for per-campaign
 * lift/sparkline + drift flags. Pure data, no React.
 */

/**
 * Per-campaign performance fixture. `weekLift` is %, null means "measuring".
 * `sparkBars` is 8 normalized values 0..1 for the bar sparkline viz.
 */
export interface CampaignFixture {
  weekLift: number | null;
  sparkBars: number[];
}

export const CAMPAIGN_FIXTURES: Record<string, CampaignFixture> = {
  // CFM-13 Pass Stuck Rescue — anchor demo, strong lift
  'cmp-cfm-407': {
    weekLift: 8.2,
    sparkBars: [0.30, 0.45, 0.55, 0.50, 0.65, 0.70, 0.85, 0.95],
  },
  // CFM-11 Lễ Hội Cuối Năm — scheduled, moderate
  'cmp-cfm-411': {
    weekLift: 3.1,
    sparkBars: [0.40, 0.55, 0.50, 0.60, 0.65, 0.70, 0.75, 0.78],
  },
  // CFM-18 Low CF Coin — revenue, big lift
  'cmp-cfm-408': {
    weekLift: 12.4,
    sparkBars: [0.35, 0.50, 0.62, 0.68, 0.78, 0.85, 0.95, 1.00],
  },
  // TF-1 Football Hub — measuring
  'cmp-tf-001': {
    weekLift: null,
    sparkBars: [0.20, 0.25, 0.22, 0.28, 0.24, 0.30, 0.26, 0.32],
  },
};

/**
 * Segment IDs flagged as drifting (audience size envelope breach).
 * Surfaced in the "Drift signals" KPI tile.
 */
export const DRIFT_SEGMENT_IDS = new Set<string>([
  'seg-cfm-rfm-tier-1-2026',
]);

/**
 * Drift detail for the KPI sub-caption (single most recent).
 */
export const DRIFT_HEADLINE = {
  segmentId: 'seg-cfm-rfm-tier-1-2026',
  segmentName: 'CFM EoY · Tier 1 NRU',
  reason: '+18% above expected envelope · 2d',
};

/**
 * Recent total reach across active campaigns (synthetic rollup).
 * Hardcoded to keep KPI tile deterministic regardless of catalog changes.
 */
export const AUDIENCE_REACHED_THIS_WEEK = 342_000;
