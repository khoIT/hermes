/**
 * WorkingStatusBlock — header section of a deep-research trace.
 * Shows "Working.." (pulsing dot) or "Done" (filled dot) plus a 1-2 sentence
 * intent statement. Optional collapse-toggle is controlled by the parent.
 */
import React from 'react';
import { T } from '../../../theme';
import type { WorkingStatusPayload } from '../../../data/chat/response-types';

interface Props {
  payload: WorkingStatusPayload;
  /** Optional collapsed-state controller — owned by parent. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function WorkingStatusBlock({ payload, collapsed, onToggleCollapsed }: Props) {
  const state = payload.state ?? 'working';
  return (
    <div data-hermes-section="working-status" style={{
      borderTop: `1px solid ${T.n100}`,
      padding: '14px 0 4px',
      marginBottom: 4,
      maxWidth: 820,
    }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dot state={state} />
          <h3 style={{
            fontFamily: T.fSans, fontSize: 15, fontWeight: 600,
            color: T.n900, margin: 0,
          }}>{state === 'done' ? 'Done' : 'Working..'}</h3>
        </div>
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            style={{
              background: 'transparent', border: 'none', color: T.n500,
              fontFamily: T.fSans, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              padding: 0,
            }}
          >{collapsed ? 'Show details ▾' : 'Hide details ▴'}</button>
        )}
      </header>
      <p style={{
        margin: '8px 0 0', fontFamily: T.fSans, fontSize: 13.5,
        color: T.n700, lineHeight: 1.55, maxWidth: 720,
      }}>{payload.intent}</p>
      <style>{`@keyframes hermesPulse{0%,100%{opacity:.35}50%{opacity:1}}`}</style>
    </div>
  );
}

function Dot({ state }: { state: 'working' | 'done' }) {
  return (
    <span aria-hidden style={{
      width: 8, height: 8, borderRadius: '50%',
      background: T.n900,
      opacity: state === 'working' ? 0.85 : 1,
      animation: state === 'working' ? 'hermesPulse 1.4s ease-in-out infinite' : 'none',
    }} />
  );
}
