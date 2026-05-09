/**
 * FeatureRegisteredModal — handoff modal shown after registering a new feature.
 * Shape mirrors the segment / campaign handoff modals (PRD §8.7, §9.9):
 * mono FeatureID + 4-step "what happens next" + Substrate A/B verbatim copy.
 *
 * Three CTAs: View feature · Register another · Done.
 */
import React from 'react';
import { T } from '../../../theme';
import { SUBSTRATE_LONG } from '../../../components/_logic/latency-labels';
import type { HermesFeatureSource } from '@hermes/contracts';

interface Props {
  feature: HermesFeatureSource;
  featureId: string;
  onView: () => void;
  onAnother: () => void;
  onDone: () => void;
}

const Step: React.FC<{ idx: number; label: string; status: string }> = ({ idx, label, status }) => (
  <li
    style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 10,
      padding: '4px 0',
      fontFamily: T.fSans,
      fontSize: 12,
      color: T.n700,
    }}
  >
    <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400, minWidth: 14 }}>
      {idx}.
    </span>
    <span style={{ flex: 1 }}>{label}</span>
    <span style={{ fontFamily: T.fMono, fontSize: 10, color: T.n500 }}>{status}</span>
  </li>
);

export const FeatureRegisteredModal: React.FC<Props> = ({
  feature,
  featureId,
  onView,
  onAnother,
  onDone,
}) => {
  const showA = feature.dualTier || feature.substrate === 'A';
  const showB = feature.dualTier || feature.substrate === 'B';

  const copyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(featureId).catch(() => {});
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 540,
          maxWidth: '92vw',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          padding: '24px 28px',
        }}
      >
        <div
          style={{
            fontFamily: T.fSans,
            fontSize: 11,
            fontWeight: 700,
            color: T.green600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}
        >
          ✓ Feature registered
        </div>
        <div
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: 19,
            color: T.n900,
            marginBottom: 14,
          }}
        >
          {feature.displayName}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: T.n50,
            padding: '8px 12px',
            borderRadius: 6,
            marginBottom: 18,
          }}
        >
          <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500, fontWeight: 600 }}>
            FeatureID
          </span>
          <code style={{ fontFamily: T.fMono, fontSize: 12, color: T.n900, flex: 1 }}>
            {featureId}
          </code>
          <button
            type="button"
            onClick={copyId}
            style={{
              fontFamily: T.fSans,
              fontSize: 10,
              color: T.brand,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            copy
          </button>
        </div>

        <div
          style={{
            fontFamily: T.fSans,
            fontSize: 10,
            fontWeight: 700,
            color: T.n400,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            marginBottom: 6,
          }}
        >
          What happens next
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', marginBottom: 16 }}>
          <Step idx={1} label="Definition compiled to expr-lang" status={showA ? 'done' : 'skipped'} />
          <Step idx={2} label="Definition compiled to dbt SQL" status={showB ? 'done' : 'skipped'} />
          <Step idx={3} label="Substrate A registers feature ID" status={showA ? 'pending sync' : '—'} />
          <Step idx={4} label="Substrate B writes Iceberg schema" status={showB ? 'pending sync' : '—'} />
        </ol>

        <div
          style={{
            background: T.n50,
            padding: '10px 12px',
            borderRadius: 6,
            fontFamily: T.fMono,
            fontSize: 11,
            color: T.n700,
            lineHeight: 1.6,
            marginBottom: 18,
          }}
        >
          {showA && <div>{SUBSTRATE_LONG.A}</div>}
          {showB && <div>{SUBSTRATE_LONG.B}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onAnother}
            style={{
              fontFamily: T.fSans,
              fontSize: 12,
              fontWeight: 600,
              color: T.n600,
              background: 'transparent',
              border: `1px solid ${T.n200}`,
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            Register another
          </button>
          <button
            type="button"
            onClick={onDone}
            style={{
              fontFamily: T.fSans,
              fontSize: 12,
              fontWeight: 600,
              color: T.n600,
              background: 'transparent',
              border: `1px solid ${T.n200}`,
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
          <button
            type="button"
            onClick={onView}
            style={{
              fontFamily: T.fSans,
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              background: T.brand,
              border: `1px solid ${T.brand}`,
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            View feature →
          </button>
        </div>
      </div>
    </div>
  );
};
