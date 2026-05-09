/**
 * Predicate visualisation — WHEN / AND chain rendering of approved features.
 * Each row clickable → hop back to features (STAGE_REOPEN: features).
 */
import React from 'react';
import { T } from '../../../../theme';
import { RationaleChip } from './rationale-chip';
import type { ApprovedFeatureRow } from '../_state/compose-types';

interface Props {
  rows: readonly ApprovedFeatureRow[];
  onEditFeatures: () => void;
}

function formatThreshold(t: ApprovedFeatureRow['threshold']): string {
  if (t.op === 'is_false') return 'is false';
  if (t.op === 'is_true') return 'is true';
  return `${t.op} ${typeof t.value === 'string' ? `"${t.value}"` : t.value}`;
}

const ROW_KW: Record<number, string> = { 0: 'WHEN', 1: 'AND', 2: 'AND', 3: 'AND', 4: 'AND' };

export const PredicateBlocks: React.FC<Props> = ({ rows, onEditFeatures }) => {
  if (rows.length === 0) {
    return (
      <div style={{ padding: 16, fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
        No approved features.
      </div>
    );
  }
  return (
    <div style={{
      padding: 16, borderRadius: 12,
      background: T.n50, border: `1px solid ${T.n200}`,
    }}>
      {rows.map((r, i) => (
        <div
          key={r.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 0', borderBottom: i < rows.length - 1 ? `1px dashed ${T.n200}` : 'none',
          }}
        >
          <span style={{
            display: 'inline-block', minWidth: 44, textAlign: 'right',
            fontFamily: T.fMono, fontSize: 11, color: T.n500, fontWeight: 600,
          }}>
            {ROW_KW[i] ?? 'AND'}
          </span>
          <span style={{
            padding: '3px 8px', borderRadius: 6, background: '#fff',
            border: `1px solid ${T.n200}`, fontFamily: T.fMono, fontSize: 12, color: T.n900,
          }}>
            {r.featureId}
          </span>
          <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.n500 }}>
            {formatThreshold(r.threshold)}
          </span>
          <RationaleChip rationale={r.rationale} />
        </div>
      ))}
      <div style={{ marginTop: 10, textAlign: 'right' }}>
        <button
          onClick={onEditFeatures}
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.brand, background: 'none',
            border: 0, cursor: 'pointer', padding: 0,
          }}
        >
          Edit features ↑
        </button>
      </div>
    </div>
  );
};
