/**
 * Two-audience label policy for Hermes Feature Store v2 (Phase 2):
 *
 *   PM-facing (library, detail header, picker, predicate row, filter rail):
 *     `<1s` → Realtime
 *     `<1h` → Batch warm
 *     `<1d` → Batch cold
 *
 *   Engineer-facing (handoff modals, lineage detail rows, definition pane):
 *     Substrate A · Apollo TEE + Temporal
 *     Substrate B · Hatchet + Trino + Iceberg
 *
 * The architecture identifiers (A/B) are preserved on engineer surfaces per
 * PRD §6.1 + §10 (engineering reviewers must recognise the architecture from
 * the artifact). PMs see plain-English labels everywhere else.
 *
 * This file is the single source of truth — every consumer goes through these
 * maps. Adding a new latency tier? Update here and every callsite picks it up.
 */
import type { HermesLatencyTier, HermesSubstrate } from '@hermes/contracts';

/** PM-facing label for a given latency tier. */
export const TIER_LABEL: Record<HermesLatencyTier, string> = {
  '<1s': 'Realtime',
  '<1h': 'Batch warm',
  '<1d': 'Batch cold',
};

/** Tone identifier for tier-driven theming. */
export type LatencyTone = 'realtime' | 'warm' | 'cold';

export const TIER_TONE: Record<HermesLatencyTier, LatencyTone> = {
  '<1s': 'realtime',
  '<1h': 'warm',
  '<1d': 'cold',
};

/** Color tokens for each tone — pulled from theme palette. */
export const TIER_COLORS: Record<
  LatencyTone,
  { bg: string; fg: string; border: string }
> = {
  realtime: { bg: '#dcfce7', fg: '#15803d', border: '#86efac' }, // green-100/700/300
  warm: { bg: '#fef3c7', fg: '#b45309', border: '#fde68a' }, // amber-100/700/200
  cold: { bg: '#e2e8f0', fg: '#475569', border: '#cbd5e1' }, // slate-200/600/300
};

/** Engineer-facing long label retained in handoff modals + lineage detail. */
export const SUBSTRATE_LONG: Record<HermesSubstrate, string> = {
  A: 'Substrate A · Apollo TEE + Temporal',
  B: 'Substrate B · Hatchet + Trino + Iceberg',
};

/** Definition side-by-side pane header — preserves engineer signal. */
export const SUBSTRATE_PANE_LABEL: Record<HermesSubstrate, string> = {
  A: 'Substrate A · expr-lang',
  B: 'Substrate B · dbt SQL',
};
