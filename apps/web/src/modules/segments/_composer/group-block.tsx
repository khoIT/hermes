/**
 * GroupBlock — one AND-group containing OR'd predicate rows.
 * Header matches reference: "Group N · match ANY/ALL of these" left,
 * "group → {count}" mono right, optional "· cumulative {cumCount}" for G2+.
 * Passes rowCount prop to each PredicateRow for the MatchBar.
 * Per PRD §8.3 AND-of-OR-groups model + reference segments.jsx PredicateGroup.
 */
import React from 'react';
import { T } from '../../../theme';
import type { MatchGroup, Row } from '../_state/predicate-types';
import { groupMode } from '../_state/predicate-types';
import { PredicateRow } from './predicate-row';

const ACCENT = '#f05a22';
const MAU_BASE = 1_250_000;

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/** Rough per-row count from audience baseline — used when no model data passed */
function estimateRowCount(row: Row): number {
  const BASELINE: Record<string, number> = {
    consecutive_ranked_losses_streak: 23_890,
    mmr_drift_7d: 250_000,
    is_paying_user_lifetime: 975_000,
    account_age_days: 1_200_000,
    is_test_account: 12_000,
    last_login_days_ago: 600_000,
    session_count_30d: 800_000,
  };
  const base = BASELINE[row.feature] ?? 500_000;
  const v = row.value;
  let scale = 0.5;
  if (typeof v === 'number') {
    if ((row.operator === '>=' || row.operator === '>') && v > 5)  scale = 0.25;
    if ((row.operator === '>=' || row.operator === '>') && v > 20) scale = 0.08;
    if ((row.operator === '<=' || row.operator === '<') && v < 10) scale = 0.03;
  }
  if (row.operator === 'is_true')  scale = 0.5;
  if (row.operator === 'is_false') scale = 0.6;
  return Math.round(base * scale);
}

interface Props {
  group: MatchGroup;
  groupIndex: number;
  /** Count after this group's predicate (cumulative intersection) */
  groupCount?: number;
  /** Cumulative count through all groups up to and including this one */
  cumCount?: number;
  activePlaygroundRowId: string | null;
  activeSwapRowId: string | null;
  onSetFeature: (rowId: string, feature: string, featureType: string) => void;
  onSetOperator: (rowId: string, op: Row['operator']) => void;
  onSetValue: (rowId: string, value: unknown) => void;
  onThresholdChange: (rowId: string, value: number) => void;
  onOpenPlayground: (rowId: string) => void;
  onClosePlayground: () => void;
  onOpenSwap: (rowId: string) => void;
  onCloseSwap: () => void;
  onRemoveRow: (rowId: string) => void;
  onRemoveGroup: () => void;
  onOpenOrRowPicker: () => void;
  onBrowseFeatureStore?: () => void;
  onSetGroupMode?: (mode: 'any' | 'all') => void;
}

export const GroupBlock = React.memo<Props>(({
  group, groupIndex, groupCount, cumCount,
  activePlaygroundRowId, activeSwapRowId,
  onSetFeature, onSetOperator, onSetValue,
  onThresholdChange, onOpenPlayground, onClosePlayground,
  onOpenSwap, onCloseSwap,
  onRemoveRow, onRemoveGroup, onOpenOrRowPicker,
  onBrowseFeatureStore, onSetGroupMode,
}) => {
  const isAny = groupMode(group) === 'any';
  const resolvedGroupCount = groupCount ?? Math.round(MAU_BASE * 0.02);

  return (
    <div style={{
      border: `1px solid ${T.n200}`,
      borderRadius: 8,
      background: '#fff',
      marginBottom: 8,
      overflow: 'hidden',
    }}>
      {/* Group header — reference style */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '9px 14px',
        background: '#fafaf6',
        borderBottom: `1px solid ${T.n100}`,
      }}>
        <span style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.n700, flex: 1 }}>
          <span style={{ fontFamily: T.fMono, fontWeight: 600, color: T.n800 }}>
            Group {groupIndex + 1}
          </span>
          {' · match '}
          {onSetGroupMode ? (
            <button
              type="button"
              onClick={() => onSetGroupMode(isAny ? 'all' : 'any')}
              title={isAny ? 'Switch to AND (all rows must match)' : 'Switch to OR (any row matches)'}
              style={{
                fontFamily: T.fMono, fontSize: 11.5, fontWeight: 700,
                color: ACCENT, background: '#fff2eb',
                border: `1px solid #f5c8b3`, borderRadius: 4,
                padding: '1px 7px', cursor: 'pointer', letterSpacing: '0.04em',
                transition: 'background 120ms, border-color 120ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffe5d4'; e.currentTarget.style.borderColor = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff2eb'; e.currentTarget.style.borderColor = '#f5c8b3'; }}
            >
              {isAny ? 'ANY' : 'ALL'}
            </button>
          ) : (
            <span style={{ fontFamily: T.fMono, fontWeight: 600 }}>
              {isAny ? 'ANY' : 'ALL'}
            </span>
          )}
          {' of these'}
        </span>

        {/* Count right-aligned */}
        <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>
          group → <span style={{ color: ACCENT, fontWeight: 600 }}>{fmtNum(resolvedGroupCount)}</span>
          {cumCount != null && groupIndex > 0 && (
            <span style={{ color: T.n400 }}> · cumulative {fmtNum(cumCount)}</span>
          )}
        </span>

        {/* 3-dot menu */}
        <button
          title="Group options"
          style={{
            fontFamily: T.fSans, fontSize: 14, color: T.n400,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0 4px', lineHeight: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.n700; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.n400; }}
        >
          ···
        </button>

        {/* Remove group */}
        <button
          onClick={onRemoveGroup}
          title="Remove group"
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.n400,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.red500; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.n400; }}
        >
          ✕
        </button>
      </div>

      {/* Rows */}
      {group.rows.map((row, rowIndex) => {
        const rowCount = estimateRowCount(row);
        return (
          <React.Fragment key={row.id}>
            {/* OR / AND separator between rows */}
            {rowIndex > 0 && (
              <div style={{
                padding: '3px 14px',
                fontFamily: T.fMono, fontSize: 10, fontWeight: 700,
                color: T.n400, textTransform: 'uppercase', letterSpacing: '0.05em',
                borderBottom: `1px solid ${T.n100}`,
                background: '#fafaf6',
              }}>
                {isAny ? 'OR' : 'AND'}
              </div>
            )}
            <PredicateRow
              row={row}
              groupId={group.id}
              prefix={rowIndex === 0 ? 'IF' : isAny ? 'OR' : 'AND'}
              rowCount={rowCount}
              activePlayground={activePlaygroundRowId === row.id}
              activeSwap={activeSwapRowId === row.id}
              onSetFeature={(feat, ftype) => onSetFeature(row.id, feat, ftype)}
              onSetOperator={op => onSetOperator(row.id, op)}
              onSetValue={v => onSetValue(row.id, v)}
              onThresholdChange={v => onThresholdChange(row.id, v)}
              onOpenPlayground={() => onOpenPlayground(row.id)}
              onClosePlayground={onClosePlayground}
              onOpenSwap={() => onOpenSwap(row.id)}
              onCloseSwap={onCloseSwap}
              onRemove={() => onRemoveRow(row.id)}
              onBrowseFeatureStore={onBrowseFeatureStore}
            />
          </React.Fragment>
        );
      })}

      {/* Add OR row footer */}
      <div style={{ padding: '8px 14px', background: '#fafaf6', borderTop: `1px solid ${T.n100}` }}>
        <button
          onClick={onOpenOrRowPicker}
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.n500,
            background: 'none', border: `1px dashed ${T.n300}`,
            borderRadius: 5, padding: '3px 10px', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.n300; e.currentTarget.style.color = T.n500; }}
        >
          + Add OR row
        </button>
      </div>
    </div>
  );
});
GroupBlock.displayName = 'GroupBlock';
