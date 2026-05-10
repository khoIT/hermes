/**
 * Active campaigns panel — header + rows. Filters real catalog to
 * status ∈ {active, scheduled}. Header has 'View all →' link.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { T, Icon } from '../../theme';
import { allCampaigns } from '../../data/catalog/campaigns';
import { CAMPAIGN_FIXTURES } from '../../data/catalog/_welcome-fixtures';
import { ActiveCampaignRow } from './active-campaign-row';

const ACTIVE_STATUSES = new Set(['active', 'scheduled']);

export function ActiveCampaignsPanel() {
  const navigate = useNavigate();
  const rows = allCampaigns.filter(c => ACTIVE_STATUSES.has(c.status));

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.n200}`,
      borderRadius: 10,
      padding: '20px 24px 12px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <h2 style={{
          fontFamily: T.fSans,
          fontSize: 16,
          fontWeight: 600,
          color: T.n950,
          margin: 0,
        }}>
          Active campaigns
        </h2>
        <button
          onClick={() => navigate('/campaigns')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            color: T.n600,
            fontFamily: T.fSans,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          View all
          <Icon icon={ChevronRight} size={14} color={T.n600} />
        </button>
      </div>
      {rows.length === 0 ? (
        <div style={{
          padding: 32,
          textAlign: 'center',
          color: T.n500,
          fontSize: 13,
          fontFamily: T.fSans,
        }}>
          No active campaigns right now.
        </div>
      ) : (
        rows.map((c, i) => (
          <ActiveCampaignRow
            key={c.id}
            campaign={c}
            fixture={CAMPAIGN_FIXTURES[c.id]}
            showDivider={i > 0}
          />
        ))
      )}
    </div>
  );
}
