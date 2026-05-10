/**
 * Campaigns tab — lists campaigns where `audienceRef === segmentId`. Empty
 * state surfaces a CTA to seed a new realtime campaign with this segment.
 *
 * NOTE: filter is on the contract field `audienceRef` (NOT `segmentId` —
 * that field doesn't exist on `HermesCampaign`). `lift` is also not a
 * contract field; render "—" rather than synthesize numbers.
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MailX, ArrowRight } from 'lucide-react';
import { T } from '../../theme';
import { allCampaigns } from '../../data/catalog/campaigns';
import { allSegments } from '../../data/catalog/segments';
import type { HermesCampaign } from '@hermes/contracts';

const TYPE_LABEL: Record<HermesCampaign['triggerType'], string> = {
  'one-time': 'One-time',
  'scheduled': 'Scheduled',
  'real-time': 'Real-time',
  'hybrid': 'Hybrid',
};

const STATUS_COLOR: Partial<Record<HermesCampaign['status'], string>> = {
  active: T.green600,
  scheduled: '#3f8dff',
  paused: T.amber500,
  draft: T.n400,
  ended: T.n400,
  archived: T.n300,
};

export default function SegmentsCampaignsTabPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) return null;
  const seg = allSegments.find(s => s.id === id);
  if (!seg) {
    return (
      <div style={{ padding: 32, fontFamily: T.fSans, color: T.n500 }}>
        Segment not found.
      </div>
    );
  }
  const matched = allCampaigns.filter(c => c.audienceRef === id);

  if (matched.length === 0) {
    return (
      <div style={{
        padding: '60px 32px', maxWidth: 720, margin: '0 auto',
      }}>
        <div style={{
          background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 12,
          padding: '48px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 999, background: T.n100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.n500,
          }}>
            <MailX size={20} />
          </div>
          <div style={{
            fontFamily: T.fDisp, fontSize: 22, color: T.n900,
            textTransform: 'uppercase', lineHeight: 1.05,
          }}>Not used in any campaign yet</div>
          <p style={{
            fontFamily: T.fSans, fontSize: 13, color: T.n600,
            margin: '0 auto', maxWidth: 460,
          }}>
            Activate this audience by creating a realtime, scheduled, or one-time campaign.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              onClick={() => navigate(`/campaigns/new/realtime?seedSegmentId=${id}`)}
              style={{
                fontFamily: T.fSans, fontSize: 12, fontWeight: 600, color: '#fff',
                background: T.brand, border: 'none', borderRadius: 7,
                padding: '8px 14px',
                display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              }}
            >
              Create campaign <ArrowRight size={13} />
            </button>
            <button
              onClick={() => navigate('/campaigns/patterns')}
              style={{
                fontFamily: T.fSans, fontSize: 12, color: T.n700,
                background: '#fff', border: `1px solid ${T.n200}`,
                borderRadius: 7, padding: '8px 14px', cursor: 'pointer',
              }}
            >
              Browse campaign patterns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px 48px', maxWidth: 1100 }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 13, color: T.n600, marginBottom: 12,
      }}>
        <strong style={{ color: T.n900 }}>{matched.length}</strong>
        {' '}campaign{matched.length === 1 ? '' : 's'} targeting this segment
      </div>
      <div style={{
        background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.n50 }}>
              {['Status', 'Name', 'Type', 'Window', 'Lift'].map(h => (
                <th key={h} style={{
                  fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '10px 12px', textAlign: 'left',
                  borderBottom: `1px solid ${T.n100}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matched.map(c => (
              <tr key={c.id}
                onClick={() => navigate(`/campaigns/${c.id}`)}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.n50; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
                    color: T.n800,
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: 4,
                      background: STATUS_COLOR[c.status] ?? T.n400,
                    }} />
                    {c.status}
                  </span>
                </td>
                <td style={{
                  fontFamily: T.fSans, fontSize: 13, color: T.brand,
                  padding: '10px 12px', fontWeight: 500,
                }}>{c.displayName}</td>
                <td style={{
                  fontFamily: T.fSans, fontSize: 11.5, color: T.n700,
                  padding: '10px 12px',
                }}>
                  <span style={{
                    background: T.n100, padding: '2px 8px', borderRadius: 999,
                  }}>
                    {TYPE_LABEL[c.triggerType]}
                  </span>
                </td>
                <td style={{
                  fontFamily: T.fMono, fontSize: 11.5, color: T.n600,
                  padding: '10px 12px',
                }}>
                  {c.windowStart ? c.windowStart.slice(0, 10) : '—'}
                  {c.windowEnd ? ` → ${c.windowEnd.slice(0, 10)}` : ''}
                </td>
                <td style={{
                  fontFamily: T.fMono, fontSize: 12, color: T.n400,
                  padding: '10px 12px',
                }} title="Not measured yet">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
