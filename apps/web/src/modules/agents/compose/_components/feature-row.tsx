/**
 * Feature row — one proposed feature with rationale + threshold + actions.
 * Pure render — all dispatching done via callbacks from the parent stage.
 */
import React from 'react';
import { T, Sparkline } from '../../../../theme';
import { ProvenanceDot } from './provenance-dot';
import { RationaleChip } from './rationale-chip';
import type { ProposedFeatureRow } from '../_state/compose-types';
import type { HermesFeature } from '@hermes/contracts';

interface Props {
  row: ProposedFeatureRow;
  feature: HermesFeature | undefined;
  approved?: boolean;
  onApprove?: () => void;
  onSwap?: () => void;
  onDrop?: () => void;
  onViewDetail?: () => void;
}

function formatThreshold(t: ProposedFeatureRow['threshold']): string {
  if (t.op === 'is_false') return '= false';
  if (t.op === 'is_true') return '= true';
  return `${t.op} ${typeof t.value === 'string' ? `"${t.value}"` : t.value}`;
}

function getSource(feature: HermesFeature | undefined): 'real' | 'hybrid' | 'synth' {
  if (!feature) return 'synth';
  return ((feature.analytics as unknown as { source?: 'real' | 'hybrid' | 'synth' }).source) ?? 'synth';
}

export const FeatureRow: React.FC<Props> = ({ row, feature, approved, onApprove, onSwap, onDrop, onViewDetail }) => {
  const source = getSource(feature);
  const sparkline = feature?.analytics?.requestRateSparkline?.slice(-30) ?? [];

  return (
    <div style={{
      display: 'flex', gap: 16, padding: 14,
      border: `1px solid ${approved ? '#a7f3d0' : T.n200}`,
      background: approved ? '#f0fdf4' : '#fff',
      borderRadius: 10, alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <ProvenanceDot source={source} />
          <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.n900, fontWeight: 600 }}>
            {row.featureId}
          </span>
          <RationaleChip rationale={row.rationale} />
          {approved && (
            <span style={{
              fontFamily: T.fMono, fontSize: 10, color: '#065f46',
              padding: '1px 6px', borderRadius: 9999, background: '#d1fae5',
            }}>
              ✓ approved
            </span>
          )}
        </div>
        <div style={{
          fontFamily: '"Spectral", Georgia, serif', fontSize: 14,
          color: T.n800, lineHeight: 1.5, marginBottom: 8,
        }}>
          {row.rephrase}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: T.fMono, fontSize: 11, padding: '2px 8px',
            borderRadius: 6, background: T.n50, border: `1px solid ${T.n200}`, color: T.n700,
          }}>
            threshold · {formatThreshold(row.threshold)}
          </span>
          {sparkline.length > 0 && <Sparkline data={sparkline} width={70} height={20} />}
          <button
            onClick={onViewDetail}
            style={{
              fontFamily: T.fSans, fontSize: 11, color: T.brand,
              background: 'none', border: 0, padding: 0, cursor: 'pointer',
            }}
          >
            Open in Feature Store →
          </button>
        </div>
      </div>
      {!approved && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <button
            onClick={onApprove}
            style={{
              padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
              background: T.brand, color: '#fff', border: 0,
              fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
            }}
          >
            Approve
          </button>
          <button
            onClick={onSwap}
            style={{
              padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
              background: '#fff', color: T.n800, border: `1px solid ${T.n200}`,
              fontFamily: T.fSans, fontSize: 11,
            }}
          >
            Swap
          </button>
          <button
            onClick={onDrop}
            style={{
              padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
              background: '#fff', color: T.n500, border: `1px solid ${T.n200}`,
              fontFamily: T.fSans, fontSize: 11,
            }}
          >
            Drop
          </button>
        </div>
      )}
    </div>
  );
};
