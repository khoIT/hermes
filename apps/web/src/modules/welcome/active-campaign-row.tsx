/**
 * Active campaign row — italic display name + mono ID/trigger,
 * 4R chip, bar sparkline, lift %. Click → /campaigns/:id.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { HermesCampaign, HermesCampaignGoal4r, HermesTriggerType } from '@hermes/contracts';
import { T, Badge } from '../../theme';
import { BarSparkline } from './bar-sparkline';
import type { CampaignFixture } from '../../data/catalog/_welcome-fixtures';

interface ActiveCampaignRowProps {
  campaign: HermesCampaign;
  fixture?: CampaignFixture;
  showDivider?: boolean;
}

const GOAL_VARIANT: Record<HermesCampaignGoal4r, 'info' | 'destructive' | 'warning' | 'success'> = {
  retain: 'info',
  revenue: 'destructive',
  reactivate: 'warning',
  recruit: 'success',
};

const GOAL_LABEL: Record<HermesCampaignGoal4r, string> = {
  retain: 'Retain',
  revenue: 'Revenue',
  reactivate: 'Reactivate',
  recruit: 'Recruit',
};

const TRIGGER_LABEL: Record<HermesTriggerType, string> = {
  'one-time': 'One-time',
  'scheduled': 'Scheduled',
  'real-time': 'Real-time',
  'hybrid': 'Hybrid',
};

export const ActiveCampaignRow = React.memo<ActiveCampaignRowProps>(({
  campaign, fixture, showDivider,
}) => {
  const navigate = useNavigate();
  const [hover, setHover] = React.useState(false);
  const lift = fixture?.weekLift ?? null;
  const measuring = lift === null;
  const liftColor = measuring
    ? T.n500
    : (lift! >= 0 ? T.green600 : T.red600);
  const liftText = measuring
    ? 'measuring'
    : `${lift! >= 0 ? '+' : ''}${lift!.toFixed(1)}%`;

  return (
    <div
      onClick={() => navigate(`/campaigns/${campaign.id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 96px 72px 64px',
        alignItems: 'center',
        gap: 16,
        padding: '14px 4px',
        borderTop: showDivider ? `1px solid ${T.n100}` : 'none',
        background: hover ? T.n50 : 'transparent',
        cursor: 'pointer',
        transition: 'background-color .1s',
        margin: '0 -4px',
        borderRadius: 6,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: T.fDisp,
          fontStyle: 'italic',
          fontSize: 16,
          color: T.n950,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {campaign.displayName}
        </div>
        <div style={{
          fontFamily: T.fMono,
          fontSize: 11,
          color: T.n500,
          marginTop: 4,
        }}>
          {campaign.id} · {TRIGGER_LABEL[campaign.triggerType]}
        </div>
      </div>
      <div>
        <Badge variant={GOAL_VARIANT[campaign.goal4r]}>
          {GOAL_LABEL[campaign.goal4r]}
        </Badge>
      </div>
      <BarSparkline data={fixture?.sparkBars ?? []} muted={measuring} />
      <div style={{
        fontFamily: T.fSans,
        fontSize: 13,
        fontWeight: 600,
        color: liftColor,
        textAlign: 'right',
      }}>
        {liftText}
      </div>
    </div>
  );
});
ActiveCampaignRow.displayName = 'ActiveCampaignRow';
