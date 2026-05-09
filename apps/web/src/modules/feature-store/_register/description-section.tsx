/**
 * DescriptionSection — short plain-English description (1-2 short paragraphs,
 * 280 chars total). Surfaces in the detail page DescriptionBlock.
 */
import React from 'react';
import { T } from '../../../theme';
import type { FeatureFormState } from '../_logic/feature-form-validation';
import { Field, SectionCard, Textarea } from './form-primitives';

interface Props {
  form: FeatureFormState;
  onChange: (patch: Partial<FeatureFormState>) => void;
}

const MAX = 280;

export const DescriptionSection: React.FC<Props> = ({ form, onChange }) => {
  const remaining = MAX - form.description.length;
  return (
    <SectionCard title="Description">
      <Field label="Plain-English description" hint="Up to 280 characters · plain prose, no SQL.">
        <Textarea
          value={form.description}
          rows={3}
          maxLength={MAX}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What this feature represents and when LiveOps should use it."
        />
      </Field>
      <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n400, textAlign: 'right' }}>
        {remaining} chars left
      </div>
    </SectionCard>
  );
};
