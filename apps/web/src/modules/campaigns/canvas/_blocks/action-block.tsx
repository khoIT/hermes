/**
 * ActionBlock — variant toggle (A/B), channel selector, copy + reward inputs.
 */
import React from 'react';
import { T } from '../../../../theme';

const CHANNELS = ['IAM', 'Push', 'SMS', 'Email', 'In-game grant'];

interface Variant {
  id: string;
  label: string;
  channel: string;
  copy: string;
  reward: string;
  allocation: number;
}

const DEFAULT_VARIANT_A: Variant  = { id: 'A',       label: 'Variant A', channel: 'IAM', copy: '', reward: '', allocation: 0.45 };
const DEFAULT_HOLDOUT: Variant    = { id: 'holdout', label: 'Holdout',   channel: '—',   copy: 'No action — control group', reward: '', allocation: 0.10 };
const DEFAULT_VARIANTS: Variant[] = [DEFAULT_VARIANT_A, DEFAULT_HOLDOUT];

export function ActionBlock() {
  const [abEnabled, setAbEnabled] = React.useState(false);
  const [variants, setVariants]   = React.useState<Variant[]>(DEFAULT_VARIANTS);

  function updateVariant(id: string, patch: Partial<Variant>) {
    setVariants(vs => vs.map(v => v.id === id ? { ...v, ...patch } : v));
  }

  function toggleAB() {
    if (!abEnabled) {
      setVariants(vs => {
        const first: Variant   = vs[0]             ?? DEFAULT_VARIANT_A;
        const last: Variant    = vs[vs.length - 1] ?? DEFAULT_HOLDOUT;
        const variantB: Variant = { id: 'B', label: 'Variant B', channel: 'IAM', copy: '', reward: '', allocation: 0.45 };
        return [first, variantB, last];
      });
    } else {
      setVariants([DEFAULT_VARIANT_A, DEFAULT_HOLDOUT]);
    }
    setAbEnabled(!abEnabled);
  }

  const treatmentVariants = variants.filter(v => v.id !== 'holdout');
  const holdout = variants.find(v => v.id === 'holdout');

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Action
        </div>
        {/* A/B toggle */}
        <button
          onClick={toggleAB}
          style={{
            fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
            background: abEnabled ? T.brandSoft : T.n100,
            color: abEnabled ? T.brand : T.n600,
            border: `1px solid ${abEnabled ? T.brandBorder : T.n200}`,
          }}
        >
          {abEnabled ? 'A/B: On' : 'A/B: Off'}
        </button>
      </div>

      {/* Treatment variants */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {treatmentVariants.map(v => (
          <VariantRow key={v.id} variant={v} onUpdate={patch => updateVariant(v.id, patch)} />
        ))}
      </div>

      {/* Holdout note */}
      {holdout && (
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 7,
          background: T.n50, border: `1px solid ${T.n200}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n500 }}>
            HOLDOUT
          </span>
          <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500 }}>
            {holdout.copy}
          </span>
          <span style={{ marginLeft: 'auto', fontFamily: T.fMono, fontSize: 11, color: T.n400 }}>
            {(holdout.allocation * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

function VariantRow({ variant, onUpdate }: { variant: Variant; onUpdate: (p: Partial<Variant>) => void }) {
  return (
    <div style={{
      border: `1px solid ${T.n200}`, borderRadius: 8,
      padding: '14px', background: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          fontFamily: T.fSans, fontWeight: 700, fontSize: 11, color: T.brand,
          background: T.brandSoft, border: `1px solid ${T.brandBorder}`,
          borderRadius: 5, padding: '2px 8px',
        }}>
          {variant.label}
        </span>
        <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>
          {(variant.allocation * 100).toFixed(0)}% allocation
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {/* Channel */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
          <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600, fontWeight: 600 }}>Channel</span>
          <select
            value={variant.channel}
            onChange={e => onUpdate({ channel: e.target.value })}
            style={fieldStyle}
          >
            {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        {/* Copy */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
          <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600, fontWeight: 600 }}>Message copy</span>
          <input
            value={variant.copy}
            onChange={e => onUpdate({ copy: e.target.value })}
            placeholder="e.g. MMR shield · Next loss won't drop your rank"
            style={fieldStyle}
          />
        </label>

        {/* Reward */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
          <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600, fontWeight: 600 }}>Reward (optional)</span>
          <input
            value={variant.reward}
            onChange={e => onUpdate({ reward: e.target.value })}
            placeholder="e.g. 200 CF Coins"
            style={fieldStyle}
          />
        </label>
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 13, color: T.n800,
  border: `1px solid ${T.n200}`, borderRadius: 7,
  padding: '6px 10px', outline: 'none', background: '#fff', width: '100%',
};
