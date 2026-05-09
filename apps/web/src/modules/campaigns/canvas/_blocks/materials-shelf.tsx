/**
 * MaterialsShelf (campaign variant) — right-rail reference cards.
 * Shows: target segment card, event source card, features in trigger predicate,
 * pattern reference. Extends the shared component pattern from P-6/7.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { EventSource } from './event-source-picker';

interface SegmentRef {
  id: string;
  name: string;
  reach: number;
}

interface PatternRef {
  id: string;
  name: string;
  liftBand: string;
  portfolioUses: number;
}

interface Props {
  segment?: SegmentRef | null;
  eventSource?: EventSource | null;
  triggerFeatures?: string[];
  pattern?: PatternRef | null;
}

function ShelfCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: `1px solid ${T.n200}`, borderRadius: 8,
      overflow: 'hidden', marginBottom: 10,
    }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n500,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        background: T.n50, borderBottom: `1px solid ${T.n200}`,
        padding: '6px 12px',
      }}>
        {title}
      </div>
      <div style={{ padding: '10px 12px', background: '#fff' }}>
        {children}
      </div>
    </div>
  );
}

export function CampaignMaterialsShelf({ segment, eventSource, triggerFeatures = [], pattern }: Props) {
  return (
    <div>
      {/* Segment reference */}
      {segment ? (
        <ShelfCard title="Target Segment">
          <div style={{ fontFamily: T.fSans, fontSize: 12, fontWeight: 600, color: T.n800 }}>{segment.name}</div>
          <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400, marginTop: 2, wordBreak: 'break-all' }}>{segment.id}</div>
          <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, marginTop: 4 }}>
            ~{segment.reach.toLocaleString()} users
          </div>
        </ShelfCard>
      ) : (
        <ShelfCard title="Target Segment">
          <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n400, fontStyle: 'italic' }}>
            No segment — real-time only
          </div>
        </ShelfCard>
      )}

      {/* Event source reference */}
      {eventSource && (
        <ShelfCard title="Event Source">
          <div style={{ fontFamily: T.fMono, fontSize: 12, fontWeight: 600, color: T.n800 }}>{eventSource.name}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>
              ~{(eventSource.dailyVolume / 1000).toFixed(0)}k / day
            </span>
            <span style={{
              fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
              color: eventSource.tier === 'high' ? T.green600 : T.amber500,
            }}>
              {eventSource.tier === 'high' ? '<1s' : eventSource.tier === 'mid' ? '<1h' : '<1d'}
            </span>
          </div>
        </ShelfCard>
      )}

      {/* Features in trigger predicate */}
      {triggerFeatures.length > 0 && (
        <ShelfCard title="Features in Predicate">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {triggerFeatures.map(f => (
              <span key={f} style={{
                fontFamily: T.fMono, fontSize: 11, color: T.n700,
                background: T.n50, border: `1px solid ${T.n200}`,
                borderRadius: 4, padding: '2px 6px', display: 'inline-block',
              }}>
                {f}
              </span>
            ))}
          </div>
        </ShelfCard>
      )}

      {/* Pattern reference */}
      {pattern && (
        <ShelfCard title="Pattern Reference">
          <div style={{ fontFamily: T.fSans, fontSize: 12, fontWeight: 600, color: T.n800 }}>{pattern.name}</div>
          <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.green600, marginTop: 2 }}>
            {pattern.liftBand}
          </div>
          <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, marginTop: 2 }}>
            Used in {pattern.portfolioUses} campaigns
          </div>
        </ShelfCard>
      )}

      {/* Default empty pattern if none provided */}
      {!pattern && !eventSource && !segment && (
        <div style={{
          fontFamily: T.fSans, fontSize: 12, color: T.n400, fontStyle: 'italic',
          textAlign: 'center', padding: '20px 0',
        }}>
          Materials will appear here as you fill in the canvas.
        </div>
      )}
    </div>
  );
}
