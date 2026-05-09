/**
 * Event source banner — dark inverted strip with event name + peak rate + lifecycle.
 */
import React from 'react';
import { T } from '../../../../theme';

interface Props {
  source: { name: string; peakRate: string; lifecycle: string };
}

export const EventSourceBanner: React.FC<Props> = ({ source }) => (
  <div style={{
    background: T.n950, color: '#fff', borderRadius: 10, padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
  }}>
    <span style={{
      fontFamily: T.fMono, fontSize: 10, color: '#fed7aa',
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      Event source
    </span>
    <span style={{ fontFamily: T.fMono, fontSize: 13, color: '#fff', fontWeight: 600 }}>
      {source.name}
    </span>
    <span style={{ fontFamily: T.fMono, fontSize: 11, color: '#a3a3a3' }}>
      peak · {source.peakRate}
    </span>
    <span style={{ fontFamily: T.fMono, fontSize: 11, color: '#a3a3a3' }}>
      · {source.lifecycle}
    </span>
  </div>
);
