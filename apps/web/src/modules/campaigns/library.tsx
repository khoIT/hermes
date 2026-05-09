/**
 * 09 — Campaigns Library (cmp_library)
 * Header stat strip, group-by selector, filter rail with Author filter,
 * row cards with trigger-type chip + Author column, entry-points strip.
 * Per PRD §9.3 and Agentic §6.1.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, Badge, Sparkline } from '../../theme';
import { allCampaigns } from '../../data/catalog/campaigns';
import type { HermesCampaign } from '@hermes/contracts';
import { Goal4RBadge } from './canvas/_blocks/goal-4r';

// ── Stat strip values (real from catalog + fixed demo)
const ACTIVE    = allCampaigns.filter(c => c.status === 'active').length;
const DRAFTS    = allCampaigns.filter(c => c.status === 'draft').length;
const SCHEDULED = allCampaigns.filter(c => c.status === 'scheduled').length;
const ENDED     = allCampaigns.filter(c => c.status === 'ended').length;

type GroupBy = 'goal' | 'trigger' | 'status' | 'owner' | 'none';
type AuthorFilter = 'all' | 'hand-built' | 'agent-drafted' | 'agent-edited';

const TRIGGER_LABELS: Record<string, string> = {
  'real-time': 'Real-time',
  'scheduled': 'Scheduled',
  'one-time':  'One-time',
  'hybrid':    'Hybrid',
};

const AUTHOR_COLORS: Record<string, { bg: string; fg: string } | undefined> = {
  'hand-built':    { bg: T.n100,      fg: T.n700      },
  'agent-drafted': { bg: T.purpleSoft, fg: T.purple500 },
  'agent-edited':  { bg: T.blueSoft,  fg: T.blue600   },
};

const DEMO_SPARKLINES: Record<string, number[]> = {
  'cmp-cfm-407': [3200, 3280, 3350, 3420, 3380, 3450, 3500],
  'cmp-cfm-408': [11200, 11800, 12400, 12800, 12600, 13100, 12900],
  'cmp-tf-001':  [580, 600, 610, 590, 615, 608, 600],
};

function group(campaigns: HermesCampaign[], by: GroupBy): Array<{ label: string; items: HermesCampaign[] }> {
  if (by === 'none') return [{ label: 'All campaigns', items: campaigns }];
  const map = new Map<string, HermesCampaign[]>();
  for (const c of campaigns) {
    const key =
      by === 'goal'    ? c.goal4r :
      by === 'trigger' ? c.triggerType :
      by === 'status'  ? c.status :
      by === 'owner'   ? c.game : 'Unknown';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

export default function CampaignsLibraryPage() {
  const navigate                    = useNavigate();
  const [groupBy, setGroupBy]       = React.useState<GroupBy>('goal');
  const [authorFilter, setAuthorFilter] = React.useState<AuthorFilter>('all');
  const [query, setQuery]           = React.useState('');

  const filtered = React.useMemo(() => {
    let list = allCampaigns;
    if (authorFilter !== 'all') list = list.filter(c => c.author === authorFilter);
    if (query) list = list.filter(c =>
      c.displayName.toLowerCase().includes(query.toLowerCase()) ||
      c.id.toLowerCase().includes(query.toLowerCase())
    );
    return list;
  }, [authorFilter, query]);

  const groups = React.useMemo(() => group(filtered, groupBy), [filtered, groupBy]);

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* Page header */}
      <div style={{ padding: '28px 40px 0', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          04 · Campaign
        </div>
        <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>
          Campaigns
        </div>

        {/* Stat strip */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
          {[
            { label: 'active',     value: ACTIVE,    color: T.green600 },
            { label: 'in draft',   value: DRAFTS,    color: T.amber500 },
            { label: 'scheduled',  value: SCHEDULED, color: T.blue600  },
            { label: 'ended this month', value: ENDED, color: T.n500   },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: T.fDisp, fontSize: 28, textTransform: 'uppercase', color: s.color }}>{s.value}</span>
              <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Entry points strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <EntryBtn label="+ By goal"      onClick={() => navigate('/campaigns/new/realtime')} />
          <EntryBtn label="+ By hypothesis" onClick={() => navigate('/campaigns/new/realtime')} />
          <EntryBtn label="+ From archetype" onClick={() => navigate('/campaigns/patterns')} primary />
          <EntryBtn label="+ From segment"  onClick={() => navigate('/segments')} />
          <EntryBtn label="Continue draft"  onClick={() => {}} />
          <EntryBtn label="Build journey"   onClick={() => navigate('/campaigns/cmp-tf-001/journey')} />
        </div>
      </div>

      {/* Filter rail */}
      <div style={{
        padding: '12px 40px', background: '#fff',
        borderBottom: `1px solid ${T.n200}`,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search campaigns…"
          style={{
            fontFamily: T.fSans, fontSize: 13, color: T.n900,
            border: `1px solid ${T.n200}`, borderRadius: 7,
            padding: '6px 12px', outline: 'none', width: 220,
          }}
        />

        {/* Group-by */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500 }}>Group by</span>
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value as GroupBy)}
            style={selectStyle}
          >
            {(['goal','trigger','status','owner','none'] as GroupBy[]).map(v => (
              <option key={v} value={v}>{v === 'none' ? 'None' : v.charAt(0).toUpperCase() + v.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Author filter — Agentic §6.1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500 }}>Author</span>
          <select
            value={authorFilter}
            onChange={e => setAuthorFilter(e.target.value as AuthorFilter)}
            style={selectStyle}
          >
            <option value="all">All</option>
            <option value="hand-built">Hand-built</option>
            <option value="agent-drafted">Agent-drafted</option>
            <option value="agent-edited">Agent-edited</option>
          </select>
        </div>
      </div>

      {/* Campaign groups */}
      <div style={{ padding: '24px 40px' }}>
        {groups.map(g => (
          <div key={g.label} style={{ marginBottom: 32 }}>
            <div style={{
              fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n500,
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {g.label}
              <span style={{ fontWeight: 400, color: T.n400 }}>({g.items.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {g.items.map(c => (
                <CampaignRow key={c.id} campaign={c} onNavigate={navigate} />
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n400, textAlign: 'center', padding: '40px 0' }}>
            No campaigns match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Row card ────────────────────────────────────────────────────────────────
function CampaignRow({ campaign: c, onNavigate }: {
  campaign: HermesCampaign;
  onNavigate: ReturnType<typeof useNavigate>;
}) {
  const [hovered, setHovered] = React.useState(false);
  const authorStyle = (AUTHOR_COLORS[c.author] ?? AUTHOR_COLORS['hand-built'])!;
  const sparkline   = DEMO_SPARKLINES[c.id];

  return (
    <div
      onClick={() => onNavigate(`/campaigns/${c.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 100px 110px 90px 140px 90px 100px 120px',
        alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 9, cursor: 'pointer',
        background: hovered ? '#fff' : '#fff',
        border: `1px solid ${hovered ? T.brand : T.n200}`,
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        transition: 'border-color .1s, box-shadow .1s',
      }}
    >
      {/* Name + ID */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: '"Georgia","Times New Roman",serif',
          fontStyle: 'italic', fontSize: 14, color: T.n900, fontWeight: 400,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {c.displayName}
        </div>
        <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n400, marginTop: 1 }}>{c.id}</div>
      </div>

      {/* 4R Goal badge */}
      <div><Goal4RBadge value={c.goal4r} /></div>

      {/* Trigger type chip */}
      <div>
        <span style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
          padding: '3px 9px', borderRadius: 5,
          background: c.triggerType === 'real-time' ? T.brandSoft :
                      c.triggerType === 'hybrid'    ? T.purpleSoft :
                      c.triggerType === 'scheduled' ? T.blueSoft   : T.n100,
          color:      c.triggerType === 'real-time' ? T.brand :
                      c.triggerType === 'hybrid'    ? T.purple500 :
                      c.triggerType === 'scheduled' ? T.blue600   : T.n600,
        }}>
          {TRIGGER_LABELS[c.triggerType] ?? c.triggerType}
        </span>
      </div>

      {/* Status */}
      <div>
        <Badge
          variant={
            c.status === 'active'    ? 'live'    :
            c.status === 'draft'     ? 'warning' :
            c.status === 'scheduled' ? 'info'    :
            c.status === 'ended'     ? 'secondary' : 'secondary'
          }
          dot={c.status === 'active'}
        >
          {c.status}
        </Badge>
      </div>

      {/* Target audience (clickable) */}
      <div
        onClick={e => {
          if (!c.audienceRef) return;
          e.stopPropagation();
          onNavigate(`/segments/${c.audienceRef}`);
        }}
        style={{
          fontFamily: T.fSans, fontSize: 11, color: c.audienceRef ? T.blue600 : T.n400,
          cursor: c.audienceRef ? 'pointer' : 'default',
          textDecoration: c.audienceRef ? 'underline' : 'none',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        {c.audienceRef ? c.audienceRef.replace('seg-', '').split('-').slice(0, 3).join(' ') : '—'}
      </div>

      {/* Reach + sparkline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div>
          <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n700 }}>
            {c.estimatedFiresPerDay ? `~${(c.estimatedFiresPerDay / 1000).toFixed(1)}k/d` : '—'}
          </div>
        </div>
        {sparkline && <Sparkline data={sparkline} width={48} height={16} color={T.brand} />}
      </div>

      {/* Lift */}
      <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.green600, fontWeight: 600 }}>
        {c.id === 'cmp-cfm-407' ? '+8.2% D1' : '—'}
      </div>

      {/* Author column — Agentic §6.1 / §12.5 */}
      <div>
        <span style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
          padding: '2px 8px', borderRadius: 5,
          background: authorStyle.bg, color: authorStyle.fg,
        }}>
          {c.author}
        </span>
        {c.agentRef && (
          <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n400, marginTop: 2 }}>{c.agentRef}</div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function EntryBtn({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
        padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
        background: primary ? T.brand : T.n100,
        color: primary ? '#fff' : T.n700,
        border: primary ? 'none' : `1px solid ${T.n200}`,
      }}
    >
      {label}
    </button>
  );
}

const selectStyle: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 12, color: T.n800,
  border: `1px solid ${T.n200}`, borderRadius: 6,
  padding: '5px 8px', outline: 'none', background: '#fff', cursor: 'pointer',
};
