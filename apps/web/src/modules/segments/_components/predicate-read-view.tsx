/**
 * PredicateReadView — pure renderer that walks a `PredicateAST` and
 * displays group blocks with feature pills, operator + value tokens.
 * Groups are AND'd; conditions inside a group join with `group.op`.
 * Exclusions render as a separate "Exclude where" card.
 */
import React from 'react';
import { Sliders } from 'lucide-react';
import type { PredicateAST, PredicateLeaf } from '@hermes/contracts';
import { T } from '../../../theme';
import { getFeatureByName } from '../../../data/catalog/features';

interface Props {
  predicate: PredicateAST;
  onTuneRow?: (rowKey: string) => void;
}

export function PredicateReadView({ predicate, onTuneRow }: Props) {
  if (!predicate.groups.length && !(predicate.exclusions?.length)) {
    return (
      <div style={{
        fontFamily: T.fSans, fontSize: 13, color: T.n500, padding: 24,
        background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
        textAlign: 'center',
      }}>
        Empty predicate. Click <strong style={{ color: T.brand }}>Edit</strong> to add conditions.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {predicate.groups.map((g, i) => (
        <React.Fragment key={i}>
          <GroupCard group={g} index={i} onTuneRow={onTuneRow} />
          {i < predicate.groups.length - 1 && <AndDivider />}
        </React.Fragment>
      ))}
      {predicate.exclusions && predicate.exclusions.length > 0 && (
        <ExclusionCard exclusions={predicate.exclusions} onTuneRow={onTuneRow} />
      )}
    </div>
  );
}

function AndDivider() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0',
    }}>
      <div style={{ flex: 1, height: 1, background: T.n200 }} />
      <span style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n600,
        letterSpacing: '0.12em',
      }}>AND</span>
      <div style={{ flex: 1, height: 1, background: T.n200 }} />
    </div>
  );
}

interface GroupCardProps {
  group: PredicateAST['groups'][number];
  index: number;
  onTuneRow?: (rowKey: string) => void;
}

function GroupCard({ group, index, onTuneRow }: GroupCardProps) {
  const op = group.op === 'OR' ? 'OR' : 'AND';
  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
        color: T.n500, letterSpacing: '0.06em', textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        Group {index + 1} · joins with {op}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {group.conditions.map((c, j) => (
          <React.Fragment key={j}>
            {j > 0 && <RowJoiner op={op} />}
            <ConditionRow condition={c} rowKey={`g${index}-r${j}`} onTune={onTuneRow} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function RowJoiner({ op }: { op: 'AND' | 'OR' }) {
  return (
    <div style={{
      fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400,
      letterSpacing: '0.1em', padding: '0 4px',
    }}>{op}</div>
  );
}

function ExclusionCard({ exclusions, onTuneRow }: {
  exclusions: PredicateLeaf[];
  onTuneRow?: (rowKey: string) => void;
}) {
  return (
    <div style={{
      background: T.redSoft, border: `1px solid #fecaca`, borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.red600,
        letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        Exclude where (AND NOT)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {exclusions.map((c, j) => (
          <ConditionRow key={j} condition={c} rowKey={`x-${j}`} onTune={onTuneRow} />
        ))}
      </div>
    </div>
  );
}

function ConditionRow({ condition, rowKey, onTune }: {
  condition: PredicateLeaf;
  rowKey: string;
  onTune?: (rowKey: string) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    }}>
      <FeaturePill name={condition.feature} />
      <OpToken op={condition.op} />
      <ValueToken value={condition.value} />
      {onTune && (
        <button
          onClick={() => onTune(rowKey)}
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.n600,
            background: T.n50, border: `1px solid ${T.n200}`,
            borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          <Sliders size={11} /> Tune
        </button>
      )}
    </div>
  );
}

function FeaturePill({ name }: { name: string }) {
  const f = getFeatureByName(name);
  const display = f?.displayName ?? name;
  return (
    <span style={{
      fontFamily: T.fSans, fontSize: 12, fontWeight: 500, color: T.n900,
      background: T.brandSoft, border: `1px solid ${T.brandBorder}`,
      borderRadius: 6, padding: '3px 8px',
    }}>
      {display}
    </span>
  );
}

function OpToken({ op }: { op: PredicateLeaf['op'] }) {
  const map: Record<string, string> = {
    '=': 'is',
    '!=': 'is not',
    '>': '>',
    '>=': '≥',
    '<': '<',
    '<=': '≤',
    'in': 'in',
    'not_in': 'not in',
    'between': 'between',
    'contains_any': 'contains any',
    'contains_all': 'contains all',
    'is_true': 'is true',
    'is_false': 'is false',
  };
  return (
    <span style={{
      fontFamily: T.fMono, fontSize: 12, color: T.n600,
    }}>{map[op] ?? op}</span>
  );
}

function ValueToken({ value }: { value: PredicateLeaf['value'] }) {
  if (typeof value === 'boolean') {
    return null;
  }
  let display: string;
  if (Array.isArray(value)) {
    if (value.length <= 3) display = value.map(String).join(', ');
    else display = `${value.slice(0, 2).map(String).join(', ')} +${value.length - 2} more`;
  } else {
    display = String(value);
  }
  return (
    <span style={{
      fontFamily: T.fMono, fontSize: 12, color: T.n900,
      background: T.n100, border: `1px solid ${T.n200}`,
      borderRadius: 6, padding: '3px 8px',
    }}>
      {display}
    </span>
  );
}
