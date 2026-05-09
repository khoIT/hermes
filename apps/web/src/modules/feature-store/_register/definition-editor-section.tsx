/**
 * DefinitionEditorSection — two-pane code-style textareas for expr-lang +
 * dbt SQL. "Reset to stub" buttons regenerate the seed copy from the
 * current name/type/tier so authors can re-anchor after small edits.
 */
import React from 'react';
import { T } from '../../../theme';
import { SUBSTRATE_PANE_LABEL } from '../../../components/_logic/latency-labels';
import { dbtSqlStub, exprLangStub } from '../_logic/definition-stubs';
import type { FeatureFormState } from '../_logic/feature-form-validation';
import { Field, SectionCard, Textarea } from './form-primitives';

interface Props {
  form: FeatureFormState;
  errors: Record<string, string>;
  onChange: (patch: Partial<FeatureFormState>) => void;
}

const Pane: React.FC<{
  paneTitle: string;
  subtitle: string;
  value: string;
  onValueChange: (next: string) => void;
  onReset: () => void;
  errorText?: string;
  accentColor: string;
}> = ({ paneTitle, subtitle, value, onValueChange, onReset, errorText, accentColor }) => (
  <div
    style={{
      flex: 1,
      minWidth: 0,
      borderTop: `2px solid ${accentColor}`,
      background: '#fff',
      borderRadius: 0,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 4px 8px',
      }}
    >
      <div>
        <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n800, fontWeight: 600 }}>
          {paneTitle}
        </div>
        <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400 }}>{subtitle}</div>
      </div>
      <button
        type="button"
        onClick={onReset}
        style={{
          fontFamily: T.fSans,
          fontSize: 10,
          color: T.n500,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Reset to stub
      </button>
    </div>
    <Field label="" error={errorText}>
      <Textarea
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        rows={8}
        error={!!errorText}
        style={{ background: T.n50 }}
      />
    </Field>
  </div>
);

export const DefinitionEditorSection: React.FC<Props> = ({ form, errors, onChange }) => {
  const showA = form.dualTier || form.substrate === 'A';
  const showB = form.dualTier || form.substrate === 'B';

  const resetExpr = () =>
    onChange({ exprLang: exprLangStub(form.name || 'feature_name', form.type, form.latencyTier) });
  const resetSql = () =>
    onChange({ dbtSql: dbtSqlStub(form.name || 'feature_name', form.type, form.latencyTier) });

  return (
    <SectionCard title="Definition">
      <div style={{ display: 'flex', gap: 12 }}>
        {showA && (
          <Pane
            paneTitle={SUBSTRATE_PANE_LABEL.A}
            subtitle="Apollo TEE · real-time"
            value={form.exprLang}
            onValueChange={(next) => onChange({ exprLang: next })}
            onReset={resetExpr}
            errorText={errors.exprLang}
            accentColor={T.green600}
          />
        )}
        {showB && (
          <Pane
            paneTitle={SUBSTRATE_PANE_LABEL.B}
            subtitle="Hatchet/Trino · batch"
            value={form.dbtSql}
            onValueChange={(next) => onChange({ dbtSql: next })}
            onReset={resetSql}
            errorText={errors.dbtSql}
            accentColor={T.amber500}
          />
        )}
      </div>
    </SectionCard>
  );
};
