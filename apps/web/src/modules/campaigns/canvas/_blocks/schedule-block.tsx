/**
 * ScheduleBlock — active date range + frequency cap.
 * Variants per trigger type:
 *   real-time: date range + frequency cap dropdown
 *   scheduled:  cadence picker + start/end
 *   one-time:   send-when-ready / on-date radio
 */
import React from 'react';
import { T } from '../../../../theme';
import type { TriggerType } from './trigger-type-control';

interface Props {
  triggerType: TriggerType;
}

const FREQ_CAP_OPTIONS = [
  { value: 'none',     label: 'No frequency limit' },
  { value: 'daily',    label: 'Once per day' },
  { value: 'duration', label: 'Once per user for the duration of this campaign' },
];

const CADENCE_OPTIONS = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function ScheduleBlock({ triggerType }: Props) {
  const [startDate, setStartDate]     = React.useState('2026-05-10');
  const [endDate, setEndDate]         = React.useState('2026-06-10');
  const [freqCap, setFreqCap]         = React.useState('daily');
  const [cadence, setCadence]         = React.useState('daily');
  const [sendMode, setSendMode]       = React.useState<'ready' | 'date'>('ready');

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n700,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
      }}>
        Schedule
      </div>

      {/* ── Real-time ── */}
      {triggerType === 'real-time' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <label style={{ fontFamily: T.fSans, fontSize: 13, color: T.n700, display: 'flex', alignItems: 'center', gap: 8 }}>
            Active from
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={inputStyle} />
          </label>
          <span style={{ color: T.n400 }}>–</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            style={inputStyle} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n700 }}>Frequency cap</span>
            <select value={freqCap} onChange={e => setFreqCap(e.target.value)} style={selectStyle}>
              {FREQ_CAP_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Scheduled ── */}
      {triggerType === 'scheduled' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n700 }}>Cadence</span>
            <select value={cadence} onChange={e => setCadence(e.target.value)} style={selectStyle}>
              {CADENCE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <label style={{ fontFamily: T.fSans, fontSize: 13, color: T.n700, display: 'flex', alignItems: 'center', gap: 8 }}>
            Start
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ fontFamily: T.fSans, fontSize: 13, color: T.n700, display: 'flex', alignItems: 'center', gap: 8 }}>
            End
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
          </label>
        </div>
      )}

      {/* ── One-time ── */}
      {triggerType === 'one-time' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="radio" name="send-mode" value="ready" checked={sendMode === 'ready'}
              onChange={() => setSendMode('ready')} />
            <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n800 }}>
              Send when ready (immediately after activation)
            </span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="radio" name="send-mode" value="date" checked={sendMode === 'date'}
              onChange={() => setSendMode('date')} />
            <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n800 }}>Send on date</span>
            {sendMode === 'date' && (
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
            )}
          </label>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 13, color: T.n800,
  border: `1px solid ${T.n200}`, borderRadius: 7,
  padding: '5px 10px', outline: 'none', background: '#fff',
};

const selectStyle: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 13, color: T.n800,
  border: `1px solid ${T.n200}`, borderRadius: 7,
  padding: '5px 10px', outline: 'none', background: '#fff', cursor: 'pointer',
};
