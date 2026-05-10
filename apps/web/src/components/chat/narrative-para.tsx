/**
 * NarrativePara — minimal-markdown paragraph. Supports **bold** and inline `code`.
 * No external deps; regex-tokenized for safety.
 */
import React from 'react';
import { T } from '../../theme';

interface NarrativeParaProps {
  text: string;
}

interface Token {
  kind: 'plain' | 'bold' | 'code';
  text: string;
}

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  // Match **bold** or `code` greedily
  const regex = /(\*\*[^*]+\*\*)|(`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: 'plain', text: text.slice(last, m.index) });
    if (m[1]) out.push({ kind: 'bold', text: m[1].slice(2, -2) });
    else if (m[2]) out.push({ kind: 'code', text: m[2].slice(1, -1) });
    last = regex.lastIndex;
  }
  if (last < text.length) out.push({ kind: 'plain', text: text.slice(last) });
  return out;
}

export function NarrativePara({ text }: NarrativeParaProps) {
  const tokens = React.useMemo(() => tokenize(text), [text]);
  return (
    <p style={{
      fontFamily: T.fSans, fontSize: 15, color: T.n800, lineHeight: 1.65,
      margin: '0 0 12px', maxWidth: 820,
    }}>
      {tokens.map((t, i) => {
        if (t.kind === 'bold') return <strong key={i} style={{ color: T.n900 }}>{t.text}</strong>;
        if (t.kind === 'code') return (
          <code key={i} style={{
            fontFamily: T.fMono, fontSize: 13,
            background: T.n100, color: T.n800,
            padding: '1px 5px', borderRadius: 4,
          }}>{t.text}</code>
        );
        return <React.Fragment key={i}>{t.text}</React.Fragment>;
      })}
    </p>
  );
}
