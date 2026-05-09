/**
 * Campaign builder — derive a CampaignTemplate for the current session by
 * starting from the matched playbook's template (if any) and folding in
 * audience size + threshold values from the approved features.
 */
import type { ComposeSession, CampaignTemplate } from './compose-types';
import { getPlaybookById } from '../../../../data/catalog/agents/compose-playbooks';

export function buildCampaignTemplate(session: ComposeSession): CampaignTemplate | null {
  if (!session.matchedPlaybook) return null;
  const pb = getPlaybookById(session.matchedPlaybook);
  if (!pb || !pb.campaignTemplate) return null;

  const t = pb.campaignTemplate;
  const audience = session.stages.segment.audienceCount;
  const headline = session.stages.features.approved.find((r) => r.isHeadline);
  const headlineThreshold = headline
    ? `${headline.threshold.op} ${headline.threshold.value}`
    : null;

  const finalHeadline = headline && typeof headline.threshold.value === 'number'
    ? t.headline.replace(/loses 5 in a row/i, `crosses ${headline.featureId} ${headlineThreshold}`)
    : t.headline;

  return {
    ...t,
    headline: finalHeadline,
    fireMetrics: audience != null ? {
      ...t.fireMetrics,
      forecastDailyFires: `~${Math.round(audience * 0.15).toLocaleString()}/day`,
    } : t.fireMetrics,
  };
}
