/**
 * ToolCallChip + Provenance — agent-first demo + research threads.
 *
 * ToolCallChip renders a structured function-call shape:
 *   `⚡ fn(arg="value", arg2=42) → result · 1.4s`
 *
 * Buffer animation: when the chip mounts in 'running' state, it shows a
 * pulsing amber dot + "running…" placeholder for `durationMs` (default 900ms),
 * then flips to 'done' with a green dot + the actual result + duration. This
 * makes the agent feel like it is actually executing the query rather than
 * narrating a pre-canned step.
 *
 * The buffer timer respects React Strict Mode double-invocation by clamping.
 */
import React from 'react';
import { T } from '../../theme';
import type { ToolCallPayload } from '../../data/chat/response-types';

type ChipStatus = 'running' | 'done' | 'error';

const DEFAULT_DURATION_MS = 900;

function formatArgs(args: ToolCallPayload['args']): string {
  if (!args?.length) return '';
  return args
    .map(a => {
      const v = a.value;
      if (typeof v === 'string') return `${a.name}="${v}"`;
      return `${a.name}=${String(v)}`;
    })
    .join(', ');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ToolCallChip(props: ToolCallPayload) {
  const {
    fn, args, result, error,
    durationMs = DEFAULT_DURATION_MS,
    status: explicit,
  } = props;

  // Animate running → done. If explicit status is provided, honor it (no
  // animation). Otherwise start 'running' and flip after durationMs.
  const [status, setStatus] = React.useState<ChipStatus>(
    explicit ?? 'running',
  );
  React.useEffect(() => {
    if (explicit) {
      setStatus(explicit);
      return;
    }
    setStatus('running');
    const timer = window.setTimeout(() => setStatus('done'), durationMs);
    return () => window.clearTimeout(timer);
  }, [explicit, durationMs]);

  const dotColor =
    status === 'running' ? '#f59e0b' :
    status === 'error'   ? '#ef4444' :
                           '#10b981';
  const argsStr = formatArgs(args);

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      fontFamily: T.fMono, fontSize: 12, color: T.n700,
      background: T.n50, border: `1px solid ${T.n200}`,
      borderRadius: 6, padding: '6px 12px',
      margin: '4px 0', maxWidth: 760, lineHeight: 1.55,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: dotColor, flexShrink: 0,
        marginTop: 7,
        animation: status === 'running' ? 'hermesPulse 1.1s ease-in-out infinite' : undefined,
      }} />
      <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
        <span style={{ color: T.n800, fontWeight: 600 }}>{fn}</span>
        <span style={{ color: T.n500 }}>({argsStr})</span>
        {status === 'running' && (
          <span style={{ color: T.n500, fontStyle: 'italic', marginLeft: 6 }}>
            … running
          </span>
        )}
        {status === 'done' && result && (
          <>
            <span style={{ color: T.n500 }}> {' → '} </span>
            <span style={{ color: T.n800 }}>{result}</span>
            <span style={{ color: T.n500 }}> · {formatDuration(durationMs)}</span>
          </>
        )}
        {status === 'error' && (
          <>
            <span style={{ color: '#ef4444' }}> {' → '} </span>
            <span style={{ color: '#ef4444' }}>{error ?? 'failed'}</span>
            <span style={{ color: T.n500 }}> · {formatDuration(durationMs)}</span>
          </>
        )}
      </span>
      <style>{`@keyframes hermesPulse{0%,100%{opacity:.35}50%{opacity:1}}`}</style>
    </div>
  );
}

export function ProvenanceCaption({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: T.fMono, fontSize: 11, color: T.n500,
      margin: '-4px 0 14px', maxWidth: 820, lineHeight: 1.5,
      letterSpacing: '0.005em',
    }}>
      {text}
    </div>
  );
}
