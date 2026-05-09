/**
 * EventSourcePicker — Browse / Search / AI-assist tabs.
 * Reads event volumes from crawled data. Default suggestion: event_match_end.
 * Calls onSelect when user picks an event.
 */
import React from 'react';
import { T, Sparkline, Tabs } from '../../../../theme';
import eventVolumes from '../../../../data/crawled/event-volumes.json';

export interface EventSource {
  name: string;
  dailyVolume: number;
  peakRate: number;
  domain: string;
  sparkline7d: number[];
  tier: string;
}

interface Props {
  onSelect: (event: EventSource) => void;
  onClose: () => void;
  defaultEvent?: string;
}

const LATENCY_LABEL: Record<string, string> = {
  high: '<1s · real-time', mid: '<1h · warm', low: '<1d · cold',
};

const AI_SUGGESTIONS = [
  { name: 'event_match_end',              reason: 'High frustration signal — loss streak detectable at match boundary' },
  { name: 'event_login',                  reason: 'Re-engagement trigger — last-login gap detectable on login' },
  { name: 'event_currency_balance_change',reason: 'Purchase-intent proxy — low balance + promoted item in context' },
];

// Build typed event list from JSON
const ALL_EVENTS: EventSource[] = Object.entries(
  eventVolumes as Record<string, {
    dailyVolume: number; peakRate: number; domain: string;
    sparkline7d: number[]; tier: string;
  }>
).map(([name, v]) => ({ name, ...v }))
  .sort((a, b) => b.dailyVolume - a.dailyVolume);

export const EventSourcePicker = React.memo<Props>(({ onSelect, onClose, defaultEvent = 'event_match_end' }) => {
  const [tab, setTab]     = React.useState<'browse' | 'search' | 'ai'>('browse');
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!query) return ALL_EVENTS.slice(0, 20);
    return ALL_EVENTS.filter(e => e.name.includes(query.toLowerCase())).slice(0, 20);
  }, [query]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 350,
      background: 'rgba(0,0,0,0.3)',
      display: 'flex', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div style={{
        width: 480, height: '100%', background: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 20px',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ fontFamily: T.fDisp, fontSize: 22, textTransform: 'uppercase', color: T.n950, marginBottom: 4 }}>
          Event Source
        </div>
        <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, marginBottom: 16 }}>
          Choose the event that triggers this campaign.
        </div>

        <Tabs
          tabs={[
            { value: 'browse', label: 'Browse' },
            { value: 'search', label: 'Search' },
            { value: 'ai',     label: 'AI assist' },
          ]}
          value={tab}
          onChange={v => setTab(v as typeof tab)}
          style={{ marginBottom: 14 }}
        />

        {/* Search input */}
        {(tab === 'search' || tab === 'browse') && (
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter events…"
            style={{
              fontFamily: T.fSans, fontSize: 13, color: T.n900,
              border: `1px solid ${T.n200}`, borderRadius: 7,
              padding: '8px 12px', marginBottom: 10, outline: 'none',
            }}
          />
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* AI suggestions */}
          {tab === 'ai' && (
            <div>
              <div style={{
                fontFamily: T.fSans, fontSize: 11, color: T.purple500,
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
              }}>
                AI Recommendations
              </div>
              {AI_SUGGESTIONS.map(s => {
                const ev = ALL_EVENTS.find(e => e.name === s.name);
                if (!ev) return null;
                return (
                  <EventCard
                    key={s.name}
                    event={ev}
                    isDefault={s.name === defaultEvent}
                    aiReason={s.reason}
                    onSelect={onSelect}
                  />
                );
              })}
            </div>
          )}

          {/* Browse / Search list */}
          {(tab === 'browse' || tab === 'search') && filtered.map(ev => (
            <EventCard
              key={ev.name}
              event={ev}
              isDefault={ev.name === defaultEvent}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
EventSourcePicker.displayName = 'EventSourcePicker';

function EventCard({
  event, isDefault, aiReason, onSelect,
}: {
  event: EventSource;
  isDefault?: boolean;
  aiReason?: string;
  onSelect: (e: EventSource) => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={() => onSelect(event)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
        marginBottom: 6, border: `1px solid ${hovered ? T.brand : T.n200}`,
        background: hovered ? T.brandSoft : '#fff', transition: 'all .1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: T.fMono, fontSize: 12, fontWeight: 600, color: T.n900 }}>
              {event.name}
            </span>
            {isDefault && (
              <span style={{
                fontFamily: T.fSans, fontSize: 10, color: T.brand, fontWeight: 600,
                background: T.brandSoft, border: `1px solid ${T.brandBorder}`,
                borderRadius: 4, padding: '1px 6px',
              }}>suggested</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>
              {(event.dailyVolume / 1000).toFixed(0)}k / day
            </span>
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>
              {event.domain}
            </span>
            <span style={{
              fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
              color: event.tier === 'high' ? T.green600 : event.tier === 'mid' ? T.amber500 : T.n500,
            }}>
              {LATENCY_LABEL[event.tier] ?? event.tier}
            </span>
          </div>
          {aiReason && (
            <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.purple500, marginTop: 4 }}>
              {aiReason}
            </div>
          )}
        </div>
        <Sparkline data={event.sparkline7d} width={56} height={20} color={T.brand} />
      </div>
    </div>
  );
}
