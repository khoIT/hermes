/**
 * LatencySubstrateSection — primary tier (Realtime/Batch warm/Batch cold) +
 * dual-tier toggle. Substrate is derived from tier (Realtime → A, batch → B)
 * but switchable for advanced cases.
 */
import React from 'react';
import { T } from '../../../theme';
import type { HermesLatencyTier } from '@hermes/contracts';
import type { FeatureFormState } from '../_logic/feature-form-validation';
import { Field, SectionCard, Toggle } from './form-primitives';

const TIER_OPTIONS: { tier: HermesLatencyTier; label: string; substrate: 'A' | 'B' }[] = [
  { tier: '<1s', label: 'Realtime', substrate: 'A' },
  { tier: '<1h', label: 'Batch warm', substrate: 'B' },
  { tier: '<1d', label: 'Batch cold', substrate: 'B' },
];

interface Props {
  form: FeatureFormState;
  onChange: (patch: Partial<FeatureFormState>) => void;
}

export const LatencySubstrateSection: React.FC<Props> = ({ form, onChange }) => (
  <SectionCard title="Latency & substrate">
    <Field label="Primary tier">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TIER_OPTIONS.map(({ tier, label, substrate }) => {
          const active = form.latencyTier === tier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => onChange({ latencyTier: tier, substrate })}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                fontFamily: T.fSans,
                fontSize: 12,
                fontWeight: 600,
                color: active ? T.brand : T.n600,
                background: active ? T.brandSoft : '#fff',
                border: `1px solid ${active ? T.brandBorder : T.n200}`,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </Field>

    <Toggle
      checked={form.dualTier}
      onChange={(next) => onChange({ dualTier: next })}
      label="Dual-tier — define both Substrate A and Substrate B materializations"
    />
  </SectionCard>
);
