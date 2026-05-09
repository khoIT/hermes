/**
 * AudienceBlock — "Pick existing segment" / "Define inline" CTAs.
 * Optional for real-time campaigns, required for scheduled/one-time.
 * "Define inline" opens a mini slide-in reusing P-7 PredicateComposer.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../../../theme';
import { PredicateComposer } from '../../../segments/_composer/predicate-composer';
import { canvasReducer, initialState } from '../../../segments/_state/canvas-reducer';

interface SelectedSegment {
  id: string;
  name: string;
  reach: number;
}

interface Props {
  required?: boolean;
  selected?: SelectedSegment | null;
  onSelect?: (seg: SelectedSegment) => void;
  onClear?: () => void;
  /** If provided, seed segment from URL query param (id already chosen) */
  seedSegmentId?: string | null;
}

const DEMO_SEGMENTS: SelectedSegment[] = [
  { id: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9', name: 'CFM · Loss Streak Non-Paying', reach: 48200 },
  { id: 'seg-cfm-rfm-tier-1-2026',                       name: 'CFM · RFM Tier 1 (NRU)',       reach: 91400 },
  { id: 'seg-tf-returning-coaches-2026',                  name: 'TF · Returning Coaches',        reach: 12800 },
  { id: 'seg-cfm-ss1-weapon-owners-2026',                 name: 'CFM · SS1 Weapon Owners',       reach: 34600 },
  { id: 'seg-nth-whale-at-risk-2026',                     name: 'NTH · Whale At-Risk',           reach: 3100  },
];

export function AudienceBlock({ required, selected, onSelect, onClear, seedSegmentId }: Props) {
  const navigate = useNavigate();
  const [showPicker, setShowPicker]       = React.useState(false);
  const [showInline, setShowInline]       = React.useState(false);
  const [query, setQuery]                 = React.useState('');
  const [inlineState, inlineDispatch]     = React.useReducer(canvasReducer, undefined, () => initialState());

  // Auto-select seed segment from URL
  React.useEffect(() => {
    if (seedSegmentId && !selected) {
      const seg = DEMO_SEGMENTS.find(s => s.id === seedSegmentId);
      if (seg) onSelect?.(seg);
    }
  }, [seedSegmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = DEMO_SEGMENTS.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Audience {required && <span style={{ color: T.red600 }}>*</span>}
        </div>
        {!required && (
          <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400 }}>Optional for real-time</span>
        )}
      </div>

      {/* Selected state */}
      {selected ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 8,
          border: `1px solid ${T.n200}`, background: T.brandSoft,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.n900 }}>{selected.name}</div>
            <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500, marginTop: 2 }}>{selected.id}</div>
            <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600, marginTop: 2 }}>
              ~{selected.reach.toLocaleString()} users
            </div>
          </div>
          <button onClick={() => onClear?.()} style={{
            fontFamily: T.fSans, fontSize: 12, color: T.n500,
            background: 'none', border: `1px solid ${T.n200}`, borderRadius: 6,
            padding: '4px 10px', cursor: 'pointer',
          }}>
            Change
          </button>
          <button
            onClick={() => navigate(`/segments/${selected.id}`)}
            style={{
              fontFamily: T.fSans, fontSize: 12, color: T.blue600,
              background: 'none', border: `1px solid ${T.n200}`, borderRadius: 6,
              padding: '4px 10px', cursor: 'pointer',
            }}
          >
            View →
          </button>
        </div>
      ) : (
        /* Empty state — two CTAs */
        <div style={{
          display: 'flex', gap: 8, padding: '14px',
          border: `1px dashed ${T.n300}`, borderRadius: 8, background: T.n50,
        }}>
          <button
            onClick={() => setShowPicker(true)}
            style={{
              flex: 1, fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
              color: T.n800, background: '#fff',
              border: `1px solid ${T.n200}`, borderRadius: 7,
              padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div>Pick existing segment</div>
            <div style={{ fontSize: 11, color: T.n400, marginTop: 2 }}>Browse from your segment library</div>
          </button>
          <button
            onClick={() => setShowInline(true)}
            style={{
              flex: 1, fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
              color: T.brand, background: T.brandSoft,
              border: `1px solid ${T.brandBorder}`, borderRadius: 7,
              padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div>Define inline</div>
            <div style={{ fontSize: 11, color: T.brand, opacity: 0.7, marginTop: 2 }}>Build a quick segment with the predicate composer</div>
          </button>
        </div>
      )}

      {/* Segment picker slide-in */}
      {showPicker && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', justifyContent: 'flex-end',
        }} onClick={() => setShowPicker(false)}>
          <div style={{
            width: 400, height: '100%', background: '#fff',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column',
            padding: '24px 20px',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: T.fDisp, fontSize: 24, textTransform: 'uppercase', color: T.n950, marginBottom: 16 }}>
              Segments
            </div>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search segments…"
              style={{
                fontFamily: T.fSans, fontSize: 13, color: T.n900,
                border: `1px solid ${T.n200}`, borderRadius: 7,
                padding: '8px 12px', marginBottom: 12, outline: 'none',
              }}
            />
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map(seg => (
                <div
                  key={seg.id}
                  onClick={() => { onSelect?.(seg); setShowPicker(false); }}
                  style={{
                    padding: '10px 12px', borderRadius: 7, cursor: 'pointer',
                    marginBottom: 6, border: `1px solid ${T.n200}`,
                    background: '#fff',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.brandSoft; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                >
                  <div style={{ fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.n800 }}>{seg.name}</div>
                  <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400, marginTop: 2 }}>{seg.id}</div>
                  <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, marginTop: 1 }}>
                    ~{seg.reach.toLocaleString()} users
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inline predicate composer slide-in */}
      {showInline && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', justifyContent: 'flex-end',
        }} onClick={() => setShowInline(false)}>
          <div style={{
            width: 520, height: '100%', background: '#fff',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column',
            padding: '24px 20px', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: T.fDisp, fontSize: 22, textTransform: 'uppercase', color: T.n950, marginBottom: 4 }}>
              Define Inline Segment
            </div>
            <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, marginBottom: 20 }}>
              Build a one-off audience for this campaign. This will be registered as a segment on activation.
            </div>
            <PredicateComposer
              predicate={inlineState.predicate}
              activePlaygroundRowId={inlineState.activePlaygroundRowId}
              activeSwapRowId={inlineState.activeSwapRowId}
              openPicker={inlineState.openPicker}
              pickerTargetGroupId={inlineState.pickerTargetGroupId}
              dispatch={inlineDispatch}
            />
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  const features = inlineState.predicate.groups.flatMap(g => g.rows.map(r => r.feature));
                  const hash = features.join('-').slice(0, 8) || 'inline';
                  const seg: SelectedSegment = {
                    id: `seg-inline-${hash}-${Date.now().toString(36)}`,
                    name: `Inline segment (${features.slice(0, 2).join(', ') || 'custom'})`,
                    reach: 12000,
                  };
                  onSelect?.(seg);
                  setShowInline(false);
                }}
                style={{
                  fontFamily: T.fSans, fontSize: 13, fontWeight: 600,
                  background: T.brand, color: '#fff', border: 'none',
                  borderRadius: 7, padding: '9px 18px', cursor: 'pointer',
                }}
              >
                Use this segment
              </button>
              <button
                onClick={() => setShowInline(false)}
                style={{
                  fontFamily: T.fSans, fontSize: 13, color: T.n700,
                  background: T.n100, border: 'none', borderRadius: 7,
                  padding: '9px 14px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
