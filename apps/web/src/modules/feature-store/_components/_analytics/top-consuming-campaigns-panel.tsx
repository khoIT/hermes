/**
 * TopConsumingCampaignsPanel — top-3 campaigns by fire count over 180d.
 * Each row: rank · campaign ID (mono, navigates to campaign) · game chip ·
 * fire count formatted (1.2M / 800K).
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../../../theme';
import type { FeatureAnalytics180d } from '@hermes/contracts';
import { GAME_TINT } from '../../../../components/_logic/game-colors';
import { formatCount } from './_logic/format-freshness';
import { PanelShell } from './panel-shell';

interface TopConsumingCampaignsPanelProps {
  analytics: FeatureAnalytics180d;
}

export const TopConsumingCampaignsPanel: React.FC<TopConsumingCampaignsPanelProps> = ({
  analytics,
}) => {
  const navigate = useNavigate();
  const top = analytics.topConsumingCampaigns;
  const empty = top.length === 0;

  return (
    <PanelShell title="Top consuming campaigns">
      {empty ? (
        <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, fontStyle: 'italic' }}>
          No campaign consumption recorded.
        </div>
      ) : (
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {top.map((c, i) => {
            const tint = GAME_TINT[c.game];
            return (
              <li
                key={c.campaignId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 11,
                    color: T.n400,
                    minWidth: 16,
                  }}
                >
                  {i + 1}.
                </span>
                <button
                  onClick={() =>
                    navigate(`/campaigns/${encodeURIComponent(c.campaignId)}`)
                  }
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 12,
                    fontWeight: 600,
                    color: T.brand,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {c.campaignId}
                </button>
                <span
                  style={{
                    fontFamily: T.fMono,
                    fontWeight: 700,
                    fontSize: 9,
                    padding: '1px 5px',
                    background: tint.bg,
                    color: tint.fg,
                    border: `1px solid ${tint.border}`,
                    borderRadius: 3,
                  }}
                >
                  {tint.label}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: T.fMono,
                    fontSize: 12,
                    color: T.n800,
                    fontWeight: 600,
                  }}
                >
                  {formatCount(c.fires180d)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </PanelShell>
  );
};
