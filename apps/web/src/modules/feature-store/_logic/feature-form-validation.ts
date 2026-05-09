/**
 * Phase 4 register-form validation. Builds an issue list keyed by form path
 * — page renders inline errors next to the offending input.
 *
 * Rules:
 *   - name: snake_case regex /^[a-z][a-z0-9_]*$/, min 3, unique against catalog
 *   - displayName: non-empty
 *   - games: at least one
 *   - dualTier: requires substrate-A definition AND substrate-B definition both filled
 *   - propensity (when platform): family + target + AUC + version all set
 */
import type {
  HermesFeatureSource,
  HermesFeatureType,
  HermesGame,
  HermesLatencyTier,
  HermesSubstrate,
  PropensityModelMeta,
} from '@hermes/contracts';
import { getAllFeatures } from '../../../data/catalog/features/index';

export interface FeatureFormState {
  name: string;
  displayName: string;
  type: HermesFeatureType;
  domain: string;
  status: 'active' | 'beta' | 'deprecated';
  latencyTier: HermesLatencyTier;
  substrate: HermesSubstrate;
  dualTier: boolean;
  games: HermesGame[];
  platform: boolean;
  propensityModel: PropensityModelMeta;
  exprLang: string;
  dbtSql: string;
  description: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

const NAME_RE = /^[a-z][a-z0-9_]*$/;

export function validateFeatureForm(form: FeatureFormState): ValidationResult {
  const errors: Record<string, string> = {};

  if (!form.name) {
    errors.name = 'Name required';
  } else if (form.name.length < 3) {
    errors.name = 'At least 3 characters';
  } else if (!NAME_RE.test(form.name)) {
    errors.name = 'Use snake_case: lowercase, numbers, underscores; start with a letter';
  } else if (getAllFeatures().some((f) => f.name === form.name)) {
    errors.name = `Name already taken — pick another`;
  }

  if (!form.displayName.trim()) {
    errors.displayName = 'Display name required';
  }

  if (form.games.length === 0) {
    errors.games = 'Select at least one game';
  }

  if (form.dualTier) {
    if (!form.exprLang.trim()) {
      errors.exprLang = 'Substrate A definition required for dual-tier';
    }
    if (!form.dbtSql.trim()) {
      errors.dbtSql = 'Substrate B definition required for dual-tier';
    }
  } else if (form.substrate === 'A' && !form.exprLang.trim()) {
    errors.exprLang = 'Substrate A definition required';
  } else if (form.substrate === 'B' && !form.dbtSql.trim()) {
    errors.dbtSql = 'Substrate B definition required';
  }

  if (form.platform) {
    if (!form.propensityModel.target.trim()) errors.propensityTarget = 'Target metric required';
    if (!form.propensityModel.aucBand.trim()) errors.propensityAuc = 'AUC band required';
    if (!form.propensityModel.modelVersion.trim()) errors.propensityVersion = 'Model version required';
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/** Build the source-form feature object from validated form state. */
export function buildFeatureSource(
  form: FeatureFormState,
  owner: string,
): HermesFeatureSource {
  return {
    name: form.name,
    displayName: form.displayName,
    type: form.type,
    latencyTier: form.latencyTier,
    substrate: form.substrate,
    domain: form.domain as HermesFeatureSource['domain'],
    games: form.games,
    platform: form.platform || undefined,
    propensityModel: form.platform ? form.propensityModel : undefined,
    dualTier: form.dualTier || undefined,
    owner,
    status: form.status,
    addedAt: new Date().toISOString().slice(0, 10),
    sparklineKey: `spk-${form.name.replace(/_/g, '-')}`,
    usedBySegments: 0,
    usedByCampaigns: 0,
    definition: {
      exprLang: form.exprLang.trim(),
      dbtSql: form.dbtSql.trim(),
    },
  };
}
