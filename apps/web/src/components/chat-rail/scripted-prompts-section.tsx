/**
 * ScriptedPromptsSection — 4 categorized prompts under 2 pill labels in
 * the chat rail empty state. Click → caller submits the prompt text (which
 * matches an intent and triggers the corresponding thread fixture).
 */
import React from 'react';
import { CornerDownRight } from 'lucide-react';
import { T, Icon } from '../../theme';
import {
  SUGGESTED_PROMPTS, CATEGORY_LABEL,
  type PromptCategory, type SuggestedPrompt,
} from '../../data/chat/suggested-prompts';

interface ScriptedPromptsSectionProps {
  onPick: (prompt: SuggestedPrompt) => void;
}

const CATEGORIES: PromptCategory[] = ['research', 'segment'];

export function ScriptedPromptsSection({ onPick }: ScriptedPromptsSectionProps) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h6 style={subheaderStyle}>TRY ONE OF THESE</h6>
      {CATEGORIES.map(cat => {
        const prompts = SUGGESTED_PROMPTS.filter(p => p.category === cat);
        if (prompts.length === 0) return null;
        return (
          <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={pillLabelStyle}>{CATEGORY_LABEL[cat]}</div>
            {prompts.map(p => (
              <button
                key={p.id}
                onClick={() => onPick(p)}
                style={promptRowStyle}
                onMouseEnter={e => { e.currentTarget.style.background = T.n100; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                <Icon icon={CornerDownRight} size={12} color={T.n400} />
                <span style={{
                  flex: 1, minWidth: 0,
                  fontFamily: T.fSans, fontSize: 12, color: T.n800,
                  lineHeight: 1.4,
                }}>
                  {p.text}
                </span>
              </button>
            ))}
          </div>
        );
      })}
    </section>
  );
}

const subheaderStyle: React.CSSProperties = {
  margin: 0, padding: '0 4px 4px',
  fontFamily: T.fMono, fontSize: 9.5, fontWeight: 600,
  color: T.n400, letterSpacing: '0.04em', textTransform: 'uppercase',
};

const pillLabelStyle: React.CSSProperties = {
  fontFamily: T.fMono, fontSize: 10, fontWeight: 600,
  color: T.n500, letterSpacing: '0.04em', textTransform: 'uppercase',
  padding: '0 4px',
};

const promptRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 8,
  width: '100%', boxSizing: 'border-box',
  padding: '8px 10px',
  background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8,
  cursor: 'pointer', textAlign: 'left',
  transition: 'background .12s',
};
