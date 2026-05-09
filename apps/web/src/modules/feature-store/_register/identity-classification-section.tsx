/**
 * IdentityClassificationSection — Identity (name, displayName) +
 * Classification (domain, type, status). Combined into one card for
 * compactness; conceptually two groups but visually adjacent fields.
 */
import React from 'react';
import { T } from '../../../theme';
import type { FeatureFormState } from '../_logic/feature-form-validation';
import { Field, SectionCard, Select, TextInput } from './form-primitives';

const DOMAINS: FeatureFormState['domain'][] = [
  'identity-lifecycle',
  'monetization',
  'currency',
  'engagement',
  'gameplay-cfm',
  'stateful-streaks',
  'inventory',
  'promotion-config',
  'social-playstyle',
  'test-system',
  'campaign-engagement',
  'predictive',
];

const TYPES: FeatureFormState['type'][] = [
  'int',
  'numeric',
  'bool',
  'enum',
  'string',
  'timestamp',
  'array<string>',
];

const STATUSES: FeatureFormState['status'][] = ['active', 'beta', 'deprecated'];

interface Props {
  form: FeatureFormState;
  errors: Record<string, string>;
  onChange: (patch: Partial<FeatureFormState>) => void;
}

export const IdentityClassificationSection: React.FC<Props> = ({ form, errors, onChange }) => (
  <SectionCard title="Identity & Classification">
    <Field label="Technical name" hint="snake_case · lowercase · numbers · underscores" error={errors.name}>
      <TextInput
        value={form.name}
        onChange={(e) => onChange({ name: e.target.value.trim() })}
        placeholder="my_new_feature_score"
        error={!!errors.name}
      />
    </Field>

    <Field label="Display name" error={errors.displayName}>
      <TextInput
        value={form.displayName}
        onChange={(e) => onChange({ displayName: e.target.value })}
        placeholder="My New Feature Score"
        style={{ fontFamily: '"Georgia", "Times New Roman", serif', fontStyle: 'italic' }}
        error={!!errors.displayName}
      />
    </Field>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      <Field label="Domain">
        <Select value={form.domain} onChange={(e) => onChange({ domain: e.target.value })}>
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Type">
        <Select
          value={form.type}
          onChange={(e) => onChange({ type: e.target.value as FeatureFormState['type'] })}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Status">
        <Select
          value={form.status}
          onChange={(e) => onChange({ status: e.target.value as FeatureFormState['status'] })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  </SectionCard>
);
