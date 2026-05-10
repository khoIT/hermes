/**
 * ToolCallChip + Provenance — agent-first demo path (260510-2300).
 *
 * ToolCallChip surfaces a single query/computation the agent ran, as a
 * mono-styled pill. Visual signal that distinguishes "agent doing work" from
 * narrative text. Used in thread-demo-agent-livops-2026 only.
 *
 * Provenance is a small grey caption beneath a chart, surfacing the data
 * source/window/sample so claims feel grounded vs slide-deck-numbers.
 */
import React from 'react';
import { T } from '../../theme';

export function ToolCallChip({
  label, detail, status = 'done',
}: { label: string; detail?: string; status?: 'running' | 'done' }) {
  const dotColor = status === 'running' ? '#f59e0b' : '#10b981';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: T.fMono, fontSize: 12, color: T.n700,
      background: T.n50, border: `1px solid ${T.n200}`,
      borderRadius: 6, padding: '4px 10px',
      margin: '4px 6px 4px 0', maxWidth: 760,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: dotColor, flexShrink: 0,
        animation: status === 'running' ? 'hermesPulse 1.4s ease-in-out infinite' : undefined,
      }} />
      <span style={{ fontWeight: 500 }}>{label}</span>
      {detail && (
        <span style={{ color: T.n500, fontWeight: 400 }}>· {detail}</span>
      )}
      <style>{`@keyframes hermesPulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
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
