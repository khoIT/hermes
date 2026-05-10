/**
 * SuggestedPromptList — renders the 5 landing-page prompts as clickable rows.
 * onPick receives the full prompt (incl. threadId) so callers can route to
 * the canonical pre-seeded thread instead of forking a duplicate.
 */
import React from 'react';
import { SUGGESTED_PROMPTS, type SuggestedPrompt } from '../../data/chat/suggested-prompts';
import { SuggestedPromptRow } from './suggested-prompt-row';

interface SuggestedPromptListProps {
  onPick: (prompt: SuggestedPrompt) => void;
}

export function SuggestedPromptList({ onPick }: SuggestedPromptListProps) {
  return (
    <div style={{ width: '100%' }}>
      {SUGGESTED_PROMPTS.map(p => (
        <SuggestedPromptRow key={p.id} text={p.text} onClick={() => onPick(p)} />
      ))}
    </div>
  );
}
