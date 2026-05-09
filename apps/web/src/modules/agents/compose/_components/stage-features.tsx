/**
 * Stage 1 — Features. Lists proposed + approved feature rows with the
 * "Continue to segment →" CTA. Approve/Swap/Drop dispatched up via callbacks.
 */
import React from 'react';
import { T } from '../../../../theme';
import { FeatureRow } from './feature-row';
import type { ProposedFeatureRow, StageFeatures as StageFeaturesState } from '../_state/compose-types';
import type { HermesFeature } from '@hermes/contracts';

interface Props {
  stage: StageFeaturesState;
  features: readonly HermesFeature[];
  onApprove: (rowId: string) => void;
  onSwap: (rowId: string) => void;
  onDrop: (rowId: string) => void;
  onViewDetail: (featureId: string) => void;
  onAdvance: () => void;
}

export const StageFeatures: React.FC<Props> = ({
  stage, features, onApprove, onSwap, onDrop, onViewDetail, onAdvance,
}) => {
  const featureMap = React.useMemo(() => {
    const m = new Map<string, HermesFeature>();
    for (const f of features) m.set(f.name, f);
    return m;
  }, [features]);

  const canAdvance = stage.approved.length >= 1;
  const isStale = stage.status === 'stale';

  const Item = (row: ProposedFeatureRow, approved: boolean) => (
    <FeatureRow
      key={row.id}
      row={row}
      feature={featureMap.get(row.featureId)}
      approved={approved}
      onApprove={!approved ? () => onApprove(row.id) : undefined}
      onSwap={!approved ? () => onSwap(row.id) : undefined}
      onDrop={!approved ? () => onDrop(row.id) : undefined}
      onViewDetail={() => onViewDetail(row.featureId)}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {isStale && (
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          background: '#fffbeb', border: `1px solid #fde68a`, color: '#92400e',
          fontFamily: T.fSans, fontSize: 12,
        }}>
          ⚠ Features changed — downstream stages will recompute when you continue.
        </div>
      )}
      {stage.approved.map((r) => Item(r, true))}
      {stage.proposed.map((r) => Item(r, false))}
      {stage.proposed.length === 0 && stage.approved.length === 0 && (
        <div style={{ padding: 20, fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
          Submit an intent and the agent will propose features.
        </div>
      )}
      {(stage.approved.length > 0 || stage.proposed.length > 0) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={onAdvance}
            disabled={!canAdvance}
            style={{
              padding: '8px 16px', borderRadius: 8,
              cursor: canAdvance ? 'pointer' : 'not-allowed',
              background: canAdvance ? T.brand : T.n200,
              color: canAdvance ? '#fff' : T.n500,
              border: 0, fontFamily: T.fSans, fontSize: 13, fontWeight: 600,
              animation: canAdvance ? 'cta-pulse 2.4s ease-in-out infinite' : 'none',
            }}
          >
            Continue to segment →
          </button>
          <style>{`
            @keyframes cta-pulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(240,90,34,0.5) }
              50%      { box-shadow: 0 0 0 6px rgba(240,90,34,0) }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};
