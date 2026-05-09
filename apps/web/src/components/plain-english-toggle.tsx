/**
 * PlainEnglishToggle — toggle switch + renders a plain-English version
 * of a predicate for non-technical PMs. Used in segment/campaign authoring.
 * Per PRD §8.3 region 3 and §8.8 overview tab.
 */
import React from 'react';
import { T, Switch } from '../theme';
import type { PredicateAST } from '@hermes/contracts';

interface PlainEnglishToggleProps {
  predicate: PredicateAST;
  /** Pre-computed plain-English string; if omitted a simple render is derived */
  plainEnglish?: string;
  style?: React.CSSProperties;
}

/** Derive a naive plain-English sentence from the predicate AST */
function deriveEnglish(ast: PredicateAST): string {
  const groupParts = ast.groups.map(g => {
    const conditions = g.conditions.map(c => {
      const val = Array.isArray(c.value) ? c.value.join(', ') : String(c.value);
      return `${c.feature} ${c.op} ${val}`;
    });
    return conditions.join(g.op === 'AND' ? ' AND ' : ' OR ');
  });

  let sentence = groupParts.join(' AND ');
  if (ast.exclusions?.length) {
    const excl = ast.exclusions.map(e => `${e.feature} ${e.op} ${String(e.value)}`).join(' OR ');
    sentence += `, excluding: ${excl}`;
  }
  return sentence || 'No conditions defined.';
}

export const PlainEnglishToggle = React.memo<PlainEnglishToggleProps>(({
  predicate,
  plainEnglish,
  style,
}) => {
  const [showPlain, setShowPlain] = React.useState(false);
  const text = plainEnglish ?? deriveEnglish(predicate);

  return (
    <div style={{ ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: showPlain ? 10 : 0 }}>
        <Switch checked={showPlain} onChange={setShowPlain} />
        <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n600 }}>
          Plain English
        </span>
      </div>

      {showPlain && (
        <div style={{
          fontFamily: T.fSans, fontSize: 13, fontStyle: 'italic',
          color: T.n700, lineHeight: 1.6,
          background: T.brandSoft, border: `1px solid ${T.brandBorder}`,
          borderRadius: 8, padding: '10px 14px',
        }}>
          {text}
        </div>
      )}
    </div>
  );
});
PlainEnglishToggle.displayName = 'PlainEnglishToggle';
