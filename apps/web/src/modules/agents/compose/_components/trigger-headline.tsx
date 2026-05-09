/**
 * Trigger headline — large serif sentence built from the campaign template.
 */
import React from 'react';
import { T } from '../../../../theme';

interface Props {
  headline: string;
}

export const TriggerHeadline: React.FC<Props> = ({ headline }) => (
  <div style={{
    padding: '20px 22px', borderRadius: 12,
    background: '#fff', border: `1px solid ${T.brandBorder}`,
    boxShadow: '0 0 0 4px rgba(240,90,34,0.06)',
  }}>
    <div style={{
      fontFamily: T.fMono, fontSize: 10, color: T.brand,
      letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
    }}>
      ✦ The trigger
    </div>
    <div style={{
      fontFamily: '"Spectral", Georgia, serif', fontSize: 24, lineHeight: 1.25,
      color: T.n900,
    }}>
      {headline}
    </div>
  </div>
);
