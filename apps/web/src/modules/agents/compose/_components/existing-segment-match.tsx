/**
 * Existing-segment match pill — when an approved feature set ≥ 0.8 Jaccard
 * overlaps an existing segment, surface a "use existing" affordance.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { HermesSegment } from '@hermes/contracts';

interface Props {
  segment: HermesSegment;
  jaccard: number;
  selected: boolean;
  onUseExisting: () => void;
}

export const ExistingSegmentMatch: React.FC<Props> = ({ segment, jaccard, selected, onUseExisting }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', borderRadius: 10,
    background: selected ? '#ecfdf5' : '#eff6ff',
    border: `1px solid ${selected ? '#a7f3d0' : '#bfdbfe'}`,
  }}>
    <span style={{
      fontFamily: T.fMono, fontSize: 11, fontWeight: 700,
      color: selected ? '#065f46' : '#1e3a8a',
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {selected ? '✓ using existing' : 'Match found'}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n800, fontWeight: 600 }}>
        {segment.id}
      </div>
      <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600, marginTop: 1 }}>
        {segment.displayName} · {(segment.audienceSize ?? 0).toLocaleString()} UIDs · overlap {(jaccard * 100).toFixed(0)}%
      </div>
    </div>
    {!selected && (
      <button
        onClick={onUseExisting}
        style={{
          padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
          background: '#fff', color: T.n800, border: `1px solid ${T.n200}`,
          fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
        }}
      >
        Use existing
      </button>
    )}
    <a
      href={`/segments/${segment.id}`}
      target="_blank"
      rel="noreferrer"
      style={{
        fontFamily: T.fSans, fontSize: 11, color: T.brand, textDecoration: 'none',
      }}
    >
      Open ↗
    </a>
  </div>
);
