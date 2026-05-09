/**
 * Action card — channel · payload · cooldown · platform cap · A/B holdout grid.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { CampaignTemplate } from '../_state/compose-types';

interface Props {
  action: CampaignTemplate['action'];
}

const Field: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div style={{
      fontFamily: T.fMono, fontSize: 10, color: T.n500,
      letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4,
    }}>
      {label}
    </div>
    <div style={{
      fontFamily: mono ? T.fMono : T.fSans, fontSize: 13, color: T.n900, fontWeight: 500,
    }}>
      {value}
    </div>
  </div>
);

const CHANNEL_LABEL: Record<CampaignTemplate['action']['channel'], string> = {
  iam: 'In-App Message',
  push: 'Push notification',
  email: 'Email',
  'in-game-popup': 'In-game popup',
};

export const ActionCard: React.FC<Props> = ({ action }) => (
  <div style={{
    padding: 18, borderRadius: 12, background: '#fff',
    border: `1px solid ${T.n200}`,
  }}>
    <div style={{
      fontFamily: T.fMono, fontSize: 10, color: T.n500,
      letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12,
    }}>
      Action
    </div>
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gap: 16, marginBottom: 14,
    }}>
      <Field label="Channel"      value={CHANNEL_LABEL[action.channel]} />
      <Field label="Cooldown"     value={action.cooldown} mono />
      <Field label="Platform cap" value={action.platformCap} mono />
      <Field label="A/B holdout"  value={action.abHoldout} mono />
    </div>
    <div>
      <div style={{
        fontFamily: T.fMono, fontSize: 10, color: T.n500,
        letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4,
      }}>
        Payload
      </div>
      <div style={{
        fontFamily: '"Spectral", Georgia, serif', fontSize: 16,
        color: T.n900, lineHeight: 1.45,
        padding: '10px 14px', background: T.n50, borderRadius: 8,
        border: `1px solid ${T.n200}`,
      }}>
        {action.payload}
      </div>
    </div>
  </div>
);
