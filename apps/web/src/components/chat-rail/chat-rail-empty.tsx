/**
 * ChatRailEmpty — empty rail body. Brand mark + tagline. Placeholder slots
 * for Recent Threads + Scripted Prompts populated in Phase 3.
 */
import React from 'react';
import { T } from '../../theme';

interface ChatRailEmptyProps {
  /** Phase 3: <RecentThreadsSection> rendered here when present. */
  recentThreadsSlot?: React.ReactNode;
  /** Phase 3: <ScriptedPromptsSection> rendered here when present. */
  scriptedPromptsSlot?: React.ReactNode;
}

export function ChatRailEmpty({ recentThreadsSlot, scriptedPromptsSlot }: ChatRailEmptyProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      padding: '32px 16px 16px', gap: 18,
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        padding: '24px 0 4px',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: T.n900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: T.fDisp, fontSize: 18, fontWeight: 400,
            color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em',
            lineHeight: 1,
          }}>VG</span>
        </div>
        <p style={{
          fontFamily: T.fSans, fontSize: 13, color: T.n500,
          margin: 0, textAlign: 'center', maxWidth: 280, lineHeight: 1.5,
        }}>
          Ask about this page or your data
        </p>
      </div>
      {recentThreadsSlot}
      {scriptedPromptsSlot}
    </div>
  );
}
