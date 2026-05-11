/**
 * TaskProgressPanel — vertical checklist of canonical pipeline steps with
 * per-step state (done / in_progress / pending) and a percent header. The
 * connecting vertical rail visually links steps in the screenshot pattern.
 */
import React from 'react';
import { Check, RefreshCw, Circle } from 'lucide-react';
import { T, Icon } from '../../../theme';
import type { TaskProgressPayload } from '../../../data/chat/response-types';

interface Props {
  payload: TaskProgressPayload;
}

export function TaskProgressPanel({ payload }: Props) {
  const [expanded, setExpanded] = React.useState(true);
  return (
    <div data-hermes-section="task-progress" style={{
      border: `1px solid ${T.n200}`, borderRadius: 8, background: T.surface,
      padding: '12px 14px 8px', margin: '8px 0', maxWidth: 820,
    }}>
      <header
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon icon={RefreshCw} size={13} color={T.n500} />
          <span style={{ fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.n800 }}>
            Task progress
          </span>
        </div>
        <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500 }}>
          {payload.percent}% {expanded ? '▾' : '▸'}
        </span>
      </header>
      {expanded && (
        <ol style={{ listStyle: 'none', padding: 0, margin: '12px 0 4px' }}>
          {payload.steps.map((s, i) => (
            <Row key={i} step={s} isLast={i === payload.steps.length - 1} />
          ))}
        </ol>
      )}
    </div>
  );
}

function Row({ step, isLast }: { step: TaskProgressPayload['steps'][number]; isLast: boolean }) {
  const color = step.state === 'done' ? T.n900 : step.state === 'in_progress' ? T.brand : T.n400;
  return (
    <li style={{
      position: 'relative', paddingLeft: 26, paddingBottom: isLast ? 0 : 10,
      fontFamily: T.fSans, fontSize: 13, color: step.state === 'pending' ? T.n500 : T.n800,
      lineHeight: 1.5,
    }}>
      {!isLast && (
        <span aria-hidden style={{
          position: 'absolute', left: 7, top: 16, bottom: 0, width: 1,
          background: T.n200,
        }} />
      )}
      <span aria-hidden style={{
        position: 'absolute', left: 0, top: 1, width: 16, height: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: T.surface, color,
      }}>
        {step.state === 'done'        && <Icon icon={Check}   size={13} color={color} />}
        {step.state === 'in_progress' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, animation: 'hermesPulse 1.4s ease-in-out infinite' }} />}
        {step.state === 'pending'     && <Icon icon={Circle}  size={13} color={color} />}
      </span>
      {step.label}
    </li>
  );
}
