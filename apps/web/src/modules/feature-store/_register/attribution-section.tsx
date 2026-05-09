/**
 * AttributionSection — games multi-select + Platform toggle.
 * Auto-suggests Platform when ≥3 games are selected; user can override.
 */
import React from 'react';
import { T } from '../../../theme';
import type { HermesGame } from '@hermes/contracts';
import { GAME_ORDER, GAME_TINT } from '../../../components/_logic/game-colors';
import type { FeatureFormState } from '../_logic/feature-form-validation';
import { Field, SectionCard, Toggle } from './form-primitives';

interface Props {
  form: FeatureFormState;
  errors: Record<string, string>;
  onChange: (patch: Partial<FeatureFormState>) => void;
}

export const AttributionSection: React.FC<Props> = ({ form, errors, onChange }) => {
  const toggleGame = (g: HermesGame) => {
    const next = form.games.includes(g)
      ? form.games.filter((x) => x !== g)
      : [...form.games, g];
    // Auto-flip platform default when threshold crossed (user can still override).
    const autoPlatform = next.length >= 3;
    onChange({ games: next, platform: autoPlatform ? true : form.games.length >= 3 ? false : form.platform });
  };

  return (
    <SectionCard title="Attribution">
      <Field label="Games" error={errors.games}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GAME_ORDER.map((g) => {
            const tint = GAME_TINT[g];
            const active = form.games.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGame(g)}
                style={{
                  fontFamily: T.fMono,
                  fontWeight: 700,
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${active ? tint.fg : T.n200}`,
                  background: active ? tint.bg : '#fff',
                  color: active ? tint.fg : T.n500,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
                title={tint.fullName}
              >
                {tint.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Toggle
        checked={form.platform}
        onChange={(next) => onChange({ platform: next })}
        label="Platform feature — cross-game GDS-owned propensity model"
      />
      {form.games.length >= 3 && !form.platform && (
        <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400, fontStyle: 'italic' }}>
          Tip · features used across 3+ games are typically Platform.
        </span>
      )}
    </SectionCard>
  );
};
