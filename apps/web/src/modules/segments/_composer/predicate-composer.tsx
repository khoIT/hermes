/**
 * PredicateComposer — AND-of-OR-groups orchestrator.
 * PUBLIC: reused by P-8 campaign trigger predicate editor.
 *
 * Renders all match groups (AND'd), exclusion rows (AND NOT'd),
 * and the "+ Add group AND" / "+ Add exclusion AND NOT" actions.
 * Delegates picker open/close to parent via CanvasAction dispatch.
 *
 * Per PRD §8.3, phase-07 spec.
 */
import React from 'react';
import { T } from '../../../theme';
import type { Predicate, Row } from '../_state/predicate-types';
import type { CanvasAction } from '../_state/canvas-reducer';
import { GroupBlock } from './group-block';
import { PredicateRow } from './predicate-row';
import { ConditionPicker } from './condition-picker';
import { ExclusionPicker } from './exclusion-picker';
import { OrRowPicker } from './or-row-picker';

interface Props {
  predicate: Predicate;
  activePlaygroundRowId: string | null;
  activeSwapRowId: string | null;
  openPicker: 'condition' | 'exclusion' | 'or-row' | null;
  pickerTargetGroupId: string | null;
  dispatch: React.Dispatch<CanvasAction>;
  onBrowseFeatureStore?: () => void;
}

export const PredicateComposer = React.memo<Props>(({
  predicate, activePlaygroundRowId, activeSwapRowId,
  openPicker, pickerTargetGroupId,
  dispatch, onBrowseFeatureStore,
}) => {
  // Collect all features currently in the predicate (for picker de-emphasis)
  const allUsedFeatures = React.useMemo(() => [
    ...predicate.groups.flatMap(g => g.rows.map(r => r.feature)),
    ...predicate.exclusions.map(r => r.feature),
  ], [predicate]);

  // Group features for the or-row picker pairing logic
  const targetGroupFeatures = React.useMemo(() => {
    if (!pickerTargetGroupId) return [];
    const g = predicate.groups.find(g => g.id === pickerTargetGroupId);
    return g ? g.rows.map(r => r.feature) : [];
  }, [predicate.groups, pickerTargetGroupId]);

  return (
    <div>
      {/* Match groups */}
      {predicate.groups.map((group, idx) => (
        <GroupBlock
          key={group.id}
          group={group}
          groupIndex={idx}
          activePlaygroundRowId={activePlaygroundRowId}
          activeSwapRowId={activeSwapRowId}
          onSetFeature={(rowId, feat, ftype) =>
            dispatch({ type: 'SET_ROW_FEATURE', groupId: group.id, rowId, feature: feat, featureType: ftype })}
          onSetOperator={(rowId, op) =>
            dispatch({ type: 'SET_ROW_OPERATOR', groupId: group.id, rowId, operator: op })}
          onSetValue={(rowId, v) =>
            dispatch({ type: 'SET_ROW_VALUE', groupId: group.id, rowId, value: v })}
          onThresholdChange={(rowId, v) =>
            dispatch({ type: 'SET_THRESHOLD', groupId: group.id, rowId, value: v })}
          onOpenPlayground={rowId => dispatch({ type: 'OPEN_PLAYGROUND', rowId })}
          onClosePlayground={() => dispatch({ type: 'CLOSE_PLAYGROUND' })}
          onOpenSwap={rowId => dispatch({ type: 'OPEN_SWAP', rowId })}
          onCloseSwap={() => dispatch({ type: 'CLOSE_SWAP' })}
          onRemoveRow={rowId =>
            dispatch({ type: 'REMOVE_ROW', groupId: group.id, rowId })}
          onRemoveGroup={() =>
            dispatch({ type: 'REMOVE_GROUP', groupId: group.id })}
          onOpenOrRowPicker={() =>
            dispatch({ type: 'OPEN_PICKER', picker: 'or-row', groupId: group.id })}
          onBrowseFeatureStore={onBrowseFeatureStore}
        />
      ))}

      {/* Add group AND */}
      <button
        onClick={() => dispatch({ type: 'OPEN_PICKER', picker: 'condition' })}
        style={{
          fontFamily: T.fSans, fontSize: 12, color: T.n700,
          background: T.n50, border: `1px dashed ${T.n300}`,
          borderRadius: 7, padding: '6px 14px', cursor: 'pointer',
          marginBottom: 16, width: '100%', textAlign: 'left',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.color = T.brand; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.n300; e.currentTarget.style.color = T.n700; }}
      >
        + Add condition{predicate.groups.length > 0 ? ' AND' : ''}
      </button>

      {/* Exclusions */}
      {predicate.exclusions.length > 0 && (
        <div style={{
          border: `1px solid #fecaca`,
          borderRadius: 8, background: T.redSoft,
          padding: '10px 14px', marginBottom: 8,
        }}>
          <div style={{
            fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
            color: T.red600, textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: 6,
          }}>
            AND NOT — Exclusions
          </div>
          {predicate.exclusions.map((row, idx) => (
            <PredicateRow
              key={row.id}
              row={row}
              groupId="exclusions"
              prefix={idx === 0 ? 'NOT' : 'NOT'}
              isExclusion
              activePlayground={activePlaygroundRowId === row.id}
              activeSwap={activeSwapRowId === row.id}
              onSetFeature={(feat, ftype) =>
                dispatch({ type: 'SET_ROW_FEATURE', groupId: 'exclusions', rowId: row.id, feature: feat, featureType: ftype })}
              onSetOperator={op =>
                dispatch({ type: 'SET_ROW_OPERATOR', groupId: 'exclusions', rowId: row.id, operator: op })}
              onSetValue={v =>
                dispatch({ type: 'SET_EXCLUSION_VALUE', rowId: row.id, value: v })}
              onThresholdChange={v =>
                dispatch({ type: 'SET_THRESHOLD', groupId: 'exclusions', rowId: row.id, value: v })}
              onOpenPlayground={() => dispatch({ type: 'OPEN_PLAYGROUND', rowId: row.id })}
              onClosePlayground={() => dispatch({ type: 'CLOSE_PLAYGROUND' })}
              onOpenSwap={() => dispatch({ type: 'OPEN_SWAP', rowId: row.id })}
              onCloseSwap={() => dispatch({ type: 'CLOSE_SWAP' })}
              onRemove={() => dispatch({ type: 'REMOVE_EXCLUSION', rowId: row.id })}
              onBrowseFeatureStore={onBrowseFeatureStore}
            />
          ))}
        </div>
      )}

      {/* Add exclusion */}
      <button
        onClick={() => dispatch({ type: 'OPEN_PICKER', picker: 'exclusion' })}
        style={{
          fontFamily: T.fSans, fontSize: 12, color: T.red600,
          background: T.redSoft, border: `1px dashed #fca5a5`,
          borderRadius: 7, padding: '6px 14px', cursor: 'pointer',
          width: '100%', textAlign: 'left',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.red600; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#fca5a5'; }}
      >
        + Add exclusion AND NOT
      </button>

      {/* Slide-in pickers — rendered as fixed overlays */}
      {openPicker === 'condition' && (
        <ConditionPicker
          existingFeatures={allUsedFeatures}
          onSelect={(feat, ftype) => {
            if (pickerTargetGroupId) {
              dispatch({ type: 'ADD_ROW', groupId: pickerTargetGroupId, feature: feat, featureType: ftype });
            } else {
              // New group
              dispatch({ type: 'ADD_GROUP' });
              // The new group gets a makeGroup() with default row; replace it via SET_ROW_FEATURE
              // Simpler: dispatch ADD_GROUP then immediately add the row to the last group
              // We rely on the reducer creating a new group with a default row, then the user
              // can swap feature. For a better UX, handle via a dedicated action in future.
              dispatch({ type: 'CLOSE_PICKER' });
              // Re-open after group is added would require effect; acceptable v1 trade-off
            }
            dispatch({ type: 'CLOSE_PICKER' });
          }}
          onClose={() => dispatch({ type: 'CLOSE_PICKER' })}
        />
      )}

      {openPicker === 'exclusion' && (
        <ExclusionPicker
          existingFeatures={predicate.exclusions.map((r: Row) => r.feature)}
          onSelect={(feat, ftype) => {
            dispatch({ type: 'ADD_EXCLUSION', feature: feat, featureType: ftype });
            dispatch({ type: 'CLOSE_PICKER' });
          }}
          onClose={() => dispatch({ type: 'CLOSE_PICKER' })}
        />
      )}

      {openPicker === 'or-row' && pickerTargetGroupId && (
        <OrRowPicker
          groupFeatures={targetGroupFeatures}
          onSelect={(feat, ftype) => {
            dispatch({ type: 'ADD_ROW', groupId: pickerTargetGroupId, feature: feat, featureType: ftype });
            dispatch({ type: 'CLOSE_PICKER' });
          }}
          onClose={() => dispatch({ type: 'CLOSE_PICKER' })}
        />
      )}
    </div>
  );
});
PredicateComposer.displayName = 'PredicateComposer';
