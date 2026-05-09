/**
 * PropensityModelSection — gated card; renders only when form.platform === true.
 * Captures family · target · training window · AUC band · model version · cadence.
 */
import React from 'react';
import type { PropensityModelMeta } from '@hermes/contracts';
import type { FeatureFormState } from '../_logic/feature-form-validation';
import { Field, SectionCard, Select, TextInput } from './form-primitives';

const FAMILIES: PropensityModelMeta['family'][] = [
  'pltv',
  'churn',
  'reactivation',
  'monetization',
  'engagement',
];

interface Props {
  form: FeatureFormState;
  errors: Record<string, string>;
  onChange: (patch: Partial<FeatureFormState>) => void;
}

export const PropensityModelSection: React.FC<Props> = ({ form, errors, onChange }) => {
  if (!form.platform) return null;

  const patch = (next: Partial<PropensityModelMeta>) =>
    onChange({ propensityModel: { ...form.propensityModel, ...next } });

  return (
    <SectionCard title="Propensity model">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Family">
          <Select
            value={form.propensityModel.family}
            onChange={(e) => patch({ family: e.target.value as PropensityModelMeta['family'] })}
          >
            {FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Target metric" error={errors.propensityTarget}>
          <TextInput
            value={form.propensityModel.target}
            onChange={(e) => patch({ target: e.target.value })}
            placeholder="30d_revenue"
            error={!!errors.propensityTarget}
          />
        </Field>

        <Field label="Training window (days)">
          <TextInput
            type="number"
            value={form.propensityModel.trainingWindowDays}
            onChange={(e) =>
              patch({ trainingWindowDays: Math.max(1, parseInt(e.target.value, 10) || 1) })
            }
          />
        </Field>

        <Field label="Refresh cadence">
          <Select
            value={form.propensityModel.refreshCadence}
            onChange={(e) =>
              patch({ refreshCadence: e.target.value as PropensityModelMeta['refreshCadence'] })
            }
          >
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
          </Select>
        </Field>

        <Field label="AUC band" error={errors.propensityAuc}>
          <TextInput
            value={form.propensityModel.aucBand}
            onChange={(e) => patch({ aucBand: e.target.value })}
            placeholder="0.78-0.82"
            error={!!errors.propensityAuc}
          />
        </Field>

        <Field label="Model version" error={errors.propensityVersion}>
          <TextInput
            value={form.propensityModel.modelVersion}
            onChange={(e) => patch({ modelVersion: e.target.value })}
            placeholder="v1.0"
            error={!!errors.propensityVersion}
          />
        </Field>
      </div>
    </SectionCard>
  );
};
