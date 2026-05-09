/**
 * ActivityRow — single line item for the Activity feed (screen 21).
 * Shows: mono timestamp · agent badge · action type · outcome chip · terse description
 * Per PRD_Hermes_Agentic.md §5.5
 */
import React from 'react';
import { T } from '../../../theme';
import type { AgentActivity } from '@hermes/contracts';

interface ActivityRowProps {
  activity: AgentActivity;
}

const AGENT_COLORS: Record<string, { bg: string; fg: string }> = {
  insight:    { bg: T.brandSoft,  fg: T.brand    },
  authoring:  { bg: T.blueSoft,   fg: T.blue600  },
  experiment: { bg: T.purpleSoft, fg: T.purple500 },
};

const OUTCOME_COLORS: Record<string, { bg: string; fg: string }> = {
  'approved':            { bg: '#d1fae5', fg: '#065f46' },
  'approved-with-edits': { bg: '#d1fae5', fg: '#065f46' },
  'rejected':            { bg: '#fee2e2', fg: '#991b1b' },
  'dismissed':           { bg: T.n100,   fg: T.n600    },
  'expired':             { bg: T.n100,   fg: T.n500    },
};

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch {
    return iso;
  }
}

export const ActivityRow = React.memo<ActivityRowProps>(({ activity: a }) => {
  const agentStyle   = AGENT_COLORS[a.agent]   ?? AGENT_COLORS['insight']!;
  const outcomeStyle = OUTCOME_COLORS[a.outcome] ?? OUTCOME_COLORS['dismissed']!;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '140px 100px 90px 130px 1fr',
      alignItems: 'center', gap: 12,
      padding: '9px 12px',
      borderBottom: `1px solid ${T.n100}`,
    }}>
      {/* Mono timestamp */}
      <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>
        {formatTimestamp(a.timestamp)}
      </span>

      {/* Agent chip */}
      <span style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
        padding: '2px 8px', borderRadius: 5,
        background: agentStyle.bg, color: agentStyle.fg,
        width: 'fit-content', textTransform: 'capitalize',
      }}>
        {a.agent}
      </span>

      {/* Action type */}
      <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700 }}>
        {a.action}
      </span>

      {/* Outcome chip */}
      <span style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
        padding: '2px 8px', borderRadius: 5,
        background: outcomeStyle.bg, color: outcomeStyle.fg,
        width: 'fit-content',
      }}>
        {a.outcome.replace(/-/g, ' ')}
      </span>

      {/* Description */}
      <div style={{ minWidth: 0 }}>
        <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n700 }}>
          {a.artifactLabel ?? a.artifactRef ?? '—'}
        </span>
        {a.reasonCode && (
          <span style={{
            fontFamily: T.fSans, fontSize: 11, color: T.n400,
            marginLeft: 6,
          }}>
            · {a.reasonCode.replace(/-/g, ' ')}
          </span>
        )}
      </div>
    </div>
  );
});
ActivityRow.displayName = 'ActivityRow';
