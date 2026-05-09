/**
 * SuggestedNext — AI block in the right rail.
 * Shows hardcoded feature suggestions based on the current predicate pattern.
 * Attribution footer per Agentic §6.2.
 * Per PRD §8.3 Region 4.
 */
import React from 'react';
import { T } from '../../../theme';
import { allFeatures } from '../../../data/catalog/features/index';
import type { HermesFeature } from '@hermes/contracts';
import { LatencyBadge } from '../../../components/latency-badge';

/** Hardcoded suggestions per Agentic §8.3 — keyed by anchor feature */
const SUGGESTIONS_BY_FEATURE: Record<string, string[]> = {
  consecutive_ranked_losses_streak: ['tenure_days_total', 'gem_balance_log10', 'mmr_drift_3d'],
  spend_tier_lifetime:              ['cf_coin_balance_current', 'purchase_count_30d', 'vip_status'],
  last_login_days_ago:              ['session_count_7d', 'is_returning_after_lapse', 'daily_login_streak_current'],
  account_age_days:                 ['player_lifecycle_stage', 'lifetime_login_count', 'ranked_match_count_30d'],
  is_paying_user_lifetime:          ['spend_tier_lifetime', 'purchase_count_30d', 'annual_contribution_tier'],
};

const FALLBACK_SUGGESTIONS = [
  'last_login_days_ago', 'session_count_30d', 'spend_tier_lifetime',
];

interface Props {
  /** Features currently in the predicate */
  activeFeatures: string[];
  onAddFeature?: (feature: string, featureType: string) => void;
  onOpenReasoningPanel?: () => void;
}

export const SuggestedNext = React.memo<Props>(({
  activeFeatures, onAddFeature, onOpenReasoningPanel,
}) => {
  const suggestions = React.useMemo<HermesFeature[]>(() => {
    // Find first anchor feature match
    for (const feat of activeFeatures) {
      const candidates = SUGGESTIONS_BY_FEATURE[feat];
      if (candidates) {
        return candidates
          .filter(c => !activeFeatures.includes(c))
          .map(c => allFeatures.find(f => f.name === c))
          .filter((f): f is HermesFeature => f != null)
          .slice(0, 3);
      }
    }
    // Fallback
    return FALLBACK_SUGGESTIONS
      .filter(c => !activeFeatures.includes(c))
      .map(c => allFeatures.find(f => f.name === c))
      .filter((f): f is HermesFeature => f != null);
  }, [activeFeatures]);

  if (!suggestions.length) return null;

  return (
    <div style={{
      border: `1px solid ${T.brandBorder}`,
      borderRadius: 8, background: T.brandSoft,
      padding: '10px 12px',
    }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
        color: T.brand, textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>✦</span> Suggested next
      </div>

      <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600, margin: '0 0 8px', lineHeight: 1.4 }}>
        Based on your current predicate pattern:
      </p>

      {suggestions.map(feat => (
        <div
          key={feat.name}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 0',
            borderBottom: `1px solid ${T.brandBorder}`,
          }}
        >
          <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n900, flex: 1 }}>
            {feat.name}
          </span>
          <LatencyBadge tier={feat.latencyTier} substrate={feat.substrate ?? 'B'} />
          {onAddFeature && (
            <button
              onClick={() => onAddFeature(feat.name, feat.type)}
              style={{
                fontFamily: T.fSans, fontSize: 10, color: T.brand,
                background: 'none', border: `1px solid ${T.brandBorder}`,
                borderRadius: 4, padding: '1px 7px', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.brand; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.brand; }}
            >
              + Add
            </button>
          )}
        </div>
      ))}

      {/* Agentic §6.2 attribution footer */}
      <div style={{
        marginTop: 8, paddingTop: 6, borderTop: `1px solid ${T.brandBorder}`,
        fontFamily: T.fSans, fontSize: 10, color: T.n500,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>Powered by <strong style={{ color: T.brand }}>Authoring Agent</strong></span>
        {onOpenReasoningPanel && (
          <button
            onClick={onOpenReasoningPanel}
            style={{
              fontFamily: T.fMono, fontSize: 10, color: T.brand,
              background: 'none', border: 'none', padding: 0,
              cursor: 'pointer', textDecoration: 'underline',
              textDecorationStyle: 'dotted',
            }}
          >
            View reasoning →
          </button>
        )}
      </div>
    </div>
  );
});
SuggestedNext.displayName = 'SuggestedNext';
