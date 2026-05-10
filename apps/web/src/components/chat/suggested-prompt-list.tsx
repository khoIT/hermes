/**
 * SuggestedPromptList — renders the 5 landing-page prompts as clickable rows.
 */
import React from 'react';
import { SUGGESTED_PROMPTS } from '../../data/chat/suggested-prompts';
import { SuggestedPromptRow } from './suggested-prompt-row';

interface SuggestedPromptListProps {
  onPick: (text: string) => void;
}

export function SuggestedPromptList({ onPick }: SuggestedPromptListProps) {
  return (
    <div style={{ width: '100%' }}>
      {SUGGESTED_PROMPTS.map(p => (
        <SuggestedPromptRow key={p.id} text={p.text} onClick={() => onPick(p.text)} />
      ))}
    </div>
  );
}
