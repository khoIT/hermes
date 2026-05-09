/**
 * PredicateRow — one condition row inside a MatchGroup.
 * Layout: [FeaturePill] [LatencyBadge(s)] [operator select] [value cell] [MatchBar] [3-dot] [×]
 * Click on FeaturePill → InlineSwapPopover
 * Click on numeric value → InlineThresholdPlayground
 *
 * rowCount prop (optional) drives the MatchBar; parent computes it via audience-lookup.
 * Per PRD §8.3, §8.4, §8.5.
 */
import React from 'react';
import { T } from '../../../theme';
import type { Row } from '../_state/predicate-types';
import { InlineSwapPopover } from './inline-swap-popover';
import { InlineThresholdPlayground } from './inline-threshold-playground';
import { allFeatures } from '../../../data/catalog/features/index';
import { LatencyBadge } from '../../../components/latency-badge';
import { MatchBar } from '../_components/match-bar';
import type { HermesLatencyTier, HermesSubstrate } from '@hermes/contracts';

const OPERATORS = ['>=', '<=', '>', '<', '=', '!=', 'in', 'not_in', 'between', 'is_true', 'is_false', 'contains_any'];
const MAU_BASE = 1_250_000;

interface Props {
  row: Row;
  groupId: string;
  /** Prefix label shown to left of row ("WHERE" / "OR" / "AND") */
  prefix?: string;
  isExclusion?: boolean;
  /** Match count for this row individually (from audience model) */
  rowCount?: number;
  activePlayground: boolean;
  activeSwap: boolean;
  onSetFeature: (feature: string, featureType: string) => void;
  onSetOperator: (op: Row['operator']) => void;
  onSetValue: (value: unknown) => void;
  onThresholdChange: (value: number) => void;
  onOpenPlayground: () => void;
  onClosePlayground: () => void;
  onOpenSwap: () => void;
  onCloseSwap: () => void;
  onRemove: () => void;
  onBrowseFeatureStore?: () => void;
}

import type { HermesFeature } from '@hermes/contracts';

function lookupFeature(name: string): HermesFeature | undefined {
  return allFeatures.find(f => f.name === name);
}

function featureType(featureName: string): string {
  return lookupFeature(featureName)?.type ?? 'int';
}

/** Returns latency tiers for a feature — some features have dual tiers */
function featureTiers(featureName: string): Array<{ tier: HermesLatencyTier; substrate: HermesSubstrate }> {
  const feat = lookupFeature(featureName);
  if (!feat) return [{ tier: '<1d', substrate: 'B' }];
  // Dual-tier features (stateful-streaks domain) surface both <1s·A and <1h·B
  const dualTierFeatures = ['consecutive_ranked_losses_streak', 'daily_login_streak_current'];
  if (dualTierFeatures.includes(featureName)) {
    return [
      { tier: '<1s', substrate: 'A' },
      { tier: '<1h', substrate: 'B' },
    ];
  }
  return [{ tier: (feat.latencyTier ?? '<1d') as HermesLatencyTier, substrate: (feat.substrate ?? 'B') as HermesSubstrate }];
}

/** Render value cell based on operator */
function ValueCell({ row, onClick }: { row: Row; onClick: () => void }) {
  const op = row.operator;

  if (op === 'is_true' || op === 'is_false') {
    return (
      <span style={{
        fontFamily: T.fMono, fontSize: 11,
        color: T.n500, padding: '2px 6px',
        background: T.n100, borderRadius: 4,
      }}>
        {op === 'is_true' ? 'true' : 'false'}
      </span>
    );
  }

  if (op === 'between' && Array.isArray(row.value)) {
    const [lo, hi] = row.value as number[];
    return <button onClick={onClick} style={valueBtnStyle}>{lo} — {hi}</button>;
  }

  if ((op === 'in' || op === 'not_in' || op === 'contains_any') && Array.isArray(row.value)) {
    const arr = row.value as string[];
    return (
      <button onClick={onClick} style={valueBtnStyle}>
        {arr.length === 0 ? 'select…' : arr.slice(0, 2).join(', ') + (arr.length > 2 ? ` +${arr.length - 2}` : '')}
      </button>
    );
  }

  const isNumeric = typeof row.value === 'number';
  return (
    <button
      onClick={isNumeric ? onClick : undefined}
      style={{
        ...valueBtnStyle,
        cursor: isNumeric ? 'pointer' : 'default',
        color: isNumeric ? T.brand : T.n800,
        borderColor: isNumeric ? T.brandBorder : T.n200,
        background: isNumeric ? T.brandSoft : T.n50,
      }}
      title={isNumeric ? 'Click to open threshold playground' : undefined}
    >
      {String(row.value)}
    </button>
  );
}

const valueBtnStyle: React.CSSProperties = {
  fontFamily: T.fMono, fontSize: 12, fontWeight: 500,
  color: T.n800, background: T.n50,
  border: `1px solid ${T.n200}`, borderRadius: 5,
  padding: '2px 8px', cursor: 'pointer',
};

export const PredicateRow = React.memo<Props>(({
  row, prefix = 'WHERE', rowCount,
  activePlayground, activeSwap,
  onSetFeature, onSetOperator, onSetValue,
  onThresholdChange, onOpenPlayground, onClosePlayground,
  onOpenSwap, onCloseSwap, onRemove, onBrowseFeatureStore,
}) => {
  const fType = featureType(row.feature);
  const tiers = featureTiers(row.feature);

  return (
    <div style={{ borderBottom: `1px solid ${T.n100}` }}>
      {/* Main row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', flexWrap: 'wrap',
      }}>
        {/* Feature pill — click → swap popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={activeSwap ? onCloseSwap : onOpenSwap}
            style={{
              fontFamily: T.fMono, fontSize: 12, fontWeight: 500,
              color: T.n950, background: T.n100,
              border: `1px solid ${activeSwap ? T.brand : '#d8d6d0'}`,
              borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
            title="Click to swap feature"
          >
            {row.feature}
            {/* chevron-down */}
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {activeSwap && (
            <InlineSwapPopover
              featureName={row.feature}
              onSwap={(feat, ftype) => { onSetFeature(feat, ftype); onCloseSwap(); }}
              onClose={onCloseSwap}
              onBrowseFeatureStore={onBrowseFeatureStore}
            />
          )}
        </div>

        {/* Latency badge(s) — dual for streak features */}
        {tiers.length === 2 ? (
          <LatencyBadge tiers={tiers as [{ tier: HermesLatencyTier; substrate: HermesSubstrate }, { tier: HermesLatencyTier; substrate: HermesSubstrate }]} />
        ) : (
          <LatencyBadge tier={tiers[0]!.tier} substrate={tiers[0]!.substrate} />
        )}

        {/* Operator select */}
        <select
          value={row.operator}
          onChange={e => onSetOperator(e.target.value as Row['operator'])}
          style={{
            fontFamily: T.fMono, fontSize: 11, color: T.n800,
            background: '#fff', border: `1px solid ${T.n200}`,
            borderRadius: 5, padding: '3px 6px', cursor: 'pointer',
          }}
        >
          {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
        </select>

        {/* Value cell */}
        <ValueCell row={row} onClick={activePlayground ? onClosePlayground : onOpenPlayground} />

        {/* Match bar — shown when rowCount is provided */}
        {rowCount !== undefined && (
          <MatchBar count={rowCount} mauBase={MAU_BASE} style={{ marginLeft: 'auto' }} />
        )}

        {/* 3-dot menu placeholder */}
        <button
          title="Row options"
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.n400,
            background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
            lineHeight: 1, flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.n700; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.n400; }}
        >
          ···
        </button>

        {/* Remove × */}
        <button
          onClick={onRemove}
          title="Remove condition"
          style={{
            fontFamily: T.fSans, fontSize: 12, color: T.n400,
            background: 'none', border: 'none',
            cursor: 'pointer', padding: '0 2px',
            lineHeight: 1, flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.red500; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.n400; }}
        >
          ✕
        </button>
      </div>

      {/* Inline threshold playground — expands below the row */}
      {activePlayground && typeof row.value === 'number' && (
        <div style={{ paddingLeft: 14, paddingRight: 14, paddingBottom: 8 }}>
          <InlineThresholdPlayground
            featureName={row.feature}
            featureType={fType}
            initialValue={row.value as number}
            operator={row.operator}
            onThresholdChange={onThresholdChange}
            onApply={v => { onSetValue(v); onClosePlayground(); }}
            onCancel={onClosePlayground}
          />
        </div>
      )}
    </div>
  );
});
PredicateRow.displayName = 'PredicateRow';
