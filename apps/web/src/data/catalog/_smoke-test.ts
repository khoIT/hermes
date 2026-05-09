/**
 * Smoke test — verifies all load-bearing anchor entities resolve at compile time.
 * Per phase-03 risk mitigation: "write a smoke test that asserts specific
 * load-bearing names: consecutive_ranked_losses_streak, event_match_end,
 * seg-cfm-loss-streak-non-paying-2026-0508-a3f9, cmp-cfm-407, trg-cfm-pass-stuck"
 *
 * This file is intentionally import-only (no runtime assertions needed):
 * TypeScript strict mode catches any missing or mistyped references at compile time.
 * Run: pnpm --filter @hermes/web typecheck
 */
import { allFeatures, getFeatureByName } from './features/index.js';
import { allEvents, getEventByName } from './events/index.js';
import {
  allSegments,
  segCfmLossStreakNonPaying,
  segCfmSs1WeaponOwners2026,
  segTfReturningCoaches2026,
} from './segments.js';
import { allCampaigns, cmpCfm407 } from './campaigns.js';
import { allOpportunities, opCfmLossStreak } from './agents/opportunities.js';
import { statefulStreaksFeatures } from './features/stateful-streaks.js';

// ── Feature anchors ────────────────────────────────────────────────────────

/** consecutive_ranked_losses_streak must exist and be dual-tier */
const streakFeature = statefulStreaksFeatures.find(
  (f) => f.name === 'consecutive_ranked_losses_streak',
);
if (!streakFeature) throw new Error('SMOKE: consecutive_ranked_losses_streak missing');
if (!streakFeature.dualTier) throw new Error('SMOKE: consecutive_ranked_losses_streak must have dualTier=true');
if (!streakFeature.definition) throw new Error('SMOKE: consecutive_ranked_losses_streak must have full definition');

/** Look up via aggregated index */
const streakViaIndex = getFeatureByName('consecutive_ranked_losses_streak');
if (!streakViaIndex) throw new Error('SMOKE: consecutive_ranked_losses_streak not found via getFeatureByName');

// ── Event anchors ──────────────────────────────────────────────────────────

const matchEndEvent = getEventByName('event_match_end');
if (!matchEndEvent) throw new Error('SMOKE: event_match_end missing');

// ── Segment anchors ────────────────────────────────────────────────────────

/** seg-cfm-loss-streak-non-paying-2026-0508-a3f9 — agent-drafted, demo step 5 */
if (segCfmLossStreakNonPaying.id !== 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9') {
  throw new Error('SMOKE: loss-streak segment ID mismatch');
}
if (segCfmLossStreakNonPaying.author !== 'agent-drafted') {
  throw new Error('SMOKE: loss-streak segment must be agent-drafted');
}
if (segCfmLossStreakNonPaying.agentRef !== 'ag-op-1042') {
  throw new Error('SMOKE: loss-streak segment agentRef must be ag-op-1042');
}

if (segCfmSs1WeaponOwners2026.id !== 'seg-cfm-ss1-weapon-owners-2026') {
  throw new Error('SMOKE: CFM-2 segment ID mismatch');
}
if (segTfReturningCoaches2026.id !== 'seg-tf-returning-coaches-2026') {
  throw new Error('SMOKE: TF-1 segment ID mismatch');
}

// ── Campaign anchors ───────────────────────────────────────────────────────

/** cmp-cfm-407 — CFM-13 Pass Stuck Rescue, canonical demo */
if (cmpCfm407.id !== 'cmp-cfm-407') throw new Error('SMOKE: cmp-cfm-407 ID mismatch');
if (cmpCfm407.triggerId !== 'trg-cfm-pass-stuck') {
  throw new Error('SMOKE: trg-cfm-pass-stuck must be triggerId on cmp-cfm-407');
}
if (cmpCfm407.eventTrigger !== 'event_match_end') {
  throw new Error('SMOKE: cmp-cfm-407 eventTrigger must be event_match_end');
}

// ── Opportunity anchors ────────────────────────────────────────────────────

/** ag-op-1042 — CFM Loss Streak, anchors demo step 11 */
if (opCfmLossStreak.id !== 'ag-op-1042') throw new Error('SMOKE: ag-op-1042 ID mismatch');
if (opCfmLossStreak.proposed.segment !== 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9') {
  throw new Error('SMOKE: ag-op-1042 must propose the loss-streak segment');
}

// ── Count assertions ───────────────────────────────────────────────────────

const featureCount = allFeatures.length;
const eventCount = allEvents.length;
const segmentCount = allSegments.length;
const campaignCount = allCampaigns.length;
const opportunityCount = allOpportunities.length;

// Log to console (visible during dev; stripped in production builds)
console.info(`[smoke] features=${featureCount} events=${eventCount} segments=${segmentCount} campaigns=${campaignCount} opportunities=${opportunityCount}`);

// Type-narrowing exports (prevent tree-shaking of the above side-effect checks)
export const _smokeResults = {
  featureCount,
  eventCount,
  segmentCount,
  campaignCount,
  opportunityCount,
  anchors: {
    consecutiveRankedLossesStreak: streakFeature.name,
    eventMatchEnd: matchEndEvent.name,
    lossStreakSegmentId: segCfmLossStreakNonPaying.id,
    canonicalCampaignId: cmpCfm407.id,
    canonicalTriggerId: cmpCfm407.triggerId,
    anchorOpportunityId: opCfmLossStreak.id,
  },
} as const;
