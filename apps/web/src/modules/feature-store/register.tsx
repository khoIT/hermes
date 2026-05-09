/**
 * Feature Store / Register New Feature (Phase 4 v2).
 * Form left, live preview right. Submits into the in-memory catalog and
 * shows a handoff modal mirroring segment / campaign handoffs.
 *
 * Prefill via query params (e.g. from detail "Register similar"):
 *   ?domain=...&games=cfm,pt&latency=<1h&similarTo=...
 */
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { T } from '../../theme';
import type { HermesGame, HermesLatencyTier, PropensityModelMeta } from '@hermes/contracts';
import { emptyAnalytics180d, registerFeature } from '../../data/catalog/features/index';
import { GAME_ORDER } from '../../components/_logic/game-colors';
import { dbtSqlStub, exprLangStub } from './_logic/definition-stubs';
import {
  buildFeatureSource,
  validateFeatureForm,
  type FeatureFormState,
} from './_logic/feature-form-validation';
import { AttributionSection } from './_register/attribution-section';
import { DefinitionEditorSection } from './_register/definition-editor-section';
import { DescriptionSection } from './_register/description-section';
import { FeatureRegisteredModal } from './_register/feature-registered-modal';
import { IdentityClassificationSection } from './_register/identity-classification-section';
import { LatencySubstrateSection } from './_register/latency-substrate-section';
import { PreviewPane } from './_register/preview-pane';
import { PropensityModelSection } from './_register/propensity-model-section';

const DEFAULT_PROPENSITY: PropensityModelMeta = {
  family: 'pltv',
  target: '',
  trainingWindowDays: 90,
  aucBand: '',
  modelVersion: '',
  refreshCadence: 'daily',
};

const DEFAULT_FEATURE_OWNER = 'gds-newfeature';

function initialForm(prefill: URLSearchParams): FeatureFormState {
  const games = (prefill.get('games') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is HermesGame => GAME_ORDER.includes(s as HermesGame));
  const latency = (prefill.get('latency') as HermesLatencyTier) || '<1h';
  const substrate: 'A' | 'B' = latency === '<1s' ? 'A' : 'B';
  const domain = (prefill.get('domain') as FeatureFormState['domain']) || 'engagement';
  return {
    name: '',
    displayName: '',
    type: 'numeric',
    domain,
    status: 'beta',
    latencyTier: latency,
    substrate,
    dualTier: false,
    games,
    platform: false,
    propensityModel: DEFAULT_PROPENSITY,
    exprLang: '',
    dbtSql: '',
    description: '',
  };
}

function gamePrefix(games: HermesGame[]): string {
  if (games.length === 0) return 'feat';
  if (games.length >= 4) return 'platform';
  return games[0] ?? 'feat';
}

export default function FeatureStoreRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = React.useState<FeatureFormState>(() => initialForm(searchParams));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState<{
    featureId: string;
    name: string;
    displayName: string;
  } | null>(null);

  const patch = React.useCallback(
    (next: Partial<FeatureFormState>) => setForm((cur) => ({ ...cur, ...next })),
    [],
  );

  // Auto-rehydrate definition stubs when name/type/tier changes and the
  // pane is empty — keeps "starter code" fresh for new authors.
  React.useEffect(() => {
    if (form.name && !form.exprLang) {
      patch({ exprLang: exprLangStub(form.name, form.type, form.latencyTier) });
    }
    if (form.name && !form.dbtSql) {
      patch({ dbtSql: dbtSqlStub(form.name, form.type, form.latencyTier) });
    }
    // Intentional dep list: only react to name & latency changes; user edits to
    // the textarea are preserved by the empty-check above.
  }, [form.name, form.latencyTier, form.type, form.exprLang, form.dbtSql, patch]);

  const handleSubmit = () => {
    const result = validateFeatureForm(form);
    setErrors(result.errors);
    if (!result.ok) {
      const firstKey = Object.keys(result.errors)[0];
      if (firstKey && typeof document !== 'undefined') {
        const el = document.getElementById(`field-${firstKey}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const source = buildFeatureSource(form, DEFAULT_FEATURE_OWNER);
    try {
      registerFeature({ ...source, analytics: emptyAnalytics180d() });
    } catch (err) {
      setErrors({ name: err instanceof Error ? err.message : 'Registration failed' });
      return;
    }

    const featureId = `feat-${gamePrefix(form.games)}-${form.name}`;
    setSubmitted({ featureId, name: form.name, displayName: form.displayName });
  };

  const onModalView = () => {
    if (submitted) navigate(`/feature-store/${encodeURIComponent(submitted.name)}`);
  };
  const onModalDone = () => {
    setSubmitted(null);
    navigate('/feature-store');
  };
  const onModalAnother = () => {
    setSubmitted(null);
    setForm(initialForm(new URLSearchParams()));
    setErrors({});
  };

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* Top bar */}
      <div
        style={{
          padding: '20px 40px 16px',
          background: '#fff',
          borderBottom: `1px solid ${T.n200}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/feature-store')}
            style={{
              fontFamily: T.fSans,
              fontSize: 11,
              color: T.n500,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ← Feature Store
          </button>
          <span style={{ color: T.n300, fontSize: 11 }}>/</span>
          <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n700 }}>Register new feature</span>
        </div>
        <h1
          style={{
            fontFamily: T.fDisp,
            fontSize: 32,
            color: T.n950,
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: 1,
          }}
        >
          Register new feature
        </h1>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)',
          gap: 24,
          padding: '24px 40px',
          alignItems: 'flex-start',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <IdentityClassificationSection form={form} errors={errors} onChange={patch} />
          <LatencySubstrateSection form={form} onChange={patch} />
          <AttributionSection form={form} errors={errors} onChange={patch} />
          <PropensityModelSection form={form} errors={errors} onChange={patch} />
          <DefinitionEditorSection form={form} errors={errors} onChange={patch} />
          <DescriptionSection form={form} onChange={patch} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => navigate('/feature-store')}
              style={{
                fontFamily: T.fSans,
                fontSize: 13,
                fontWeight: 600,
                color: T.n600,
                background: 'transparent',
                border: `1px solid ${T.n200}`,
                borderRadius: 8,
                padding: '8px 18px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                fontFamily: T.fSans,
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                background: T.brand,
                border: `1px solid ${T.brand}`,
                borderRadius: 8,
                padding: '8px 18px',
                cursor: 'pointer',
              }}
            >
              Register feature →
            </button>
          </div>
        </form>

        <PreviewPane form={form} />
      </div>

      {submitted && (
        <FeatureRegisteredModal
          feature={buildFeatureSource(form, DEFAULT_FEATURE_OWNER)}
          featureId={submitted.featureId}
          onView={onModalView}
          onAnother={onModalAnother}
          onDone={onModalDone}
        />
      )}
    </div>
  );
}
