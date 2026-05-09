/**
 * AgentThread — chronological mono reasoning log for an Opportunity.
 * Format per entry: "HH:MM:SS  action  description"
 * Per PRD_Hermes_Agentic.md §5.3
 */
import React from 'react';
import { T } from '../../../theme';

interface AgentThreadProps {
  entries: string[];
  style?: React.CSSProperties;
}

export const AgentThread = React.memo<AgentThreadProps>(({ entries, style }) => {
  if (!entries?.length) return null;

  return (
    <div style={{ ...style }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
      }}>
        Agent reasoning thread
      </div>
      <div style={{
        background: T.n950, borderRadius: 8,
        padding: '14px 16px',
        fontFamily: T.fMono, fontSize: 12, color: T.n300,
        lineHeight: 1.8,
        overflowX: 'auto',
      }}>
        {entries.map((line, i) => {
          // Parse "HH:MM:SS  action  description" — split on 2+ spaces
          const parts = line.split(/\s{2,}/);
          const timestamp = parts[0] ?? '';
          const action    = parts[1] ?? '';
          const desc      = parts.slice(2).join('  ');

          return (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
              <span style={{ color: T.n500, flexShrink: 0, minWidth: 64 }}>
                {timestamp}
              </span>
              <span style={{
                color: T.brand, flexShrink: 0, minWidth: 80,
                fontWeight: 600, letterSpacing: '0.03em',
              }}>
                {action}
              </span>
              <span style={{ color: T.n300 }}>
                {desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
AgentThread.displayName = 'AgentThread';
