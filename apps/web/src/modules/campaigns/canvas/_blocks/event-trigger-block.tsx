/**
 * EventTriggerBlock — event source banner + trigger predicate composer + policies.
 * Real-time canvas only. Reuses P-7 PredicateComposer.
 * Shows mixed-latency warning if predicate mixes <1s and batch features.
 * Shows audience preview band: "Estimated fires/day · Unique players/week"
 */
import React from 'react';
import { T } from '../../../../theme';
import type { EventSource } from './event-source-picker';
import { EventSourcePicker } from './event-source-picker';
import { PredicateComposer } from '../../../segments/_composer/predicate-composer';
import { canvasReducer, initialState } from '../../../segments/_state/canvas-reducer';

const BATCH_FEATURE_PATTERNS = ['_1h', '_1d', '_7d', '_30d', 'session_count', 'purchase_count'];

function hasBatchFeature(features: string[]): boolean {
  return features.some(f => BATCH_FEATURE_PATTERNS.some(p => f.includes(p)));
}

const COOLDOWN_OPTIONS = [
  { value: '1',    label: '1 hour' },
  { value: '6',    label: '6 hours' },
  { value: '24',   label: '24 hours' },
  { value: '168',  label: '7 days' },
  { value: 'custom', label: 'Custom…' },
];

interface Props {
  /** Called when an event is selected — parent stores it for handoff minting */
  onEventSelected?: (event: EventSource) => void;
  /** Pre-selected event (e.g. from campaign catalog) */
  defaultEventName?: string;
}

export function EventTriggerBlock({ onEventSelected, defaultEventName }: Props) {
  const [showPicker, setShowPicker]     = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<EventSource | null>(null);
  const [triggerState, triggerDispatch] = React.useReducer(canvasReducer, undefined, () => initialState());
  const [cooldown, setCooldown]         = React.useState('24');
  const [globalCap, setGlobalCap]       = React.useState('');
  const [antiFatigue, setAntiFatigue]   = React.useState('2');

  const allFeatures = React.useMemo(() =>
    triggerState.predicate.groups.flatMap(g => g.rows.map(r => r.feature))
    .concat(triggerState.predicate.exclusions.map(r => r.feature)),
    [triggerState.predicate]
  );

  const showLatencyWarning = selectedEvent?.tier === 'high' && hasBatchFeature(allFeatures);

  function handleSelectEvent(ev: EventSource) {
    setSelectedEvent(ev);
    setShowPicker(false);
    onEventSelected?.(ev);
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Section header */}
      <div style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n700,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
      }}>
        Event Trigger
      </div>

      {/* Event source banner */}
      {selectedEvent ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 8,
          background: T.n50, border: `1px solid ${T.n200}`,
          marginBottom: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: T.fMono, fontSize: 13, fontWeight: 600, color: T.n900 }}>
                {selectedEvent.name}
              </span>
              <span style={{
                fontFamily: T.fSans, fontSize: 10, fontWeight: 600, borderRadius: 4,
                padding: '1px 6px',
                color: selectedEvent.tier === 'high' ? T.green600 : T.amber500,
                background: selectedEvent.tier === 'high' ? T.greenSoft : T.amberSoft,
              }}>
                {selectedEvent.tier === 'high' ? '<1s · real-time' : selectedEvent.tier === 'mid' ? '<1h · warm' : '<1d · cold'}
              </span>
            </div>
            <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, marginTop: 2 }}>
              ~{(selectedEvent.dailyVolume / 1000).toFixed(0)}k fires / day · {selectedEvent.domain}
            </div>
          </div>
          <button
            onClick={() => setShowPicker(true)}
            style={{
              fontFamily: T.fSans, fontSize: 12, color: T.n600,
              background: 'none', border: `1px solid ${T.n200}`, borderRadius: 6,
              padding: '4px 10px', cursor: 'pointer',
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          style={{
            fontFamily: T.fSans, fontSize: 13, color: T.n700,
            background: T.n50, border: `1px dashed ${T.n300}`, borderRadius: 8,
            padding: '12px 16px', cursor: 'pointer', width: '100%', textAlign: 'left',
            marginBottom: 14,
          }}
        >
          + Choose event source
          <span style={{ fontSize: 11, color: T.n400, marginLeft: 8 }}>
            Browse · Search · AI-assist
          </span>
        </button>
      )}

      {/* Mixed-latency warning */}
      {showLatencyWarning && (
        <div style={{
          display: 'flex', gap: 10, padding: '10px 14px',
          borderRadius: 8, background: T.amberSoft,
          border: `1px solid ${T.amber500}`, marginBottom: 14,
        }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <div style={{ fontFamily: T.fSans, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
            This trigger evaluates at event time. Batch features ({'<'}1h, {'<'}1d) are
            point-in-time as of last refresh — today 06:00 for warm, last night for cold.
          </div>
        </div>
      )}

      {/* Predicate composer */}
      {selectedEvent && (
        <div style={{
          border: `1px solid ${T.n200}`, borderRadius: 8,
          padding: '14px', marginBottom: 14, background: '#fff',
        }}>
          <div style={{
            fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500,
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
          }}>
            Trigger Predicate — fires when:
          </div>
          <PredicateComposer
            predicate={triggerState.predicate}
            activePlaygroundRowId={triggerState.activePlaygroundRowId}
            activeSwapRowId={triggerState.activeSwapRowId}
            openPicker={triggerState.openPicker}
            pickerTargetGroupId={triggerState.pickerTargetGroupId}
            dispatch={triggerDispatch}
          />
        </div>
      )}

      {/* Trigger policies */}
      {selectedEvent && (
        <div style={{
          border: `1px solid ${T.n200}`, borderRadius: 8,
          padding: '14px', background: '#fff',
        }}>
          <div style={{
            fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500,
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12,
          }}>
            Trigger Policies
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {/* Per-player cooldown */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600, fontWeight: 600 }}>
                Per-player cooldown
              </span>
              <select
                value={cooldown}
                onChange={e => setCooldown(e.target.value)}
                style={selectStyle}
              >
                {COOLDOWN_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            {/* Global frequency cap */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600, fontWeight: 600 }}>
                Global cap / day
              </span>
              <input
                type="number"
                value={globalCap}
                onChange={e => setGlobalCap(e.target.value)}
                placeholder="e.g. 50000"
                style={{ ...selectStyle, width: 120 }}
              />
            </label>

            {/* Anti-fatigue */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n600, fontWeight: 600 }}>
                Anti-fatigue max IAMs / 24h
              </span>
              <input
                type="number"
                value={antiFatigue}
                onChange={e => setAntiFatigue(e.target.value)}
                min={1} max={10}
                style={{ ...selectStyle, width: 80 }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Audience preview band */}
      {selectedEvent && (
        <div style={{
          display: 'flex', gap: 24, marginTop: 12,
          padding: '10px 14px', borderRadius: 8,
          background: T.brandSoft, border: `1px solid ${T.brandBorder}`,
        }}>
          <div>
            <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Est. fires / day
            </div>
            <div style={{ fontFamily: T.fDisp, fontSize: 22, color: T.n900, textTransform: 'uppercase' }}>
              ~3,420
            </div>
          </div>
          <div>
            <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Unique players / week
            </div>
            <div style={{ fontFamily: T.fDisp, fontSize: 22, color: T.n900, textTransform: 'uppercase' }}>
              ~18,200
            </div>
          </div>
          <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, alignSelf: 'flex-end', paddingBottom: 2 }}>
            With {cooldown}h cooldown · anti-fatigue {antiFatigue}/24h
          </div>
        </div>
      )}

      {/* Picker slide-in */}
      {showPicker && (
        <EventSourcePicker
          onSelect={handleSelectEvent}
          onClose={() => setShowPicker(false)}
          defaultEvent={defaultEventName}
        />
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 13, color: T.n800,
  border: `1px solid ${T.n200}`, borderRadius: 7,
  padding: '5px 10px', outline: 'none', background: '#fff', cursor: 'pointer',
};
