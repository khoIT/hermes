/**
 * Trigger lifecycle strip — chevron flow: event → predicate → match → IAM → cooldown → resume.
 */
import React from 'react';
import { T } from '../../../../theme';

interface Props {
  steps: readonly string[];
}

export const TriggerLifecycleStrip: React.FC<Props> = ({ steps }) => (
  <div style={{
    display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'wrap',
    padding: 12, borderRadius: 10,
    background: T.n50, border: `1px solid ${T.n200}`,
  }}>
    {steps.map((s, i) => (
      <React.Fragment key={s}>
        <span style={{
          padding: '6px 12px', borderRadius: 6,
          background: '#fff', border: `1px solid ${T.n200}`,
          fontFamily: T.fMono, fontSize: 11, color: T.n800,
          letterSpacing: '0.04em',
        }}>
          {s}
        </span>
        {i < steps.length - 1 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0 8px', color: T.brand, fontFamily: T.fMono, fontSize: 14,
          }}>
            ›
          </span>
        )}
      </React.Fragment>
    ))}
  </div>
);
