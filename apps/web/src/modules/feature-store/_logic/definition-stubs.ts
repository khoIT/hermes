/**
 * Definition stub generators (Phase 4 register page).
 * Producing starter code for both substrates so authors can edit rather
 * than scaffold — copy reflects the latency tier + type chosen on the form.
 */
import type { HermesFeatureType, HermesLatencyTier } from '@hermes/contracts';

export function exprLangStub(
  name: string,
  type: HermesFeatureType,
  tier: HermesLatencyTier,
): string {
  if (tier === '<1s') {
    return [
      '# Substrate A — TEE online state at event arrival',
      'WHEN event.uid IS NOT NULL',
      `  THEN AGGREGATE(${name}, window='session')`,
      `ELSE @state.${name}`,
    ].join('\n');
  }
  return [
    '# Substrate A — read offline cache (batch feature)',
    `@cache.offline_${name}`,
  ].join('\n');
}

export function dbtSqlStub(
  name: string,
  type: HermesFeatureType,
  tier: HermesLatencyTier,
): string {
  const interval = tier === '<1d' ? '7' : '1';
  const isNumeric = type === 'int' || type === 'numeric';
  const aggregation = isNumeric
    ? `MAX(value) AS ${name}`
    : `LATEST_BY(value, ts) AS ${name}`;
  return [
    `-- Substrate B — Hatchet/Trino refresh tied to ${tier} cadence`,
    'SELECT',
    '  uid,',
    `  ${aggregation}`,
    'FROM {{ ref("fct_user_events") }}',
    `WHERE ds >= CURRENT_DATE - INTERVAL '${interval}' DAY`,
    'GROUP BY uid',
  ].join('\n');
}
